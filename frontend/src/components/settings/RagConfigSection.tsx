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
import { useSettingsHandlers } from "../../hooks/useSettingsHandlers";
import { SettingSlider, SettingInput } from "./SettingControls";

/**
 * RAG Configuration section component for adjusting retrieval and generation settings.
 * 
 * Provides controls for temperature, top-P, confidence threshold, and various K values
 * for vector database and reranker configurations.
 * 
 * @returns RAG configuration section with sliders and inputs
 */
export const RagConfigSection = () => {
  const { temperature, topP, confidenceScoreThreshold = 0, set: setSettings } = useSettingsStore();
  const { 
    vdbTopKInput, 
    rerankerTopKInput, 
    maxTokensInput, 
    handleVdbTopKChange, 
    handleRerankerTopKChange, 
    handleMaxTokensChange 
  } = useSettingsHandlers();

  return (
    <div className="space-y-6">
      <SettingSlider
        label="Temperature"
        description="Controls randomness in responses. Higher values = more creative, lower values = more focused."
        value={temperature}
        onChange={(value) => setSettings({ temperature: value })}
        min={0}
        max={1}
        step={0.1}
      />

      <SettingSlider
        label="Top P"
        description="Limits token selection to cumulative probability. Lower values = more focused responses."
        value={topP}
        onChange={(value) => setSettings({ topP: value })}
        min={0}
        max={1}
        step={0.1}
      />

      <SettingSlider
        label="Confidence Score Threshold"
        description="Minimum confidence score for document relevance. Higher values = more selective results."
        value={confidenceScoreThreshold}
        onChange={(value) => setSettings({ confidenceScoreThreshold: value })}
        min={0}
        max={1}
        step={0.05}
      />

      <SettingInput
        label="Vector DB Top K"
        description="Number of documents to retrieve from vector database"
        value={vdbTopKInput}
        onChange={handleVdbTopKChange}
        type="number"
        min={1}
        max={100}
      />

      <SettingInput
        label="Reranker Top K"
        description="Number of documents to return after reranking"
        value={rerankerTopKInput}
        onChange={handleRerankerTopKChange}
        type="number"
        min={1}
        max={50}
      />

      <SettingInput
        label="Max Tokens"
        description="Maximum number of tokens in the response"
        value={maxTokensInput}
        onChange={handleMaxTokensChange}
        type="number"
        min={1}
        max={4000}
      />
    </div>
  );
}; 