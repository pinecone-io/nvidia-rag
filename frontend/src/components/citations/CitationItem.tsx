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

import { useMemo } from "react";
import type { Citation } from "../../types/chat";
import { useFileIcons } from "../../hooks/useFileIcons";
import { useCitationText } from "../../hooks/useCitationText";
import { useCitationExpansion } from "../../hooks/useCitationExpansion";
import { useCitationUtils } from "../../hooks/useCitationUtils";
// import { CitationBadge } from "./CitationBadge";
// import { CitationScore } from "./CitationScore";
import { CitationVisualContent } from "./CitationVisualContent";
import { CitationTextContent } from "./CitationTextContent";
import { CitationMetadata } from "./CitationMetadata";
import { ExpandChevron } from "../ui/ExpandChevron";

interface CitationItemProps {
  citation: Citation;
  index: number;
}

const CitationHeader = ({ 
  citation, 
  index, 
  isExpanded, 
  onClick 
}: {
  citation: Citation;
  index: number;
  isExpanded: boolean;
  onClick: () => void;
}) => {
  const { getFileIconByExtension } = useFileIcons();
  const { getAbridgedText } = useCitationText();
  const { formatScore } = useCitationUtils();

  return (
    <div 
      className="w-full px-5 py-4 cursor-pointer select-none"
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Unified Rank & Score Badge */}
          <div className="flex-shrink-0">
            <div className="flex-shrink-0 rounded-md bg-[var(--nv-green)]/20 border border-[var(--nv-green)]/30 px-2 py-1.5">
              <div className="flex items-center gap-3">
                <div className="text-base font-bold text-[var(--nv-green)]" data-testid="citation-badge">#{index + 1}</div>
                {citation.score !== undefined && (
                  <div className="text-center">
                    <div className="text-xs text-[var(--nv-green)]/60 leading-none">Score</div>
                    <div 
                      className="text-base font-medium text-[var(--nv-green)]/90 leading-none mt-0.5"
                      data-testid="citation-score"
                    >
                      {formatScore(citation.score, 2)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <div className="flex-shrink-0 text-gray-400">
                {getFileIconByExtension(citation.source, { size: 'sm' })}
              </div>
              
              <h3 className="font-semibold text-white text-sm truncate">
                {citation.source}
              </h3>
              {citation.document_type && (
                <span className="text-xs px-2 py-0.5 rounded-md bg-neutral-800 text-gray-300 uppercase font-medium">
                  {citation.document_type}
                </span>
              )}
            </div>
            {!isExpanded && (
              <p className="text-xs text-gray-400 line-clamp-1 ml-6">
                {getAbridgedText(citation.text, 150)}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <ExpandChevron isExpanded={isExpanded} />
        </div>
      </div>
    </div>
  );
};

const CitationContent = ({ citation }: { citation: Citation }) => {
  const { isVisualType } = useCitationUtils();
  const isVisual = isVisualType(citation.document_type);

  return (
    <div className="border-t border-neutral-700 bg-neutral-900/30">
      <div className="p-5 space-y-4">
        {isVisual ? (
          <CitationVisualContent 
            imageData={citation.text || ""} 
            documentType={citation.document_type} 
          />
        ) : (
          <CitationTextContent text={citation.text || ""} />
        )}
        
        <CitationMetadata 
          source={citation.source} 
        />
      </div>
    </div>
  );
};

export default function CitationItem({ citation, index }: CitationItemProps) {
  const { generateCitationId } = useCitationUtils();
  
  const citationId = useMemo(() => 
    generateCitationId(citation, index), 
    [citation, index, generateCitationId]
  );
  
  const { isExpanded, toggle } = useCitationExpansion(citationId);

  return (
    <div className="group rounded-xl border border-neutral-700 bg-neutral-900/50 hover:bg-neutral-900/80 hover:border-neutral-600 transition-all duration-200 overflow-hidden">
      <CitationHeader 
        citation={citation}
        index={index}
        isExpanded={isExpanded}
        onClick={toggle}
      />
      
      {isExpanded && <CitationContent citation={citation} />}
    </div>
  );
}
