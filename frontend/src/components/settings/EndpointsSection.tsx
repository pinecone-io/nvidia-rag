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

import { useSettingsStore } from "../../store/useSettingsStore";

/**
 * Endpoints section component for configuring API endpoint URLs.
 * 
 * Provides input fields for configuring LLM, embedding, reranker, VLM,
 * and vector database endpoints. Shows current values as placeholders
 * and allows override with custom URLs.
 * 
 * @returns Endpoints configuration section with URL input fields
 */
export const EndpointsSection = () => {
  const { 
    llmEndpoint, 
    embeddingEndpoint, 
    rerankerEndpoint, 
    vlmEndpoint, 
    vdbEndpoint, 
    set: setSettings 
  } = useSettingsStore();

  const endpoints = [
    { key: 'llmEndpoint', label: 'LLM Endpoint', value: llmEndpoint },
    { key: 'embeddingEndpoint', label: 'Embedding Endpoint', value: embeddingEndpoint },
    { key: 'rerankerEndpoint', label: 'Reranker Endpoint', value: rerankerEndpoint },
    { key: 'vlmEndpoint', label: 'VLM Endpoint', value: vlmEndpoint },
    { key: 'vdbEndpoint', label: 'Vector Database Endpoint', value: vdbEndpoint },
  ];

  return (
    <div className="space-y-0">
      {endpoints.map(({ key, label, value }, index) => (
        <div 
          key={key} 
          className={`py-4 ${index < endpoints.length - 1 ? 'border-b border-neutral-800' : ''}`}
        >
          <label className="block text-sm font-medium text-white mb-3">{label}</label>
          <input
            type="text"
            value={value}
            onChange={(e) => setSettings({ [key]: e.target.value })}
            className="w-full rounded-lg bg-neutral-800 border border-neutral-700 px-3 py-2.5 text-sm text-white focus:ring-2 focus:ring-[var(--nv-green)]/50 focus:border-[var(--nv-green)]/50 focus:outline-none transition-colors"
            placeholder={value ? `Current: ${value}` : "Leave empty for default"}
          />
        </div>
      ))}
    </div>
  );
}; 