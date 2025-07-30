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
This is the Main module for RAG ingestion pipeline.
1. Upload documents: Upload documents to the vector store. Method name: upload_documents
2. Update documents: Update documents in the vector store. Method name: update_documents
3. Status: Get the status of an ingestion task. Method name: status
4. Create collection: Create a new collection in the vector store. Method name: create_collection
5. Create collections: Create new collections in the vector store. Method name: create_collections
6. Delete collections: Delete collections in the vector store. Method name: delete_collections
7. Get collections: Get all collections in the vector store. Method name: get_collections
8. Get documents: Get documents in the vector store. Method name: get_documents
9. Delete documents: Delete documents in the vector store. Method name: delete_documents

Private methods:
1. __ingest_docs: Ingest documents to the vector store.
2. __nvingest_upload_doc: Upload documents to the vector store using nvingest.
3. __get_failed_documents: Get failed documents from the vector store.
4. __get_non_supported_files: Get non-supported files from the vector store.
5. __ingest_document_summary: Drives summary generation and ingestion if enabled.
6. __prepare_summary_documents: Prepare summary documents for ingestion.
7. __generate_summary_for_documents: Generate summary for documents.
8. __put_document_summary_to_minio: Put document summaries to minio.
"""

import os
import time
import asyncio
import json
from typing import (
    List,
    Dict,
    Union,
    Any,
    Tuple
)
import logging
from uuid import uuid4
from datetime import datetime
from urllib.parse import urlparse
from langchain_core.documents import Document
from langchain_core.prompts.chat import ChatPromptTemplate
from langchain_core.output_parsers.string import StrOutputParser
from langchain_text_splitters import RecursiveCharacterTextSplitter
from nvidia_rag.utils.embedding import get_embedding_model
from nvidia_rag.utils.llm import get_llm, get_prompts
from nvidia_rag.ingestor_server.nvingest import get_nv_ingest_client, get_nv_ingest_ingestor
from nvidia_rag.utils.common import get_config
from nvidia_rag.ingestor_server.task_handler import INGESTION_TASK_HANDLER
from nv_ingest_client.util.file_processing.extract import EXTENSION_TO_DOCUMENT_TYPE
from nvidia_rag.utils.minio_operator import (get_minio_operator,
                                      get_unique_thumbnail_id_collection_prefix,
                                      get_unique_thumbnail_id_file_name_prefix,
                                      get_unique_thumbnail_id)
from nvidia_rag.utils.vectorstore import (
    get_vectorstore,
    get_docs_vectorstore_langchain,
    del_docs_vectorstore_langchain,
    create_collection,
    create_collections,
    get_collection,
    delete_collections,
)
from pinecone import Pinecone

# Initialize global objects
logger = logging.getLogger(__name__)

CONFIG = get_config()
DOCUMENT_EMBEDDER = document_embedder = get_embedding_model(model=CONFIG.embeddings.model_name, url=CONFIG.embeddings.server_url)
NV_INGEST_CLIENT_INSTANCE = get_nv_ingest_client()
MINIO_OPERATOR = get_minio_operator()

# NV-Ingest Batch Mode Configuration
ENABLE_NV_INGEST_BATCH_MODE = os.getenv("ENABLE_NV_INGEST_BATCH_MODE", "true").lower() == "true"
NV_INGEST_FILES_PER_BATCH = int(os.getenv("NV_INGEST_FILES_PER_BATCH", 16))
ENABLE_NV_INGEST_PARALLEL_BATCH_MODE = os.getenv("ENABLE_NV_INGEST_PARALLEL_BATCH_MODE", "true").lower() == "true"
NV_INGEST_CONCURRENT_BATCHES = int(os.getenv("NV_INGEST_CONCURRENT_BATCHES", 4))

class NvidiaRAGIngestor():
    """
    Main Class for RAG ingestion pipeline integration for NV-Ingest
    """

    _config = get_config()
    _vdb_upload_bulk_size = 500


    async def upload_documents(
        self,
        filepaths: List[str],
        delete_files_after_ingestion: bool = False,
        blocking: bool = False,
        collection_name: str = "multimodal_data",
        split_options: Dict[str, Any] = {"chunk_size": CONFIG.nv_ingest.chunk_size, "chunk_overlap": CONFIG.nv_ingest.chunk_overlap},
        custom_metadata: List[Dict[str, Any]] = [],
        generate_summary: bool = False
    ) -> Dict[str, Any]:
        """Upload documents to the vector store using Pinecone SDK."""

        try:

            if not blocking:
                _task = lambda: self.__ingest_docs(
                    filepaths=filepaths,
                    delete_files_after_ingestion=delete_files_after_ingestion,
                    collection_name=collection_name,
                    split_options=split_options,
                    custom_metadata=custom_metadata,
                    generate_summary=generate_summary
                )
                task_id = INGESTION_TASK_HANDLER.submit_task(_task)
                return {"message": "Ingestion started in background", "task_id": task_id}
            else:
                response_dict = await self.__ingest_docs(
                    filepaths=filepaths,
                    delete_files_after_ingestion=delete_files_after_ingestion,
                    collection_name=collection_name,
                    split_options=split_options,
                    custom_metadata=custom_metadata,
                    generate_summary=generate_summary
                )
            return response_dict

        except Exception as e:
            logger.exception(f"Failed to upload documents: {e}")
            return {
                "message": f"Failed to upload documents due to error: {str(e)}",
                "total_documents": len(filepaths),
                "documents": [],
                "failed_documents": []
            }

    async def __ingest_docs(
        self,
        filepaths: List[str],
        delete_files_after_ingestion: bool = False,
        collection_name: str = "multimodal_data",
        split_options: Dict[str, Any] = {"chunk_size": CONFIG.nv_ingest.chunk_size, "chunk_overlap": CONFIG.nv_ingest.chunk_overlap},
        custom_metadata: List[Dict[str, Any]] = [],
        generate_summary: bool = False
    ) -> Dict[str, Any]:
        """
        Main function called by ingestor server to ingest
        the documents to vector-DB

        Arguments:
            - filepaths: List[str] - List of absolute filepaths
            - delete_files_after_ingestion: bool - Whether to delete files after ingestion
            - collection_name: str - Name of the collection in the vector database
            - split_options: Dict[str, Any] - Options for splitting documents
            - custom_metadata: List[Dict[str, Any]] - Custom metadata to be added to documents
        """

        logger.info("Performing ingestion in collection_name: %s", collection_name)
        logger.debug("Filepaths for ingestion: %s", filepaths)

        try:
            # Verify the metadata
            if custom_metadata:
                validation_status, validation_errors = await self.__verify_metadata(custom_metadata, collection_name, filepaths)
                if not validation_status:
                    return {
                        "message": f"Custom metadata validation failed: {validation_errors}",
                        "total_documents": len(filepaths),
                        "documents": [],
                        "failed_documents": [],
                        "validation_errors": validation_errors,
                        "state": "FAILED",
                    }

            failed_validation_documents = []

            # Peform ingestion using nvingest for all files that have not failed
            # Check if the provided collection_name exists in vector-DB
            pinecone_client = Pinecone(api_key=os.getenv("PINECONE_API_KEY"), source_tag="nvidia:rag-blueprint")
            if not pinecone_client.has_index(collection_name):
                raise ValueError(f"Pinecone index {collection_name} does not exist. Ensure the index is created before ingestion.")

            start_time = time.time()
            results, failures = await self.__nvingest_upload_doc(
                filepaths=filepaths,
                collection_name=collection_name,
                split_options=split_options,
                custom_metadata=custom_metadata,
                generate_summary=generate_summary
            )

            logger.info("== Overall Ingestion completed successfully in %s seconds ==", time.time() - start_time)

            # Get failed documents
            failed_documents = await self.__get_failed_documents(failures, filepaths, collection_name)
            failures_filepaths = [failed_document.get("document_name") for failed_document in failed_documents]

            filename_to_metadata_map = {custom_metadata_item.get("filename"): custom_metadata_item.get("metadata") for custom_metadata_item in custom_metadata}
            # Generate response dictionary
            uploaded_documents = [
                {
                    "document_id": str(uuid4()),  # Generate a document_id from filename
                    "document_name": os.path.basename(filepath),
                    "size_bytes": os.path.getsize(filepath),
                    "metadata": filename_to_metadata_map.get(os.path.basename(filepath), {})
                }
                for filepath in filepaths if os.path.basename(filepath) not in failures_filepaths
            ]

             # Get current timestamp in ISO format
            timestamp = datetime.utcnow().isoformat()
            # TODO: Store document_id, timestamp and document size as metadata

            response_data = {
                "message": "Document upload job successfully completed.",
                "total_documents": len(uploaded_documents) + len(failed_validation_documents) + len(failed_documents),
                "documents": uploaded_documents,
                "failed_documents": failed_documents + failed_validation_documents
            }

            # Optional: Clean up provided files after ingestion, needed for docker workflow
            if delete_files_after_ingestion:
                logger.info(f"Cleaning up files in {filepaths}")
                for file in filepaths:
                    try:
                        os.remove(file)
                        logger.debug(f"Deleted temporary file: {file}")
                    except FileNotFoundError:
                        logger.warning(f"File not found: {file}")
                    except Exception as e:
                        logger.error(f"Error deleting {file}: {e}")

            return response_data

        except Exception as e:
            logger.exception("Ingestion failed due to error: %s", e, exc_info=logger.getEffectiveLevel() <= logging.DEBUG)
            raise e

    async def __ingest_document_summary(
        self,
        results: List[List[Dict[str, Union[str, dict]]]],
        collection_name: str
    )-> None:
        """
        Generates and ingests document summaries for a list of files.

        Args:
            filepaths (List[str]): List of paths to documents to generate summaries for
        """

        logger.info(f"Document summary ingestion started")
        start_time = time.time()
        # Prepare summary documents
        documents = await self.__prepare_summary_documents(results, collection_name)
        # Generate summary for each document
        documents = await self.__generate_summary_for_documents(documents)
        # # Add document summary to minio
        await self.__put_document_summary_to_minio(documents)
        end_time = time.time()
        logger.info(f"Document summary ingestion completed! Time taken: {end_time - start_time} seconds")

    async def update_documents(
        self,
        filepaths: List[str],
        delete_files_after_ingestion: bool = False,
        blocking: bool = False,
        collection_name: str = "multimodal_data",
        split_options: Dict[str, Any] = {"chunk_size": CONFIG.nv_ingest.chunk_size, "chunk_overlap": CONFIG.nv_ingest.chunk_overlap},
        custom_metadata: List[Dict[str, Any]] = [],
        generate_summary: bool = False
    ) -> Dict[str, Any]:

        """Upload a document to the vector store. If the document already exists, it will be replaced."""

        for file in filepaths:
            file_name = os.path.basename(file)

            # Delete the existing document

            if delete_files_after_ingestion:
                response = self.delete_documents([file_name],
                                                    collection_name=collection_name)
            else:
                 response = self.delete_documents([file],
                                                    collection_name=collection_name)

            if response["total_documents"] == 0:
                logger.info("Unable to remove %s from collection. Either the document does not exist or there is an error while removing. Proceeding with ingestion.", file_name)
            else:
                logger.info("Successfully removed %s from collection %s.", file_name, collection_name)

        response = await self.upload_documents(
            filepaths=filepaths,
            delete_files_after_ingestion=delete_files_after_ingestion,
            blocking=blocking,
            collection_name=collection_name,
            split_options=split_options,
            custom_metadata=custom_metadata,
            generate_summary=generate_summary
        )
        return response


    async def status(self, task_id: str)-> Dict[str, Any]:
        """Get the status of an ingestion task."""

        logger.info(f"Getting status of task {task_id}")
        try:
            if INGESTION_TASK_HANDLER.get_task_status(task_id) == "PENDING":
                logger.info(f"Task {task_id} is pending")
                return {
                    "state": "PENDING",
                    "result": {"message": "Task is pending"}
                }
            elif INGESTION_TASK_HANDLER.get_task_status(task_id) == "FINISHED":
                try:
                    result = INGESTION_TASK_HANDLER.get_task_result(task_id)
                    if isinstance(result, dict) and result.get("state") == "FAILED":
                        logger.error(f"Task {task_id} failed with error: {result.get('message')}")
                        result.pop("state")
                        return {
                            "state": "FAILED",
                            "result" : result
                        }
                    logger.info(f"Task {task_id} is finished")
                    return {
                        "state": "FINISHED",
                        "result": result
                    }
                except Exception as e:
                    logger.error(f"Task {task_id} failed with error: {e}")
                    return {
                        "state": "FAILED",
                        "result" : {"message": str(e)}
                    }
            else:
                logger.error(f"Unknown task state: {INGESTION_TASK_HANDLER.get_task_status(task_id)}")
                return {
                    "state": "UNKNOWN",
                    "result": {"message": "Unknown task state"}
                }
        except KeyError as e:
            logger.error(f"Task {task_id} not found with error: {e}")
            return {
                "state": "UNKNOWN",
                "result": {"message": "Unknown task state"}
            }


    def create_collections(
        self, collection_names: List[str], vdb_endpoint: str, embedding_dimension: int = 2048
    ) -> str:
        """
        Main function called by ingestor server to create new collections in vector-DB

        Arguments:
            - collection_names: List[str] - List of collection names to create
            - vdb_endpoint: str - URL of the vector database endpoint
            - embedding_dimension: int - Dimension of the embedding vectors

        Returns:
            - str - Success message
        """
        try:
            result = create_collections(collection_names, vdb_endpoint, embedding_dimension)
            return f"Collections created successfully: {result}"
        except Exception as e:
            logger.error(f"Failed to create collections in Pinecone: {e}")
            raise e

    def create_collection(
        self, collection_name: str, vdb_endpoint: str, embedding_dimension: int = 2048, metadata_schema: List[Dict[str, str]] = []
    ) -> str:
        """
        Main function called by ingestor server to create a new collection in vector-DB

        Arguments:
            - collection_name: str - Name of the collection to create
            - vdb_endpoint: str - URL of the vector database endpoint
            - embedding_dimension: int - Dimension of the embedding vectors
            - metadata_schema: List[Dict[str, str]] - Metadata schema for the collection

        Returns:
            - str - Success message
        """
        try:
            create_collection(collection_name, vdb_endpoint, embedding_dimension)
            return f"Collection '{collection_name}' created successfully"
        except Exception as e:
            logger.error(f"Failed to create collection in Pinecone: {e}")
            raise e

    def delete_collections(
        self, vdb_endpoint: str, collection_names: List[str],
    ) -> Dict[str, Any]:
        """
        Main function called by ingestor server to delete collections in vector-DB

        Arguments:
            - vdb_endpoint: str - URL of the vector database endpoint
            - collection_names: List[str] - List of collection names to delete

        Returns:
            - Dict[str, Any] - Result of the deletion operation
        """
        try:
            result = delete_collections(vdb_endpoint, collection_names)
            return {
                "message": "Collections deleted successfully",
                "result": result
            }
        except Exception as e:
            logger.error(f"Failed to delete collections in Pinecone: {e}")
            raise e

    def get_collections(self, vdb_endpoint: str) -> Dict[str, Any]:
        """
        Main function called by ingestor server to get all collections in vector-DB

        Arguments:
            - vdb_endpoint: str - URL of the vector database endpoint

        Returns:
            - Dict[str, Any] - List of collections with their metadata
        """
        try:
            result = get_collection(vdb_endpoint)
            return {
                "message": "Collections retrieved successfully",
                "collections": result
            }
        except Exception as e:
            logger.error(f"Failed to get collections from Pinecone: {e}")
            raise e

    def get_documents(self, collection_name: str, vdb_endpoint: str) -> Dict[str, Any]:
        """
        Main function called by ingestor server to get documents in vector-DB

        Arguments:
            - collection_name: str - Name of the collection to get documents from
            - vdb_endpoint: str - URL of the vector database endpoint

        Returns:
            - Dict[str, Any] - List of documents with their metadata
        """
        try:
            vectorstore = get_vectorstore(DOCUMENT_EMBEDDER, collection_name, vdb_endpoint)
            if vectorstore is None:
                return {
                    "message": f"Collection '{collection_name}' does not exist",
                    "total_documents": 0,
                    "documents": []
                }
            
            documents = get_docs_vectorstore_langchain(vectorstore, collection_name, vdb_endpoint)
            return {
                "message": "Documents retrieved successfully",
                "total_documents": len(documents),
                "documents": documents
            }
        except Exception as e:
            logger.error(f"Failed to get documents from Pinecone: {e}")
            return {
                "message": f"Document listing failed due to error {str(e)}",
                "total_documents": 0,
                "documents": []
            }

    def delete_documents(self, document_names: List[str], collection_name: str, vdb_endpoint: str, include_upload_path: bool = False) -> Dict[str, Any]:
        """
        Main function called by ingestor server to delete documents in vector-DB

        Arguments:
            - document_names: List[str] - List of document names to delete
            - collection_name: str - Name of the collection to delete documents from
            - vdb_endpoint: str - URL of the vector database endpoint
            - include_upload_path: bool - Whether to include upload path in document name

        Returns:
            - Dict[str, Any] - Result of the deletion operation
        """
        try:
            vectorstore = get_vectorstore(DOCUMENT_EMBEDDER, collection_name, vdb_endpoint)
            if vectorstore is None:
                return {
                    "message": f"Collection '{collection_name}' does not exist",
                    "total_documents": 0,
                    "documents": []
                }
            
            success = del_docs_vectorstore_langchain(vectorstore, document_names, collection_name, include_upload_path)
            if success:
                return {
                    "message": "Documents deleted successfully",
                    "total_documents": len(document_names),
                    "documents": document_names
                }
            else:
                return {
                    "message": "Failed to delete documents",
                    "total_documents": 0,
                    "documents": []
                }
        except Exception as e:
            logger.error(f"Failed to delete documents from Pinecone: {e}")
            return {
                "message": f"Document deletion failed due to error {str(e)}",
                "total_documents": 0,
                "documents": []
            }

    def __put_content_to_minio(
        self, results: List[List[Dict[str, Union[str, dict]]]],
        collection_name: str,
    ) -> None:
        """
        Put nv-ingest image/table/chart content to minio
        """
        if not CONFIG.captioning.enable_captioning:
            logger.info(f"Skipping minio insertion for collection: {collection_name}")
            return # Don't perform minio insertion if captioning is disabled

        logger.info(f"== MinIO upload for collection_name: {collection_name} started ==")
        start_time = time.time()

        try:
            # Extract content from results
            payloads = []
            for result_list in results:
                for result_element in result_list:
                    if result_element.get("type") in ["image", "table", "chart"]:
                        content = result_element.get("content", "")
                        if content:
                            # Generate unique ID for the content
                            unique_id = get_unique_thumbnail_id_collection_prefix(collection_name)
                            
                            # Create payload for MinIO
                            payload = {
                                "id": unique_id,
                                "content": content,
                                "type": result_element.get("type"),
                                "source": result_element.get("source", {}),
                                "metadata": result_element.get("metadata", {})
                            }
                            payloads.append(payload)

            # Upload to MinIO
            if payloads:
                if os.getenv("ENABLE_MINIO_BULK_UPLOAD", "True") in ["True", "true"]:
                    logger.info(f"Bulk uploading {len(payloads)} payloads to MinIO")
                    MINIO_OPERATOR.put_payloads_bulk(
                        payloads=payloads,
                        collection_prefix=collection_name
                    )
                else:
                    logger.info(f"Sequentially uploading {len(payloads)} payloads to MinIO")
                    for payload in payloads:
                        MINIO_OPERATOR.put_payload(
                            payload=payload,
                            collection_prefix=collection_name
                        )

            end_time = time.time()
            logger.info(f"== MinIO upload for collection_name: {collection_name} completed in {end_time - start_time} seconds ==")

        except Exception as e:
            logger.error("Failed to put content to minio: %s, citations would be disabled for collection: %s", str(e),
                        collection_name)

    async def __nvingest_upload_doc(
        self,
        filepaths: List[str],
        collection_name: str,
        split_options: Dict[str, Any] = {"chunk_size": CONFIG.nv_ingest.chunk_size, "chunk_overlap": CONFIG.nv_ingest.chunk_overlap},
        custom_metadata: List[Dict[str, Any]] = [],
        generate_summary: bool = False
    ) -> Tuple[List[List[Dict[str, Union[str, dict]]]], List[Dict[str, Any]]]:
        """
        Upload documents to the vector store using nvingest

        Arguments:
            - filepaths: List[str] - List of absolute filepaths
            - collection_name: str - Name of the collection in the vector database
            - split_options: Dict[str, Any] - Options for splitting documents
            - custom_metadata: List[Dict[str, Any]] - Custom metadata to be added to documents
            - generate_summary: bool - Whether to generate summaries for documents

        Returns:
            - Tuple[List[List[Dict[str, Union[str, dict]]]], List[Dict[str, Any]]] - Results and failures
        """
        logger.info(f"== NV-Ingest upload for collection_name: {collection_name} started ==")
        start_time = time.time()

        try:
            if ENABLE_NV_INGEST_BATCH_MODE:
                logger.info(f"Using batch mode with {NV_INGEST_FILES_PER_BATCH} files per batch")
                
                if ENABLE_NV_INGEST_PARALLEL_BATCH_MODE:
                    logger.info(f"Using parallel batch mode with {NV_INGEST_CONCURRENT_BATCHES} concurrent batches")
                    
                    # Split filepaths into batches
                    batches = [filepaths[i:i + NV_INGEST_FILES_PER_BATCH] for i in range(0, len(filepaths), NV_INGEST_FILES_PER_BATCH)]
                    
                    async def process_batch(sub_filepaths, batch_num):
                        logger.info(f"Processing batch {batch_num} with {len(sub_filepaths)} files")
                        return await self.__nv_ingest_ingestion(
                            filepaths=sub_filepaths,
                            collection_name=collection_name,
                            batch_number=batch_num,
                            split_options=split_options,
                            custom_metadata=custom_metadata,
                            generate_summary=generate_summary
                        )
                    
                    # Process batches concurrently
                    tasks = [process_batch(batch, i) for i, batch in enumerate(batches)]
                    batch_results = await asyncio.gather(*tasks, return_exceptions=True)
                    
                    # Combine results
                    all_results = []
                    all_failures = []
                    for i, result in enumerate(batch_results):
                        if isinstance(result, Exception):
                            logger.error(f"Batch {i} failed with error: {result}")
                            all_failures.append({"batch": i, "error": str(result)})
                        else:
                            batch_result, batch_failures = result
                            all_results.extend(batch_result)
                            all_failures.extend(batch_failures)
                    
                    results = all_results
                    failures = all_failures
                else:
                    # Sequential batch processing
                    results = []
                    failures = []
                    for i in range(0, len(filepaths), NV_INGEST_FILES_PER_BATCH):
                        batch = filepaths[i:i + NV_INGEST_FILES_PER_BATCH]
                        batch_num = i // NV_INGEST_FILES_PER_BATCH
                        logger.info(f"Processing batch {batch_num} with {len(batch)} files")
                        
                        batch_result, batch_failures = await self.__nv_ingest_ingestion(
                            filepaths=batch,
                            collection_name=collection_name,
                            batch_number=batch_num,
                            split_options=split_options,
                            custom_metadata=custom_metadata,
                            generate_summary=generate_summary
                        )
                        results.extend(batch_result)
                        failures.extend(batch_failures)
            else:
                # Single batch processing
                results, failures = await self.__nv_ingest_ingestion(
                    filepaths=filepaths,
                    collection_name=collection_name,
                    split_options=split_options,
                    custom_metadata=custom_metadata,
                    generate_summary=generate_summary
                )

            end_time = time.time()
            logger.info(f"== NV-Ingest upload for collection_name: {collection_name} completed in {end_time - start_time} seconds ==")

            return results, failures

        except Exception as e:
            logger.exception(f"NV-Ingest upload failed: {e}")
            raise e

    async def __nv_ingest_ingestion(
        self,
        filepaths: List[str],
        collection_name: str,
        batch_number: int=0,
        split_options: Dict[str, Any] = {"chunk_size": CONFIG.nv_ingest.chunk_size, "chunk_overlap": CONFIG.nv_ingest.chunk_overlap},
        custom_metadata: List[Dict[str, Any]] = [],
        generate_summary: bool = False
    ) -> Tuple[List[List[Dict[str, Union[str, dict]]]], List[Dict[str, Any]]]:
        """
        Perform NV-Ingest ingestion for a batch of files

        Arguments:
            - filepaths: List[str] - List of absolute filepaths
            - collection_name: str - Name of the collection in the vector database
            - batch_number: int - Batch number for logging
            - split_options: Dict[str, Any] - Options for splitting documents
            - custom_metadata: List[Dict[str, Any]] - Custom metadata to be added to documents
            - generate_summary: bool - Whether to generate summaries for documents

        Returns:
            - Tuple[List[List[Dict[str, Union[str, dict]]]], List[Dict[str, Any]]] - Results and failures
        """
        logger.info(f"== NV-Ingest ingestion batch {batch_number} started with {len(filepaths)} files ==")
        start_time = time.time()

        try:
            # Get NV-Ingest ingestor
            ingestor = get_nv_ingest_ingestor(
                NV_INGEST_CLIENT_INSTANCE,
                filepaths=filepaths,
                collection_name=collection_name,
                split_options=split_options,
                custom_metadata=custom_metadata
            )

            # Perform ingestion
            results = await ingestor.ingest()

            # Process results
            processed_results = []
            failures = []

            for i, result in enumerate(results):
                if result.get("status") == "success":
                    processed_results.append(result.get("data", []))
                else:
                    failures.append({
                        "file": filepaths[i] if i < len(filepaths) else "unknown",
                        "error": result.get("error", "Unknown error"),
                        "batch": batch_number
                    })

            end_time = time.time()
            logger.info(f"== NV-Ingest ingestion batch {batch_number} completed in {end_time - start_time} seconds ==")

            return processed_results, failures

        except Exception as e:
            logger.exception(f"NV-Ingest ingestion batch {batch_number} failed: {e}")
            failures = [{"file": filepath, "error": str(e), "batch": batch_number} for filepath in filepaths]
            return [], failures

    async def __get_failed_documents(
        self,
        failures: List[Dict[str, Any]],
        filepaths: List[str],
        collection_name: str
    ) -> List[Dict[str, Any]]:
        """
        Get failed documents from the vector store

        Arguments:
            - failures: List[Dict[str, Any]] - List of failures from NV-Ingest
            - filepaths: List[str] - List of filepaths that were processed
            - collection_name: str - Name of the collection in the vector database

        Returns:
            - List[Dict[str, Any]] - List of failed documents with error details
        """
        failed_documents = []

        for failure in failures:
            file_name = failure.get("file", "unknown")
            error_message = failure.get("error", "Unknown error")
            
            failed_documents.append({
                "document_name": os.path.basename(file_name) if file_name != "unknown" else "unknown",
                "error": error_message,
                "file_path": file_name
            })

        return failed_documents

    async def __get_non_supported_files(self, filepaths: List[str]) -> List[str]:
        """
        Get non-supported files from the list of filepaths

        Arguments:
            - filepaths: List[str] - List of filepaths to check

        Returns:
            - List[str] - List of non-supported files
        """
        non_supported_files = []
        for filepath in filepaths:
            file_extension = os.path.splitext(filepath)[1].lower()
            if file_extension not in EXTENSION_TO_DOCUMENT_TYPE:
                non_supported_files.append(filepath)
        return non_supported_files

    async def __verify_metadata(
            self,
            custom_metadata: List[Dict[str, Any]],
            collection_name: str,
            filepaths: List[str]
        ) -> Tuple[bool, Dict[str, Any]]:
        """
        Verify custom metadata against the collection's metadata schema

        Arguments:
            - custom_metadata: List[Dict[str, Any]] - Custom metadata to verify
            - collection_name: str - Name of the collection in the vector database
            - filepaths: List[str] - List of filepaths being processed

        Returns:
            - Tuple[bool, Dict[str, Any]] - Validation status and errors
        """
        try:
            # For Pinecone, we don't have a metadata schema system like some vector databases
            # So we'll just validate that the metadata structure is correct
            validation_errors = []
            
            for metadata_item in custom_metadata:
                if not isinstance(metadata_item, dict):
                    validation_errors.append(f"Metadata item must be a dictionary: {metadata_item}")
                    continue
                
                filename = metadata_item.get("filename")
                metadata = metadata_item.get("metadata")
                
                if not filename:
                    validation_errors.append("Metadata item must contain 'filename' field")
                    continue
                
                if not isinstance(metadata, dict):
                    validation_errors.append(f"Metadata for {filename} must be a dictionary")
                    continue
                
                # Check if the file exists in the filepaths
                file_exists = any(os.path.basename(filepath) == filename for filepath in filepaths)
                if not file_exists:
                    validation_errors.append(f"File {filename} not found in the provided filepaths")
            
            if validation_errors:
                return False, {"validation_errors": validation_errors}
            
            return True, {}
            
        except Exception as e:
            logger.error(f"Metadata validation failed: {e}")
            return False, {"validation_errors": [f"Metadata validation error: {str(e)}"]}

    async def __prepare_summary_documents(
        self,
        results: List[List[Dict[str, Union[str, dict]]]],
        collection_name: str
    ) -> List[Document]:
        """
        Prepare summary documents for ingestion

        Arguments:
            - results: List[List[Dict[str, Union[str, dict]]]] - Results from NV-Ingest
            - collection_name: str - Name of the collection in the vector database

        Returns:
            - List[Document] - List of documents prepared for summary generation
        """
        documents = []
        
        for result_list in results:
            for result_element in result_list:
                if result_element.get("type") == "text":
                    content = result_element.get("content", "")
                    if content:
                        metadata = self.__prepare_metadata(result_element)
                        metadata["collection_name"] = collection_name
                        metadata["summary_type"] = "document"
                        
                        document = Document(
                            page_content=content,
                            metadata=metadata
                        )
                        documents.append(document)
        
        return documents

    def __parse_documents(
        self,
        results: List[List[Dict[str, Union[str, dict]]]]
    ) -> List[Document]:
        """
        Parse documents from NV-Ingest results

        Arguments:
            - results: List[List[Dict[str, Union[str, dict]]]] - Results from NV-Ingest

        Returns:
            - List[Document] - List of parsed documents
        """
        documents = []
        
        for result_list in results:
            for result_element in result_list:
                if result_element.get("type") == "text":
                    content = result_element.get("content", "")
                    if content:
                        metadata = self.__prepare_metadata(result_element)
                        
                        document = Document(
                            page_content=content,
                            metadata=metadata
                        )
                        documents.append(document)
        
        return documents

    def __prepare_metadata(
        self, result_element: Dict[str, Union[str, dict]]
    ) -> Dict[str, str]:
        """
        Prepare metadata for a document

        Arguments:
            - result_element: Dict[str, Union[str, dict]] - Result element from NV-Ingest

        Returns:
            - Dict[str, str] - Prepared metadata
        """
        metadata = {}
        
        # Extract source information
        source = result_element.get("source", {})
        if isinstance(source, dict):
            metadata["source"] = source.get("source_name", "")
            metadata["page"] = str(source.get("page", ""))
        else:
            metadata["source"] = str(source)
        
        # Extract other metadata
        result_metadata = result_element.get("metadata", {})
        if isinstance(result_metadata, dict):
            for key, value in result_metadata.items():
                metadata[key] = str(value)
        
        return metadata

    async def __generate_summary_for_documents(
        self,
        documents: List[Document]
    ) -> List[Document]:
        """
        Generate summaries for documents

        Arguments:
            - documents: List[Document] - List of documents to generate summaries for

        Returns:
            - List[Document] - List of documents with summaries
        """
        if not documents:
            return documents
        
        try:
            # Get LLM for summary generation
            llm = get_llm()
            prompts = get_prompts()
            
            # Create summary prompt
            summary_prompt = ChatPromptTemplate.from_template(
                "Please provide a concise summary of the following document content:\n\n{content}\n\nSummary:"
            )
            
            # Create summary chain
            summary_chain = summary_prompt | llm | StrOutputParser()
            
            # Generate summaries
            for document in documents:
                try:
                    summary = await summary_chain.ainvoke({"content": document.page_content})
                    document.metadata["summary"] = summary
                except Exception as e:
                    logger.error(f"Failed to generate summary for document: {e}")
                    document.metadata["summary"] = "Summary generation failed"
            
            return documents
            
        except Exception as e:
            logger.error(f"Failed to generate summaries: {e}")
            return documents

    async def __put_document_summary_to_minio(
        self,
        documents: List[Document]
    ) -> None:
        """
        Put document summary to minio
        """
        if not documents:
            logger.error(f"No documents to put to minio")
            return

        logger.info(f"== Document summary insertion to MinIO started ==")
        start_time = time.time()

        try:
            for document in documents:
                try:
                    file_name = document.metadata.get("source", "unknown")
                    summary = document.metadata.get("summary", "")
                    
                    if summary and summary != "Summary generation failed":
                        # Generate unique ID for the summary
                        unique_id = get_unique_thumbnail_id_file_name_prefix(file_name)
                        
                        # Create payload for MinIO
                        payload = {
                            "id": unique_id,
                            "content": summary,
                            "type": "summary",
                            "source": {"source_name": file_name},
                            "metadata": document.metadata
                        }
                        
                        # Upload to MinIO
                        MINIO_OPERATOR.put_payload(
                            payload=payload,
                            collection_prefix=document.metadata.get("collection_name", "default")
                        )
                        
                        logger.debug(f"Document summary for {file_name} ingested to minio")
                
                except Exception as e:
                    logger.error(f"Failed to put document summary to minio: {e}")
                    continue

            end_time = time.time()
            logger.info(f"Document summary insertion completed to minio!")

        except Exception as e:
            logger.error(f"Failed to put document summaries to minio: {e}")