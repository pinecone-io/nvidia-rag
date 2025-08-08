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
import type { UIMetadataField, MetadataFieldType, ArrayElementType } from "../../types/collections";

interface FieldEditFormProps {
  field: UIMetadataField;
  onUpdate: (updates: Partial<UIMetadataField>) => void;
  onSave: () => void;
  onCancel: () => void;
}

const EditIcon = () => (
  <svg className="w-4 h-4 text-[var(--nv-green)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const FIELD_TYPES: MetadataFieldType[] = [
  "string", "integer", "float", "number", "boolean", "datetime", "array"
];

const ARRAY_TYPES: ArrayElementType[] = [
  "string", "number", "integer", "float", "boolean"
];

export const FieldEditForm = ({ field, onUpdate, onSave, onCancel }: FieldEditFormProps) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({ name: e.target.value });
  }, [onUpdate]);

  const handleTypeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value as MetadataFieldType;
    onUpdate({ 
      type: newType,
      // Reset array_type if not an array
      array_type: newType === "array" ? (field.array_type || "string") : undefined
    });
  }, [onUpdate, field.array_type]);

  const handleArrayTypeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    onUpdate({ array_type: e.target.value as ArrayElementType });
  }, [onUpdate]);

  const handleRequiredChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({ required: e.target.checked });
  }, [onUpdate]);

  const handleMaxLengthChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onUpdate({ 
      max_length: value ? parseInt(value) : undefined 
    });
  }, [onUpdate]);

  const handleDescriptionChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdate({ description: e.target.value || undefined });
  }, [onUpdate]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSave();
    }
  }, [onSave]);

  return (
    <div className="rounded-lg border-2 border-[var(--nv-green)] bg-black p-5 space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <EditIcon />
        <span className="text-xs font-medium text-[var(--nv-green)]">Editing Field</span>
      </div>
      
      {/* Basic Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Field Name */}
        <div>
          <label className="text-xs font-medium block mb-2 text-gray-300">
            Field Name <span className="text-red-400">*</span>
          </label>
          <input
            autoFocus
            value={field.name || ""}
            onChange={handleNameChange}
            onKeyDown={handleKeyDown}
            className="w-full bg-neutral-900 border border-neutral-700 text-white px-3 py-2 rounded-lg text-xs 
                     focus:border-[var(--nv-green)] focus:ring-1 focus:ring-[var(--nv-green)] focus:outline-none
                     transition-colors"
          />
        </div>

        {/* Field Type */}
        <div>
          <label className="text-xs font-medium block mb-2 text-gray-300">
            Field Type <span className="text-red-400">*</span>
          </label>
          <select
            value={field.type || "string"}
            onChange={handleTypeChange}
            className="w-full bg-neutral-900 border border-neutral-700 text-white px-3 py-2 rounded-lg text-xs 
                     focus:border-[var(--nv-green)] focus:ring-1 focus:ring-[var(--nv-green)] focus:outline-none
                     transition-colors"
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
      {field.type === "array" && (
        <div>
          <label className="text-xs font-medium block mb-2 text-gray-300">
            Array Element Type <span className="text-red-400">*</span>
          </label>
          <select
            value={field.array_type || ""}
            onChange={handleArrayTypeChange}
            className="w-full bg-neutral-900 border border-neutral-700 text-white px-3 py-2 rounded-lg text-xs 
                     focus:border-[var(--nv-green)] focus:ring-1 focus:ring-[var(--nv-green)] focus:outline-none
                     transition-colors"
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
      <div>
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
        <div className="space-y-4 p-4 bg-neutral-800/50 rounded-lg border border-neutral-600">
          {/* Required Field and Max Length side by side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Required Field */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="edit-required"
                checked={field.required || false}
                onChange={handleRequiredChange}
                className="rounded border-neutral-600 bg-neutral-700 text-[var(--nv-green)] focus:ring-1 focus:ring-[var(--nv-green)]"
              />
              <label htmlFor="edit-required" className="text-xs text-gray-300">
                Required field
              </label>
            </div>

            {/* Max Length */}
            {(field.type === "string" || field.type === "array") && (
              <div>
                <label className="text-xs font-medium block mb-2 text-gray-300">
                  Maximum {field.type === "string" ? "Length" : "Items"}
                </label>
                <input
                  type="number"
                  min="1"
                  value={field.max_length || ""}
                  onChange={handleMaxLengthChange}
                  className="w-full bg-neutral-900 border border-neutral-700 text-white px-3 py-2 rounded-lg text-xs 
                           focus:border-[var(--nv-green)] focus:ring-1 focus:ring-[var(--nv-green)] focus:outline-none
                           transition-colors"
                  placeholder={field.type === "string" ? "e.g. 100" : "e.g. 10"}
                />
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-medium block mb-2 text-gray-300">
              Description
            </label>
            <textarea
              value={field.description || ""}
              onChange={handleDescriptionChange}
              onKeyDown={handleKeyDown}
              rows={2}
              className="w-full bg-neutral-900 border border-neutral-700 text-white px-3 py-2 rounded-lg text-xs 
                       focus:border-[var(--nv-green)] focus:ring-1 focus:ring-[var(--nv-green)] focus:outline-none
                       transition-colors resize-none"
              placeholder="Optional description for this field"
            />
          </div>
        </div>
      )}

      {/* Save/Cancel Buttons */}
      <div className="flex justify-end gap-3 pt-2">
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-neutral-700 text-white rounded-lg hover:bg-neutral-600 transition-colors text-xs"
        >
          Cancel
        </button>
        <button
          onClick={onSave}
          className="px-4 py-2 bg-[var(--nv-green)] text-black rounded-lg hover:bg-[var(--nv-green)]/90 transition-colors text-xs font-medium"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}; 