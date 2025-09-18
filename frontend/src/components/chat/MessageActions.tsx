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

import { useSendMessage } from "../../api/useSendMessage";
import { useMessageSubmit } from "../../hooks/useMessageSubmit";

const StopIcon = () => (
  <div className="w-2 h-2 bg-white rounded-sm" />
);

const SendIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
);

const StopButton = () => {
  const { stopStream } = useSendMessage();

  return (
    <button
      className="flex items-center gap-1.5 px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium text-xs transition-all duration-200"
      onClick={stopStream}
    >
      <StopIcon />
      <span>Stop</span>
    </button>
  );
};

const SendButton = () => {
  const { handleSubmit, canSubmit } = useMessageSubmit();

  return (
    <button
      className={`p-1.5 rounded-md transition-all duration-200 ${
        canSubmit 
          ? 'bg-[var(--nv-green)] hover:bg-[var(--nv-green)]/90 text-black hover:shadow-lg hover:shadow-[var(--nv-green)]/20' 
          : 'bg-neutral-700 text-gray-400 cursor-not-allowed opacity-50'
      }`}
      onClick={handleSubmit}
      disabled={!canSubmit}
      title="Send message"
    >
      <SendIcon />
    </button>
  );
};

export const MessageActions = () => {
  const { isStreaming } = useSendMessage();

  return (
    <div className="absolute right-3 top-3 flex items-center gap-2">
      {isStreaming ? <StopButton /> : <SendButton />}
    </div>
  );
}; 