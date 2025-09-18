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

import { useEffect } from "react";
import NvidiaUpload from "../components/files/NvidiaUpload";
import MetadataSchemaEditor from "../components/schema/MetadataSchemaEditor";
import NewCollectionButtons from "../components/collections/NewCollectionButtons";
import StatusMessages from "../components/layout/StatusMessages";
import { useNewCollectionStore } from "../store/useNewCollectionStore";

/**
 * New Collection page component for creating collections.
 * 
 * Provides a multi-step interface for collection creation including
 * file upload, metadata schema definition, and collection naming.
 * 
 * @returns The new collection page component
 */
export default function NewCollection() {
  const { collectionName, setCollectionName, setCollectionNameTouched, reset } = useNewCollectionStore();

  useEffect(() => {
    // cleanup when leaving the page
    return () => {
      reset();
    };
  }, [reset]);

  return (
    <div className="p-6 text-white mx-auto max-w-6xl">
      <h1 className="text-2xl font-bold mb-4">Create New Collection</h1>
      <p className="text-sm text-neutral-400 mb-8">
        Upload source files and define metadata schema for this collection.
      </p>

      {/* Main form */}
      <div className="grid gap-10 md:grid-cols-2">
        {/* Left column – collection details & metadata schema */}
        <div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Collection Name</label>
            <input
              type="text"
              value={collectionName}
              onChange={(e) =>
                setCollectionName(e.target.value.replace(/\s+/g, "_"))
              }
              onBlur={() => setCollectionNameTouched(true)}
              className="w-full rounded-md px-3 py-2 bg-neutral-800 text-white"
            />
          </div>

          <MetadataSchemaEditor />
        </div>

        {/* Right column – file upload & per-file metadata */}
        <div>
          <NvidiaUpload 
            onFilesChange={(files) => {
              // Add new files to existing ones
              const { addFiles } = useNewCollectionStore.getState();
              addFiles(files);
            }}
            acceptedTypes={['.bmp', '.docx', '.html', '.jpeg', '.json', '.md', '.pdf', '.png', '.pptx', '.sh', '.tiff', '.txt', '.mp3', '.wav']}
            maxFileSize={50}
            maxFiles={20}
          />
        </div>
      </div>

      {/* Status + actions */}
      <StatusMessages />
      <NewCollectionButtons />
    </div>
  );
}