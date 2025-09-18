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

import { useCallback, useMemo } from "react";
import { useNewCollectionStore } from "../../store/useNewCollectionStore";
import { useCollectionDrawerStore } from "../../store/useCollectionDrawerStore";
import { useCollectionActions } from "../../hooks/useCollectionActions";
import { DrawerHeader } from "../drawer/DrawerHeader";
import { DrawerContent } from "../drawer/DrawerContent";
import { DrawerActions } from "../drawer/DrawerActions";
import { DrawerContainer } from "../drawer/DrawerContainer";

// Export all drawer components for external use
export { DrawerHeader } from "../drawer/DrawerHeader";
export { LoadingState } from "../ui/LoadingState";
export { ErrorState } from "../ui/ErrorState";
export { EmptyState } from "../ui/EmptyState";
export { DocumentItem } from "../tasks/DocumentItem";
export { DocumentsList } from "../tasks/DocumentsList";
export { UploaderSection } from "../drawer/UploaderSection";
export { DrawerContent } from "../drawer/DrawerContent";
export { DrawerActions } from "../drawer/DrawerActions";
export { DrawerContainer } from "../drawer/DrawerContainer";

export default function CollectionDrawer() {
  const { activeCollection, closeDrawer, toggleUploader } = useCollectionDrawerStore();
  const { setMetadataSchema } = useNewCollectionStore();
  const { handleDeleteCollection, isDeleting } = useCollectionActions();

  const title = useMemo(() => 
    activeCollection?.collection_name || "Collection", 
    [activeCollection]
  );

  const handleClose = useCallback(() => {
    useNewCollectionStore.getState().reset();
    closeDrawer();
  }, [closeDrawer]);

  const handleAddSource = useCallback(() => {
    setMetadataSchema(activeCollection?.metadata_schema || []);
    toggleUploader(true);
  }, [activeCollection, setMetadataSchema, toggleUploader]);

  const handleDelete = useCallback(() => {
    if (activeCollection?.collection_name) {
      handleDeleteCollection(activeCollection.collection_name);
    }
  }, [activeCollection?.collection_name, handleDeleteCollection]);

  return (
    <DrawerContainer>
      <DrawerHeader 
        title={title}
        subtitle="Collection Details"
        onClose={handleClose}
      />
      <DrawerContent />
      <DrawerActions 
        onDelete={handleDelete}
        onAddSource={handleAddSource}
        isDeleting={isDeleting}
      />
    </DrawerContainer>
  );
}
