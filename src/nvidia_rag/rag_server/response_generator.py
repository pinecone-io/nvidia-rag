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

""" This module contains the response generator for the RAG server which generates the response to the user query and retrieves the summary of a document.
    1. response_generator(): Generate a response using the RAG chain.
    2. prepare_llm_request(): Prepare the request for the LLM response generation.
    3. generate_answer(): Generate and stream the response to the provided prompt.
    4. prepare_citations(): Prepare citations for the response.
    5. error_response_generator(): Generate a stream of data for the error response.
    6. retrieve_summary(): Retrieve the summary of a document.
"""

import logging
import time
import os
import bleach
import asyncio
from typing import Dict, Any, Generator, List, Union
from uuid import uuid4
from langchain_core.documents import Document
from pydantic import BaseModel, Field, validator
from typing import Literal, Optional

from nvidia_rag.utils.minio_operator import get_unique_thumbnail_id, get_minio_operator

logger = logging.getLogger(__name__)

FALLBACK_EXCEPTION_MSG = "Error from rag-server. Please check rag-server logs for more details."


class Usage(BaseModel):
    """Token usage information."""

    total_tokens: int = Field(
        default=0,
        ge=0,
        le=1000000000,
        format="int64",
        description="Total tokens used in the request",
    )
    prompt_tokens: int = Field(
        default=0,
        ge=0,
        le=1000000000,
        format="int64",
        description="Tokens used for the prompt",
    )
    completion_tokens: int = Field(
        default=0,
        ge=0,
        le=1000000000,
        format="int64",
        description="Tokens used for the completion",
    )

class SourceMetadata(BaseModel):
    """Metadata associated with a document source."""

    language: str = Field(
        default="",
        max_length=100000,
        pattern=r"[\s\S]*",
        description="Language of the document",
    )
    date_created: str = Field(
        default="",
        max_length=100000,
        pattern=r"[\s\S]*",
        description="Creation date of the document",
    )
    last_modified: str = Field(
        default="",
        max_length=100000,
        pattern=r"[\s\S]*",
        description="Last modification date",
    )
    page_number: int = Field(
        default=0,
        ge=-1,
        le=1000000,
        format="int64",
        description="Page number in the document",
    )
    description: str = Field(
        default="",
        max_length=100000,
        pattern=r"[\s\S]*",
        description="Description of the document content",
    )
    height: int = Field(
        default=0,
        ge=0,
        le=100000,
        format="int64",
        description="Height of the document in pixels",
    )
    width: int = Field(
        default=0,
        ge=0,
        le=100000,
        format="int64",
        description="Width of the document in pixels",
    )
    location: List[float] = Field(
        default=[],
        description="Bounding box location of the content"
    )
    location_max_dimensions: List[int] = Field(
        default=[],
        description="Maximum dimensions of the document"
    )
    content_metadata: Dict[str, Any] = Field(
        default={},
        description="Metadata about the content"
    )

class SourceResult(BaseModel):
    """Represents a single source document result."""

    document_id: str = Field(
        default="",
        max_length=100000,
        pattern=r"[\s\S]*",
        description="Unique identifier of the document",
    )
    content: str = Field(
        default="",
        pattern=r"[\s\S]*",
        description="Extracted content from the document",
    )
    document_name: str = Field(
        default="",
        max_length=100000,
        pattern=r"[\s\S]*",
        description="Name of the document",
    )
    document_type: Literal["image", "text", "table", "chart", "audio"] = Field(
        default="text",
        description="Type of document content"
    )
    score: float = Field(
        default=0.0,
        description="Relevance score of the document")

    metadata: SourceMetadata

class Citations(BaseModel):
    """Represents the sources section of the API response."""

    total_results: int = Field(
        default=0,
        ge=0,
        le=1000000,
        format="int64",
        description="Total number of source documents found",
    )
    results: List[SourceResult] = Field(
        default=[], description="List of document results"
    )

class Message(BaseModel):
    """Definition of the Chat Message type."""

    role: Literal["user", "assistant", "system", None] = Field(
        description="Role for a message: either 'user' or 'assistant' or 'system",
        default="user"
    )
    content: str = Field(
        description="The input query/prompt to the pipeline.",
        default="Hello! What can you help me with?",
        max_length=131072,
        pattern=r'[\s\S]*',
    )

    @validator('role')
    @classmethod
    def validate_role(cls, value):
        """ Field validator function to validate values of the field role"""
        if value:
            value = bleach.clean(value, strip=True)
            valid_roles = {'user', 'assistant', 'system'}
            if value is not None and value.lower() not in valid_roles:
                raise ValueError("Role must be one of 'user', 'assistant', or 'system'")
            return value.lower()

    @validator('content')
    @classmethod
    def sanitize_content(cls, v):
        """ Field validator function to sanitize content"""
        if v:
            v = bleach.clean(v, strip=True)
        return v

class ChainResponseChoices(BaseModel):
    """ Definition of Chain response choices"""

    index: int = Field(default=0, ge=0, le=256, format="int64")
    message: Message = Field(default=Message(role="assistant", content=""))
    delta: Message = Field(default=Message(role=None, content=""))
    finish_reason: Optional[str] = Field(default=None, max_length=4096, pattern=r'[\s\S]*')

class ChainResponse(BaseModel):
    """Definition of Chain APIs resopnse data type"""

    id: str = Field(default="", max_length=100000, pattern=r'[\s\S]*')
    choices: List[ChainResponseChoices] = Field(default=[], max_items=256)
    # context will be deprecated once `sources` field is implemented and populated
    model: str = Field(default="", max_length=4096, pattern=r'[\s\S]*')
    object: str = Field(default="", max_length=4096, pattern=r'[\s\S]*')
    created: int = Field(default=0, ge=0, le=9999999999, format="int64")
    # Place holder fields for now to match generate API response structure
    usage: Optional[Usage] = Field(default=Usage(), description="Token usage statistics")
    citations: Optional[Citations] = Field(default=Citations(), description="Source documents used for the response")

def prepare_llm_request(messages: List[Dict[str, str]], **kwargs) -> Dict[str, Any]:
    """
    Prepare the request for the LLM response generation
    Arguments:
        - messages: List of messages to be sent to the LLM
        - **kwargs: Additional arguments to be passed to the LLM
    Returns:
        - request: Dict containing the prepared request
    """
    request = {
        "messages": messages,
        "stream": True,
        "temperature": kwargs.get("temperature", 0.2),
        "max_tokens": kwargs.get("max_tokens", 1024),
        "top_p": kwargs.get("top_p", 0.9),
        "frequency_penalty": kwargs.get("frequency_penalty", 0.0),
        "presence_penalty": kwargs.get("presence_penalty", 0.0),
        "stop": kwargs.get("stop", None),
        "seed": kwargs.get("seed", None),
        "tools": kwargs.get("tools", None),
        "tool_choice": kwargs.get("tool_choice", None),
        "response_format": kwargs.get("response_format", None),
        "logit_bias": kwargs.get("logit_bias", None),
        "user": kwargs.get("user", None),
        "function_call": kwargs.get("function_call", None),
        "functions": kwargs.get("functions", None),
    }

    # Remove None values
    request = {k: v for k, v in request.items() if v is not None}

    return request

async def generate_answer(
    generator: 'Generator[str]',
    contexts: List[Any],
    model: str = "",
    namespace: str = "",
    enable_citations: bool = True
):
    """
    Generate and stream the response to the provided prompt
    Arguments:
        - generator: Generator object that yields response chunks
        - contexts: List of context documents
        - model: Model name for the response
        - namespace: Name of the namespace
        - enable_citations: Whether to enable citations
    Yields:
        - response_chunk: Stream of response chunks
    """
    try:
        resp_id = str(uuid4())
        for chunk in generator:
            if chunk:
                response_choice = ChainResponseChoices(
                    index=0,
                    message=Message(role="assistant", content=chunk),
                    delta=Message(role=None, content=chunk),
                    finish_reason=None
                )
                chain_response = ChainResponse(
                    id=resp_id,
                    choices=[response_choice],
                    model=model,
                    object="chat.completion.chunk",
                    created=int(time.time()),
                    citations=prepare_citations(contexts, enable_citations=enable_citations) if enable_citations else None
                )
                chain_response.id = resp_id
                chain_response.choices.append(response_choice)  # pylint: disable=E1101
                chain_response.model = model
                chain_response.object = "chat.completion.chunk"
                chain_response.created = int(time.time())
                logger.debug(response_choice)
                yield "data: " + str(chain_response.json()) + "\n\n"
            else:
                chain_response = ChainResponse()
                yield "data: " + str(chain_response.json()) + "\n\n"

    except Exception as e:
        exception_msg = ("Error from vector database server. Please ensure you have ingested some documents. "
                         "Please check rag-server logs for more details.")
        logger.error(
            "Error from vector database endpoint. Please ensure you have ingested some documents. " +
            "Error details: %s",
            e, exc_info=logger.getEffectiveLevel() <= logging.DEBUG)
        yield error_response_generator(exception_msg)

    except Exception as e:
        logger.error("Error from generate endpoint. Error details: %s", e,
                     exc_info=logger.getEffectiveLevel() <= logging.DEBUG)
        yield error_response_generator(FALLBACK_EXCEPTION_MSG)


def prepare_citations(
    retrieved_documents: List[Document],
    force_citations: bool = False, # True in-case of doc search api
    enable_citations: bool = True
) -> Citations:
    """
    Prepare citation information based on retrieved_documents
    Arguments:
        - namespace: str - Vector Database Namespace Name
        - retrieved_documents: List of retrieved langchain documents
        - force_citations: This flag would give citations even if config enable_citations is unset
    Returns:
        - source_results: Citations
    """
    citations = list()

    if force_citations or enable_citations:
        for doc in retrieved_documents:

            if isinstance(doc.metadata.get("source"), str):
                # If langchain is used for ingestion, the source is a string
                file_name = os.path.basename(doc.metadata.get("source"))
                content = doc.page_content
                source_metadata = SourceMetadata(
                    description=doc.page_content,
                    content_metadata=doc.metadata.get("content_metadata", {})
                )
                document_type = "text"
            else:
                file_name = os.path.basename(doc.metadata.get("source").get("source_id"))

            if doc.metadata.get("content_metadata", {}).get("type") in ["text", "audio"]:
                content = doc.page_content
                document_type = doc.metadata.get("content_metadata", {}).get("type")
                source_metadata = SourceMetadata(
                    description=doc.page_content,
                    content_metadata=doc.metadata.get("content_metadata")
                )

            elif doc.metadata.get("content_metadata", {}).get("type", {}) in ["image", "structured"]:
                # Pull required metadata
                page_number = doc.metadata.get("content_metadata", {}).get("page_number")
                location = doc.metadata.get("content_metadata", {}).get("location")
                if doc.metadata.get("content_metadata", {}).get("type") == "image":
                    document_type = doc.metadata.get("content_metadata", {}).get("type")
                else:
                    document_type = doc.metadata.get("content_metadata", {}).get("subtype")
                try:
                    if enable_citations:
                        logger.debug("Pulling content from minio for image/table/chart for citations ...")
                        unique_thumbnail_id = get_unique_thumbnail_id(
                            namespace=doc.metadata.get("namespace"),
                            file_name=file_name,
                            page_number=page_number,
                            location=location
                        )
                        payload = get_minio_operator().get_payload(object_name=unique_thumbnail_id)
                        content = payload.get("content", "")
                        source_metadata = SourceMetadata(
                            page_number=page_number,
                            location=location,
                            description=doc.page_content,
                            content_metadata=doc.metadata.get("content_metadata")
                        )
                    else:
                        content = ""
                        source_metadata = SourceMetadata(
                            description=doc.page_content,
                            content_metadata=doc.metadata.get("content_metadata")
                        )
                except Exception as e:
                    logger.error(f"Error pulling content from minio for image/table/chart for citations: {e}")
                    content = ""
                    source_metadata = SourceMetadata(
                        description=doc.page_content,
                        content_metadata=doc.metadata.get("content_metadata", {})
                    )

            if content and document_type in ["image", "text", "table", "chart", "audio"]:
                # Prepare citations basemodel
                source_result = SourceResult(
                    content=content,
                    document_type=document_type,
                    document_name=file_name,
                    score=doc.metadata.get("relevance_score", 0),
                    metadata=source_metadata
                )
                citations.append(source_result)

    return Citations(
        total_results=len(citations),
        results=citations
    )


def error_response_generator(exception_msg: str):
    """
    Generate a stream of data for the error response
    """

    def get_chain_response(
        content: str = "",
        finish_reason: Union[str, None] = None
    ) -> ChainResponse:
        """
        Get a chain response for an exception
        Args:
            exception_msg: str - Exception message
        Returns:
            chain_response: ChainResponse - Chain response for an exception
        """
        chain_response = ChainResponse()
        chain_response.id = str(uuid4())
        response_choice = ChainResponseChoices(
            index=0,
            message=Message(role="assistant", content=content),
            delta=Message(role=None, content=content),
            finish_reason=finish_reason
        )
        chain_response.choices.append(response_choice)  # pylint: disable=E1101
        chain_response.object = "chat.completion.chunk"
        chain_response.created = int(time.time())
        return chain_response

    for i in range(0, len(exception_msg), 5):
        exception_msg_content = exception_msg[i:i+5]
        chain_response = get_chain_response(content=exception_msg_content)
        yield "data: " + str(chain_response.model_dump_json()) + "\n\n"
    chain_response = get_chain_response(finish_reason="stop")
    yield "data: " + str(chain_response.model_dump_json()) + "\n\n"


async def retrieve_summary(
        namespace: str,
        file_name: str,
        wait: bool = False,
        timeout: int = 300
    ) -> Dict[str, Any]:
        """Get the summary of a document."""

        try:
            unique_thumbnail_id = get_unique_thumbnail_id(
                namespace=f"summary_{namespace}",
                file_name=file_name,
                page_number=0,
                location=[]
            )

            # First attempt to get existing summary
            payload = get_minio_operator().get_payload(object_name=unique_thumbnail_id)

            if payload:
                return {
                    "message": "Summary retrieved successfully.",
                    "summary": payload.get("summary", ""),
                    "file_name": payload.get("file_name", ""),
                    "namespace": namespace,
                    "status": "SUCCESS"
                }

            # If summary not found and wait=False, return immediately
            if not wait:
                return {
                    "message": f"Summary for {file_name} not found. Ensure the file name and namespace are correct. Set wait=true to wait for generation.",
                    "status": "FAILED"
                }

            # If wait=True, poll for summary with timeout
            start_time = time.time()
            while time.time() - start_time < timeout:
                payload = get_minio_operator().get_payload(object_name=unique_thumbnail_id)
                if payload:
                    return {
                        "message": "Summary retrieved successfully.",
                        "summary": payload.get("summary", ""),
                        "file_name": payload.get("file_name", ""),
                        "namespace": namespace,
                        "status": "SUCCESS"
                    }
                await asyncio.sleep(5)  # Wait 5 seconds before checking again

            return {
                "message": f"Summary for {file_name} not found after {timeout} seconds. Ensure the file name and namespace are correct.",
                "status": "FAILED"
            }

        except Exception as e:
            logger.error(f"Error retrieving summary for {file_name}: {e}")
            return {
                "message": f"Error retrieving summary: {str(e)}",
                "status": "FAILED"
            }


def escape_json_content(content: str) -> str:
    """
    Escape JSON content to prevent JSON parsing errors
    """
    if not content:
        return content
    
    # Replace problematic characters
    content = content.replace('\\', '\\\\')
    content = content.replace('"', '\\"')
    content = content.replace('\n', '\\n')
    content = content.replace('\r', '\\r')
    content = content.replace('\t', '\\t')
    
    return content