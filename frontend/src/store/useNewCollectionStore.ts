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

import { create } from "zustand";
import type { UIMetadataField } from "../types/collections";

/**
 * State interface for the new collection creation flow.
 */
interface NewCollectionState {
  collectionName: string;
  collectionNameTouched: boolean;
  selectedFiles: File[];
  fileMetadata: Record<string, Record<string, string>>;
  metadataSchema: UIMetadataField[];
  isLoading: boolean;
  uploadComplete: boolean;
  error: string | null;
  setCollectionName: (name: string) => void;
  setCollectionNameTouched: (touched: boolean) => void;
  setMetadataSchema: (schema: UIMetadataField[]) => void;
  setIsLoading: (v: boolean) => void;
  setUploadComplete: (v: boolean) => void;
  setError: (msg: string | null) => void;
  addFiles: (files: File[]) => void;
  removeFile: (index: number) => void;
  updateMetadataField: (filename: string, field: string, value: string) => void;
  reset: () => void;
}

/**
 * Zustand store for managing the new collection creation process.
 * 
 * Handles collection name, file selection, metadata schema, and upload state
 * throughout the multi-step collection creation workflow.
 * 
 * @returns Store with collection creation state and actions
 * 
 * @example
 * ```tsx
 * const { collectionName, selectedFiles, setCollectionName, addFiles } = useNewCollectionStore();
 * setCollectionName("my-collection");
 * addFiles([file1, file2]);
 * ```
 */
export const useNewCollectionStore = create<NewCollectionState>((set, get) => ({
  collectionName: "",
  collectionNameTouched: false,
  selectedFiles: [],
  fileMetadata: {},
  metadataSchema: [],
  isLoading: false,
  uploadComplete: false,
  error: null,

  setCollectionName: (name) => set({ collectionName: name }),
  setCollectionNameTouched: (touched) => set({ collectionNameTouched: touched }),
  setIsLoading: (v) => set({ isLoading: v }),
  setUploadComplete: (v) => set({ uploadComplete: v }),
  setError: (msg) => set({ error: msg }),

  setMetadataSchema: (schema) => {
    const { selectedFiles, fileMetadata } = get();
    const updatedMetadata: Record<string, Record<string, string>> = {};

    for (const file of selectedFiles) {
      const existing = fileMetadata[file.name] || {};
      updatedMetadata[file.name] = {};

      for (const field of schema) {
        updatedMetadata[file.name][field.name] = existing[field.name] || "";
      }
    }

    set({
      metadataSchema: schema,
      fileMetadata: updatedMetadata,
    });
  },

  addFiles: (files) => {
    const { selectedFiles, metadataSchema, fileMetadata } = get();
    const updated = [...selectedFiles, ...files];
    const updatedMetadata = { ...fileMetadata };

    for (const file of files) {
      if (!updatedMetadata[file.name]) {
        updatedMetadata[file.name] = {};
        for (const field of metadataSchema) {
          updatedMetadata[file.name][field.name] = "";
        }
      }
    }

    set({
      selectedFiles: updated,
      fileMetadata: updatedMetadata,
    });
  },

  removeFile: (index) => {
    const { selectedFiles, fileMetadata } = get();
    const file = selectedFiles[index];
    const updatedFiles = selectedFiles.filter((_, i) => i !== index);
    const updatedMetadata = { ...fileMetadata };
    delete updatedMetadata[file.name];

    set({
      selectedFiles: updatedFiles,
      fileMetadata: updatedMetadata,
    });
  },

  updateMetadataField: (filename, field, value) => {
    const { fileMetadata } = get();
    set({
      fileMetadata: {
        ...fileMetadata,
        [filename]: {
          ...fileMetadata[filename],
          [field]: value,
        },
      },
    });
  },

  reset: () =>
    set({
      collectionName: "",
      collectionNameTouched: false,
      selectedFiles: [],
      fileMetadata: {},
      metadataSchema: [],
      isLoading: false,
      uploadComplete: false,
      error: null,
    }),
}));
