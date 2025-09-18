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

import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Props for the NewCollectionButton component.
 */
interface NewCollectionButtonProps {
  disabled?: boolean;
}

/**
 * Button component for creating a new collection.
 * 
 * Displays a styled button that navigates to the new collection page.
 * Can be disabled to prevent navigation when needed.
 * 
 * @param props - Component props with optional disabled state
 * @returns New collection button with navigation functionality
 */
export const NewCollectionButton = ({ disabled = false }: NewCollectionButtonProps) => {
  const navigate = useNavigate();

  const handleClick = useCallback(() => {
    navigate("/collections/new");
  }, [navigate]);

  return (
    <div className="mt-auto flex gap-2">
      <button
        className="flex w-full items-center justify-center gap-2 rounded-full border border-[var(--nv-green)] bg-black px-4 py-2 font-medium text-white transition-colors hover:bg-nvidia-darker disabled:cursor-not-allowed disabled:opacity-50"
        onClick={handleClick}
        disabled={disabled}
      >
        <span className="text-sm">New Collection</span>
      </button>
    </div>
  );
}; 