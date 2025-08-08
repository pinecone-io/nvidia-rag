<!--
  SPDX-FileCopyrightText: Copyright (c) 2025 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
  SPDX-License-Identifier: Apache-2.0
-->

# Configure Elasticsearch as Your Vector Database

The RAG blueprint supports multiple vector database backends including [Milvus](https://milvus.io/docs) and [Elasticsearch](https://www.elastic.co/elasticsearch/vector-database). 
Elasticsearch provides robust search capabilities and can be used as an alternative to Milvus for storing and retrieving document embeddings.

After you have followed the [quick start guide](./quickstart.md#deploy-with-docker-compose) to launch the blueprint, 
use this documentation to configure Elasticsearch as your vector database.


## Before You Start

The following are some important notes to keep in mind before you switch from Milvus to Elasticsearch.

- **Fresh Setup Required** – When you switch from Milvus to Elasticsearch, you need to re-upload your documents. The data stored in Milvus isn't automatically migrated to Elasticsearch.

- **Port Availability** – Elasticsearch runs on port 9200 by default. Ensure this port is available and not in conflict with other services.

- **Folder Permissions** – Elasticsearch data is persisted in the `volumes/elasticsearch` directory. Make sure you have appropriate permissions set.

    ```bash
    sudo chown -R 1000:1000 deploy/compose/volumes/elasticsearch/
    ```


## Docker Compose

Use the following steps to configure Elasticsearch as your vector database in Docker.

1. Start the Elasticsearch container.

   ```bash
   docker compose -f deploy/compose/vectordb.yaml --profile elasticsearch up -d
   ```

2. Set the vector database configuration.

   ```bash
   export APP_VECTORSTORE_URL="http://elasticsearch:9200"
   export APP_VECTORSTORE_NAME="elasticsearch"
   ```

3. Relaunch the RAG and ingestion services.

   ```bash
   docker compose -f deploy/compose/docker-compose-ingestor-server.yaml up -d
   docker compose -f deploy/compose/docker-compose-rag-server.yaml up -d
   ```

## Helm

If you're using Helm for deployment, use the following steps to configure Elasticsearch as your vector database.

1. Update your `values.yaml` file to configure Elasticsearch as the vector database.

   ```yaml
   rag-server:
     envVars:
       APP_VECTORSTORE_URL: "http://elasticsearch:9200"
       APP_VECTORSTORE_NAME: "elasticsearch"
   
   ingestor-server:
     envVars:
       APP_VECTORSTORE_URL: "http://elasticsearch:9200"
       APP_VECTORSTORE_NAME: "elasticsearch"
   ```

2. Enable Elasticsearch deployment in your `values.yaml` file.

   ```yaml
   elasticsearch:
     enabled: true
   ```

3. Apply the updated Helm chart by running the following command.

   ```bash
   cd deploy/helm/
   helm upgrade --install rag -n rag https://helm.ngc.nvidia.com/nvstaging/blueprint/charts/nvidia-blueprint-rag-v2.2.0.tgz \
   --username '$oauthtoken' \
   --password "${NGC_API_KEY}" \
   --set imagePullSecret.password=$NGC_API_KEY \
   --set ngcApiSecret.password=$NGC_API_KEY \
   -f rag-server/values.yaml
   ```


## Verify Your Setup

After you complete the setup, verify that Elasticsearch is running correctly:

```bash
curl -X GET "localhost:9200/_cluster/health?pretty"
```

You should see a response that indicates the cluster status is green or yellow, confirming that Elasticsearch is operational and ready to store embeddings.



## Define Your Own Vector Database

You can create your own custom vector database operators by implementing the `VDBRag` base class. 
This enables you to integrate with any vector database that isn't already supported.

> [!CAUTION]
> This section is for advanced developers who need to integrate custom vector databases beyond the supported database options.

For a complete example, refer to [Custom VDB Operator Notebook](../notebooks/building_rag_vdb_operator.ipynb).

> [!TIP]
> Choose your integration path:
> - Start with Library Mode for fastest iteration during development (recommended for most users).
> - Advanced users who are comfortable with deployments can start directly with Server Mode. See: [Integrate Into NVIDIA RAG (Server Mode)](#integrate-into-nvidia-rag-server-mode).


### Integrate in Library Mode (Developer-Friendly)

Before wiring your custom VDB into the servers, the quickest way to iterate is to run it in library mode. This is ideal for development, debugging, and ensuring the operator behaves correctly.

- Reference implementation (start here)
  - Read the notebook: `../notebooks/building_rag_vdb_operator.ipynb`.
  - It contains a complete, working example you can copy and adapt.

- What you build
  - A class that inherits from `VDBRag` and implements the required methods for ingestion and retrieval.
  - Instantiate that class and pass it to `NvidiaRAG` and/or `NvidiaRAGIngestor` via the `vdb_op` parameter.

- Minimal example
  ```python
  from nvidia_rag import NvidiaRAG, NvidiaRAGIngestor
  from nvidia_rag.utils.vdb.vdb_base import VDBRag

  class CustomVDB(VDBRag):
      def __init__(self, custom_url: str, index_name: str, embedding_model=None):
          # initialize client(s) here
          self.url = custom_url
          self.index_name = index_name
          self.embedding_model = embedding_model

      def create_collection(self, collection_name: str, dimension: int = 2048, collection_type: str = "text"):
          ...  # create index/collection

      def write_to_index(self, records: list[dict], **kwargs):
          ...  # bulk insert vectors + metadata

      # implement retrieval and other required methods used by the notebook

  custom_vdb_op = CustomVDB(custom_url="http://localhost:9200", index_name="test_library")
  rag = NvidiaRAG(vdb_op=custom_vdb_op)
  ingestor = NvidiaRAGIngestor(vdb_op=custom_vdb_op)
  ```

- Quick checklist:
  - Implement a `VDBRag` subclass with at least: `create_collection`, `write_to_index`, and retrieval helpers used in the notebook.
  - Initialize your operator and pass it via `vdb_op` to `NvidiaRAG`/`NvidiaRAGIngestor`.
  - Run the notebook cells to validate: create collection → upload documents → search/generate → list/delete documents.
  - Once satisfied, proceed to Server Mode integration below.

### Implementation Steps

Use the following steps to create and use your own custom database operators.

1. Create a class that inherits from `VDBRag` and implements all required methods.

   ```python
   from nvidia_rag.utils.vdb.vdb_base import VDBRag
   
   class CustomVDB(VDBRag):
       def __init__(self, custom_url, index_name, embedding_model=None):
           # Initialize your custom VDB connection
           pass
       
       def create_collection(self, collection_name, dimension=2048):
           # Implement collection creation
           pass
       
       def write_to_index(self, records, **kwargs):
           # Implement document indexing
           pass
       
       # Implement other required methods...
   ```

2. Use your custom operator with NVIDIA RAG components.

   ```python
   # Initialize custom VDB operator
   custom_vdb_op = CustomVDB(
       custom_url="your://database:url",
       index_name="collection_name",
       embedding_model=embedding_model
   )
   
   # Use with NVIDIA RAG
   rag = NvidiaRAG(vdb_op=custom_vdb_op)
   ingestor = NvidiaRAGIngestor(vdb_op=custom_vdb_op)
   ```
    
    #### Method Descriptions:
    
    Use this as a minimal checklist for your `VDBRag` subclass. Keep names consistent with your codebase; ensure these behaviors exist.
    
    - Initialization
      - `__init__(...)`: Initialize your backend client/connection, set collection/index name, capture metadata helpers, and optionally accept an embedding model handle.
      - `collection_name (property)`: Getter/Setter mapping to your underlying collection/index identifier.
    
    - Core index operations
      - `_check_index_exists(name)`: Return whether the target collection/index exists.
      - `create_index()`: Create the collection/index if missing with appropriate vector settings.
      - `write_to_index(records, **kwargs)`: Clean incoming records, extract `text`, `vector`, and metadata (e.g., `source`, `content_metadata`), bulk-insert, and refresh visibility.
      - `retrieval(queries, **kwargs)`: Optional for RAG. Implement multi-query retrieval or raise `NotImplementedError` if you expose a different retrieval entrypoint.
      - `reindex(records, **kwargs)`: Optional for RAG. Implement reindex/update workflows or raise `NotImplementedError`.
      - `run(records)`: Convenience helper to create (if needed) then write.
    
    - Collection management
      - `create_collection(collection_name, dimension=2048, collection_type="text")`: Ensure a collection exists and is ready for inserts/queries.
      - `check_collection_exists(collection_name)`: Boolean existence check.
      - `get_collection()`: Return a list of collections with document counts and any stored metadata schema.
      - `delete_collections(collection_names)`: Delete specified collections and clean up stored schemas.
    
    - Document management
      - `get_documents(collection_name)`: Return unique documents (commonly grouped by a `source` field) with schema-aligned metadata values.
      - `delete_documents(collection_name, source_values)`: Bulk-delete documents matching provided sources; refresh visibility.
    
    - Metadata schema management
      - `create_metadata_schema_collection()`: Initialize storage for metadata schemas if missing.
      - `add_metadata_schema(collection_name, metadata_schema)`: Replace the stored schema for a collection.
      - `get_metadata_schema(collection_name)`: Fetch the stored schema; return an empty list if none.
    
    - Retrieval helpers
      - Retrieval helper (e.g., `retrieval_*`): Return top‑k relevant documents using your backend’s semantic search. Support optional filters and tracing where applicable.
      - Vector index handle (e.g., `get_*_vectorstore`): Return a handle to your backend’s vector index suitable for retrieval operations.
      - Add collection tag (e.g., `_add_collection_name_to_*docs`): Add the originating collection name into each document’s metadata (useful for multi‑collection citations).
    
    For a concrete, working example, see `src/nvidia_rag/utils/vdb/elasticsearch/elastic_vdb.py` and `notebooks/building_rag_vdb_operator.ipynb`.

### Integrate Into NVIDIA RAG (Server Mode)

Before proceeding in server mode, go through “### Implementation Steps” above to implement and validate your operator.

Follow these steps to add your custom vector database to the NVIDIA RAG servers (RAG server and Ingestor server).

- Reference implementation (read this first)
  - We strongly recommend reviewing the companion notebook: `../notebooks/building_rag_vdb_operator.ipynb`.
  - It contains a complete, working custom VDB example that you can adapt. The server-mode integration below reuses the same class and only adds a small registration step plus environment configuration.

- 1) Add your implementation
  - Create your operator under the project tree:
    ```
    src/nvidia_rag/utils/vdb/custom_vdb_name/custom_vdb_name.py
    ```
  - Implement the class that inherits from `VDBRag` and fulfills the required methods (create collection, write, search, etc.).

- 2) Register your operator in the server
  - Update the VDB factory so the servers can instantiate your operator by name. Edit `src/nvidia_rag/utils/vdb/__init__.py` and add a branch inside `_get_vdb_op`:
    ```python
    elif CONFIG.vector_store.name == "your_custom_vdb":
        from nvidia_rag.utils.vdb.custom_vdb_name.custom_vdb_name import CustomVDB
        return CustomVDB(
            index_name=collection_name,
            custom_url=vdb_endpoint or CONFIG.vector_store.url,
            embedding_model=embedding_model,
        )
    ```

- 3) Configure docker compose (server deployments)
  - Set `APP_VECTORSTORE_NAME` to your custom name and point `APP_VECTORSTORE_URL` to your service in both compose files:
    - `deploy/compose/docker-compose-rag-server.yaml`
    - `deploy/compose/docker-compose-ingestor-server.yaml`

    Example overrides via environment (recommended):
    ```bash
    export APP_VECTORSTORE_NAME="your_custom_vdb"
    export APP_VECTORSTORE_URL="http://your-custom-vdb:1234"
    docker compose -f deploy/compose/docker-compose-rag-server.yaml up -d
    docker compose -f deploy/compose/docker-compose-ingestor-server.yaml up -d
    ```

    Or, you may edit the files locally to show your custom value. Search for `APP_VECTORSTORE_NAME` and adjust defaults if desired:
    ```yaml
    # Type of vectordb used to store embedding (supports "milvus", "elasticsearch", or a custom value like "your_custom_vdb")
    APP_VECTORSTORE_NAME: ${APP_VECTORSTORE_NAME:-"milvus"}
    # URL on which vectorstore is hosted
    APP_VECTORSTORE_URL: ${APP_VECTORSTORE_URL:-http://your-custom-vdb:1234}
    ```

- 4) How the configuration is picked up
  - The application configuration (`src/nvidia_rag/utils/configuration.py`) maps environment variables into the `AppConfig` object. Specifically:
    - `APP_VECTORSTORE_NAME` → `CONFIG.vector_store.name`
    - `APP_VECTORSTORE_URL` → `CONFIG.vector_store.url`
  - The server calls the VDB factory with this configuration. See `_get_vdb_op`:
    - When `CONFIG.vector_store.name == "your_custom_vdb"`, the branch you added is executed and your operator is constructed with `CONFIG.vector_store.url` (or the request override) and the embedding model.

- TL;DR
  - Create a `VDBRag` subclass in `src/nvidia_rag/utils/vdb/<your_name>/<your_name>.py` (mirror the notebook example).
  - Add a new `elif CONFIG.vector_store.name == "your_custom_vdb"` branch in `src/nvidia_rag/utils/vdb/__init__.py::_get_vdb_op` that instantiates your class.
  - Set env vars for both servers: `APP_VECTORSTORE_NAME=your_custom_vdb`, `APP_VECTORSTORE_URL=http://your-custom-vdb:1234`.
  - Restart `docker-compose` services for the RAG server and Ingestor server.

That’s it—after these steps, both the RAG server and the Ingestor will use your custom vector database when `APP_VECTORSTORE_NAME` is set to `your_custom_vdb`.
