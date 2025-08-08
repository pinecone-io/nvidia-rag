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

// src/components/MetadataSchemaEditor.tsx

import { useSchemaEditor } from "../../hooks/useSchemaEditor";
import { SchemaHeader } from "./SchemaHeader";
import { FieldsList } from "./FieldsList";
import { NewFieldForm } from "./NewFieldForm";

// Export all schema editor components for external use
export { SchemaHeader } from "./SchemaHeader";
export { FieldEditForm } from "./FieldEditForm";
export { FieldDisplayCard } from "./FieldDisplayCard";
export { FieldsList } from "./FieldsList";
export { NewFieldForm } from "./NewFieldForm";

const SchemaContent = () => (
  <div className="border-t border-neutral-700 p-6">
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-white mb-2">Schema Configuration</h3>
      <p className="text-sm text-gray-400">
        Define metadata fields for this collection.
      </p>
    </div>

    <FieldsList />
    <NewFieldForm />
  </div>
);

export default function MetadataSchemaEditor() {
  const { showSchemaEditor, toggleEditor } = useSchemaEditor();

  return (
    <div className="rounded-lg border border-neutral-700 bg-black text-white mt-4 my-3">
      <SchemaHeader isOpen={showSchemaEditor} onToggle={toggleEditor} />
      {showSchemaEditor && <SchemaContent />}
    </div>
  );
}
