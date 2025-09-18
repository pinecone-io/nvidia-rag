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

interface DrawerActionsProps {
  onDelete: () => void;
  onAddSource: () => void;
  isDeleting?: boolean;
}

const DeleteIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
  </svg>
);

const AddIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);

const SpinnerIcon = () => (
  <div className="w-4 h-4 animate-spin rounded-full border-2 border-red-400 border-t-transparent" />
);

export const DrawerActions = ({ 
  onDelete, 
  onAddSource, 
  isDeleting = false 
}: DrawerActionsProps) => (
  <div className="mt-auto p-6 border-t border-neutral-600 bg-black/50">
    <div className="flex gap-3">
      <button
        className="flex items-center justify-center flex-1 gap-2 rounded-lg border border-red-500/50 bg-black hover:bg-red-500/10 px-4 py-3 font-medium text-red-400 transition-all duration-200 hover:border-red-500 disabled:cursor-not-allowed disabled:opacity-50"
        onClick={onDelete}
        disabled={isDeleting}
      >
        {isDeleting ? (
          <>
            <SpinnerIcon />
            <span className="text-sm">Deleting...</span>
          </>
        ) : (
          <>
            <DeleteIcon />
            <span className="text-sm font-semibold">Delete Collection</span>
          </>
        )}
      </button>
      <button
        className="flex items-center justify-center flex-1 gap-2 rounded-lg bg-[var(--nv-green)] hover:bg-[var(--nv-green)]/90 px-4 py-3 font-medium text-black transition-all duration-200 hover:shadow-lg hover:shadow-[var(--nv-green)]/20 disabled:cursor-not-allowed disabled:opacity-50"
        onClick={onAddSource}
      >
        <AddIcon />
        <span className="text-sm font-semibold">Add Source to Collection</span>
      </button>
    </div>
  </div>
); 