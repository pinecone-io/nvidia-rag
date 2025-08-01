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

import { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import NewNamespaceModal from "./NewNamespaceModal";
import NamespaceItem from "./NamespaceItem";
import SourceItem from "./SourceItem";
import AddSourceModal from "./AddSourceModal";
import { useApp } from "../../context/AppContext";
import { NamespaceResponse } from "@/types/namespaces";
import { DocumentResponse } from "@/types/documents";
import React from "react";

export default function Namespaces() {
  // State and Context
  const {
    namespaces,
    selectedNamespaces,
    setSelectedNamespaces,
    setNamespaces,
    onDocumentsUpdated,
  } = useApp();
  const selectedNamespace = selectedNamespaces[0] || null;

  const [searchQuery, setSearchQuery] = useState("");
  const [isNewNamespaceModalOpen, setIsNewNamespaceModalOpen] =
    useState(false);
  const [isAddSourceModalOpen, setIsAddSourceModalOpen] = useState(false);
  const [showSourceItems, setShowSourceItems] = useState(false);
  const [sourceItems, setSourceItems] = useState<DocumentResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCollections, setIsLoadingCollections] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalNamespaceName, setModalNamespaceName] = useState("");

  // Data Fetching
  useEffect(() => {
    fetchNamespaces();
  }, [setNamespaces]);

  // Define fetchDocuments with useCallback to avoid recreating it in each render
  const fetchDocuments = useCallback(async () => {
    if (!selectedNamespace) return;

    try {
      // Only set loading to true if we don't already have documents loaded
      // This prevents the flickering when refreshing existing documents
      if (sourceItems.length === 0) {
        setIsLoading(true);
      }

      setError(null);
      const response = await fetch(
        `/api/documents?namespace_name=${selectedNamespace}`
      );
      if (!response.ok) throw new Error("Failed to fetch documents");

      const data = await response.json();

      // Only update state if the documents have actually changed
      if (JSON.stringify(data.documents) !== JSON.stringify(sourceItems)) {
        setSourceItems(data.documents);
      }
    } catch (error) {
      console.error("Error fetching documents:", error);
      setError("Failed to load documents");
    } finally {
      setIsLoading(false);
    }
  }, [selectedNamespace, sourceItems]);

  useEffect(() => {
    if (selectedNamespace && showSourceItems) {
      // Use a slight delay to ensure state updates have been processed
      const timer = setTimeout(() => {
        fetchDocuments();
      }, 0);

      return () => clearTimeout(timer);
    }
  }, [selectedNamespace, showSourceItems, fetchDocuments]);

  // Subscribe to document updates for the selected namespace
  useEffect(() => {
    if (!selectedNamespace) return;

    // Set up the callback for updating documents when tasks complete
    const unsubscribe = onDocumentsUpdated(selectedNamespace, () => {
      // Only fetch documents if we're currently viewing them
      if (showSourceItems) {
        fetchDocuments();
      }
    });

    // Clean up the subscription when component unmounts or selectedNamespace changes
    return unsubscribe;
  }, [selectedNamespace, showSourceItems, onDocumentsUpdated, fetchDocuments]);

  // API Calls
  const fetchNamespaces = async () => {
    try {
      setIsLoadingCollections(true);
      setError(null);
      const response = await fetch("/api/namespaces");
      if (!response.ok) throw new Error("Failed to fetch namespaces");

      const data = await response.json();
      setNamespaces(
        data.namespaces.map((namespace: NamespaceResponse) => ({
          namespace_name: namespace.namespace_name,
          document_count: namespace.num_entities,
          index_count: namespace.num_entities,
          metadata_schema: namespace.metadata_schema,
        }))
      );
    } catch (error) {
      console.error("Error fetching namespaces:", error);
      setError("Failed to load namespaces");
    } finally {
      setIsLoadingCollections(false);
    }
  };

  // Event Handlers
  const handleDeleteNamespace = async (name: string) => {
    try {
      const response = await fetch("/api/namespaces", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ namespace_names: [name] }),
      });

      if (!response.ok) throw new Error("Failed to delete namespace");

      setNamespaces(namespaces.filter((c) => c.namespace_name !== name));
      setSelectedNamespaces((prev: any[]) => prev.filter((c) => c !== name));
      if (selectedNamespace === name) {
        setShowSourceItems(false);
      }
    } catch (error) {
      console.error("Error deleting namespace:", error);
      setError("Failed to delete namespace");
    }
  };

  const handleDeleteDocument = async (documentName: string) => {
    if (!selectedNamespace) return;

    try {
      const response = await fetch(
        `/api/documents?namespace_name=${selectedNamespace}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify([documentName]),
        }
      );

      if (!response.ok) throw new Error("Failed to delete document");

      await response.json();

      await fetchDocuments();

      const namespacesResponse = await fetch("/api/namespaces");
      if (namespacesResponse.ok) {
        const { namespaces: updatedNamespaces } =
          await namespacesResponse.json();
        setNamespaces(
          updatedNamespaces.map((namespace: any) => ({
            namespace_name: namespace.namespace_name,
            document_count: namespace.num_entities,
            index_count: namespace.num_entities,
          }))
        );
      }
    } catch (error) {
      console.error("Error deleting document:", error);
      setError("Failed to delete document");
      await fetchDocuments();
    }
  };

  const handleViewFiles = (namespaceName: string) => {
    // Use React 18's automatic batching or wrap in a function to batch these updates
    React.startTransition(() => {
      setSelectedNamespaces([namespaceName]);
      setShowSourceItems(true);
    });
  };

  const handleNamespaceSelect = (namespaceName: string) => {
    setSelectedNamespaces((prev: any[]) =>
      prev.includes(namespaceName)
        ? prev.filter((name: any) => name !== namespaceName)
        : [...prev, namespaceName]
    );
    setShowSourceItems(false);
  };

  const handleBackToNamespaces = () => {
    setShowSourceItems(false);
    setSourceItems([]);
  };

  // Function to open AddSourceModal for a specific namespace
  const openAddSourceModal = (namespaceName: string) => {
    setModalNamespaceName(namespaceName);
    setIsAddSourceModalOpen(true);
  };

  // Render Helpers
  const renderHeader = () => (
    <div className="mb-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-medium">
          {showSourceItems ? (
            <button
              onClick={handleBackToNamespaces}
              className="whitespace-nowrap hover:text-[var(--nv-green)]"
            >
              All Namespaces
            </button>
          ) : (
            <span className="whitespace-nowrap">All Namespaces</span>
          )}
        </h2>
        {showSourceItems && selectedNamespace && (
          <>
            <span className="text-gray-500">/</span>
            <span
              title={selectedNamespace}
              className="inline-block max-w-[170px] truncate text-sm font-medium text-[var(--nv-green)]"
            >
              {selectedNamespace}
            </span>
          </>
        )}
      </div>
    </div>
  );

  const renderContent = () => {
    if (isLoadingCollections) {
      return <LoadingState message="Loading namespaces..." />;
    }

    if (error) {
      return <ErrorState error={error} />;
    }

    if (namespaces.length === 0) {
      return <EmptyState />;
    }

    return (
      <>
        <div className="collections-container relative">
          <div className="max-h-[calc(100vh-260px)] overflow-y-auto pr-2">
            {showSourceItems ? <DocumentsList /> : <NamespacesList />}
          </div>
        </div>
      </>
    );
  };

  // Render Components
  const LoadingState = ({ message }: { message: string }) => (
    <div className="flex h-[200px] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--nv-green)] border-t-transparent" />
        <p className="text-sm text-gray-400">{message}</p>
      </div>
    </div>
  );

  const ErrorState = ({ error }: { error: string }) => (
    <div className="flex h-[200px] flex-col items-center justify-center text-center">
      <div className="mb-4">
        <Image
          src="/error.svg"
          alt="Error"
          width={48}
          height={48}
          className="opacity-50"
        />
      </div>
      <p className="mb-2 text-sm text-red-400">{error}</p>
      <button
        onClick={() => window.location.reload()}
        className="text-xs text-[var(--nv-green)] hover:underline"
      >
        Try again
      </button>
    </div>
  );

  const EmptyState = () => (
    <div className="flex h-[200px] flex-col items-center justify-center text-center">
      <div className="mb-4">
        <Image
          src="/empty-collections.svg"
          alt="No namespaces"
          width={48}
          height={48}
          className="opacity-50"
        />
      </div>
      <p className="mb-2 text-sm text-gray-400">No namespaces</p>
      <p className="text-xs text-gray-500">
        Create your first namespace and add files to customize your model
        response.
      </p>
    </div>
  );

  // Memoize the rendered components to prevent unnecessary re-renders
  const DocumentsList = useMemo(() => {
    return () => (
      <div className="documents-container relative">
        <div className="max-h-[calc(100vh-260px)] space-y-1 overflow-y-auto pr-2">
          {isLoading ? (
            <LoadingState message="Loading documents..." />
          ) : sourceItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Image
                src="/document.svg"
                alt="No documents"
                width={48}
                height={48}
                className="mb-4 opacity-50"
              />
              <p className="text-sm text-gray-400">
                No documents in this namespace
              </p>
            </div>
          ) : (
            sourceItems.map((item) => (
              console.log("item.metadata", item),
              <SourceItem
                key={item.document_name}
                name={item.document_name}
                metadata={item.metadata}
                onDelete={() => handleDeleteDocument(item.document_name)}
              />
            ))
          )}
          {error && (
            <div className="mt-2 rounded-md bg-red-900/50 p-2 text-sm text-red-200">
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }, [sourceItems, isLoading, error, handleDeleteDocument]);

  const NamespacesList = useMemo(() => {
    return () => (
      <>
        {namespaces
          .filter((namespace: any) =>
            namespace.namespace_name
              .toLowerCase()
              .includes(searchQuery.toLowerCase())
          )
          .map((namespace: any) => (
            <NamespaceItem
              key={namespace.namespace_name}
              name={namespace.namespace_name}
              metadataSchema={namespace.metadata_schema}
              isSelected={selectedNamespaces.includes(namespace.namespace_name)}
              onSelect={() => handleNamespaceSelect(namespace.namespace_name)}
              onDelete={() => handleDeleteNamespace(namespace.namespace_name)}
              handleViewFiles={handleViewFiles}
              onDocumentsUpdate={fetchDocuments}
              onShowTaskStatus={() => openAddSourceModal(namespace.namespace_name)}
            />
          ))}
      </>
    );
  }, [
    namespaces,
    searchQuery,
    selectedNamespaces,
    handleNamespaceSelect,
    handleDeleteNamespace,
    handleViewFiles,
    fetchDocuments,
    openAddSourceModal,
  ]);

  return (
    <div className="flex w-[320px] flex-col bg-black p-4 text-white">
      <div className="relative mb-6">
        <input
          type="text"
          placeholder="Search namespaces"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-md bg-neutral-900 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--nv-green)]"
          disabled={isLoadingCollections}
        />
      </div>

      <div className="flex-1">
        {renderHeader()}
        {renderContent()}
      </div>

      <div className="mt-auto flex gap-2">
        <button
          className="flex w-full items-center justify-center gap-2 rounded-full border border-[var(--nv-green)] bg-black px-4 py-2 font-medium text-white transition-colors hover:bg-[#1A1A1A] disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => setIsNewNamespaceModalOpen(true)}
          disabled={isLoadingCollections}
        >
          <span className="text-sm">New Namespace</span>
        </button>
        <button
          className="flex w-full items-center justify-center gap-2 rounded-full border border-[var(--nv-green)] bg-black px-4 py-2 font-medium text-white transition-colors hover:bg-[#1A1A1A] disabled:cursor-not-allowed disabled:opacity-50"
          disabled={
            namespaces.length === 0 ||
            isLoadingCollections ||
            (showSourceItems && !selectedNamespace)
          }
          onClick={() => {
            setModalNamespaceName(selectedNamespace || "");
            setIsAddSourceModalOpen(true);
          }}
        >
          <span className="text-sm">Add Source</span>
        </button>

        <NewNamespaceModal
          isOpen={isNewNamespaceModalOpen}
          onSuccess={() => {
            fetchNamespaces(); // ← trigger immediate reload
          }}
          onClose={() => setIsNewNamespaceModalOpen(false)}
        />
        <AddSourceModal
          key={modalNamespaceName || selectedNamespace || ""}
          isOpen={isAddSourceModalOpen}
          onClose={() => setIsAddSourceModalOpen(false)}
          namespaceName={modalNamespaceName || selectedNamespace || ""}
          onDocumentsUpdate={fetchDocuments}
        />
      </div>
    </div>
  );
}
