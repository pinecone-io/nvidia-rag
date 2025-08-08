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

import { useSettingsSections } from "../hooks/useSettingsSections";
import { useFeatureWarning } from "../hooks/useFeatureWarning";
import { SettingsHeader } from "../components/settings/SettingsHeader";
import { SettingsSidebar } from "../components/settings/SettingsSidebar";
import { SettingsContent } from "../components/settings/SettingsContent";
import { FeatureWarningModal } from "../components/modals/FeatureWarningModal";

/**
 * Settings page component providing comprehensive application configuration.
 * 
 * Displays a settings interface with sidebar navigation and content panels
 * for configuring RAG parameters, feature toggles, model settings, endpoints,
 * and advanced options. Includes feature warning modal for experimental features.
 * 
 * @returns Settings page with sidebar navigation and configuration panels
 */
export default function SettingsPage() {
  const { activeSection, setSection } = useSettingsSections();
  const { showModal, showWarning, confirmChange, cancelChange } = useFeatureWarning();

  return (
    <div className="h-full bg-nvidia-dark overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 px-8 pt-8 pb-4">
        <SettingsHeader />
      </div>

      {/* Main content area with sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <SettingsSidebar 
          activeSection={activeSection}
          onSectionChange={setSection}
        />
        
        {/* Content */}
        <SettingsContent 
          activeSection={activeSection}
          onShowWarning={showWarning}
        />
      </div>

      {/* Feature Warning Modal */}
      <FeatureWarningModal
        isOpen={showModal}
        onClose={cancelChange}
        onConfirm={confirmChange}
      />
    </div>
  );
} 