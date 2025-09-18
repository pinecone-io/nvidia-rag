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
 * Models section component for configuring AI model settings.
 * 
 * Provides input fields for configuring LLM, embedding, reranker, and VLM models.
 * Each model can be customized with specific model names or endpoints.
 * 
 * @returns Models configuration section with input fields
 */
export const ModelsSection = () => {
  const { model, embeddingModel, rerankerModel, vlmModel, set: setSettings } = useSettingsStore();

  const models = [
    { key: 'model', label: 'LLM Model', value: model },
    { key: 'embeddingModel', label: 'Embedding Model', value: embeddingModel },
    { key: 'rerankerModel', label: 'Reranker Model', value: rerankerModel },
    { key: 'vlmModel', label: 'VLM Model', value: vlmModel },
  ];

  return (
    <div className="space-y-0">
      {models.map(({ key, label, value }, index) => (
        <div 
          key={key} 
          className={`py-4 ${index < models.length - 1 ? 'border-b border-neutral-800' : ''}`}
        >
          <label className="block text-sm font-medium text-white mb-3">{label}</label>
          <input
            type="text"
            value={value}
            onChange={(e) => setSettings({ [key]: e.target.value })}
            className="w-full rounded-lg bg-neutral-800 border border-neutral-700 px-3 py-2.5 text-sm text-white focus:ring-2 focus:ring-[var(--nv-green)]/50 focus:border-[var(--nv-green)]/50 focus:outline-none transition-colors"
            placeholder={`Enter ${label.toLowerCase()}...`}
          />
        </div>
      ))}
    </div>
  );
}; 