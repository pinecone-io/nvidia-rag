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

import { useIngestionTasksStore } from "../store/useIngestionTasksStore";

export function useUploadDocuments() {
  const { addTask } = useIngestionTasksStore();

  const mutate = (data: { files: File[]; metadata: any }, options: { onSuccess?: (data: any) => void; onError?: (error: any) => void }) => {
    const formData = new FormData();
    data.files.forEach((file) => {
      formData.append("documents", file);
    });
    formData.append("data", JSON.stringify(data.metadata));

    fetch(`/api/documents?blocking=false`, {
      method: "POST",
      body: formData,
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to upload documents");
        const responseData = await res.json();
        
        if (responseData?.task_id) {
          const taskData = {
            id: responseData.task_id,
            collection_name: data.metadata.collection_name,
            documents: data.files.map((f) => f.name),
            state: "PENDING" as const,
            created_at: new Date().toISOString(),
          };
          
          addTask(taskData);
        }
        
        options.onSuccess?.(responseData);
      })
      .catch((error) => {
        options.onError?.(error);
      });
  };

  return { 
    mutate,
    isPending: false 
  };
}
