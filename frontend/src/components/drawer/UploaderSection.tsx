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
import { useCollectionActions } from "../../hooks/useCollectionActions";
import NvidiaUpload from "../files/NvidiaUpload";

const CloseIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const AddIcon = () => (
  <svg className="w-3 h-3 text-black" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);

export const UploaderSection = () => {
  const { selectedFiles } = useNewCollectionStore();
  const { toggleUploader } = useCollectionDrawerStore();
  const { handleUploadDocuments, isUploading } = useCollectionActions();

  const handleCloseUploader = useCallback(() => {
    toggleUploader(false);
    useNewCollectionStore.getState().reset();
  }, [toggleUploader]);

  return (
    <div className="border-t border-neutral-600 pt-6 mt-6 space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-lg bg-[var(--nv-green)] flex items-center justify-center">
            <AddIcon />
          </div>
          <h3 className="text-lg font-semibold text-white">Add New Documents</h3>
        </div>
        <button
          onClick={handleCloseUploader}
          className="p-1 text-gray-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
          disabled={isUploading}
        >
          <CloseIcon />
        </button>
      </div>
      
      <NvidiaUpload
        onFilesChange={(files) => {
          useNewCollectionStore.getState().addFiles(files);
        }}
        acceptedTypes={['.bmp', '.docx', '.html', '.jpeg', '.json', '.md', '.pdf', '.png', '.pptx', '.sh', '.tiff', '.txt', '.mp3', '.wav']}
        maxFileSize={50}
        maxFiles={20}
      />
      
      {selectedFiles.length > 0 && (
        <button
          onClick={handleUploadDocuments}
          disabled={isUploading}
          className="w-full px-6 py-3 bg-[var(--nv-green)] hover:bg-[var(--nv-green)]/90 text-sm rounded-xl font-semibold text-black transition-all duration-200 hover:shadow-lg hover:shadow-[var(--nv-green)]/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? (
            <>
              <div className="inline-block w-4 h-4 mr-2 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
              Uploading {selectedFiles.length} File{selectedFiles.length > 1 ? 's' : ''}...
            </>
          ) : (
            `Upload ${selectedFiles.length} File${selectedFiles.length > 1 ? 's' : ''}`
          )}
        </button>
      )}
    </div>
  );
}; 