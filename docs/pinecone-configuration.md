# Pinecone Configuration for Pinecone Enterprise RAG Blueprint

This document outlines the configuration options for integrating Pinecone as a vector database within the Pinecone Enterprise RAG Blueprint. You can choose between using Pinecone Local for local development or the Pinecone service for production use.

## Option 1: Pinecone Local

Pinecone Local is an in-memory Pinecone emulator available as a Docker image. It allows you to develop your applications locally without connecting to your Pinecone account or incurring usage or storage fees.

### Local Setup Instructions

1. **Install Docker**: Ensure Docker is installed and running on your local machine.

2. **Create a `docker-compose.yaml` file**: Define a service for each index that Pinecone Local should create on startup. Here is an example configuration:

   ```yaml
   services:
     dense-index:
       image: ghcr.io/pinecone-io/pinecone-index:latest
       container_name: dense-index
       environment:
         PORT: 5081
         INDEX_TYPE: serverless
         VECTOR_TYPE: dense
         DIMENSION: 2
         METRIC: cosine
       ports:
         - "5081:5081"
       platform: linux/amd64
     sparse-index:
       image: ghcr.io/pinecone-io/pinecone-index:latest
       container_name: sparse-index
       environment:
         PORT: 5082
         INDEX_TYPE: serverless
         VECTOR_TYPE: sparse
         DIMENSION: 0
         METRIC: dotproduct
       ports:
         - "5082:5082"
       platform: linux/amd64
   ```

3. **Start Pinecone Local**: Run the following command to start Pinecone Local:

   ```bash
   docker compose up -d
   ```

### Limitations

- Pinecone Local is not suitable for production as it is an in-memory emulator.
- Records do not persist after Pinecone Local is stopped.
- API keys are ignored, and client requests are not authenticated.
- Max number of records per index: 100,000.

For more details, visit the [Pinecone Local Development Guide](https://docs.pinecone.io/guides/operations/local-development).

## Option 2: Pinecone Service

For production use, you can leverage the Pinecone service, which provides a scalable and efficient vector database solution.

### Service Setup Instructions

1. **Sign up for Pinecone**: Create an account at [Pinecone Console](https://app.pinecone.io).

2. **Obtain an API Key**: Once logged in, generate an API key from the Pinecone console.

3. **Export Environment Variables**: Set up your environment variables:

   ```bash
   export PINECONE_API_KEY="<your-pinecone-api-key>"
   export PINECONE_INDEX_NAME="<your-pinecone-index-name>"
   ```

4. **Configure Your Application**: Use the API key to authenticate requests to the Pinecone service. No additional setup is required.

The Pinecone service offers robust features for production environments, including persistent storage, authentication, and scalability.
