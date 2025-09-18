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
 * Props for the FeatureToggle component.
 */
interface FeatureToggleProps {
  label: string;
  description: string;
  value: boolean;
  featureKey: string;
  onShowWarning: (key: string, value: boolean) => void;
  isLast?: boolean;
}

const FeatureToggle = ({ label, description, value, featureKey, onShowWarning, isLast }: FeatureToggleProps) => (
  <div className={`flex items-center justify-between py-4 ${!isLast ? 'border-b border-neutral-800' : ''}`}>
    <div className="flex-1 pr-4">
      <p className="text-sm font-medium text-white">{label}</p>
      <p className="text-xs text-gray-400 mt-1">{description}</p>
    </div>
    <button
      onClick={() => onShowWarning(featureKey, !value)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--nv-green)]/50 focus:ring-offset-2 focus:ring-offset-neutral-900 ${
        value ? "bg-[var(--nv-green)]" : "bg-neutral-600"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform ${
          value ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  </div>
);

/**
 * Props for the FeatureTogglesSection component.
 */
interface FeatureTogglesSectionProps {
  onShowWarning: (key: string, value: boolean) => void;
}

/**
 * Feature toggles section component for enabling/disabling experimental features.
 * 
 * Provides toggle controls for reranker, citations, guardrails, query rewriting,
 * VLM inference, and filter generation features.
 * 
 * @param props - Component props with warning handler
 * @returns Feature toggles section with toggle switches
 */
export const FeatureTogglesSection = ({ onShowWarning }: FeatureTogglesSectionProps) => {
  const {
    enableReranker,
    includeCitations,
    useGuardrails,
    enableQueryRewriting,
    enableVlmInference,
    enableFilterGenerator,
  } = useSettingsStore();

  const features = [
    { key: 'enableReranker', label: 'Enable Reranker', desc: 'Use reranking to improve document relevance', value: enableReranker },
    { key: 'includeCitations', label: 'Include Citations', desc: 'Add source citations to responses', value: includeCitations },
    { key: 'useGuardrails', label: 'Use Guardrails', desc: 'Apply safety guardrails to responses', value: useGuardrails },
    { key: 'enableQueryRewriting', label: 'Query Rewriting', desc: 'Rewrite user queries for better retrieval', value: enableQueryRewriting },
    { key: 'enableVlmInference', label: 'VLM Inference', desc: 'Enable vision-language model inference', value: enableVlmInference },
    { key: 'enableFilterGenerator', label: 'Filter Generator', desc: 'Auto-generate filters from queries', value: enableFilterGenerator },
  ];

  return (
    <div className="space-y-0">
      {features.map(({ key, label, desc, value }, index) => (
        <FeatureToggle
          key={key}
          featureKey={key}
          label={label}
          description={desc}
          value={value}
          onShowWarning={onShowWarning}
          isLast={index === features.length - 1}
        />
      ))}
    </div>
  );
}; 