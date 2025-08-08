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

import type { Citation } from "../../types/chat";
import CitationItem from "../citations/CitationItem";

interface CitationsProps {
  citations?: Citation[];
}

export default function Citations({ citations = [] }: CitationsProps) {
  if (!citations.length) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center p-8">
        <div className="p-4 rounded-full bg-neutral-800/50 mb-4">
          <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-white mb-2">No Citations Available</h3>
        <p className="text-sm text-gray-400 max-w-sm">
          No sources were found for this response. Try enabling citations in settings or asking questions about your uploaded documents.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="grid gap-4">
        {citations.map((citation, index) => (
          <CitationItem key={index} citation={citation} index={index} />
        ))}
      </div>
    </div>
  );
}
