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

import { useSidebarStore } from "../../store/useSidebarStore";
import Citations from "../chat/Citations";

export default function SidebarDrawer() {
  const { view, citations, closeSidebar } = useSidebarStore();

  if (!view) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end backdrop-blur-sm bg-black/40"
      onClick={closeSidebar}
    >
      <div
        className="h-full w-[75vw] bg-nvidia-darker shadow-2xl border-l border-neutral-600 flex flex-col animate-slide-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 flex justify-between items-center border-b border-neutral-600 bg-black/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[var(--nv-green)]/20">
              <svg className="w-5 h-5 text-[var(--nv-green)]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {view === "citations" && "Source Citations"}
              </h2>
              <p className="text-sm text-gray-400">
                {view === "citations" && `${citations?.length || 0} sources found`}
              </p>
            </div>
          </div>
          <button 
            onClick={closeSidebar} 
            className="p-2 text-gray-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-all duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Content */}
        <div className="overflow-y-auto flex-1">
          {view === "citations" && <Citations citations={citations} />}
        </div>
      </div>
    </div>
  );
}
