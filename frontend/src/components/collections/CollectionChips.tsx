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

/**
 * Icon component for collection representation.
 */
const CollectionIcon = () => (
  <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
  </svg>
);

const RemoveIcon = () => (
  <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

interface CollectionChipProps {
  name: string;
  onRemove: () => void;
}

const CollectionChip = ({ name, onRemove }: CollectionChipProps) => (
  <div className="flex items-center gap-1.5 bg-[var(--nv-green)] text-black text-xs px-2.5 py-1 rounded-md font-medium hover:bg-[var(--nv-green)]/90 transition-colors">
    <span>{name}</span>
    <button
      onClick={onRemove}
      className="hover:text-red-600 transition-colors"
      title="Remove collection"
    >
      <RemoveIcon />
    </button>
  </div>
);

/**
 * Component that displays selected collections as removable chips.
 * 
 * Shows a horizontal list of selected collection names as chips with
 * remove buttons. Allows users to deselect collections by clicking
 * the remove icon on each chip.
 * 
 * @returns Collection chips component with remove functionality
 */
export const CollectionChips = () => {
  const { selectedCollections, toggleCollection } = useCollectionsStore();

  const handleRemove = useCallback((name: string) => {
    toggleCollection(name);
  }, [toggleCollection]);

  if (selectedCollections.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2 mb-3">
      <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
        <CollectionIcon />
        Collections:
      </div>
      {selectedCollections.map((name) => (
        <CollectionChip
          key={name}
          name={name}
          onRemove={() => handleRemove(name)}
        />
      ))}
    </div>
  );
}; 