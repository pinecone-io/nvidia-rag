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

import { BaseResponse, VDBConfig } from "./common";

export type DocumentMetadata = Record<string, string>;

export interface UIMetadataField {
  name: string;
  type: string;
  optional?: boolean;
}

export interface APIMetadataField {
  name: string;
  type: string;
}

export interface Namespace {
  namespace_name: string;
  document_count: number;
  index_count: number;
  embedding_dimension: number;
  metadata_schema?: APIMetadataField[];
}

export interface NamespaceResponse {
  namespace_name: string;
  num_entities: number;
  metadata_schema?: APIMetadataField[];
}

export interface NamespacesAPIResponse extends BaseResponse {
  namespaces: NamespaceResponse[];
}

export interface NamespaceRequest extends VDBConfig {
  namespace_name: string;
}