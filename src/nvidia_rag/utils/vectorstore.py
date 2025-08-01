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

"""The wrapper for interacting with Pinecone vectorstore and associated functions.
1. create_vectorstore_langchain: Create the vector db index for langchain.
2. get_vectorstore: Get the vectorstore object.
3. get_namespace: Get the list of all namespace in vectorstore along with the number of rows in each namespace.
4. delete_namespaces: Delete a list of namespaces from the Pinecone vector database.
5. get_docs_vectorstore_langchain: Retrieve filenames stored in the vector store implemented in LangChain.
"""

import os
import time
import logging
from typing import List, Dict, Any
from pathlib import Path
from urllib.parse import urlparse
from opentelemetry import context as otel_context
from langchain_core.runnables import RunnableAssign, RunnableLambda
from langchain_core.documents import Document
from langchain_core.vectorstores import VectorStore
from langchain_core.embeddings import Embeddings

from nvidia_rag.utils.common import get_config

logger = logging.getLogger(__name__)

CONFIG = get_config()
if CONFIG.vector_store.name.lower() == "pinecone" or CONFIG.vector_store.name.lower() == "pinecone-local":
    from pinecone import Pinecone, ServerlessSpec
    from langchain_pinecone import PineconeVectorStore
else:
    raise ValueError(f"{CONFIG.vector_store.name} vector database is not supported. Only 'pinecone' and 'pinecone-local' are supported.")

def create_vectorstore_langchain(document_embedder, index_name: str=os.getenv("INDEX_NAME", "nvidia-rag-blueprint")) -> VectorStore:
    """Create the vector db index for langchain."""

    config = get_config()

    if config.vector_store.name.lower() == "pinecone" or config.vector_store.name.lower() == "pinecone-local":
        if config.vector_store.name.lower() == "pinecone":
            pinecone_client = Pinecone(api_key=os.getenv("PINECONE_API_KEY"), source_tag="nvidia:rag-blueprint")
        else:
            pinecone_client = Pinecone(api_key="pclocal", host=os.getenv("PINECONE_LOCAL_HOST", "http://localhost:5080"))
        
        spec = ServerlessSpec(
            region=os.getenv("PINECONE_REGION", "us-east-1"),
            cloud=os.getenv("PINECONE_CLOUD", "aws")
        )
        logger.debug("Trying to connect to Pinecone index: %s", index_name)
        # Check if the index exists
        if not pinecone_client.has_index(index_name):
            logger.error(f"Index '{index_name}' does not exist in Pinecone. Creating it...")
            pinecone_client.create_index(
                name=index_name,
                dimension=document_embedder.dimension,
                metric=config.vector_store.metric or "cosine",
                spec=spec
            )
        logger.debug(f"Index '{index_name}' exists. Proceeding with vector store creation.")
        vectorstore = PineconeVectorStore(
            index_name=index_name,
            embedding=document_embedder
        )
    else:
        raise ValueError(f"{config.vector_store.name} vector database is not supported")
    logger.debug("Vector store created and saved.")
    return vectorstore


def get_vectorstore(
        document_embedder: "Embeddings",
        index_name: str) -> VectorStore:
    """
    Send a vectorstore object.
    If a Vectorstore object already exists, the function returns that object.
    Otherwise, it creates a new Vectorstore object and returns it.
    """
    return create_vectorstore_langchain(document_embedder, index_name)


def get_namespace(index_name: str = "") -> Dict[str, Any]:
    """Get list of all namespaces in vectorstore along with the number of rows in each namespace."""
    config = get_config()

    if config.vector_store.name.lower() == "pinecone" or config.vector_store.name.lower() == "pinecone-local":
        if config.vector_store.name.lower() == "pinecone":
            pinecone_client = Pinecone(api_key=os.getenv("PINECONE_API_KEY"), source_tag="nvidia:rag-blueprint")
        else:
            pinecone_client = Pinecone(api_key="pclocal", host=os.getenv("PINECONE_LOCAL_HOST", "http://localhost:5080"))
        
        index_name = index_name or os.getenv("PINECONE_INDEX_NAME", "nvidia-rag-blueprint")
        index = pinecone_client.Index(index_name)

        try:
            # Get stats for each index
            stats = index.describe_index_stats()
            return {
                "namespaces": [{"namespace_name": name, "vector_count": details["vector_count"]} 
                               for name, details in stats.get("namespaces", {}).items()],
                "total_namespaces":  len(stats.get("namespaces", {}))
            }
        except Exception as e:
            logger.error(f"Failed to get namespaces from Pinecone: {str(e)}")
            raise Exception(f"Failed to get namespaces from Pinecone: {str(e)}")
    else:
        raise ValueError(f"{config.vector_store.name} vector database is not supported")


def delete_namespaces(index_name: str, namespace_names: List[str]) -> dict:
    """
    Delete a list of namespaces from the Pinecone vector database.
    """
    config = get_config()
    results = {}
    
    if config.vector_store.name.lower() == "pinecone" or config.vector_store.name.lower() == "pinecone-local":
        if config.vector_store.name.lower() == "pinecone":
            pinecone_client = Pinecone(api_key=os.getenv("PINECONE_API_KEY"), source_tag="nvidia:rag-blueprint")
        else:
            pinecone_client = Pinecone(api_key="pclocal", host=os.getenv("PINECONE_LOCAL_HOST", "http://localhost:5080"))
        
        index_name = index_name or os.getenv("PINECONE_INDEX_NAME", "nvidia-rag-blueprint")
        # Check if the index exists
        if not pinecone_client.has_index(index_name):
            logger.error(f"Index '{index_name}' does not exist in Pinecone. Skipping deletion.")
            return results
        index = pinecone_client.Index(index_name)
        
        # Delete the namespaces in the index
        for namespace_name in namespace_names:
            try:
                index.delete_namespace(namespace=namespace_name)
                results[namespace_name] = {"status": "success"}
                logger.info(f"Namespace '{namespace_name}' deleted successfully from Pinecone index '{index_name}'.")
            except Exception as e:
                results[namespace_name] = {"status": "failed", "error": str(e)}
                logger.error(f"Failed to delete namespace {namespace_name}: {str(e)}")
    else:
        raise ValueError(f"{config.vector_store.name} vector database is not supported")
    
    return results


def get_docs_vectorstore_langchain(
        vectorstore: VectorStore,
        namespace_name: str,
        namespace: str = ""
    ) -> List[Dict[str, Any]]:
    """Retrieves filenames (vector IDs) stored in the vector store implemented in LangChain."""

    settings = get_config()
    try:
        extract_filename = lambda metadata: os.path.basename(metadata['source'] if type(metadata['source']) == str else metadata.get('source').get('source_name'))  # noqa: E731

        if settings.vector_store.name.lower() == "pinecone" or settings.vector_store.name.lower() == "pinecone-local":
            if settings.vector_store.name.lower() == "pinecone":
                pinecone_client = Pinecone(api_key=os.getenv("PINECONE_API_KEY"), source_tag="nvidia:rag-blueprint")
            else:
                pinecone_client = Pinecone(api_key="pclocal", host=os.getenv("PINECONE_LOCAL_HOST", "http://localhost:5080"))
            
            try:
                # Use Pinecone's list_paginated to get vector IDs
                list_response = pinecone_client.list_paginated(
                    index_name=namespace_name,
                    namespace=namespace,
                    limit=100
                )
                
                documents = []
                for vector_id in list_response.vectors:
                    documents.append({
                        "document_name": vector_id,
                        "namespace_name": namespace_name
                    })
                
                return documents
            except Exception as e:
                logger.error(f"Failed to list documents from Pinecone: {str(e)}")
                return []
        else:
            raise ValueError(f"{settings.vector_store.name} vector database is not supported")
    except Exception as e:
        logger.error(f"Error in get_docs_vectorstore_langchain: {str(e)}")
    return []


def del_docs_vectorstore_langchain(vectorstore: VectorStore, filenames: List[str], index_name: str) -> bool:
    """Delete documents from the vector store implemented in LangChain."""
    settings = get_config()
    try:
        if settings.vector_store.name.lower() == "pinecone" or settings.vector_store.name.lower() == "pinecone-local":
            if settings.vector_store.name.lower() == "pinecone":
                pinecone_client = Pinecone(api_key=os.getenv("PINECONE_API_KEY"), source_tag="nvidia:rag-blueprint")
            else:
                pinecone_client = Pinecone(api_key="pclocal", host=os.getenv("PINECONE_LOCAL_HOST", "http://localhost:5080"))
            
            index_name = index_name or os.getenv("PINECONE_INDEX_NAME", "nvidia-rag-blueprint")
            index = pinecone_client.Index(index_name)
            try:
                # Delete vectors by ID
                index.delete(ids=filenames)
                logger.info(f"Successfully deleted {len(filenames)} documents from Pinecone index '{index_name}'")
                return True
            except Exception as e:
                logger.error(f"Failed to delete documents from Pinecone: {str(e)}")
                return False
        else:
            raise ValueError(f"{settings.vector_store.name} vector database is not supported")
    except Exception as e:
        logger.error("Error occurred while deleting documents: %s", e)
        return False


def retrieve_docs_from_retriever(retriever, retriever_query: str, expr: str, otel_ctx: otel_context) -> List[Document]:
    """Retrieve documents from the retriever.

    Args:
        retriever (VectorStoreRetriever): The retriever to use.
        retriever_query (str): The query to use.
        expr (str): The expression to use.

    Returns:
        docs (List[Document]): The list of documents from the retriever.
    """

    token = otel_context.attach(otel_ctx)
    start_time = time.time()
    retriever_docs = []
    docs = []
    retriever_lambda = RunnableLambda(lambda x: retriever.invoke(x, expr=expr))
    retriever_chain = {"context": retriever_lambda} | RunnableAssign({"context": lambda input: input["context"]})
    retriever_docs = retriever_chain.invoke(retriever_query, config={'run_name':'retriever'})
    docs = retriever_docs.get("context", [])
    namespace_name = retriever.vectorstore.index_name if hasattr(retriever.vectorstore, 'index_name') else "unknown"
    end_time = time.time()
    latency = end_time - start_time
    logger.info(f"Retriever latency: {latency:.4f} seconds")
    otel_context.detach(token)
    return add_namespace_name_to_retreived_docs(docs, namespace_name)


def add_namespace_name_to_retreived_docs(docs: List[Document], namespace_name: str) -> List[Document]:
    """Add the namespace name to the retrieved documents.
    This is done to ensure the namespace name is available in the metadata of the documents for preparing citations.

    Args:
        docs (List[Document]): The list of documents to add the namespace name to.
        namespace_name (str): The name of the namespace to add to the documents.

    Returns:
        docs (List[Document]): The list of documents with the namespace name added to the metadata.
    """
    for doc in docs:
        doc.metadata["namespace_name"] = namespace_name
    return docs
