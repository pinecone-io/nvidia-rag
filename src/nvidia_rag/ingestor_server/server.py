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

"""The definition of the NVIDIA RAG Ingestion server.
    POST /documents: Upload documents to the vector store.
    GET /status: Get the status of an ingestion task.
    PATCH /documents: Update documents in the vector store.
    GET /documents: Get documents in the vector store.
    DELETE /documents: Delete documents from the vector store.
    GET /namespaces: Get namespaces in the vector store.
    POST /namespaces: Create namespaces in the vector store.
    DELETE /namespaces: Delete namespaces in the vector store.
"""

import asyncio
import logging
import os
import json
import shutil
from pathlib import Path
from typing import List, Union, Dict, Any, Literal
from fastapi import UploadFile, Request, File, FastAPI, Form, Depends, HTTPException, Query
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from starlette.status import HTTP_422_UNPROCESSABLE_ENTITY

from nvidia_rag.utils.common import get_config
from nvidia_rag.utils.vectorstore import (
    get_vectorstore, 
    get_namespaces as get_namespaces_from_vectorstore, 
    delete_namespaces, 
    del_docs_vectorstore_langchain, 
    get_docs_vectorstore_langchain
)
from nvidia_rag.ingestor_server.main import NvidiaRAGIngestor

logging.basicConfig(level=os.environ.get('LOGLEVEL', 'INFO').upper())
logger = logging.getLogger(__name__)

tags_metadata = [
    {
        "name": "Health APIs",
        "description": "APIs for checking and monitoring server liveliness and readiness.",
    },
    {"name": "Ingestion APIs", "description": "APIs for uploading, deletion and listing documents."},
    {"name": "Vector DB APIs", "description": "APIs for managing collections in vector database."}
]


# create the FastAPI server
app = FastAPI(root_path=f"/v1", title="APIs for NVIDIA RAG Ingestion Server",
    description="This API schema describes all the Ingestion endpoints exposed for NVIDIA RAG server Blueprint",
    version="1.0.0",
        docs_url="/docs",
    redoc_url="/redoc",
    openapi_tags=tags_metadata,
)

# Allow access in browser from RAG UI and Storybook (development)
origins = ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


EXAMPLE_DIR = "./"

# Initialize the NVIngestIngestor class
NV_INGEST_INGESTOR = NvidiaRAGIngestor()
CONFIG = get_config()

class HealthResponse(BaseModel):
    message: str = Field(max_length=4096, pattern=r'[\s\S]*', default="")


class SplitOptions(BaseModel):
    """Options for splitting the document into smaller chunks."""
    chunk_size: int = Field(CONFIG.nv_ingest.chunk_size, description="Number of units per split.")
    chunk_overlap: int = Field(CONFIG.nv_ingest.chunk_overlap, description="Number of overlapping units between consecutive splits.")


class CustomMetadata(BaseModel):
    """Custom metadata to be added to the document."""
    filename: str = Field(..., description="Name of the file.")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Metadata to be added to the document.")


class DocumentUploadRequest(BaseModel):
    """Request model for uploading and processing documents."""

    blocking: bool = Field(
        False,
        description="Enable/disable blocking ingestion."
    )

    split_options: SplitOptions = Field(
        default_factory=SplitOptions,
        description="Options for splitting documents into smaller parts before embedding."
    )

    custom_metadata: List[CustomMetadata] = Field(
        default_factory=list,
        description="Custom metadata to be added to the document."
    )

    generate_summary: bool = Field(
        default=False,
        description="Enable/disable summary generation for each uploaded document."
    )

    # Reserved for future use
    # embedding_model: str = Field(
    #     os.getenv("APP_EMBEDDINGS_MODELNAME", ""),
    #     description="Identifier for the embedding model to be used."
    # )

    # embedding_endpoint: str = Field(
    #     os.getenv("APP_EMBEDDINGS_SERVERURL", ""),
    #     description="URL of the embedding service endpoint."
    # )

class UploadedDocument(BaseModel):
    """Model representing an individual uploaded document."""
    # Reserved for future use
    # document_id: str = Field("", description="Unique identifier for the document.")
    document_name: str = Field("", description="Name of the document.")
    # Reserved for future use
    # size_bytes: int = Field(0, description="Size of the document in bytes.")
    metadata: Dict[str, Any] = Field({}, description="Metadata of the document.")

class FailedDocument(BaseModel):
    """Model representing an individual uploaded document."""
    document_name: str = Field("", description="Name of the document.")
    error_message: str = Field("", description="Error message from the ingestion process.")

class UploadDocumentResponse(BaseModel):
    """Response model for uploading a document."""
    message: str = Field("", description="Message indicating the status of the request.")
    total_documents: int = Field(0, description="Total number of documents uploaded.")
    documents: List[UploadedDocument] = Field([], description="List of uploaded documents.")
    failed_documents: List[FailedDocument] = Field([], description="List of failed documents.")
    validation_errors: List[Dict[str, Any]] = Field([], description="List of validation errors.")

class IngestionTaskResponse(BaseModel):
    """Response model for uploading a document."""
    message: str = Field("", description="Message indicating the status of the request.")
    task_id: str = Field("", description="Task ID of the ingestion process.")

class IngestionTaskStatusResponse(BaseModel):
    """Response model for getting the status of an ingestion task."""
    state: str = Field("", description="State of the ingestion task.")
    result: UploadDocumentResponse = Field(..., description="Result of the ingestion task.")

class DocumentListResponse(BaseModel):
    """Response model for uploading a document."""
    message: str = Field("", description="Message indicating the status of the request.")
    total_documents: int = Field(0, description="Total number of documents uploaded.")
    documents: List[UploadedDocument] = Field([], description="List of uploaded documents.")

class MetadataField(BaseModel):
    """Model representing a metadata field."""
    name: str = Field("", description="Name of the metadata field.")
    type: Literal["string", "datetime"] = Field("", description="Type of the metadata field from the following: 'string', 'datetime'.")
    description: str = Field("", description="Optional description of the metadata field.")

class UploadedNamespace(BaseModel):
    """Model representing an individual uploaded document."""
    namespace_name: str = Field("", description="Name of the namespace.")
    num_entities: int = Field(0, description="Number of rows or entities in the namespace.")
    metadata_schema: List[MetadataField] = Field([], description="Metadata schema of the namespace.")

class NamespaceListResponse(BaseModel):
    """Response model for uploading a document."""
    message: str = Field("", description="Message indicating the status of the request.")
    total_namespaces: int = Field(0, description="Total number of namespaces uploaded.")
    namespaces: List[UploadedNamespace] = Field([], description="List of uploaded namespaces.")

class CreateNamespaceRequest(BaseModel):
    """Request model for creating a namespace."""
    vdb_endpoint: str = Field(os.getenv("APP_VECTORSTORE_URL", ""), description="Endpoint of the vector database.")
    namespace_name: str = Field(os.getenv("NAMESPACE_NAME", ""), description="Name of the namespace.")
    embedding_dimension: int = Field(2048, description="Embedding dimension of the namespace.")
    metadata_schema: List[MetadataField] = Field([], description="Metadata schema of the namespace.")

class FailedNamespace(BaseModel):
    """Model representing a namespace that failed to be created or deleted."""
    namespace_name: str = Field("", description="Name of the namespace.")
    error_message: str = Field("", description="Error message from the namespace creation or deletion process.")

class NamespacesResponse(BaseModel):
    """Response model for creation or deletion of namespaces in vector database."""
    message: str = Field(..., description="Status message of the process.")
    successful: List[str] = Field(default_factory=list, description="List of successfully created or deleted namespaces.")
    failed: List[FailedNamespace] = Field(default_factory=list, description="List of namespaces that failed to be created or deleted.")
    total_success: int = Field(0, description="Total number of namespaces successfully created or deleted.")
    total_failed: int = Field(0, description="Total number of namespaces that failed to be created or deleted.")

class CreateNamespaceResponse(BaseModel):
    """Response model for creation or deletion of a namespace in vector database."""
    message: str = Field(..., description="Status message of the process.")
    namespace_name: str = Field(..., description="Name of the namespace.")


@app.exception_handler(RequestValidationError)
async def request_validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    try:
        body = await request.json()
        logger.warning("Invalid incoming Request Body:", body)
    except Exception as e:
        print("Failed to read request body:", e)
    return JSONResponse(
        status_code=HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": jsonable_encoder(exc.errors(), exclude={"input"})},
    )


@app.get(
    "/health",
    response_model=HealthResponse,
    tags=["Health APIs"],
    responses={
        500: {
            "description": "Internal Server Error",
            "content": {
                "application/json": {
                    "example": {
                        "detail": "Internal server error occurred"
                    }
                }
            },
        }
    },
)
async def health_check():
    """
    Perform a Health Check

    Returns 200 when service is up. This does not check the health of downstream services.
    """

    response_message = "Ingestion Service is up."
    return HealthResponse(message=response_message)


async def parse_json_data(
    data: str = Form(
        ...,
        description="JSON data in string format containing metadata about the documents which needs to be uploaded.",
        examples=[json.dumps(DocumentUploadRequest().model_dump())],
        media_type="application/json"
    )
) -> DocumentUploadRequest:
    try:
        json_data = json.loads(data)
        return DocumentUploadRequest(**json_data)
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=400, detail="Invalid JSON format") from e
    except Exception as e:
        raise HTTPException(status_code=422, detail=str(e)) from e


@app.post(
    "/documents",
    tags=["Ingestion APIs"],
    response_model=UploadDocumentResponse,
    responses={
        499: {
            "description": "Client Closed Request",
            "content": {
                "application/json": {
                    "example": {
                        "detail": "The client cancelled the request"
                    }
                }
            },
        },
        500: {
            "description": "Internal Server Error",
            "content": {
                "application/json": {
                    "example": {
                        "detail": "Internal server error occurred"
                    }
                }
            },
        },
        200: {
            "description": "Background Ingestion Started",
            "model": IngestionTaskResponse
        }
    }
)
async def upload_document(documents: List[UploadFile] = File(...),
    request: DocumentUploadRequest = Depends(parse_json_data)) -> Union[UploadDocumentResponse, IngestionTaskResponse]:
    """Upload a document to the vector store."""

    if not len(documents):
        raise Exception("No files provided for uploading.")

    try:
        # Store all provided file paths in a temporary directory
        all_file_paths = process_file_paths(documents, request.namespace_name)
        response_dict = await NV_INGEST_INGESTOR.upload_documents(
            filepaths=all_file_paths,
            delete_files_after_ingestion=True,
            **request.model_dump()
        )
        if not request.blocking:
            return JSONResponse(
                content=IngestionTaskResponse(**response_dict).model_dump(),
                status_code=200)

        return UploadDocumentResponse(**response_dict)
    except asyncio.CancelledError as e:
        logger.warning(f"Request cancelled while uploading document {e}")
        return JSONResponse(content={"message": "Request was cancelled by the client"}, status_code=499)
    except Exception as e:
        logger.error(f"Error from POST /documents endpoint. Ingestion of file failed with error: {e}")
        return JSONResponse(content={"message": f"Ingestion of files failed with error: {e}"}, status_code=500)


@app.get(
    "/status",
    tags=["Ingestion APIs"],
    response_model=IngestionTaskStatusResponse,
)
async def get_task_status(task_id: str):
    """Get the status of an ingestion task."""

    logger.info(f"Getting status of task {task_id}")
    try:
        result = await NV_INGEST_INGESTOR.status(task_id)
        return IngestionTaskStatusResponse(
            state=result.get("state", "UNKNOWN"),
            result=result.get("result", {})
        )
    except KeyError as e:
        logger.error(f"Task {task_id} not found with error: {e}")
        return IngestionTaskStatusResponse(
            state="UNKNOWN",
            result={"message": "Task not found"}
        )

@app.patch(
    "/documents",
    tags=["Ingestion APIs"],
    response_model=DocumentListResponse,
    responses={
        499: {
            "description": "Client Closed Request",
            "content": {
                "application/json": {
                    "example": {
                        "detail": "The client cancelled the request"
                    }
                }
            },
        },
        500: {
            "description": "Internal Server Error",
            "content": {
                "application/json": {
                    "example": {
                        "detail": "Internal server error occurred"
                    }
                }
            },
        },
    }
)
async def update_documents(documents: List[UploadFile] = File(...),
    request: DocumentUploadRequest = Depends(parse_json_data)) -> DocumentListResponse:

    """Upload a document to the vector store. If the document already exists, it will be replaced."""

    try:
        # Store all provided file paths in a temporary directory
        all_file_paths = process_file_paths(documents, request.namespace_name)
        response_dict = await NV_INGEST_INGESTOR.update_documents(
            filepaths=all_file_paths,
            delete_files_after_ingestion=True,
            **request.model_dump()
        )
        if not request.blocking:
            return JSONResponse(
                content=IngestionTaskResponse(**response_dict).model_dump(),
                status_code=200)

        return UploadDocumentResponse(**response_dict)

    except asyncio.CancelledError as e:
        logger.error(f"Request cancelled while deleting and uploading document")
        return JSONResponse(content={"message": "Request was cancelled by the client"}, status_code=499)
    except Exception as e:
        logger.error(f"Error from PATCH /documents endpoint. Ingestion failed with error: {e}")
        return JSONResponse(content={"message": f"Ingestion of files failed with error. {e}"}, status_code=500)


# Use get_vectorstore to retrieve documents
@app.get(
    "/documents",
    tags=["Ingestion APIs"],
    response_model=DocumentListResponse,
    responses={
        499: {
            "description": "Client Closed Request",
            "content": {
                "application/json": {
                    "example": {
                        "detail": "The client cancelled the request"
                    }
                }
            },
        },
        500: {
            "description": "Internal Server Error",
            "content": {
                "application/json": {
                    "example": {
                        "detail": "Internal server error occurred"
                    }
                }
            },
        }
    },
)
async def get_documents(_: Request, namespace_name: str = os.getenv("NAMESPACE_NAME", "")) -> DocumentListResponse:
    try:
        vectorstore = get_vectorstore(DOCUMENT_EMBEDDER, namespace_name)
        if vectorstore is None:
            return JSONResponse(content={"message": "Namespace not found.", "total_documents": 0, "documents": []}, status_code=404)
        documents = get_docs_vectorstore_langchain(vectorstore, namespace_name)
        return DocumentListResponse(message="Documents retrieved successfully.", total_documents=len(documents), documents=documents)
    except Exception as e:
        logger.error("Error from GET /documents endpoint. Error details: %s", e)
        return JSONResponse(content={"message": f"Error occurred while fetching documents: {e}"}, status_code=500)


# Use del_docs_vectorstore_langchain to delete documents
@app.delete(
    "/documents",
    tags=["Ingestion APIs"],
    response_model=DocumentListResponse,
    responses={
        499: {
            "description": "Client Closed Request",
            "content": {
                "application/json": {
                    "example": {
                        "detail": "The client cancelled the request"
                    }
                }
            },
        },
        500: {
            "description": "Internal Server Error",
            "content": {
                "application/json": {
                    "example": {
                        "detail": "Internal server error occurred"
                    }
                }
            },
        }
    },
)
async def delete_documents(_: Request, document_names: List[str] = [], namespace_name: str = os.getenv("NAMESPACE_NAME")) -> DocumentListResponse:
    try:
        vectorstore = get_vectorstore(DOCUMENT_EMBEDDER, namespace_name)
        if vectorstore is None:
            return JSONResponse(content={"message": "Namespace not found.", "total_documents": 0, "documents": []}, status_code=404)
        success = del_docs_vectorstore_langchain(vectorstore, document_names, namespace_name)
        if success:
            return DocumentListResponse(message="Documents deleted successfully.", total_documents=len(document_names), documents=[])
        else:
            return JSONResponse(content={"message": "Failed to delete documents."}, status_code=500)
    except Exception as e:
        logger.error("Error from DELETE /documents endpoint. Error details: %s", e)
        return JSONResponse(content={"message": f"Error deleting document {document_names}: {e}"}, status_code=500)


# Use get_namespace to retrieve namespaces
@app.get(
    "/namespaces",
    tags=["Vector DB APIs"],
    response_model=NamespacesResponse,
    responses={
        499: {
            "description": "Client Closed Request",
            "content": {
                "application/json": {
                    "example": {
                        "detail": "The client cancelled the request"
                    }
                }
            },
        },
        500: {
            "description": "Internal Server Error",
            "content": {
                "application/json": {
                    "example": {
                        "detail": "Internal server error occurred"
                    }
                }
            },
        },
    },
)
async def get_namespaces() -> NamespacesResponse:
    """
    Endpoint to get a list of namespace names from the vector database server.
    Returns a list of namespace names.
    """
    try:
        namespaces = get_namespaces_from_vectorstore()
        return NamespacesResponse(message="Namespaces retrieved successfully.", total_namespaces=len(namespaces), namespaces=namespaces)
    except Exception as e:
        logger.error("Error from GET /namespaces endpoint. Error details: %s", e)
        return JSONResponse(content={"message": f"Error occurred while fetching namespaces. Error: {e}"}, status_code=500)


@app.post(
    "/namespaces",
    tags=["Vector DB APIs"],
    response_model=CreateNamespaceResponse,
    responses={
        499: {
            "description": "Client Closed Request",
            "content": {
                "application/json": {
                    "example": {
                        "detail": "The client cancelled the request"
                    }
                }
            },
        },
        500: {
            "description": "Internal Server Error",
            "content": {
                "application/json": {
                    "example": {
                        "detail": "Internal server error occurred"
                    }
                }
            },
        },
    },
)
async def create_namespaces(
    vdb_endpoint: str = Query(default=os.getenv("APP_VECTORSTORE_URL"), include_in_schema=False),
    namespace_names: List[str] = [os.getenv("NAMESPACE_NAME")],
    embedding_dimension: int = 2048
) -> CreateNamespaceResponse:
    """
    Endpoint to create a namespace in the vector database server.
    Returns status message.
    """
    try:
        if hasattr(NV_INGEST_INGESTOR, "create_namespaces") and callable(NV_INGEST_INGESTOR.create_namespaces):
            response = NV_INGEST_INGESTOR.create_namespaces(namespace_names, vdb_endpoint, embedding_dimension)
            return CreateNamespaceResponse(**response)
        raise NotImplementedError("Example class has not implemented the create_namespaces method.")

    except asyncio.CancelledError as e:
        logger.warning(f"Request cancelled while fetching namespaces. {str(e)}")
        return JSONResponse(content={"message": "Request was cancelled by the client."}, status_code=499)
    except Exception as e:
        logger.error("Error from POST /namespaces endpoint. Error details: %s", e)
        return JSONResponse(content={"message": f"Error occurred while creating namespaces. Error: {e}"}, status_code=500)


async def __delete_namespaces(namespace_names: List[str] = [os.getenv("NAMESPACE_NAME")]) -> NamespacesResponse:
    """
    Endpoint to delete a namespace in the vector database server.
    Returns status message.
    """
    try:
        result = delete_namespaces(namespace_names)
        return NamespacesResponse(message="Namespaces deleted successfully.", successful=result.get("successful", []), failed=result.get("failed", []))
    except Exception as e:
        logger.error("Error from DELETE /namespaces endpoint. Error details: %s", e)
        return JSONResponse(content={"message": f"Error occurred while deleting namespaces. Error: {e}"}, status_code=500)

async def delete_namespaces(namespace_names: List[str] = [os.getenv("NAMESPACE_NAME")]) -> NamespacesResponse:
    """
    Endpoint to delete a namespace from the vector database server.
    Returns status message.
    """
    return __delete_namespaces(namespace_names)


def process_file_paths(filepaths: List[str], namespace_name: str):
    """Process the file paths and return the list of file paths."""

    base_upload_folder = Path(os.path.join(CONFIG.temp_dir,
                                           f"uploaded_files/{namespace_name}"))
    base_upload_folder.mkdir(parents=True, exist_ok=True)
    all_file_paths = []

    for file in filepaths:
        upload_file = os.path.basename(file.filename)

        if not upload_file:
            raise RuntimeError("Error parsing uploaded filename.")

        # Create a unique directory for each file
        unique_dir = base_upload_folder #/ str(uuid4())
        unique_dir.mkdir(parents=True, exist_ok=True)

        file_path = unique_dir / upload_file
        all_file_paths.append(str(file_path))

        # Copy uploaded file to upload_dir directory and pass that file path to ingestor server
        with open(file_path, "wb") as f:
            shutil.copyfileobj(file.file, f)

    return all_file_paths
