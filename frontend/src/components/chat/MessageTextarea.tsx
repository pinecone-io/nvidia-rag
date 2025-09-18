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
import { useChatStore } from "../../store/useChatStore";
import { useSendMessage } from "../../api/useSendMessage";
import { useTextareaResize } from "../../hooks/useTextareaResize";
import { useMessageSubmit } from "../../hooks/useMessageSubmit";

interface MessageTextareaProps {
  placeholder?: string;
}

export const MessageTextarea = ({ 
  placeholder = "Ask a question about your documents..." 
}: MessageTextareaProps) => {
  const { input, setInput } = useChatStore();
  const { isStreaming } = useSendMessage();
  const { handleInput, getTextareaStyle } = useTextareaResize();
  const { handleSubmit } = useMessageSubmit();

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  }, [setInput]);

  return (
    <textarea
      className="w-full resize-none rounded-lg bg-neutral-800 border border-neutral-700 py-3 pl-3 pr-14 text-white text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-[var(--nv-green)]/50 focus:border-[var(--nv-green)]/50 transition-all duration-200 placeholder-gray-400"
      placeholder={placeholder}
      rows={1}
      value={input}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onInput={handleInput}
      disabled={isStreaming}
      style={getTextareaStyle()}
    />
  );
}; 