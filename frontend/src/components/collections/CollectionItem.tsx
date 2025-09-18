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
import { useCollectionsStore } from "../../store/useCollectionsStore";
import { useCollectionDrawerStore } from "../../store/useCollectionDrawerStore";
import { useIngestionTasksStore } from "../../store/useIngestionTasksStore";

/**
 * Collection data interface for the item component.
 */
interface Collection {
  collection_name: string;
  num_entities: number;
  metadata_schema: { name: string; type: string; description: string }[];
}

/**
 * Props for the CollectionItem component.
 */
interface CollectionItemProps {
  collection: Collection;
}

const CheckIcon = () => (
  <svg className="w-3 h-3 text-black" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
    <path d="M5 13l4 4L19 7" />
  </svg>
);

const SpinnerIcon = () => (
  <div className="w-4 h-4 animate-spin rounded-full border-2 border-gray-600 border-t-[var(--nv-green)]" />
);

const MoreIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="12" r="2" />
    <circle cx="12" cy="5" r="2" />
    <circle cx="12" cy="19" r="2" />
  </svg>
);

export const CollectionItem = ({ collection }: CollectionItemProps) => {
  const { selectedCollections, toggleCollection } = useCollectionsStore();
  const { openDrawer } = useCollectionDrawerStore();
  const { pendingTasks } = useIngestionTasksStore();

  const isSelected = selectedCollections.includes(collection.collection_name);
  const hasPendingTasks = pendingTasks.some(
    (t) => t.collection_name === collection.collection_name && t.state === "PENDING"
  );

  const handleToggle = useCallback(() => {
    toggleCollection(collection.collection_name);
  }, [collection.collection_name, toggleCollection]);

  const handleOpenDrawer = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    // Convert API collection to internal format if needed
    const compatibleCollection = {
      ...collection,
      metadata_schema: collection.metadata_schema.map(field => ({
        ...field,
        type: field.type as any, // Temporary type assertion for compatibility
      }))
    };
    openDrawer(compatibleCollection);
  }, [collection, openDrawer]);

  return (
    <div
      className={`group relative flex cursor-pointer flex-col border-b border-neutral-800 px-3 py-2 hover:bg-neutral-900 last:border-b-0 ${
        hasPendingTasks ? "processing-item animate-subtle-pulse" : ""
      }`}
      onClick={handleToggle}
    >
      <div className="flex items-center justify-between">
        <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
          <div
            className={`mr-2 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-[2px] border ${
              isSelected
                ? "border-[var(--nv-green)] bg-[var(--nv-green)]"
                : "border-gray-600"
            }`}
          >
            {isSelected && <CheckIcon />}
          </div>
          
          <div className="flex items-center gap-2 max-w-[180px]">
            <span className="truncate text-sm text-white" title={collection.collection_name}>
              {collection.collection_name}
            </span>
          </div>
        </div>
        
        {hasPendingTasks ? (
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center">
            <SpinnerIcon />
          </div>
        ) : (
          <button
            onClick={handleOpenDrawer}
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-gray-400 hover:bg-neutral-800 hover:text-white"
          >
            <MoreIcon />
          </button>
        )}
      </div>
    </div>
  );
}; 