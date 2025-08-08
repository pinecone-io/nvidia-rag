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

import { useCallback } from "react";
import { useCollectionDocuments } from "../../api/useCollectionDocuments";
import { useCollectionDrawerStore } from "../../store/useCollectionDrawerStore";
import { DocumentItem } from "./DocumentItem";
import { LoadingState } from "../ui/LoadingState";
import { ErrorState } from "../ui/ErrorState";
import { EmptyState } from "../ui/EmptyState";

export const DocumentsList = () => {
  const { activeCollection } = useCollectionDrawerStore();
  const { data, isLoading, error } = useCollectionDocuments(activeCollection?.collection_name || "");

  const handleRetry = useCallback(() => {
    window.location.reload();
  }, []);

  if (isLoading) {
    return <LoadingState message="Loading documents..." />;
  }

  if (error) {
    return <ErrorState message="Failed to load documents" onRetry={handleRetry} />;
  }

  if (!data?.documents?.length) {
    return (
      <EmptyState 
        title="No documents yet"
        description="This collection is empty. Add files using the 'Add Source' button below to get started."
      />
    );
  }

  return (
    <div className="space-y-3" data-testid="documents-list">
      {data.documents.map((doc) => (
        <DocumentItem 
          key={doc.document_name}
          name={doc.document_name}
          metadata={doc.metadata}
        />
      ))}
    </div>
  );
}; 