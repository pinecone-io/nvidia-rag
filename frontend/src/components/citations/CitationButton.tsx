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

import type { Citation } from "../../types/chat";
import { useCitations } from "../../hooks/useCitations";

interface CitationButtonProps {
  citations: Citation[];
}

const DocumentIcon = () => (
  <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const ExternalLinkIcon = () => (
  <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
  </svg>
);

export const CitationButton = ({ citations }: CitationButtonProps) => {
  const { showCitations, formatCitationCount } = useCitations();

  const handleClick = () => showCitations(citations);

  return (
    <div className="mt-3 pt-3 border-t border-neutral-700/50">
      <button
        onClick={handleClick}
        className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium text-[var(--nv-green)] hover:text-white bg-[var(--nv-green)]/10 hover:bg-[var(--nv-green)]/20 border border-[var(--nv-green)]/30 hover:border-[var(--nv-green)]/50 rounded-lg transition-all duration-200"
      >
        <DocumentIcon />
        <span>{formatCitationCount(citations.length)}</span>
        <ExternalLinkIcon />
      </button>
    </div>
  );
}; 