// SPDX-FileCopyrightText: Copyright (c) 2025 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
"use client";

import { useState, useEffect } from "react";
import { useApp } from "@/app/context/AppContext";
import Modal from "../Modal/Modal";
import MetadataSchemaEditor from "../RightSidebar/MetadataSchemaEditor";
import { UIMetadataField } from "@/types/namespaces";

interface NewNamespaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function NewNamespaceModal({
  isOpen,
  onClose,
  onSuccess
}: NewNamespaceModalProps) {
  const { setNamespaces, addPendingTask } = useApp();
  const [namespaceName, setNamespaceName] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileMetadata, setFileMetadata] = useState<Record<string, Record<string, string>>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [showFileInput, setShowFileInput] = useState(true);
  const [metadataSchema, setMetadataSchema] = useState<UIMetadataField[]>([]);

  useEffect(() => {
    if (isOpen) {
      setNamespaceName("");
      setSelectedFiles([]);
      setFileMetadata({});
      setError(null);
      setUploadComplete(false);
      setShowFileInput(true);
      setMetadataSchema([]);
    }
  }, [isOpen]);

  const handleFileSelect = (files: File[]) => {
    setSelectedFiles((prev) => {
      const updated = [...prev, ...files];

      const newMetadata = { ...fileMetadata };
      for (const file of files) {
        if (!newMetadata[file.name]) {
          newMetadata[file.name] = {};
          for (const field of metadataSchema) {
            newMetadata[file.name][field.name] = "";
          }
        }
      }

      setFileMetadata(newMetadata);
      return updated;
    });
  };

  const removeFile = (index: number) => {
    const removedFile = selectedFiles[index];
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setFileMetadata((prev) => {
      const updated = { ...prev };
      delete updated[removedFile.name];
      return updated;
    });
  };

  const handleMetadataChange = (filename: string, field: string, value: string) => {
    setFileMetadata(prev => ({
      ...prev,
      [filename]: {
        ...prev[filename],
        [field]: value
      }
    }));
  };

  const handleNamespaceNameChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setNamespaceName(e.target.value.replace(/\s+/g, "_"));
  };

  const handleReset = () => {
    setNamespaceName("");
    setSelectedFiles([]);
    setFileMetadata({});
    setError(null);
  };

  const handleSubmit = async () => {
    try {
      if (!namespaceName.match(/^[a-zA-Z_][a-zA-Z0-9_]*$/)) {
        setError("Namespace name must start with a letter or underscore and can only contain letters, numbers and underscores");
        return;
      }

      const checkResponse = await fetch("/api/namespaces");
      if (!checkResponse.ok) throw new Error("Failed to check existing namespaces");

      const { namespaces: existingNamespaces } = await checkResponse.json();
      if (existingNamespaces.some((c: any) => c.namespace_name === namespaceName)) {
        setError("A namespace with this name already exists");
        return;
      }

      const cleanedSchema = metadataSchema.map((field) => ({
        name: field.name,
        type: field.type,
      }));

      setIsLoading(true);
      setError(null);

      const createNamespaceResponse = await fetch("/api/namespace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          namespace_name: namespaceName,
          embedding_dimension: 2048,
          metadata_schema: cleanedSchema,
        }),
      });

      if (!createNamespaceResponse.ok) throw new Error("Failed to create namespace");

      const namespaceData = await createNamespaceResponse.json();
      if (namespaceData.failed?.length > 0) {
        throw new Error(
          `Failed to create namespace: ${namespaceData.message || "Unknown error"}`
        );
      }

      if (selectedFiles.length > 0) {
        const formData = new FormData();
        selectedFiles.forEach((file) => {
          formData.append("documents", file);
        });

        const metadata = {
          namespace_name: namespaceName,
          blocking: false,
          custom_metadata: selectedFiles.map((file) => ({
            filename: file.name,
            metadata: fileMetadata[file.name] || {}
          }))
        };

        formData.append("data", JSON.stringify(metadata));

        const uploadResponse = await fetch("/api/documents?blocking=false", {
          method: "POST",
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error("Failed to upload documents");
        }

        const uploadData = await uploadResponse.json();

        if (uploadData.task_id) {
          const documentNames = selectedFiles.map(file => file.name);
          addPendingTask({
            id: uploadData.task_id,
            namespace_name: namespaceName,
            state: "PENDING",
            created_at: new Date().toISOString(),
            documents: documentNames
          });
        }
      }

      const getNamespacesResponse = await fetch("/api/namespaces");
      if (!getNamespacesResponse.ok) {
        throw new Error("Failed to fetch updated namespaces");
      }

      const { namespaces } = await getNamespacesResponse.json();
      setNamespaces(
        namespaces.map((namespace: any) => ({
          namespace_name: namespace.namespace_name,
          document_count: namespace.num_entities,
          index_count: namespace.num_entities,
          metadata_schema: namespace.metadata_schema ?? [],
        }))
      );

      setUploadComplete(true);
      setShowFileInput(false);
      setSelectedFiles([]);
      setIsLoading(false);
      onSuccess?.();
    } catch (err) {
      console.error("Error creating namespace:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
      setIsLoading(false);
    }
  };

  const modalDescription =
    "Upload a collection of source files to provide the model with relevant information for more tailored responses (e.g., marketing plans, research notes, meeting transcripts, sales documents).";

  const namespaceNameInput = (
    <div className="mb-4">
      <label className="mb-2 block text-sm font-medium">Namespace Name</label>
      <input
        type="text"
        value={namespaceName}
        onChange={handleNamespaceNameChange}
        placeholder="Enter namespace name"
        className="w-full rounded-md bg-neutral-800 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--nv-green)]"
        disabled={isLoading || uploadComplete}
      />
    </div>
  );

  const renderSuccessMessage = () => {
    if (!uploadComplete) return null;

    return (
      <div className="mb-4 mt-2 overflow-hidden rounded-md border border-neutral-700 bg-neutral-900 p-3">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6.00016 10.7799L3.22016 7.99987L2.27349 8.93987L6.00016 12.6665L14.0002 4.66654L13.0602 3.72654L6.00016 10.7799Z" fill="#22C55E"/>
            </svg>
            <span className="font-medium text-sm">Namespace created successfully</span>
          </div>
          <button
            onClick={() => setUploadComplete(false)}
            className="text-neutral-500 hover:text-white transition-colors"
            title="Dismiss"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
        <div className="mt-2 text-xs">
          <p className="text-neutral-400">
            Your new namespace "{namespaceName}" has been created.
            {selectedFiles.length > 0 && (
              <> Documents are being processed and will be available soon. You can view processing status in the Add Source dialog.</>
            )}
          </p>
        </div>
      </div>
    );
  };

  const hasMissingRequired = selectedFiles.some(file =>
    metadataSchema.some(field =>
      !field.optional && !fileMetadata[file.name]?.[field.name]?.trim()
    )
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="New Namespace"
      description={modalDescription}
      isLoading={isLoading}
      error={error}
      selectedFiles={selectedFiles}
      submitButtonText="Create Namespace"
      isSubmitDisabled={hasMissingRequired || !namespaceName}
      onFileSelect={handleFileSelect}
      onRemoveFile={removeFile}
      onReset={handleReset}
      onSubmit={handleSubmit}
      fileInputId="fileInput"
      fileMetadata={fileMetadata}
      onMetadataChange={handleMetadataChange}
      metadataSchema={metadataSchema}
      customContent={
        <>
          {namespaceNameInput}
          <MetadataSchemaEditor schema={metadataSchema} setSchema={setMetadataSchema} />
          {renderSuccessMessage()}
        </>
      }
      showFileInput={showFileInput && !uploadComplete}
      hideActionButtons={uploadComplete}
    />
  );
}