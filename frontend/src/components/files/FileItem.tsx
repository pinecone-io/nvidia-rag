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
import { useFileIcons } from "../../hooks/useFileIcons";
import { useFileUtils } from "../../hooks/useFileUtils";
import { FileMetadataForm } from "./FileMetadataForm";
import type { UploadFile } from "../../hooks/useUploadFileState";

interface FileItemProps {
  uploadFile: UploadFile;
  onRemove: (id: string) => void;
}

const RemoveIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const ErrorIcon = () => (
  <div className="w-8 h-8 border border-neutral-600 rounded flex items-center justify-center">
    <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
      <path d="M4 18h12V6l-4-4H4v16zm6-10h2v6h-2V8z"/>
    </svg>
  </div>
);

const WarningIcon = () => (
  <svg className="w-3 h-3 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
  </svg>
);

const FileIcon = ({ uploadFile }: { uploadFile: UploadFile }) => {
  const { getFileIconByExtension } = useFileIcons();
  
  if (uploadFile.status === 'error') {
    return <ErrorIcon />;
  }
  
  return getFileIconByExtension(uploadFile.file.name, { size: 'lg' });
};

const FileStatus = ({ uploadFile }: { uploadFile: UploadFile }) => {
  if (uploadFile.status === 'uploaded') {
    return (
      <>
        <span className="text-gray-500">•</span>
        <span className="text-[var(--nv-green)]">Ready</span>
      </>
    );
  }
  
  if (uploadFile.status === 'error' && uploadFile.errorMessage) {
    return (
      <>
        <span className="text-gray-500">•</span>
        <div className="flex items-center gap-1">
          <WarningIcon />
          <span className="text-orange-400">Error message during upload</span>
        </div>
      </>
    );
  }
  
  return null;
};

const FileHeader = ({ uploadFile, onRemove }: FileItemProps) => {
  const handleRemove = useCallback(() => {
    onRemove(uploadFile.id);
  }, [uploadFile.id, onRemove]);

  return (
    <div className="flex items-center justify-between mb-1">
      <p className="text-white text-sm font-medium truncate">
        {uploadFile.file.name}
      </p>
      <button
        onClick={handleRemove}
        className="text-gray-400 hover:text-white flex-shrink-0 ml-2 p-1 rounded transition-colors"
        title="Remove file"
      >
        <RemoveIcon />
      </button>
    </div>
  );
};

const FileDetails = ({ uploadFile }: { uploadFile: UploadFile }) => {
  const { formatFileSize } = useFileUtils();
  
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-gray-400">
        {formatFileSize(uploadFile.file.size)}
      </span>
      <FileStatus uploadFile={uploadFile} />
    </div>
  );
};

export const FileItem = ({ uploadFile, onRemove }: FileItemProps) => (
  <div className="flex gap-3 p-3 bg-neutral-900 border border-neutral-800 rounded-lg">
    <div className="flex-shrink-0 mt-0.5">
      <FileIcon uploadFile={uploadFile} />
    </div>

    <div className="flex-1 min-w-0">
      <FileHeader uploadFile={uploadFile} onRemove={onRemove} />
      <FileDetails uploadFile={uploadFile} />
      <FileMetadataForm fileName={uploadFile.file.name} />
    </div>
  </div>
); 