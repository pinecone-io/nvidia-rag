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
import { useChatStore } from "../store/useChatStore";
import { useSendMessage } from "../api/useSendMessage";
import { useSettingsStore } from "../store/useSettingsStore";
import { useCollectionsStore } from "../store/useCollectionsStore";
import { useUUID } from "./useUUID";

/**
 * Custom hook for handling message submission in the chat interface.
 * 
 * Manages the complete message submission flow including validation,
 * message creation, settings integration, and API communication.
 * Handles user input, selected collections, filters, and streaming responses.
 * 
 * @returns Object with submit function and submission state
 * 
 * @example
 * ```tsx
 * const { handleSubmit } = useMessageSubmit();
 * handleSubmit(); // Submits current input as message
 * ```
 */
export const useMessageSubmit = () => {
  const { input, setInput, filters, addMessage, messages } = useChatStore();
  const { mutateAsync: sendMessage, resetStream } = useSendMessage();
  const { selectedCollections } = useCollectionsStore();
  const settings = useSettingsStore();
  const { generateUUID } = useUUID();

  const createRequest = useCallback((currentMessages: any[]) => ({
    messages: currentMessages.map(({ role, content }) => ({ role, content })),
    use_knowledge_base: selectedCollections.length > 0,
    temperature: settings.temperature,
    top_p: settings.topP,
    max_tokens: settings.maxTokens,
    reranker_top_k: settings.rerankerTopK,
    vdb_top_k: settings.vdbTopK,
    vdb_endpoint: settings.vdbEndpoint,
    collection_names: selectedCollections,
    enable_query_rewriting: settings.enableQueryRewriting,
    enable_reranker: settings.enableReranker,
    enable_guardrails: settings.useGuardrails,
    enable_citations: settings.includeCitations,
    enable_vlm_inference: settings.enableVlmInference,
    enable_filter_generator: settings.enableFilterGenerator,
    model: settings.model,
    llm_endpoint: settings.llmEndpoint,
    embedding_model: settings.embeddingModel,
    embedding_endpoint: settings.embeddingEndpoint,
    reranker_model: settings.rerankerModel,
    reranker_endpoint: settings.rerankerEndpoint,
    vlm_model: settings.vlmModel,
    vlm_endpoint: settings.vlmEndpoint,
    stop: settings.stopTokens,
    confidence_threshold: settings.confidenceScoreThreshold || 0.0,
    filter_expr: filters.length
      ? filters
          .map((f: any) => `content_metadata["${f.field}"] ${f.operator} "${f.value}"`)
          .join(" or ")
      : ""
  }), [selectedCollections, settings, filters]);

  const handleSubmit = useCallback(async () => {
    if (!input.trim()) return;

    const userMessage = {
      id: generateUUID(),
      role: "user" as const,
      content: input,
      timestamp: new Date().toISOString(),
    };

    const assistantMessage = {
      id: generateUUID(),
      role: "assistant" as const,
      content: "",
      timestamp: new Date().toISOString(),
    };

    const currentMessages = [...messages, userMessage];
    addMessage(userMessage);
    addMessage(assistantMessage);
    setInput("");
    resetStream();

    const request = createRequest(currentMessages);
    await sendMessage({ request, assistantId: assistantMessage.id });
  }, [input, messages, addMessage, setInput, resetStream, createRequest, sendMessage, generateUUID]);

  return {
    handleSubmit,
    canSubmit: input.trim().length > 0,
  };
}; 