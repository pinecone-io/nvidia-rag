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
3. create_collections: Create multiple collections in the Pinecone vector database.
4. get_collection: Get the list of all collection in vectorstore along with the number of rows in each collection.
5. delete_collections: Delete a list of collections from the Pinecone vector database.
6. get_docs_vectorstore_langchain: Retrieve filenames stored in the vector store implemented in LangChain.
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

def create_vectorstore_langchain(document_embedder, collection_name: str = "", vdb_endpoint: str = "") -> VectorStore:
    """Create the vector db index for langchain."""

    config = get_config()

    if vdb_endpoint == "":
        vdb_endpoint = config.vector_store.url

    if config.vector_store.name.lower() == "pinecone" or config.vector_store.name.lower() == "pinecone-local":
        if config.vector_store.name.lower() == "pinecone":
            pinecone_client = Pinecone(api_key=os.getenv("PINECONE_API_KEY"), source_tag="nvidia:rag-blueprint")
        else:
            pinecone_client = Pinecone(api_key="pclocal", host="http://localhost:5080")
        
        spec = ServerlessSpec(
            region="us-east-1",
            cloud="aws"
        )
        logger.debug("Trying to connect to Pinecone index: %s", collection_name)
        # Check if the index exists
        if not pinecone_client.has_index(collection_name):
            logger.error(f"Index '{collection_name}' does not exist in Pinecone. Creating it...")
            pinecone_client.create_index(
                name=collection_name,
                dimension=document_embedder.dimension,
                metric=config.vector_store.metric or "cosine",
                spec=spec
            )
        logger.debug(f"Index '{collection_name}' exists. Proceeding with vector store creation.")
        vectorstore = PineconeVectorStore(
            index_name=collection_name,
            embedding=document_embedder
        )
    else:
        raise ValueError(f"{config.vector_store.name} vector database is not supported")
    logger.debug("Vector store created and saved.")
    return vectorstore


def get_vectorstore(
        document_embedder: "Embeddings",
        collection_name: str = "",
        vdb_endpoint: str = "") -> VectorStore:
    """
    Send a vectorstore object.
    If a Vectorstore object already exists, the function returns that object.
    Otherwise, it creates a new Vectorstore object and returns it.
    """
    return create_vectorstore_langchain(document_embedder, collection_name, vdb_endpoint)


def create_collection(collection_name: str, vdb_endpoint: str, dimension: int = None, collection_type: str = "text") -> None:
    """
    Create a new collection in the Pinecone vector database.
    """
    config = get_config()
    if config.vector_store.name.lower() == "pinecone" or config.vector_store.name.lower() == "pinecone-local":
        if config.vector_store.name.lower() == "pinecone":
            pinecone_client = Pinecone(api_key=os.getenv("PINECONE_API_KEY"), source_tag="nvidia:rag-blueprint")
        else:
            pinecone_client = Pinecone(api_key="pclocal", host="http://localhost:5080")
        # Pinecone does not allow underscores in collection names
        collection_name = collection_name.replace('_', '-')
        try:
            spec = ServerlessSpec(
                region="us-east-1",
                cloud="aws"
            )
            pinecone_client.create_index(
                name=collection_name,
                dimension=dimension or 1536,
                metric=config.vector_store.metric or "cosine",
                spec=spec
            )
            logger.info(f"Collection '{collection_name}' created successfully in Pinecone.")
        except Exception as e:
            logger.error(f"Failed to create collection {collection_name}: {str(e)}")
            raise Exception(f"Failed to create collection {collection_name}: {str(e)}")
    else:
        raise ValueError(f"{config.vector_store.name} vector database is not supported")


def create_collections(collection_names: List[str], vdb_endpoint: str, dimension: int = 2048, collection_type: str = "text") -> Dict[str, any]:
    """
    Create multiple collections in the Pinecone vector database.
    """
    config = get_config()
    results = {}
    
    for collection_name in collection_names:
        try:
            create_collection(collection_name, vdb_endpoint, dimension, collection_type)
            results[collection_name] = {"status": "success"}
        except Exception as e:
            results[collection_name] = {"status": "failed", "error": str(e)}
            logger.error(f"Failed to create collection {collection_name}: {str(e)}")
    
    return results


def get_collection(vdb_endpoint: str = "") -> Dict[str, Any]:
    """Get list of all collections in vectorstore along with the number of rows in each collection."""
    config = get_config()
    
    if config.vector_store.name.lower() == "pinecone" or config.vector_store.name.lower() == "pinecone-local":
        if config.vector_store.name.lower() == "pinecone":
            pinecone_client = Pinecone(api_key=os.getenv("PINECONE_API_KEY"), source_tag="nvidia:rag-blueprint")
        else:
            pinecone_client = Pinecone(api_key="pclocal", host="http://localhost:5080")
        
        try:
            # Get list of indexes
            indexes = pinecone_client.list_indexes()
            
            # Get stats for each index
            collection_info = []
            for index_name in indexes:
                try:
                    stats = pinecone_client.describe_index_stats(index_name)
                    collection_info.append({
                        "collection_name": index_name,
                        "row_count": stats.get("total_vector_count", 0)
                    })
                except Exception as e:
                    logger.warning(f"Could not get stats for index {index_name}: {str(e)}")
                    collection_info.append({
                        "collection_name": index_name,
                        "row_count": 0
                    })
            
            return {
                "collections": collection_info,
                "total_collections": len(collection_info)
            }
        except Exception as e:
            logger.error(f"Failed to get collections from Pinecone: {str(e)}")
            raise Exception(f"Failed to get collections from Pinecone: {str(e)}")
    else:
        raise ValueError(f"{config.vector_store.name} vector database is not supported")


def delete_collections(vdb_endpoint: str, collection_names: List[str]) -> dict:
    """
    Delete a list of collections from the Pinecone vector database.
    """
    config = get_config()
    results = {}
    
    if config.vector_store.name.lower() == "pinecone" or config.vector_store.name.lower() == "pinecone-local":
        if config.vector_store.name.lower() == "pinecone":
            pinecone_client = Pinecone(api_key=os.getenv("PINECONE_API_KEY"), source_tag="nvidia:rag-blueprint")
        else:
            pinecone_client = Pinecone(api_key="pclocal", host="http://localhost:5080")
        
        for collection_name in collection_names:
            try:
                pinecone_client.delete_index(collection_name)
                results[collection_name] = {"status": "success"}
                logger.info(f"Collection '{collection_name}' deleted successfully from Pinecone.")
            except Exception as e:
                results[collection_name] = {"status": "failed", "error": str(e)}
                logger.error(f"Failed to delete collection {collection_name}: {str(e)}")
    else:
        raise ValueError(f"{config.vector_store.name} vector database is not supported")
    
    return results


def get_docs_vectorstore_langchain(
        vectorstore: VectorStore,
        collection_name: str,
        vdb_endpoint: str,
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
                pinecone_client = Pinecone(api_key="pclocal", host="http://localhost:5080")
            
            try:
                # Use Pinecone's list_paginated to get vector IDs
                list_response = pinecone_client.list_paginated(
                    index_name=collection_name,
                    namespace=namespace,
                    limit=100
                )
                
                documents = []
                for vector_id in list_response.vectors:
                    documents.append({
                        "document_name": vector_id,
                        "collection_name": collection_name
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


def del_docs_vectorstore_langchain(vectorstore: VectorStore, filenames: List[str], collection_name: str="", include_upload_path: bool = False) -> bool:
    """Delete documents from the vector store implemented in LangChain."""
    settings = get_config()
    try:
        if settings.vector_store.name.lower() == "pinecone" or settings.vector_store.name.lower() == "pinecone-local":
            if settings.vector_store.name.lower() == "pinecone":
                pinecone_client = Pinecone(api_key=os.getenv("PINECONE_API_KEY"), source_tag="nvidia:rag-blueprint")
            else:
                pinecone_client = Pinecone(api_key="pclocal", host="http://localhost:5080")
            
            try:
                # Delete vectors by ID
                pinecone_client.delete(
                    index_name=collection_name,
                    ids=filenames
                )
                logger.info(f"Successfully deleted {len(filenames)} documents from Pinecone")
                return True
            except Exception as e:
                logger.error(f"Failed to delete documents from Pinecone: {str(e)}")
                return False
        else:
            raise ValueError(f"{settings.vector_store.name} vector database is not supported")
    except Exception as e:
        logger.error("Error occurred while deleting documents: %s", e)
        return False


def retreive_docs_from_retriever(retriever, retriever_query: str, expr: str, otel_ctx: otel_context) -> List[Document]:
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
    collection_name = retriever.vectorstore.index_name if hasattr(retriever.vectorstore, 'index_name') else "unknown"
    end_time = time.time()
    latency = end_time - start_time
    logger.info(f"Retriever latency: {latency:.4f} seconds")
    otel_context.detach(token)
    return add_collection_name_to_retreived_docs(docs, collection_name)


def add_collection_name_to_retreived_docs(docs: List[Document], collection_name: str) -> List[Document]:
    """Add the collection name to the retrieved documents.
    This is done to ensure the collection name is available in the metadata of the documents for preparing citations.

    Args:
        docs (List[Document]): The list of documents to add the collection name to.
        collection_name (str): The name of the collection to add to the documents.

    Returns:
        docs (List[Document]): The list of documents with the collection name added to the metadata.
    """
    for doc in docs:
        doc.metadata["collection_name"] = collection_name
    return docs
