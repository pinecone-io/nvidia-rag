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

import { useFileIcons } from "../../hooks/useFileIcons";

interface DocumentItemProps {
  name: string;
  metadata: Record<string, any>;
}

// Helper function to format metadata values for display
const formatMetadataValue = (value: any): string => {
  if (value === null || value === undefined) {
    return "—";
  }
  
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  
  if (typeof value === "string") {
    // Handle string representations of booleans
    const lowerValue = value.toLowerCase().trim();
    if (lowerValue === "true" || lowerValue === "1" || lowerValue === "yes" || lowerValue === "on") {
      return "true";
    }
    if (lowerValue === "false" || lowerValue === "0" || lowerValue === "no" || lowerValue === "off") {
      return "false";
    }
    // Return the string as-is if it's not empty
    return value.trim() || "—";
  }
  
  return String(value);
};

export const DocumentItem = ({ name, metadata }: DocumentItemProps) => {
  const { getFileIconByExtension } = useFileIcons();
  
  return (
    <div 
      className="border border-neutral-700 rounded-xl p-4 bg-neutral-900/80 transition-all duration-200"
      data-testid="document-item"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-1">
          <div className="flex-shrink-0" data-testid="document-icon">
            {getFileIconByExtension(name, { size: 'sm' })}
          </div>
          <h3 
            className="font-medium text-white text-sm break-all"
            data-testid="document-name"
          >
            {name}
          </h3>
        </div>
        {Object.keys(metadata).filter(key => key !== 'filename').length > 0 && (
          <div className="mt-3 space-y-1" data-testid="document-metadata">
            {Object.entries(metadata)
              .filter(([key]) => key !== 'filename')
              .map(([key, val]) => (
                <div key={key} className="flex flex-wrap gap-2 text-sm">
                  <span className="text-[var(--nv-green)] font-medium">{key}:</span>
                  <span className="text-gray-300">{formatMetadataValue(val)}</span>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}; 