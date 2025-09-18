import logging
import os
from pinecone import Pinecone, ServerlessSpec
from langchain_pinecone import PineconeVectorStore
from langchain_core.runnables import RunnableAssign, RunnableLambda
from opentelemetry import context as otel_context
import time
from typing import Any
from nvidia_rag.utils.common import get_config

logger = logging.getLogger(__name__)
CONFIG = get_config()

class PineconeVDB:
    def __init__(
            self,
            api_key: str,
            index_name: str,
            dimension: int = 1536,
            top_k: int = 10,
            embedding_model: str = None,
    ):
        self.api_key = api_key
        self.index_name = index_name
        self.dimension = dimension
        self.top_k = top_k
        self._embedding_model = embedding_model
        self.source_tag = "nvidia-rag"
        self.client = Pinecone(api_key=self.api_key, source_tag=self.source_tag, host=CONFIG.vector_store.url)

    def create_index(self):
        """Create an index in Pinecone."""
        logger.info(f"Creating Pinecone index if not exists: {self.index_name}")
        if not self.client.has_index(self.index_name):
            self.client.create_index(
                name=self.index_name,
                dimension=self.dimension,
                metric="cosine",
                spec=ServerlessSpec(cloud="aws", region="us-east-1")
            )
            logger.info(f"Index '{self.index_name}' created successfully.")
        else:
            logger.info(f"Index '{self.index_name}' already exists.")

    def delete_index(self):
        """Delete an index in Pinecone."""
        logger.info(f"Deleting Pinecone index: {self.index_name}")
        if self.client.has_index(self.index_name):
            self.client.delete_index(self.index_name)
            logger.info(f"Index '{self.index_name}' deleted successfully.")
        else:
            logger.warning(f"Index '{self.index_name}' does not exist.")

    def list_namespaces(self):
        """List all namespaces in the index."""
        index = self.client.Index(self.index_name)
        stats = index.describe_index_stats()
        return stats.get("namespaces", {}).keys()

    def create_namespace(self, namespace_name: str):
        """Create a namespace in the index."""
        logger.info(f"Creating namespace '{namespace_name}' in index '{self.index_name}'")
        # Pinecone creates namespaces on demand, so no explicit creation is needed
        logger.info(f"Namespace '{namespace_name}' is ready for use.")

    def delete_namespace(self, namespace_name: str):
        """Delete a namespace in the index."""
        logger.info(f"Deleting namespace '{namespace_name}' from index '{self.index_name}'")
        index = self.client.Index(self.index_name)
        index.delete_namespace(namespace=namespace_name)
        logger.info(f"Namespace '{namespace_name}' deleted successfully.")

    def create_collection(self, collection_name: str, dimension: int = 1536):
        """Wrapper for create_index to match existing method names."""
        return self.create_index()

    def check_collection_exists(self, collection_name: str) -> bool:
        """Check if a collection (index) exists."""
        return self.client.has_index(collection_name)

    def get_collection(self):
        """Get the list of collections (namespaces) in the index."""
        return self.client.list_indexes()

    def delete_collections(self, collection_names: list[str]):
        """Delete collections (namespaces) from the index."""
        for name in collection_names:
            self.delete_namespace(name)

    def get_documents(self, namespace_name: str, document_ids: list[str]):
        """Retrieve documents from a namespace."""
        index = self.client.Index(self.index_name)
        return index.fetch(ids=document_ids, namespace=namespace_name).to_dict()

    def delete_documents(self, namespace_name: str, document_ids: list[str]):
        """Delete documents from a namespace."""
        index = self.client.Index(self.index_name)
        index.delete(ids=document_ids, namespace=namespace_name)
        logger.info(f"Deleted {len(document_ids)} documents from namespace '{namespace_name}'.")

    def get_langchain_vectorstore(
        self,
        collection_name: str,
    ) -> PineconeVectorStore:
        """
        Get the vectorstore for a collection.
        """
        vectorstore = PineconeVectorStore(
            index_name=collection_name,
            embedding=self._embedding_model
        )
        return vectorstore

    def add_documents(self, namespace_name: str, documents: list[dict]):
        """Add documents to a namespace in the Pinecone index."""
        try:
            index = self.client.Index(self.index_name)
            # Assuming documents is a list of dictionaries with 'id' and 'vector' keys
            ids = [doc['id'] for doc in documents]
            vectors = [doc['vector'] for doc in documents]
            index.upsert(vectors=vectors, ids=ids, namespace=namespace_name)
            logger.info(f"Added {len(documents)} documents to namespace '{namespace_name}'.")
        except Exception as e:
            logger.error(f"Failed to add documents to namespace '{namespace_name}': {e}")
            raise

    def retrieval_langchain(
        self,
        query: str,
        namespace_name: str,
        vectorstore: PineconeVectorStore = None,
        top_k: int = 10,
        filter_expr: dict = None,
        otel_ctx: otel_context = None,
    ) -> list[dict[str, Any]]:
        """Retrieve documents from a namespace using LangChain."""
        try:
            if vectorstore is None:
                index = self.client.Index(self.index_name)
                vectorstore = PineconeVectorStore(index=index, embedding=self._embedding_model)

            token = otel_context.attach(otel_ctx)
            start_time = time.time()

            retriever = vectorstore.as_retriever(
                search_kwargs={"k": top_k, "fetch_k": top_k}
            )
            retriever_lambda = RunnableLambda(
                lambda x: retriever.invoke(x, filter=filter_expr)
            )
            retriever_chain = {"context": retriever_lambda} | RunnableAssign(
                {"context": lambda input: input["context"]}
            )
            retriever_docs = retriever_chain.invoke(query, config={"run_name": "retriever"})
            docs = retriever_docs.get("context", [])

            end_time = time.time()
            latency = end_time - start_time
            logger.info(f"Pinecone Retriever latency: {latency:.4f} seconds")

            otel_context.detach(token)
            return docs
        except Exception as e:
            logger.error(f"Failed to retrieve documents from namespace '{namespace_name}': {e}")
            raise