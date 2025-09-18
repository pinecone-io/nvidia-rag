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

import React from 'react';
import { RagConfigSection } from './RagConfigSection';
import { FeatureTogglesSection } from './FeatureTogglesSection';
import { ModelsSection } from './ModelsSection';
import { EndpointsSection } from './EndpointsSection';
import { AdvancedSection } from './AdvancedSection';

interface SettingsContentProps {
  activeSection: string;
  onShowWarning?: (featureKey: string, newValue: boolean) => void;
}

export const SettingsContent: React.FC<SettingsContentProps> = ({
  activeSection,
  onShowWarning,
}) => {
  const renderContent = () => {
    switch (activeSection) {
      case 'ragConfig':
        return (
          <div className="space-y-8">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white">RAG Configuration</h2>
              <p className="text-gray-400 text-sm leading-relaxed">
                Configure retrieval-augmented generation settings and parameters.
              </p>
            </div>
            <div className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-6">
              <RagConfigSection />
            </div>
          </div>
        );
      
      case 'features':
        return (
          <div className="space-y-8">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white">Feature Toggles</h2>
              <p className="text-gray-400 text-sm leading-relaxed">
                Enable or disable experimental features and functionality.
              </p>
            </div>
            <div className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-6">
              <FeatureTogglesSection onShowWarning={onShowWarning || (() => {})} />
            </div>
          </div>
        );
      
      case 'models':
        return (
          <div className="space-y-8">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white">Model Configuration</h2>
              <p className="text-gray-400 text-sm leading-relaxed">
                Configure AI models and their parameters for different tasks.
              </p>
            </div>
            <div className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-6">
              <ModelsSection />
            </div>
          </div>
        );
      
      case 'endpoints':
        return (
          <div className="space-y-8">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white">Endpoint Configuration</h2>
              <p className="text-gray-400 text-sm leading-relaxed">
                Configure API endpoints and connection settings.
              </p>
            </div>
            <div className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-6">
              <EndpointsSection />
            </div>
          </div>
        );
      
      case 'advanced':
        return (
          <div className="space-y-8">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white">Advanced Settings</h2>
              <p className="text-gray-400 text-sm leading-relaxed">
                Advanced configuration options and system settings.
              </p>
            </div>
            <div className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-6">
              <AdvancedSection />
            </div>
          </div>
        );
      
      default:
        return (
          <div className="space-y-8">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white">RAG Configuration</h2>
              <p className="text-gray-400 text-sm leading-relaxed">
                Configure retrieval-augmented generation settings and parameters.
              </p>
            </div>
            <div className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-6">
              <RagConfigSection />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex-1 px-8 py-8 overflow-y-auto">
      {renderContent()}
    </div>
  );
}; 