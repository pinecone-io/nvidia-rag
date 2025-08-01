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
This is the module for NV-Ingest client wrapper.
1. Get NV-Ingest client: get_nv_ingest_client()
2. Get NV-Ingest ingestor: get_nv_ingest_ingestor()
"""

import os
import logging
from typing import List

from nvidia_rag.utils.common import get_config, get_env_variable, prepare_custom_metadata_dataframe
from nv_ingest_client.client import NvIngestClient, Ingestor

# Import necessary functions from vectorstore
from nvidia_rag.utils.vectorstore import create_vectorstore_langchain, get_vectorstore

# Import get_embedding_model from the embedding module
from nvidia_rag.utils.embedding import get_embedding_model


logger = logging.getLogger(__name__)

def get_nv_ingest_client():
    """
    Creates and returns NV-Ingest client
    """
    config = get_config()

    client = NvIngestClient(
        # Host where nv-ingest-ms-runtime is running
        message_client_hostname=config.nv_ingest.message_client_hostname,
        message_client_port=config.nv_ingest.message_client_port # REST port, defaults to 7670
    )
    return client

async def get_nv_ingest_ingestor(
        nv_ingest_client_instance,
        filepaths: List[str],
        csv_file_path: str = None,
        namespace_name: str = "multimodal_data",
        split_options = None,
        custom_metadata = None
    ):
    """
    Prepare NV-Ingest ingestor instance based on nv-ingest configuration

    Args:
        nv_ingest_client_instance: NvIngestClient instance
        filepaths: List of file paths to ingest
        csv_file_path: Path to the custom metadata CSV file
        namespace_name: Name of the namespace in the vector database
        split_options: Options for splitting documents
        custom_metadata: Custom metadata to be added to documents

    Returns:
        - ingestor: Ingestor - NV-Ingest ingestor instance with configured tasks
    """
    config = get_config()

    # Prepare custom metadata dataframe
    if csv_file_path is not None:
        meta_source_field, meta_fields = prepare_custom_metadata_dataframe(
            all_file_paths=filepaths,
            csv_file_path=csv_file_path,
            custom_metadata=custom_metadata or {}
        )

    logger.debug("Preparing NV Ingest Ingestor instance for filepaths: %s", filepaths)
    # Prepare the ingestor using nv-ingest-client
    ingestor = Ingestor(client=nv_ingest_client_instance)

    # Add files to ingestor
    ingestor = ingestor.files(filepaths)

    # Add extraction task
    # Determine paddle_output_format
    paddle_output_format = "markdown" if config.nv_ingest.extract_tables else "pseudo_markdown"
    # Create kwargs for extract method
    extract_kwargs = {
        "extract_text": config.nv_ingest.extract_text,
        "extract_infographics": config.nv_ingest.extract_infographics,
        "extract_tables": config.nv_ingest.extract_tables,
        "extract_charts": config.nv_ingest.extract_charts,
        "extract_images": config.nv_ingest.extract_images,
        "extract_method": config.nv_ingest.pdf_extract_method,
        "text_depth": config.nv_ingest.text_depth,
        "paddle_output_format": paddle_output_format,
    }
    if config.nv_ingest.pdf_extract_method in ["None", "none"]:
        extract_kwargs.pop("extract_method")
    else:
        logger.info(f"Extract method used for ingestion: {config.nv_ingest.pdf_extract_method}")
    ingestor = ingestor.extract(**extract_kwargs)

    # Add splitting task (By default only works for text documents)
    split_options = split_options or {}
    split_source_types = ["text", "html"]
    split_source_types = ["PDF"] + split_source_types if config.nv_ingest.enable_pdf_splitter else split_source_types
    logger.info(f"Post chunk split status: {config.nv_ingest.enable_pdf_splitter}. Splitting by: {split_source_types}")
    ingestor = ingestor.split(
                    tokenizer=config.nv_ingest.tokenizer,
                    chunk_size=split_options.get("chunk_size", config.nv_ingest.chunk_size),
                    chunk_overlap=split_options.get("chunk_overlap", config.nv_ingest.chunk_overlap),
                    params={"split_source_types": split_source_types}
                )

    # Add captioning task if extract_images is enabled
    if config.nv_ingest.extract_images:
        logger.info(f"Enabling captioning task. Captioning Endpoint URL: {config.nv_ingest.caption_endpoint_url}, Captioning Model Name: {config.nv_ingest.caption_model_name}")
        ingestor = ingestor.caption(
                        api_key=get_env_variable(variable_name="NGC_API_KEY", default_value=""),
                        endpoint_url=config.nv_ingest.caption_endpoint_url,
                        model_name=config.nv_ingest.caption_model_name,
                    )

    # Add Embedding task
    ingestor = ingestor.embed()
    
    # Use create_vectorstore_langchain to ensure the index is created
    vectorstore = create_vectorstore_langchain(ingestor, namespace_name)

    # Use get_vectorstore to obtain the vector store instance for uploading documents
    vectorstore_instance = get_vectorstore(ingestor, namespace_name)

    # Obtain the embedding model
    embedding_model = get_embedding_model(model=os.getenv("EMBEDDING_MODEL_NAME"), url=os.getenv("EMBEDDING_MODEL_URL"))

    # Use the embedding model to generate embeddings for each document
    for file_path in filepaths:
        with open(file_path, "rb") as f:
            file_data = f.read()
            # Generate embedding for the document
            embedding = embedding_model.embed(file_data)
            # Prepare metadata for the document
            metadata = custom_metadata.get(file_path, {}) if custom_metadata else {}
            # Upsert document into the vector database
            vectorstore_instance.upsert([(file_path, embedding, metadata)])

    # Return the ingestor instance
    return ingestor