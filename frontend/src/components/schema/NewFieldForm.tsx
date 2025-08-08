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

import { useCallback, useState } from "react";
import { useNewFieldForm } from "../../hooks/useNewFieldForm";
import type { MetadataFieldType, ArrayElementType } from "../../types/collections";

const AddIcon = () => (
  <svg className="w-4 h-4 text-[var(--nv-green)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
  </svg>
);

const FIELD_TYPES: MetadataFieldType[] = [
  "string", "integer", "float", "number", "boolean", "datetime", "array"
];

const ARRAY_TYPES: ArrayElementType[] = [
  "string", "number", "integer", "float" //, "boolean"
];

export const NewFieldForm = () => {
  const { newField, fieldNameError, updateNewField, validateAndAdd, canAdd } = useNewFieldForm();
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    updateNewField({ name: e.target.value });
  }, [updateNewField]);

  const handleTypeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value as MetadataFieldType;
    updateNewField({ 
      type: newType,
      // Reset array_type if not an array
      array_type: newType === "array" ? "string" : undefined
    });
  }, [updateNewField]);

  const handleArrayTypeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    updateNewField({ array_type: e.target.value as ArrayElementType });
  }, [updateNewField]);

  const handleRequiredChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    updateNewField({ required: e.target.checked });
  }, [updateNewField]);

  const handleMaxLengthChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    updateNewField({ 
      max_length: value ? parseInt(value) : undefined 
    });
  }, [updateNewField]);

  const handleDescriptionChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateNewField({ description: e.target.value || undefined });
  }, [updateNewField]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      validateAndAdd();
    }
  }, [validateAndAdd]);

  return (
    <div className="border-t border-neutral-700 pt-6 mt-6">
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-white flex items-center gap-2">
          <AddIcon />
          Add New Field
        </h4>
        <p className="text-xs text-gray-500 mt-1">Create a metadata field for this collection</p>
      </div>
      
      <div className="bg-neutral-900 rounded-lg p-4 border border-neutral-700">
        {/* Basic Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Field Name */}
          <div>
            <label className="text-xs font-medium block mb-2 text-gray-300">
              Field Name <span className="text-red-400">*</span>
            </label>
            <input
              placeholder="e.g. category, author, department"
              value={newField.name}
              onChange={handleNameChange}
              onKeyDown={handleKeyDown}
              className="w-full px-3 py-2 rounded-md bg-neutral-800 border border-neutral-600 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--nv-green)] focus:border-transparent text-xs"
            />
            {fieldNameError && (
              <p className="text-red-400 text-xs mt-1">{fieldNameError}</p>
            )}
          </div>

          {/* Field Type */}
          <div>
            <label className="text-xs font-medium block mb-2 text-gray-300">
              Field Type <span className="text-red-400">*</span>
            </label>
            <select
              value={newField.type}
              onChange={handleTypeChange}
              className="w-full px-3 py-2 rounded-md bg-neutral-800 border border-neutral-600 text-white focus:outline-none focus:ring-2 focus:ring-[var(--nv-green)] focus:border-transparent text-xs"
            >
              {FIELD_TYPES.map(type => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Array Type Selection (only for array fields) */}
        {newField.type === "array" && (
          <div className="mb-4">
            <label className="text-xs font-medium block mb-2 text-gray-300">
              Array Element Type <span className="text-red-400">*</span>
            </label>
            <select
              value={newField.array_type || ""}
              onChange={handleArrayTypeChange}
              className="w-full px-3 py-2 rounded-md bg-neutral-800 border border-neutral-600 text-white focus:outline-none focus:ring-2 focus:ring-[var(--nv-green)] focus:border-transparent text-xs"
            >
              <option value="">Select element type</option>
              {ARRAY_TYPES.map(type => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              The data type for elements stored in this array
            </p>
          </div>
        )}

        {/* Advanced Options Toggle */}
        <div className="mb-4">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-xs text-[var(--nv-green)] hover:text-[var(--nv-green)]/80 flex items-center gap-1"
          >
            <svg
              className={`w-3 h-3 transition-transform ${showAdvanced ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            Advanced Options
          </button>
        </div>

        {/* Advanced Fields */}
        {showAdvanced && (
          <div className="space-y-6 p-6 bg-neutral-800/50 rounded-lg border border-neutral-600 mb-4">
            {/* Required Field */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="required"
                checked={newField.required}
                onChange={handleRequiredChange}
                className="rounded border-neutral-600 bg-neutral-700 text-[var(--nv-green)] focus:ring-1 focus:ring-[var(--nv-green)]"
              />
              <label htmlFor="required" className="text-sm text-gray-300 font-medium">
                Required field
              </label>
            </div>

            {/* Max Length */}
            {(newField.type === "string" || newField.type === "array") && (
              <div className="space-y-2">
                <label className="text-sm font-medium block text-gray-300">
                  Maximum {newField.type === "string" ? "Length" : "Items"}
                </label>
                <input
                  type="number"
                  min="1"
                  value={newField.max_length || ""}
                  onChange={handleMaxLengthChange}
                  className="w-full px-3 py-2.5 rounded-md bg-neutral-800 border border-neutral-600 text-white focus:outline-none focus:ring-2 focus:ring-[var(--nv-green)] focus:border-transparent text-sm"
                  placeholder={newField.type === "string" ? "e.g. 100" : "e.g. 10"}
                />
              </div>
            )}

            {/* Description */}
            <div className="space-y-2">
              <label className="text-sm font-medium block text-gray-300">
                Description
              </label>
              <textarea
                value={newField.description || ""}
                onChange={handleDescriptionChange}
                onKeyDown={handleKeyDown}
                rows={3}
                className="w-full px-3 py-2.5 rounded-md bg-neutral-800 border border-neutral-600 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--nv-green)] focus:border-transparent resize-none text-sm leading-relaxed"
                placeholder="Optional description for this field"
              />
            </div>
          </div>
        )}

        {/* Add Button */}
        <button
          onClick={validateAndAdd}
          disabled={!canAdd}
          className="w-full bg-[var(--nv-green)] text-black py-2 px-4 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--nv-green)]/90 transition-colors text-xs"
        >
          Add Field
        </button>
      </div>
    </div>
  );
}; 