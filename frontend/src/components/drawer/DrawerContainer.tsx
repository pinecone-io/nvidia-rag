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
import { useNewCollectionStore } from "../../store/useNewCollectionStore";
import { useCollectionDrawerStore } from "../../store/useCollectionDrawerStore";

interface DrawerContainerProps {
  children: React.ReactNode;
}

export const DrawerContainer = ({ children }: DrawerContainerProps) => {
  const { isOpen, closeDrawer } = useCollectionDrawerStore();

  const handleBackdropClick = useCallback(() => {
    useNewCollectionStore.getState().reset();
    closeDrawer();
  }, [closeDrawer]);

  return (
    <div
      className={`fixed inset-0 z-50 transition-opacity duration-300 ${
        isOpen ? "backdrop-blur-sm bg-black/30" : "pointer-events-none opacity-0"
      }`}
      onClick={handleBackdropClick}
      role="button"
      tabIndex={0}
    >
      <div
        className={`absolute right-0 top-0 h-full w-[75vw] bg-nvidia-darker text-white shadow-xl border-l border-neutral-600 flex flex-col transform transition-transform duration-300 ${
          isOpen ? "translate-x-0 animate-slide-in" : "translate-x-full"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}; 