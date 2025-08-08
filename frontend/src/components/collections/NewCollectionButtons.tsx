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

import { useNavigate } from "react-router-dom";
import { useNewCollectionStore } from "../../store/useNewCollectionStore";
import { useSubmitNewCollection } from "../../hooks/useSubmitNewCollection";
import { useCollections } from "../../api/useCollectionsApi";
import { useState, useEffect, useRef } from "react";

export default function NewCollectionButtons() {
  const navigate = useNavigate();
  const { collectionName, collectionNameTouched, metadataSchema, fileMetadata, selectedFiles, isLoading, setError } =
    useNewCollectionStore();

  const { submit } = useSubmitNewCollection();
  const { data: existing = [] } = useCollections();

  const [nameError, setNameError] = useState<string | null>(null);
  const isSubmittingRef = useRef(false);

  // Validate collection name on every change
  useEffect(() => {
    // Skip validation if we're in the middle of submitting
    if (isSubmittingRef.current) {
      return;
    }

    const trimmed = collectionName.trim();
    if (!trimmed) {
      setNameError(null);
      return;
    }

    const valid = /^[_a-zA-Z][_a-zA-Z0-9]*$/.test(trimmed);
    if (!valid) {
      setNameError(
        "Name must start with a letter/underscore and contain only alphanumerics or underscores"
      );
      return;
    }

    const dup = existing.some((c: any) => c.collection_name === trimmed);
    if (dup) {
      setNameError("A collection with this name already exists");
      return;
    }

    setNameError(null);
  }, [collectionName, existing]);

  // Reset submission flag when loading state changes
  useEffect(() => {
    if (!isLoading) {
      isSubmittingRef.current = false;
    }
  }, [isLoading]);

  const hasMissingRequired = selectedFiles.some((file) =>
    metadataSchema.some((field) => {
      if (field.optional) return false; // Skip optional fields
      
      const value = fileMetadata[file.name]?.[field.name];
      
      // For boolean fields, both "true" and "false" are valid values
      if (field.type === "boolean") {
        const lowerValue = (value || "").toLowerCase().trim();
        const validBooleanValues = ["true", "false", "1", "0", "yes", "no", "on", "off"];
        return !lowerValue || !validBooleanValues.includes(lowerValue);
      }
      
      // For other field types, check if value is empty
      return !value?.trim();
    })
  );

  const handleSubmit = () => {
    if (nameError) {
      setError(nameError);
      return;
    }
    
    // Mark that we're starting submission to skip validation
    isSubmittingRef.current = true;
    
    // Clear any previous errors before submitting
    setError(null);
    submit();
  };

  // Generate helpful validation message explaining why button is disabled
  const getValidationMessage = () => {
    if (!collectionName.trim() && collectionNameTouched) {
      return "Please enter a collection name";
    }
    
    if (hasMissingRequired) {
      // Find which files have missing required fields
      const filesWithMissing = selectedFiles.filter((file) =>
        metadataSchema.some((field) => {
          if (field.optional) return false;
          const value = fileMetadata[file.name]?.[field.name];
          
          if (field.type === "boolean") {
            const lowerValue = (value || "").toLowerCase().trim();
            const validBooleanValues = ["true", "false", "1", "0", "yes", "no", "on", "off"];
            return !lowerValue || !validBooleanValues.includes(lowerValue);
          }
          
          return !value?.trim();
        })
      );
      
      if (filesWithMissing.length === 1) {
        return `Please fill in required fields for ${filesWithMissing[0].name}`;
      } else if (filesWithMissing.length > 1) {
        return `Please fill in required fields for ${filesWithMissing.length} files`;
      }
      return "Please fill in all required fields";
    }
    
    return null;
  };

  const validationMessage = getValidationMessage();

  return (
    <div className="mt-6 space-y-3" data-testid="new-collection-buttons">
      {(nameError || validationMessage) && (
        <div className="flex items-center gap-2 px-3 py-2 bg-red-900/20 border border-red-800/30 rounded-lg text-sm text-red-300" data-testid="error-message">
          <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <span>{nameError || validationMessage}</span>
        </div>
      )}
      
      <div className="flex justify-end space-x-4" data-testid="button-container">
        <button
          onClick={() => navigate("/")}
          className="px-4 py-2 text-sm rounded border border-neutral-600 hover:bg-neutral-800 transition-colors"
          data-testid="cancel-button"
        >
          Cancel
        </button>
        <button
          disabled={!collectionName.trim() || hasMissingRequired || isLoading || !!nameError}
          onClick={handleSubmit}
          className="px-4 py-2 text-sm rounded bg-[var(--nv-green)] hover:bg-opacity-90 disabled:opacity-50 transition-colors"
          data-testid="create-button"
        >
          {isLoading ? "Processing..." : "Create Collection"}
        </button>
      </div>
    </div>
  );
}
