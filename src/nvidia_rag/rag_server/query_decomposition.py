# SPDX-FileCopyrightText: Copyright (c) 2025 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
# SPDX-License-Identifier: Apache-2.0
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""
This module contains the logic for query decomposition.
"""

import logging
from typing import Any

from langchain.prompts import ChatPromptTemplate
from langchain_core.documents import Document
from langchain_core.output_parsers import StrOutputParser
from langchain_nvidia_ai_endpoints import ChatNVIDIA, NVIDIAEmbeddings, NVIDIARerank

from nvidia_rag.rag_server.response_generator import generate_answer
from nvidia_rag.utils.common import filter_documents_by_confidence, get_config
from nvidia_rag.utils.llm import get_prompts, get_streaming_filter_think_parser
from nvidia_rag.utils.vdb.vdb_base import VDBRag

# Configure logger
logger = logging.getLogger(__name__)

# Configuration
config = get_config()
RECURSION_DEPTH = config.query_decomposition.recursion_depth


def format_conversation_history(history: list[tuple[str, str]]) -> str:
    """
    Format conversation history into a readable string.

    Args:
        history: List of (question, answer) tuples

    Returns:
        Formatted conversation history string
    """
    formatted = "\n\n\n".join(
        [f"Question: {question}\nAnswer: {answer}" for question, answer in history]
    )
    logger.debug(f"Formatted conversation history with {len(history)} entries")
    return formatted


def normalize_relevance_scores(
    documents: list[Document],
    filter_docs: bool = True,
    confidence_threshold: float = config.default_confidence_threshold,
) -> list[Document]:
    """
    Normalize relevance scores in a list of documents to be between 0 and 1 using sigmoid function.

    Args:
        documents: List of Document objects with relevance_score in metadata

    Returns:
        The same list of documents with normalized scores (top 3)
    """
    import math

    if not documents:
        logger.debug("No documents provided for normalization")
        return documents

    logger.debug(f"Normalizing relevance scores for {len(documents)} documents")

    # Apply sigmoid normalization (1 / (1 + e^-x))
    for doc in documents:
        if "relevance_score" in doc.metadata:
            original_score = doc.metadata["relevance_score"]
            scaled_score = original_score * 0.1
            normalized_score = 1 / (1 + math.exp(-scaled_score))
            doc.metadata["relevance_score"] = normalized_score
            logger.debug(f"Normalized score: {original_score} -> {normalized_score}")

    if filter_docs:
        # Sort documents by normalized relevance_score in descending order and return top 3
        documents = sorted(
            documents,
            key=lambda doc: doc.metadata.get("relevance_score", 0),
            reverse=True,
        )[:3]

    if confidence_threshold > 0.0:
        documents = filter_documents_by_confidence(documents, confidence_threshold)

    return documents


def generate_subqueries(query: str, llm: ChatNVIDIA) -> list[str]:
    """
    Generate multiple perspectives/subqueries from the original query.

    Args:
        query: Original query string
        llm: Language model instance

    Returns:
        List of generated subqueries
    """
    prompts = get_prompts()
    template = prompts.get("query_decomposition_multiquery_prompt")
    prompt_perspectives = ChatPromptTemplate.from_template(template)

    generate_queries = (
        prompt_perspectives
        | llm
        | StrOutputParser()
        | (
            lambda x: [
                q.strip().split(". ", 1)[1] if ". " in q else q.strip()
                for q in x.split("\n")
                if q.strip() and any(c.isdigit() for c in q)
            ]
        )
    )

    questions = generate_queries.invoke({"question": query})
    logger.info(f"Generated {len(questions)} subqueries from original query")
    logger.debug(f"Subqueries: {questions}")

    return questions


def rewrite_query_with_context(
    question: str, history: list[tuple[str, str]], llm: ChatNVIDIA
) -> str:
    """
    Rewrite a query based on conversation history.

    Args:
        question: Original question
        history: Conversation history
        llm: Language model instance

    Returns:
        Rewritten query string
    """
    if not history:
        logger.debug("No history available, returning original question")
        return question

    prompts = get_prompts()
    streaming_parser = get_streaming_filter_think_parser()

    query_rewriter_prompt = prompts.get("query_decompositions_query_rewriter_prompt")
    query_rewriter = ChatPromptTemplate.from_template(query_rewriter_prompt)

    query_rewriter_chain = query_rewriter | llm | streaming_parser | StrOutputParser()
    rewritten_query = query_rewriter_chain.invoke(
        {
            "conversation_history": format_conversation_history(history),
            "question": question,
        }
    )

    logger.debug(f"Query rewritten: '{question}' -> '{rewritten_query}'")
    return rewritten_query.strip()


def retrieve_and_rank_documents(
    query: str,
    original_query: str,
    vdb_op: VDBRag,
    ranker: NVIDIARerank | None,
    collection_name: str = config.vector_store.default_collection_name,
    top_k: int = config.retriever.top_k,
) -> list[Document]:
    """
    Retrieve and optionally rerank documents for a query.

    Args:
        query: Query to retrieve documents for
        original_query: Original user query for reranking
        vdb_op: vectorstore object
        ranker: Optional document ranker instance

    Returns:
        List of retrieved and ranked documents
    """
    retrieved_docs = vdb_op.retrieval_langchain(
        query=query,
        collection_name=collection_name,
        top_k=top_k,
    )
    logger.info(f"Retrieved {len(retrieved_docs)} documents for query")

    if ranker and retrieved_docs:
        retrieved_docs = ranker.compress_documents(
            query=original_query, documents=retrieved_docs
        )
        logger.info(f"Reranked to {len(retrieved_docs)} documents")

    return retrieved_docs


def generate_answer_for_query(
    question: str, documents: list[Document], llm: ChatNVIDIA
) -> str:
    """
    Generate an answer for a specific question using retrieved documents.

    Args:
        question: Question to answer
        documents: Retrieved documents as context
        llm: Language model instance

    Returns:
        Generated answer string
    """
    prompts = get_prompts()
    streaming_parser = get_streaming_filter_think_parser()

    system_prompt = prompts.get("rag_template")
    system_message = [("system", system_prompt)]
    user_message = [("user", "{question}")]
    message = system_message + user_message

    prompt = ChatPromptTemplate.from_messages(message)
    rag_chain = prompt | llm | streaming_parser | StrOutputParser()

    answer = rag_chain.invoke({"question": question, "context": documents})
    logger.debug(f"Generated answer for question: '{question[:50]}...'")

    return answer


def generate_followup_question(
    history: list[tuple[str, str]],
    original_query: str,
    contexts: list[Document],
    llm: ChatNVIDIA,
) -> str:
    """
    Generate a follow-up question based on conversation history and context.

    Args:
        history: Conversation history
        original_query: Original user query
        contexts: Retrieved contexts
        llm: Language model instance

    Returns:
        Follow-up question string (empty if no follow-up needed)
    """
    prompts = get_prompts()
    streaming_parser = get_streaming_filter_think_parser()

    followup_question_prompt = ChatPromptTemplate.from_template(
        prompts.get("query_decomposition_followup_question_prompt")
    )

    followup_question_chain = (
        followup_question_prompt | llm | streaming_parser | StrOutputParser()
    )
    followup_question = followup_question_chain.invoke(
        {
            "conversation_history": format_conversation_history(history),
            "question": original_query,
            "context": f"{contexts}",
        }
    )

    # Clean up the follow-up question
    cleaned_followup = followup_question.strip().replace("'", "").replace('"', "")

    if cleaned_followup:
        logger.info(f"Generated follow-up question: {cleaned_followup}")
    else:
        logger.info("No follow-up question needed")

    return followup_question if cleaned_followup else ""


def process_subqueries(
    questions: list[str],
    original_query: str,
    llm: ChatNVIDIA,
    vdb_op: VDBRag,
    ranker: NVIDIARerank | None,
    collection_name: str = config.vector_store.default_collection_name,
    top_k: int = config.retriever.top_k,
    confidence_threshold: float = config.default_confidence_threshold,
) -> tuple[list[tuple[str, str]], list[Document]]:
    """
    Process a list of subqueries and return conversation history and contexts.

    Args:
        questions: List of questions to process
        original_query: Original user query
        llm: Language model instance
        vdb_op: vectorstore object
        ranker: Optional document ranker

    Returns:
        Tuple of (conversation_history, final_contexts)
    """
    history = []
    final_contexts = []

    for i, question in enumerate(questions):
        logger.info(f"Processing question {i + 1}/{len(questions)}: {question}")

        # Rewrite query with context from previous answers
        rewritten_query = rewrite_query_with_context(question, history, llm)
        logger.debug(f"Rewritten query: {rewritten_query}")

        # Retrieve and rank documents
        retrieved_docs = retrieve_and_rank_documents(
            rewritten_query, original_query, vdb_op, ranker, collection_name, top_k
        )

        # Add normalized documents to final contexts
        if ranker and retrieved_docs:
            final_contexts.extend(
                normalize_relevance_scores(
                    retrieved_docs, confidence_threshold=confidence_threshold
                )
            )

        # Generate answer
        answer = generate_answer_for_query(rewritten_query, retrieved_docs, llm)
        logger.debug(f"Generated answer length: {len(answer)} characters")

        history.append((question, answer))

    logger.info(
        f"Processed {len(questions)} subqueries, collected {len(final_contexts)} contexts"
    )
    return history, final_contexts


def generate_final_response(
    history: list[tuple[str, str]],
    contexts: list[Document],
    original_query: str,
    llm: ChatNVIDIA,
    enable_citations: bool = True,
    collection_name: str = "",
):
    """
    Generate the final comprehensive response.

    Args:
        history: Conversation history
        contexts: Final contexts
        original_query: Original user query
        llm: Language model instance

    Returns:
        Generated response stream
    """
    prompts = get_prompts()
    streaming_parser = get_streaming_filter_think_parser()

    final_response_prompt = prompts.get("query_decomposition_final_response_prompt")
    final_response_generator = ChatPromptTemplate.from_template(final_response_prompt)

    final_response_chain = (
        final_response_generator | llm | streaming_parser | StrOutputParser()
    )

    logger.info("Generating final comprehensive response")

    return generate_answer(
        final_response_chain.stream(
            {
                "conversation_history": format_conversation_history(history),
                "context": f"{contexts}",
                "question": original_query,
            }
        ),
        contexts=contexts,
        model=llm.model,
        collection_name=collection_name,
        enable_citations=enable_citations,
    )


def iterative_query_decomposition(
    query: str,
    history: list[tuple[str, str]],
    llm: ChatNVIDIA,
    vdb_op: VDBRag,
    ranker: NVIDIARerank | None = None,
    recursion_depth: int = config.query_decomposition.recursion_depth,
    enable_citations: bool = True,
    collection_name: str = config.vector_store.default_collection_name,
    top_k: int = config.retriever.top_k,
    confidence_threshold: float = config.default_confidence_threshold,
):
    """
    Decompose a complex query into simpler subqueries and generate a comprehensive answer.

    This function breaks down complex queries into manageable subqueries, processes them
    iteratively with context awareness, and generates a final comprehensive response.

    Args:
        query: Original complex query
        history: Previous conversation history (currently unused in recursion)
        llm: Language model instance
        vdb_op: vectorstore object
        ranker: Optional document ranker for improving relevance
        recursion_depth: Maximum number of recursion levels for query refinement

    Returns:
        Generated comprehensive answer stream

    Raises:
        ValueError: If no vectorstore object is provided
    """
    logger.info(f"Starting query decomposition for: '{query[:100]}...'")

    if not vdb_op:
        logger.error("No retriever provided")
        raise ValueError("At least one retriever must be provided")

    logger.debug(f"Using retriever: {type(vdb_op).__name__}")

    # Generate initial subqueries
    questions = generate_subqueries(query, llm)

    # If there's only one subquery, use basic RAG instead of query decomposition
    if len(questions) == 1:
        logger.info("No decomposition needed, using RAG directly")
        single_query = query

        # Retrieve and rank documents for the single query
        retrieved_docs = retrieve_and_rank_documents(
            single_query, query, vdb_op, ranker, collection_name, top_k
        )

        # Normalize relevance scores if reranker is used
        if ranker and retrieved_docs:
            retrieved_docs = normalize_relevance_scores(
                retrieved_docs,
                filter_docs=False,
                confidence_threshold=confidence_threshold,
            )

        # Generate final response directly
        return generate_final_response(
            history=[],  # Empty answer since we're generating the final response directly
            contexts=retrieved_docs,
            original_query=query,
            llm=llm,
            enable_citations=enable_citations,
            collection_name=collection_name,
        )

    final_contexts = []

    # Iterative refinement process
    for depth in range(recursion_depth):
        logger.info(f"Recursion depth: {depth + 1}/{recursion_depth}")

        # Process current set of questions
        iteration_history, iteration_contexts = process_subqueries(
            questions,
            query,
            llm,
            vdb_op,
            ranker,
            collection_name,
            top_k,
            confidence_threshold,
        )
        final_contexts.extend(iteration_contexts)

        # Generate follow-up question for next iteration
        followup_question = generate_followup_question(
            iteration_history, query, final_contexts, llm
        )

        if followup_question.strip():
            questions = [followup_question]
            logger.info(f"Continue with follow-up question: {followup_question}")
        else:
            logger.info(f"No follow-up needed, stopping at depth {depth + 1}")
            break

    # Generate final comprehensive response
    logger.info("Generating final response with all collected contexts")
    return generate_final_response(
        iteration_history, final_contexts, query, llm, enable_citations, collection_name
    )
