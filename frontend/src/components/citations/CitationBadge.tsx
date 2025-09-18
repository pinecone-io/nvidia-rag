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

interface CitationBadgeProps {
  number: number;
}

export const CitationBadge = ({ number }: CitationBadgeProps) => (
  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[var(--nv-green)]/20 border border-[var(--nv-green)]/30 flex items-center justify-center">
    <span className="text-sm font-bold text-[var(--nv-green)]">{number}</span>
  </div>
); 