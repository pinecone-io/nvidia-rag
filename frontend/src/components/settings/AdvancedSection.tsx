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

import { useSettingsHandlers } from "../../hooks/useSettingsHandlers";

export const AdvancedSection = () => {
  const { stopTokensInput, handleStopTokensChange } = useSettingsHandlers();

  return (
    <div className="py-4">
      <label className="block text-sm font-medium text-white mb-3">Stop Tokens</label>
      <input
        type="text"
        value={stopTokensInput}
        onChange={(e) => handleStopTokensChange(e.target.value)}
        className="w-full rounded-lg bg-neutral-800 border border-neutral-700 px-3 py-2.5 text-sm text-white focus:ring-2 focus:ring-[var(--nv-green)]/50 focus:border-[var(--nv-green)]/50 focus:outline-none transition-colors"
        placeholder="Enter tokens separated by commas"
      />
      <p className="mt-2 text-xs text-gray-400">Tokens that will stop text generation when encountered.</p>
    </div>
  );
}; 