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

import { useCallback, useState } from "react";
import { FeatureWarningModal } from "../modals/FeatureWarningModal";
import "./slider.css";

/**
 * Props for the SettingToggle component.
 */
interface SettingToggleProps {
  label: string;
  description: string;
  value: boolean;
  onChange: (value: boolean) => void;
}

/**
 * Props for the SettingSlider component.
 */
interface SettingSliderProps {
  label: string;
  description?: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
}

/**
 * Props for the SettingInput component.
 */
interface SettingInputProps {
  label: string;
  description?: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "number";
  placeholder?: string;
  min?: number;
  max?: number;
  isValid?: boolean;
  validationMessage?: string;
}

/**
 * A toggle switch component for settings with label and description.
 * 
 * @param props - The props for the toggle component
 * @returns JSX element representing a setting toggle switch
 */
export const SettingToggle = ({ label, description, value, onChange }: SettingToggleProps) => {
  const [showModal, setShowModal] = useState(false);

  const handleToggleClick = useCallback(() => {
    console.log('🔥 TOGGLE CLICKED!', label);
    console.log('🔥 SETTING MODAL TO TRUE');
    setShowModal(true);
  }, [label]);

  const handleConfirm = useCallback(() => {
    onChange(!value);
    setShowModal(false);
  }, [onChange, value]);

  const handleCancel = useCallback(() => {
    setShowModal(false);
  }, []);

  return (
    <>
      <div 
        className="flex items-center justify-between p-3 rounded-lg bg-red-500 border border-yellow-500"
        data-testid="setting-toggle"
      >
        <div data-testid="toggle-content">
          <p 
            className="text-sm font-medium"
            data-testid="toggle-label"
          >
            {label} {showModal ? '[MODAL OPEN]' : '[MODAL CLOSED]'}
          </p>
          <p 
            className="text-xs text-gray-400"
            data-testid="toggle-description"
          >
            {description}
          </p>
        </div>
        <button
          onClick={handleToggleClick}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--nv-green)]/50 focus:ring-offset-2 focus:ring-offset-neutral-900 ${
            value ? "bg-[var(--nv-green)]" : "bg-neutral-600"
          }`}
          data-testid="toggle-button"
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform ${
              value ? "translate-x-6" : "translate-x-1"
            }`}
            data-testid="toggle-indicator"
          />
        </button>
      </div>

      <FeatureWarningModal
        isOpen={showModal}
        onClose={handleCancel}
        onConfirm={handleConfirm}
      />
    </>
  );
};

/**
 * A slider component for numeric settings with label, description, and range controls.
 * 
 * @param props - The props for the slider component
 * @returns JSX element representing a setting slider with input field
 */
export const SettingSlider = ({ 
  label, 
  description, 
  value, 
  onChange, 
  min, 
  max, 
  step 
}: SettingSliderProps) => {
  // Calculate the percentage for the gradient fill
  const percentage = ((value - min) / (max - min)) * 100;
  
  return (
    <div 
      className="space-y-3"
      data-testid="setting-slider"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <label 
            className="text-sm font-medium text-white"
            data-testid="slider-label"
          >
            {label}
          </label>
          {description && (
            <p 
              className="text-xs text-gray-400 mt-0.5"
              data-testid="slider-description"
            >
              {description}
            </p>
          )}
        </div>
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-20 rounded-lg bg-neutral-800 border border-neutral-700 px-3 py-1.5 text-sm text-white focus:ring-2 focus:ring-[var(--nv-green)]/50 focus:border-[var(--nv-green)]/50 focus:outline-none transition-colors"
          step={step}
          min={min}
          max={max}
          data-testid="slider-input"
        />
      </div>
      <div className="relative w-full h-5 flex items-center">
        <div 
          className="absolute inset-x-0 h-2 bg-neutral-700 rounded-lg"
        />
        <div 
          className="absolute left-0 h-2 bg-[var(--nv-green)] rounded-lg transition-all duration-150"
          style={{ width: `${percentage}%` }}
        />
        <input
          type="range"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="relative w-full h-2 bg-transparent appearance-none cursor-pointer z-10 range-slider"
          step={step}
          min={min}
          max={max}
          data-testid="slider-range"
        />
      </div>
    </div>
  );
};

export const SettingInput = ({ 
  label, 
  description, 
  value, 
  onChange, 
  type = "text", 
  placeholder,
  min,
  max,
  isValid = true,
  validationMessage
}: SettingInputProps) => {
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  }, [onChange]);

  return (
    <div 
      className="space-y-2"
      data-testid="setting-input"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <label 
            className="text-sm font-medium text-white"
            data-testid="input-label"
          >
            {label}
          </label>
          {description && (
            <p 
              className="text-xs text-gray-400 mt-0.5"
              data-testid="input-description"
            >
              {description}
            </p>
          )}
        </div>
        <input
          type={type}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          min={min}
          max={max}
          className={`w-32 rounded-lg bg-neutral-800 border px-3 py-1.5 text-sm text-white focus:ring-2 focus:ring-offset-0 focus:outline-none transition-colors ${
            isValid 
              ? 'border-neutral-700 focus:ring-[var(--nv-green)]/50 focus:border-[var(--nv-green)]/50' 
              : 'border-red-500 focus:ring-red-500/50'
          }`}
          data-testid="input-field"
        />
      </div>
      {!isValid && validationMessage && (
        <p 
          className="text-xs text-red-400"
          data-testid="input-validation-message"
        >
          {validationMessage}
        </p>
      )}
    </div>
  );
};

export const SettingTextInput = ({ 
  label, 
  description, 
  value, 
  onChange, 
  placeholder 
}: Omit<SettingInputProps, 'type' | 'min' | 'max' | 'isValid' | 'validationMessage'>) => {
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  }, [onChange]);

  return (
    <div 
      className="p-3 rounded-lg bg-neutral-900/50 border border-neutral-700"
      data-testid="setting-text-input"
    >
      <label 
        className="block text-sm font-medium mb-2"
        data-testid="text-input-label"
      >
        {label}
      </label>
      <textarea
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        rows={3}
        className="w-full rounded-lg bg-neutral-800 border border-neutral-600 px-3 py-2 text-sm text-white focus:ring-2 focus:ring-[var(--nv-green)]/50 focus:ring-offset-2 focus:ring-offset-neutral-900 focus:outline-none transition-colors resize-none"
        data-testid="text-input-field"
      />
      {description && (
        <p 
          className="mt-1 text-xs text-gray-400"
          data-testid="text-input-description"
        >
          {description}
        </p>
      )}
    </div>
  );
}; 