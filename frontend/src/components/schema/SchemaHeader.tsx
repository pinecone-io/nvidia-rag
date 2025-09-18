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

interface SchemaHeaderProps {
  isOpen: boolean;
  onToggle: () => void;
}

const SchemaIcon = () => (
  <svg 
    className="w-5 h-5 text-[var(--nv-green)]" 
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
    data-testid="schema-icon"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
  </svg>
);

const ToggleButton = ({ isOpen }: { isOpen: boolean }) => (
  <div 
    className={`w-6 h-6 rounded-full border-2 border-neutral-600 flex items-center justify-center text-sm transition-all ${
      isOpen ? 'border-[var(--nv-green)] text-[var(--nv-green)]' : 'text-neutral-400'
    }`}
    data-testid="toggle-button"
  >
    <span data-testid="toggle-icon">
      {isOpen ? "−" : "+"}
    </span>
  </div>
);

export const SchemaHeader = ({ isOpen, onToggle }: SchemaHeaderProps) => (
  <button
    type="button"
    onClick={onToggle}
    className="w-full flex justify-between items-center px-6 py-4 text-base font-semibold hover:bg-neutral-900 transition-colors rounded-lg"
    data-testid="schema-header-button"
  >
    <div 
      className="flex items-center gap-3"
      data-testid="schema-header-content"
    >
      <SchemaIcon />
      <span data-testid="schema-header-title">Metadata Schema</span>
    </div>
    <ToggleButton isOpen={isOpen} />
  </button>
); 