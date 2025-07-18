<!--
  SPDX-FileCopyrightText: Copyright (c) 2025 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
  SPDX-License-Identifier: Apache-2.0
-->

# Get Started With NVIDIA RAG Blueprint

Use the following documentation to get started with the NVIDIA RAG Blueprint.

- [Obtain API Keys](#obtain-api-keys)
- [Interact using native python APIs](#interact-using-native-python-apis)
- [Deploy With Docker Compose](#deploy-with-docker-compose)
- [Deploy With Helm Chart](#deploy-with-helm-chart)
- [Data Ingestion](#data-ingestion)

## Obtain API Keys

You need to generate API keys to access NIM services, to access models hosted in the NVIDIA API Catalog, and to download models on-premises.

### NGC API Key

For more information, refer to [NGC API Keys](https://docs.nvidia.com/ngc/gpu-cloud/ngc-private-registry-user-guide/index.html#ngc-api-keys).

To generate an NGC API key, use the following procedure.

1. Go to https://org.ngc.nvidia.com/setup/api-keys.
2. Click **+ Generate Personal Key**.
3. Enter a **Key Name**.
4. For **Services Included**, select **NGC Catalog** and **Public API Endpoints**.
5. Click **Generate Personal Key**.

After you generate your key, export your key as an environment variable by using the following code.

```bash
export NGC_API_KEY="<your-ngc-api-key>"
```

### Pinecone API Key

To use Pinecone as your vector database, you need a Pinecone API key.

1. Go to [Pinecone Console](https://app.pinecone.io/).
2. Sign up or log in to your account.
3. Navigate to API Keys in the left sidebar.
4. Click **Create API Key**.
5. Give your key a name and copy the generated key.

After you generate your key, export your key as an environment variable:

```bash
export PINECONE_API_KEY="<your-pinecone-api-key>"
```

You'll also need to set your Pinecone environment (e.g., "gcp-starter", "us-west1-gcp", etc.):

```bash
export PINECONE_ENVIRONMENT="<your-pinecone-environment>"
```

## Interact using native python APIs

You can interact with and deploy the NVIDIA RAG Blueprint directly from Python using the provided Jupyter notebook. This approach is ideal for users who prefer a programmatic interface for setup, ingestion, and querying, or for those who want to automate workflows and integrate with other Python tools.

- **Notebook:** [rag_library_usage.ipynb](../notebooks/rag_library_usage.ipynb)

The notebook demonstrates environment setup, document ingestion, collection management, and querying using the NVIDIA RAG Python client. Follow the cells in the notebook for an end-to-end example of using the RAG system natively from Python.

## Deploy With Docker Compose

Use these procedures to deploy with Docker Compose for a single node deployment. Alternatively, you can [Deploy With Helm Chart](#deploy-with-helm-chart) to deploy on a Kubernetes cluster.

Developers need to deploy ingestion services and rag services using separate dedicated docker compose files.
For both retrieval and ingestion services, by default all the models are deployed on-prem. Follow relevant section below as per your requirement and hardware availability.

- Start the Microservices
  - [Using on-prem models](#start-using-on-prem-models)
  - [Using NVIDIA hosted models](#start-using-nvidia-hosted-models)

### Prerequisites

1. Install Docker Engine. For more information, see [Ubuntu](https://docs.docker.com/engine/install/ubuntu/).

2. Install Docker Compose. For more information, see [install the Compose plugin](https://docs.docker.com/compose/install/linux/).

   a. Ensure the Docker Compose plugin version is 2.29.1 or later.

   b. After you get the Docker Compose plugin installed, run `docker compose version` to confirm.

3. To pull images required by the blueprint from NGC, you must first authenticate Docker with nvcr.io. Use the NGC API Key you created in [Obtain API Keys](#obtain-api-keys).

   ```bash
   export NGC_API_KEY="nvapi-..."
   echo "${NGC_API_KEY}" | docker login nvcr.io -u '$oauthtoken' --password-stdin
   ```

4. Some containers are enabled with GPU acceleration, such as NVIDIA NIMS deployed on-prem. To configure Docker for GPU-accelerated containers, [install](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html) the NVIDIA Container Toolkit.

5. Ensure you meet [the hardware requirements if you are deploying models on-prem](./support-matrix.md).

6. Set up your Pinecone API key and environment variables as described in [Obtain API Keys](#obtain-api-keys).

### Start using on-prem models

Use the following procedure to start all containers needed for this blueprint. This launches the ingestion services followed by the rag services and all of its dependent NIMs on-prem.

1. Fulfill the [prerequisites](#prerequisites). Ensure you meet [the hardware requirements](./support-matrix.md).

2. Create a directory to cache the models and export the path to the cache as an environment variable.

   ```bash
   mkdir -p ~/.cache/model-cache
   export MODEL_DIRECTORY=~/.cache/model-cache
   ```

3. Export all the required environment variables to use on-prem models. Ensure the section `Endpoints for using cloud NIMs` is commented in this file.

   ```bash
   source deploy/compose/.env
   ```

   [Optional]:
   Check out the guidance here for some [best practices] for choosing configurations(./accuracy_perf.md).
   To turn on recommended configs for accuracy optimized profile set additional configs:

   ```bash
   source deploy/compose/accuracy_profile.env
   ```

   To turn on recommended configs for perf optimized profile set additional configs:

   ```bash
   source deploy/compose/perf_profile.env
   ```

4. Start all required NIMs.

   Before running the command please ensure the GPU allocation is done appropriately in the deploy/compose/.env. You might need to override them
   for the hardware you are deploying this blueprint on. The default assumes you are deploying this on a 2XH100 environment.

   ```bash
   USERID=$(id -u) docker compose -f deploy/compose/nims.yaml up -d
   ```

   - Wait till the `nemoretriever-ranking-ms`, `nemoretriever-embedding-ms` and `nim-llm-ms`  NIMs are in healthy state before proceeding further.

   - The nemo LLM service may take upto 30 mins to start for the first time as the model is downloaded and cached. The models are downloaded and cached in the path specified by `MODEL_DIRECTORY`. Subsequent deployments will take 2-5 mins to startup based on the GPU profile.

   - The default configuration allocates one GPU (GPU ID 1) to `nim-llm-ms` which defaults to minimum GPUs needed for H100 or B200 profile. If you are deploying the solution on A100, please allocate 2 available GPUs by exporting below env variable before launching:

     ```bash
     export LLM_MS_GPU_ID=1,2
     ```

   - To start just the NIMs specific to rag or ingestion add the `--profile rag` or `--profile ingest` flag to the command.

   - Ensure all the below are running before proceeding further

     ```bash
     watch -n 2 'docker ps --format "table {{.Names}}\t{{.Status}}"'
     ```

     ```output
        NAMES                                   STATUS

        nemoretriever-ranking-ms                Up 14 minutes (healthy)
        compose-page-elements-1                 Up 14 minutes
        compose-paddle-1                        Up 14 minutes
        compose-graphic-elements-1              Up 14 minutes
        compose-table-structure-1               Up 14 minutes
        nemoretriever-embedding-ms              Up 14 minutes (healthy)
        nim-llm-ms                              Up 14 minutes (healthy)
     ```

5. Configure Pinecone environment variables. The system will use Pinecone as the vector database instead of running a local vector database container.

   ```bash
   # Set Pinecone configuration
   export VECTOR_STORE_NAME="pinecone"
   export APP_VECTORSTORE_URL="https://api.pinecone.io"
   export PINECONE_API_KEY="<your-pinecone-api-key>"
   export PINECONE_ENVIRONMENT="<your-pinecone-environment>"
   ```

6. Start the ingestion containers from the repo root. This pulls the prebuilt containers from NGC and deploys it on your system.

   ```bash
   docker compose -f deploy/compose/docker-compose-ingestor-server.yaml up -d
   ```

   [!TIP]
   You can add a `--build` argument in case you have made some code changes or have any requirement of re-building ingestion containers from source code:

   ```bash
   docker compose -f deploy/compose/docker-compose-ingestor-server.yaml up -d --build
   ```

7. Start the rag containers from the repo root. This pulls the prebuilt containers from NGC and deploys it on your system.

   ```bash
   docker compose -f deploy/compose/docker-compose-rag-server.yaml up -d
   ```

   [!TIPS]
   You can add a `--build` argument in case you have made some code changes or have any requirement of re-building containers from source code:

   ```bash
   docker compose -f deploy/compose/docker-compose-rag-server.yaml up -d --build
   ```

   You can check the status of the rag-server and its dependencies by issuing this curl command

   ```bash
   curl -X 'GET' 'http://workstation_ip:8081/v1/health?check_dependencies=true' -H 'accept: application/json'
   ```

8. Confirm all the below mentioned containers are running.

   ```bash
   docker ps --format "table {{.ID}}\t{{.Names}}\t{{.Status}}"
   ```

   *Example Output*

   ```output
   NAMES                                   STATUS
   compose-nv-ingest-ms-runtime-1          Up 5 minutes (healthy)
   ingestor-server                         Up 5 minutes
   compose-redis-1                         Up 5 minutes
   rag-playground                          Up 9 minutes
   rag-server                              Up 9 minutes
   nemoretriever-ranking-ms                Up 38 minutes (healthy)
   compose-page-elements-1                 Up 38 minutes
   compose-paddle-1                        Up 38 minutes
   compose-graphic-elements-1              Up 38 minutes
   compose-table-structure-1               Up 38 minutes
   nemoretriever-embedding-ms              Up 38 minutes (healthy)
   nim-llm-ms                              Up 38 minutes (healthy)
   ```

9.  Open a web browser and access `http://localhost:8090` to use the RAG Playground. You can use the upload tab to ingest files into the server or follow [the notebooks](../notebooks/) to understand the API usage.

10. To stop all running services, after making some [customizations](#next-steps)

    ```bash
    docker compose -f deploy/compose/docker-compose-ingestor-server.yaml down
    docker compose -f deploy/compose/nims.yaml down
    docker compose -f deploy/compose/docker-compose-rag-server.yaml down
    ```

**📝 Notes:**

1. A single NVIDIA A100-80GB or H100-80GB, B200 GPU can be used to start non-LLM NIMs (nemoretriever-embedding-ms, nemoretriever-ranking-ms, and ingestion services like page-elements, paddle, graphic-elements, and table-structure) for ingestion and RAG workflows. You can control which GPU is used for each service by setting these environment variables in `deploy/compose/.env` file before launching:

   ```bash
   EMBEDDING_MS_GPU_ID=0
   RANKING_MS_GPU_ID=0
   YOLOX_MS_GPU_ID=0
   YOLOX_GRAPHICS_MS_GPU_ID=0
   YOLOX_TABLE_MS_GPU_ID=0
   PADDLE_MS_GPU_ID=0
   ```

2. If the NIMs are deployed in a different workstation or outside the nvidia-rag docker network on the same system, replace the host address of the below URLs with workstation IPs.

   ```bash
   APP_EMBEDDINGS_SERVERURL="workstation_ip:8000"
   APP_LLM_SERVERURL="workstation_ip:8000"
   APP_RANKING_SERVERURL="workstation_ip:8000"
   PADDLE_GRPC_ENDPOINT="workstation_ip:8001"
   YOLOX_GRPC_ENDPOINT="workstation_ip:8001"
   YOLOX_GRAPHIC_ELEMENTS_GRPC_ENDPOINT="workstation_ip:8001"
   YOLOX_TABLE_STRUCTURE_GRPC_ENDPOINT="workstation_ip:8001"
   ```

3. Due to react limitations, any changes made to below environment variables will require developers to rebuilt the rag containers. This will be fixed in a future release.

   ```output
   # Model name for LLM
   NEXT_PUBLIC_MODEL_NAME: ${APP_LLM_MODELNAME:-meta/llama-3.1-70b-instruct}
   # Model name for embeddings
   NEXT_PUBLIC_EMBEDDING_MODEL: ${APP_EMBEDDINGS_MODELNAME:-nvidia/llama-3.2-nv-embedqa-1b-v2}
   # Model name for reranking
   NEXT_PUBLIC_RERANKER_MODEL: ${APP_RANKING_MODELNAME:-nvidia/llama-3.2-nv-rerankqa-1b-v2}
   # URL for rag server container
   NEXT_PUBLIC_CHAT_BASE_URL: "http://rag-server:8081/v1"
   # URL for ingestor container
   NEXT_PUBLIC_VDB_BASE_URL: "http://ingestor-server:8082/v1"
   ```

### Start using nvidia hosted models

1. Verify that you meet the [prerequisites](#prerequisites).

2. Open `deploy/compose/.env` and uncomment the section `Endpoints for using cloud NIMs`.
   Then set the environment variables by executing below command.

   ```bash
   source deploy/compose/.env
   ```

   [Optional]:
   Check out the guidance here for some [best practices] for choosing configurations(./accuracy_perf.md).
   To turn on recommended configs for accuracy optimized profile set additional configs:

   ```bash
   source deploy/compose/accuracy_profile.env
   ```

   To turn on recommended configs for perf optimized profile set additional configs:

   ```bash
   source deploy/compose/perf_profile.env
   ```

   **📝 Note:**
   When using NVIDIA hosted endpoints, you may encounter rate limiting with larger file ingestions (>10 files).

3. Configure Pinecone environment variables. The system will use Pinecone as the vector database.

   ```bash
   # Set Pinecone configuration
   export VECTOR_STORE_NAME="pinecone"
   export APP_VECTORSTORE_URL="https://api.pinecone.io"
   export PINECONE_API_KEY="<your-pinecone-api-key>"
   ```

4. Start the ingestion containers from the repo root. This pulls the prebuilt containers from NGC and deploys it on your system.

   ```bash
   docker compose -f deploy/compose/docker-compose-ingestor-server.yaml up -d
   ```

   [!TIP]
   You can add a `--build` argument in case you have made some code changes or have any requirement of re-building ingestion containers from source code:

   ```bash
   docker compose -f deploy/compose/docker-compose-ingestor-server.yaml up -d --build
   ```

5. Start the rag containers from the repo root. This pulls the prebuilt containers from NGC and deploys it on your system.

   ```bash
   docker compose -f deploy/compose/docker-compose-rag-server.yaml up -d
   ```

   [!TIP]
   You can add a `--build` argument in case you have made some code changes or have any requirement of re-building containers from source code:

   ```bash
   docker compose -f deploy/compose/docker-compose-rag-server.yaml up -d --build
   ```

   You can check the status of the rag-server and its dependencies by issuing this curl command

   ```bash
   curl -X 'GET' 'http://workstation_ip:8081/v1/health?check_dependencies=true' -H 'accept: application/json'
   ```

6. Confirm all the below mentioned containers are running.

   ```bash
   docker ps --format "table {{.ID}}\t{{.Names}}\t{{.Status}}"
   ```

   *Example Output*

   ```output
   NAMES                                   STATUS
   compose-nv-ingest-ms-runtime-1          Up 5 minutes (healthy)
   ingestor-server                         Up 5 minutes
   compose-redis-1                         Up 5 minutes
   rag-playground                          Up 9 minutes
   rag-server                              Up 9 minutes
   ```

7. Open a web browser and access `http://localhost:8090` to use the RAG Playground. You can use the upload tab to ingest files into the server or follow [the notebooks](../notebooks/) to understand the API usage.

8. To stop all running services, after making some [customizations](#next-steps)

    ```bash
    docker compose -f deploy/compose/docker-compose-ingestor-server.yaml down
    docker compose -f deploy/compose/docker-compose-rag-server.yaml down
    ```

## Deploy With Helm Chart

Use these procedures to deploy with Helm Chart to deploy on a Kubernetes cluster. Alternatively, you can [Deploy With Docker Compose](#deploy-with-docker-compose) for a single node deployment.

### Prerequisites

- Verify that you meet the [prerequisites](#prerequisites).

- Verify that you meet the hardware requirements.

  - The total GPU requirement for deploying this chart is as follows:
    - 8xH100-80GB
    - 9xA100-80GB
    - 8xB200

- Verify that you have the NGC CLI available on your client machine. You can download the CLI from <https://ngc.nvidia.com/setup/installers/cli>.

- Set up your Pinecone API key and environment variables as described in [Obtain API Keys](#obtain-api-keys).

### Deploy the RAG Server

1. Create a namespace for the RAG server.

   ```bash
   kubectl create namespace rag
   ```

2. Create a secret for the NGC API key.

   ```bash
   kubectl create secret docker-registry imagePullSecret \
     --docker-server=nvcr.io \
     --docker-username='$oauthtoken' \
     --docker-password="${NGC_API_KEY}" \
     -n rag
   ```

3. Create a secret for the NGC API key.

   ```bash
   kubectl create secret generic ngcApiSecret \
     --from-literal=password="${NGC_API_KEY}" \
     -n rag
   ```

4. Create a secret for the Pinecone API key.

   ```bash
   kubectl create secret generic pineconeApiSecret \
     --from-literal=api-key="${PINECONE_API_KEY}" \
     -n rag
   ```

5. Install the RAG server with the Ingestor Server.

   ```bash
   helm install rag -n rag https://helm.ngc.nvidia.com/nvidia/blueprint/charts/nvidia-blueprint-rag-v2.2.0.tgz \
   --username '$oauthtoken' \
   --password "${NGC_API_KEY}" \
   --set imagePullSecret.password=$NGC_API_KEY \
   --set ngcApiSecret.password=$NGC_API_KEY \
   --set pineconeApiSecret.api-key=$PINECONE_API_KEY
   ```

### Deploy the Ingestor Server

1. Install the Ingestor Server.

   ```bash
   helm install rag-ingestor -n rag https://helm.ngc.nvidia.com/nvidia/blueprint/charts/nvidia-blueprint-rag-v2.2.0.tgz \
   --username '$oauthtoken' \
   --password "${NGC_API_KEY}" \
   --set imagePullSecret.password=$NGC_API_KEY \
   --set ngcApiSecret.password=$NGC_API_KEY \
   --set pineconeApiSecret.api-key=$PINECONE_API_KEY
   ```

#### (Optional) Enabling persistence for NIMs

- For enabling persistence for NIM LLM refer to the [NIM LLM](https://docs.nvidia.com/nim/large-language-models/latest/deploy-helm.html#storage) documentation.
   Update the required fields in `values.yaml` file for `nim-llm` section.

- For enabling persistence for Nemo Retriever embedding [Nemo Retriever Text Embedding](https://docs.nvidia.com/nim/nemo-retriever/text-embedding/latest/deploying.html#storage) documentation.
   Update the required fields in `values.yaml` file for `nvidia-nim-llama-32-nv-embedqa-1b-v2` section.

- For enabling persistence for Nemo Retriever reranking [Nemo Retriever Text Reranking](https://docs.nvidia.com/nim/nemo-retriever/text-reranking/latest/deploying.html#storage) documentation.
   Update the required fields in `values.yaml` file for `text-reranking-nim` section.

#### (Optional) Customizing Pinecone Configuration

To use a custom Pinecone configuration, you need to update the environment variables in the `values.yaml` file for both the RAG server and the Ingestor server. Follow these steps:

1. **Edit `values.yaml`:**

   Open the `deploy/helm/rag-server/values.yaml` file and update the Pinecone configuration for both the RAG server and the Ingestor server sections:

   ```yaml
   env:
     # ... existing code ...
     VECTOR_STORE_NAME: "pinecone"
     APP_VECTORSTORE_URL: "https://api.pinecone.io"
     PINECONE_ENVIRONMENT: "your-pinecone-environment"
     # ... existing code ...

   ingestor-server:
     env:
       # ... existing code ...
       VECTOR_STORE_NAME: "pinecone"
       APP_VECTORSTORE_URL: "https://api.pinecone.io"
       PINECONE_ENVIRONMENT: "your-pinecone-environment"
       # ... existing code ...
   ```

2. **Deploy the Changes:**

   Redeploy the Helm chart to apply these changes:

   ```sh
   helm upgrade rag https://helm.ngc.nvidia.com/nvidia/blueprint/charts/nvidia-blueprint-rag-v2.2.0.tgz -f rag-server/values.yaml -n rag
   ```

#### (Optional) Customizing the RAG Server UI

Currently, Frontend doesn't support dynamic variables.
The default variables and values are the following:

   ```
      name: NEXT_PUBLIC_MODEL_NAME
      value: "meta/llama-3.1-70b-instruct"
    - name: NEXT_PUBLIC_EMBEDDING_MODEL
      value: "nvidia/llama-3.2-nv-embedqa-1b-v2"
    - name: NEXT_PUBLIC_RERANKER_MODEL
      value: "nvidia/llama-3.2-nv-rerankqa-1b-v2"
    - name: NEXT_PUBLIC_CHAT_BASE_URL
      value: "http://rag-server:8081/v1"
    - name: NEXT_PUBLIC_VDB_BASE_URL
      value: "http://ingestor-server:8082/v1"
   ```

  If you have a plan to customize the RAG server deployment like LLM Model Change then please follow the steps to deploy the Frontend

  - Build the new docker image with updated model name from docker compose

    ```
    cd ../deploy/compose
    ```

    Modify the `image` and `args` accordingly in `docker-compose-rag-server.yaml` for `rag-playground` service

    Example:

    ```
    # Sample UI container which interacts with APIs exposed by rag-server container
    rag-playground:
      container_name: rag-playground
      image: <image-registry-with-tag>
      build:
        # Set context to repo's root directory
        context: ../../frontend
        dockerfile: ./Dockerfile
        args:
          # Model name for LLM
          NEXT_PUBLIC_MODEL_NAME: ${APP_LLM_MODELNAME:-meta/llama-3.1-8b-instruct}
          # Model name for embeddings
          NEXT_PUBLIC_EMBEDDING_MODEL: ${APP_EMBEDDINGS_MODELNAME:-nvidia/llama-3.2-nv-embedqa-1b-v2}
          # Model name for reranking
          NEXT_PUBLIC_RERANKER_MODEL: ${APP_RANKING_MODELNAME:-nvidia/llama-3.2-nv-rerankqa-1b-v2}
          # URL for rag server container
          NEXT_PUBLIC_CHAT_BASE_URL: "http://rag-server:8081/v1"
          # URL for ingestor container
          NEXT_PUBLIC_VDB_BASE_URL: "http://ingestor-server:8082/v1"
      ports:
        - "8090:3000"
      expose:
        - "3000"
      depends_on:
        - rag-server
    ```

    Run the below command to create a docker image

    ```
    docker compose -f docker-compose-rag-server.yaml build --no-cache
    ```

    Once docker image has been build to push the image to a docker a registry

   - Run the following command to install the RAG server with the Ingestor Server and New Frontend with updated `<new-image-repository>` and `<new-image-tag>`:

      ```sh
      helm install rag -n rag https://helm.ngc.nvidia.com/nvidia/blueprint/charts/nvidia-blueprint-rag-v2.2.0.tgz \
      --username '$oauthtoken' \
      --password "${NGC_API_KEY}" \
      --set imagePullSecret.password=$NGC_API_KEY \
      --set ngcApiSecret.password=$NGC_API_KEY
      --set frontend.image.repository='<new-image-repository>' \
      --set frontend.image.tag="<new-image-tag>" \
      --set frontend.imagePullSecret.password="$NGC_API_KEY"
      ```

### Troubleshooting Helm Issues
For troubleshooting issues with Helm deployment, checkout the troubleshooting section [here](./troubleshooting.md#node-exporter-pod-crash-with-prometheus-stack-enabled-in-helm-deployment).

## Data Ingestion

[!IMPORTANT]
Before you can use this procedure, you must deploy the blueprint by using [Deploy With Docker Compose](#deploy-with-docker-compose) or [Deploy With Helm Chart](#deploy-with-helm-chart).

1. Download and install Git LFS by following the [installation instructions](https://git-lfs.com/).

2. Initialize Git LFS in your environment.

   ```bash
   git lfs install
   ```

3. Pull the dataset into the current repo.

   ```bash
   git-lfs pull
   ```

4. Install jupyterlab.

   ```bash
   pip install jupyterlab
   ```

5. Use this command to run Jupyter Lab so that you can execute this IPython notebook.

   ```bash
   jupyter lab --allow-root --ip=0.0.0.0 --NotebookApp.token='' --port=8889
   ```

6. Run the [ingestion_api_usage](../notebooks/ingestion_api_usage.ipynb) notebook.

Follow the cells in the notebook to ingest the PDF files from the data/dataset folder into the vector store.

> [!TIP]
> **Important Configuration Tip**
>
> Check out the [best practices guide](accuracy_perf.md) especially the **Vector Store Retriever Consistency Level** section to configure the required settings before starting the ingestion/retrieval process based on your use case.

## Next Steps

- [Change the Inference or Embedding Model](change-model.md)
- [Customize Prompts](prompt-customization.md)
- [Customize LLM Parameters at Runtime](llm-params.md)
- [Support Multi-Turn Conversations](multiturn.md)
- [Enable NeMo Guardrails for Content Safety](nemo-guardrails.md)
- [Query Across Multiple Collections](multi-collection-retrieval.md)
- [Troubleshoot NVIDIA RAG Blueprint](troubleshooting.md)
- [Understand latency breakdowns and debug errors using observability services](observability.md)
- [Enable Self-Reflection to improve accuracy](self-reflection.md)
- [Enable Query rewriting to Improve accuracy of Multi-Turn Conversations](query_rewriter.md)
- [Enable Image captioning support for ingested documents](image_captioning.md)
- [Enable hybrid search for Pinecone](hybrid_search.md)
- [Add custom metadata while uploaded documents](custom-metadata.md)
- [Enable low latency, low compute text only pipeline](text_only_ingest.md)
- [Enable VLM based inferencing in RAG](vlm.md)
- [Enable PDF extraction with Nemoretriever Parse](nemoretriever-parse-extraction.md)
- [Enable standalone NV-Ingest for direct document ingestion without ingestor server](nv-ingest-standalone.md)
- Explore [best practices for enhancing accuracy or latency](accuracy_perf.md)
- Explore [migration guide](migration_guide.md) if you are migrating from rag v1.0.0 to this version.

> **⚠️ Important B200 Limitation Notice:**
>
> B200 GPUs are **not supported** for the following advanced features:
> - Self-Reflection to improve accuracy
> - Query rewriting to Improve accuracy of Multi-Turn Conversations
> - Image captioning support for ingested documents
> - NeMo Guardrails for guardrails at input/output
> - VLM based inferencing in RAG
> - PDF extraction with Nemoretriever Parse
>
> For these features, please use H100 or A100 GPUs instead.
