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

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Interface defining the shape of the settings state.
 * Contains RAG configuration, feature toggles, model settings, and endpoints.
 */
interface SettingsState {
  // RAG Configuration
  temperature: number;
  topP: number;
  maxTokens: number;
  vdbTopK: number;
  rerankerTopK: number;
  confidenceScoreThreshold?: number;
  
  // Feature Toggles
  enableQueryRewriting: boolean;
  enableReranker: boolean;
  useGuardrails: boolean;
  includeCitations: boolean;
  enableVlmInference: boolean;
  enableFilterGenerator: boolean;
  
  // Models
  model: string;
  embeddingModel: string;
  rerankerModel: string;
  vlmModel: string;
  
  // Endpoints
  llmEndpoint: string;
  embeddingEndpoint: string;
  rerankerEndpoint: string;
  vlmEndpoint: string;
  vdbEndpoint: string;
  
  // Other
  stopTokens: string[];
  
  set: (values: Partial<SettingsState>) => void;
}

/**
 * Zustand store for application settings with persistence.
 * 
 * Manages RAG configuration, feature toggles, model settings, and API endpoints.
 * Settings are automatically persisted to localStorage.
 * 
 * @returns Settings store with state and setter function
 * 
 * @example
 * ```tsx
 * const { temperature, enableReranker, set } = useSettingsStore();
 * set({ temperature: 0.7, enableReranker: true });
 * ```
 */
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // RAG Configuration
      temperature: 0,
      topP: 0.1,
      maxTokens: 32768,
      vdbTopK: 100,
      rerankerTopK: 10,
      confidenceScoreThreshold: undefined,
      
      // Feature Toggles
      enableQueryRewriting: false,
      enableReranker: true,
      useGuardrails: false,
      includeCitations: true,
      enableVlmInference: false,
      enableFilterGenerator: false,
      
      // Models
      model: "nvdev/nvidia/llama-3.3-nemotron-super-49b-v1",
      embeddingModel: "nvdev/nvidia/llama-3.2-nv-embedqa-1b-v2",
      rerankerModel: "nvdev/nvidia/llama-3.2-nv-rerankqa-1b-v2",
      vlmModel: "nvidia/llama-3.1-nemotron-nano-vl-8b-v1",
      
      // Endpoints
      llmEndpoint: "",
      embeddingEndpoint: "",
      rerankerEndpoint: "https://ai.api.nvidia.com/v1/nvdev/retrieval/nvidia/llama-3_2-nv-rerankqa-1b-v2/reranking/v1",
      vlmEndpoint: "http://vlm-ms:8000/v1",
      vdbEndpoint: "http://milvus:19530",
      
      // Other
      stopTokens: [],
      
      set: (values) => set(values),
    }),
    {
      name: "rag-settings",
    }
  )
);
