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

import { useState } from "react";
import { useCollections } from "../../api/useCollectionsApi";
import { CollectionsGrid } from "./CollectionsGrid";
import { NewCollectionButton } from "./NewCollectionButton";
import CollectionDrawer from "./CollectionDrawer";
import { SearchInput } from "../filtering/SearchInput";
export { CollectionItem } from "./CollectionItem";
export { CollectionsGrid } from "./CollectionsGrid";
export { NewCollectionButton } from "./NewCollectionButton";

export default function CollectionList() {
  const { isLoading } = useCollections();
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <>
      <div className="flex w-[320px] flex-col bg-black p-4 text-white">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search collections"
        />

        <div className="flex-1">          
          <CollectionsGrid searchQuery={searchQuery} />
        </div>

        <NewCollectionButton disabled={isLoading} />
      </div>

      <CollectionDrawer />
    </>
  );
}
