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

import NotificationBell from "../notifications/NotificationBell";
import { useNavigate, useLocation } from "react-router-dom";
import logo from "../../assets/logo.svg";

/**
 * Application header component with navigation and branding.
 * 
 * Displays the NVIDIA logo, application title, and navigation elements
 * including settings button and notification bell. Handles routing
 * between different application sections.
 * 
 * @returns Header component with logo, title, and navigation elements
 */
export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleSettingsClick = () => {
    if (location.pathname === "/settings") {
      navigate("/");
    } else {
      navigate("/settings");
    }
  };

  return (
    <div className="flex h-14 items-center justify-between border-b border-neutral-800 bg-black px-4">
      <button
        onClick={() => navigate("/")}
        className="flex items-center gap-3 hover:opacity-80 transition-opacity"
      >
        <img src={logo} alt="NVIDIA Logo" className="h-6 w-auto" />
        <span className="text-xl font-semibold text-white">RAG Blueprint</span>
      </button>

      <div className="flex items-center gap-4">
        <NotificationBell />
        <button
          onClick={handleSettingsClick}
          className="flex items-center gap-2 p-2 text-gray-400 transition-colors hover:text-[var(--nv-green)] hover:bg-neutral-900 rounded-lg"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-sm font-medium">Settings</span>
        </button>
      </div>
    </div>
  );
}
