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

import { NextRequest, NextResponse } from "next/server";
import {
  createErrorResponse,
} from "../utils/api-utils";
import { API_CONFIG, buildQueryUrl } from "@/app/config/api";

// GET /namespaces
export async function GET(request: NextRequest) {
  try {
    const url = buildQueryUrl(
      `${API_CONFIG.VDB.BASE_URL}${API_CONFIG.VDB.ENDPOINTS.NAMESPACES.LIST}`,
      {}
    );

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch namespaces: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching namespaces:", error);
    return createErrorResponse(error);
  }
}

// DELETE /namespaces
export async function DELETE(request: NextRequest) {
  try {
    const { namespace_names } = await request.json();

    const url = buildQueryUrl(
      `${API_CONFIG.VDB.BASE_URL}${API_CONFIG.VDB.ENDPOINTS.NAMESPACES.DELETE}`,
      {}
    );

    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
        Array.isArray(namespace_names) ? namespace_names : [namespace_names]
      ),
    });

    if (!response.ok) {
      throw new Error(`Failed to delete namespace: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error deleting namespaces:", error);
    return createErrorResponse(error);
  }
}
