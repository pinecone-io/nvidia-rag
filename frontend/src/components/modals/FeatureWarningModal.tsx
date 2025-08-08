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

import { createPortal } from "react-dom";
import { useState } from "react";

interface FeatureWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (dontShowAgain: boolean) => void;
}

export const FeatureWarningModal = ({ isOpen, onClose, onConfirm }: FeatureWarningModalProps) => {
  const [dontShowAgain, setDontShowAgain] = useState(false);
  
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(dontShowAgain);
    setDontShowAgain(false); // Reset for next time
  };

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/30">
      <div
        className="absolute inset-0"
        onClick={onClose}
      />
      <div className="relative max-w-md w-full mx-4 bg-neutral-900 text-white rounded-lg border border-neutral-700 shadow-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-full bg-yellow-500/20">
            <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold">Feature Requirement</h3>
        </div>
        
        <p className="text-gray-300 mb-6 leading-relaxed">
          Your model needs to have this feature enabled in order for this setting to work properly. 
          Please ensure your model supports this capability before enabling.
        </p>
        
        <div className="mb-4">
          <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="w-4 h-4 rounded border-neutral-600 bg-neutral-800 text-[var(--nv-green)] focus:ring-[var(--nv-green)]/50 focus:ring-2"
            />
            Don't show this message again
          </label>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={onClose} 
            className="flex-1 px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleConfirm} 
            className="flex-1 px-4 py-2 bg-[var(--nv-green)] hover:bg-[var(--nv-green)]/80 text-white rounded-lg transition-colors"
          >
            Enable Anyway
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}; 