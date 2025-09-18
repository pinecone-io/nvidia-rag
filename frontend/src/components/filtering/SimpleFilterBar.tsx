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

import { useState, useRef, useEffect, useMemo } from "react";
import type { Filter } from "../../types/chat";

interface Props {
  filters: Filter[];
  setFilters: (filters: Filter[]) => void;
}

const ALL_OPS = ["=", "!=", ">", "<", ">=", "<="];

export default function SimpleFilterBar({ filters, setFilters }: Props) {
  const [input, setInput] = useState("");
  const [stage, setStage] = useState<"field" | "op" | "value">("field");
  const [draft, setDraft] = useState<{ field?: string; op?: string; value?: string }>({});
  const [activeIdx, setActiveIdx] = useState(0);
  const [showOperators, setShowOperators] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Always show all operator suggestions when in operator stage
  const operatorSuggestions: string[] = useMemo(() => {
    if (stage === "op" && draft.field) {
      return ALL_OPS;
    }
    return [];
  }, [stage, draft.field]);

  const commitFilter = () => {
    if (draft.field && draft.op && draft.value?.trim()) {
      setFilters([...filters, { field: draft.field, operator: draft.op as any, value: draft.value.trim() }]);
      setDraft({});
      setStage("field");
      setInput("");
    }
  };

  const chooseOperator = (idx: number) => {
    const choice = operatorSuggestions[idx];
    if (!choice) return;
    setDraft((d) => ({ ...d, op: choice }));
    setStage("value");
    setInput("");
    setShowOperators(false);
    // Focus input for value entry
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (stage === "op" && showOperators && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      e.preventDefault();
      setActiveIdx((prev) => {
        const next = e.key === "ArrowDown" ? prev + 1 : prev - 1;
        return (next + operatorSuggestions.length) % operatorSuggestions.length;
      });
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (stage === "field" && input.trim()) {
        // Move to operator stage and show operators immediately
        const fieldName = input.trim();
        setDraft({ field: fieldName });
        setStage("op");
        setInput("");
        // Use setTimeout to ensure state updates properly
        setTimeout(() => {
          setShowOperators(true);
          setActiveIdx(0);
          inputRef.current?.focus();
        }, 0);
      } else if (stage === "op") {
        if (showOperators && operatorSuggestions.length > 0) {
          // Choose the currently highlighted operator
          chooseOperator(activeIdx);
        } else if (!showOperators && draft.field) {
          // Show operators if they're not visible
          setShowOperators(true);
          setActiveIdx(0);
        }
      } else if (stage === "value" && input.trim()) {
        commitFilter();
      }
    } else if (e.key === "Tab") {
      if (stage === "op" && showOperators && operatorSuggestions.length > 0) {
        e.preventDefault();
        chooseOperator(activeIdx);
      }
    } else if (e.key === "Escape") {
      if (showOperators) {
        setShowOperators(false);
      } else if (stage !== "field") {
        // Reset to field stage
        setStage("field");
        setDraft({});
        setInput("");
        setShowOperators(false);
      }
    } else if (e.key === "Backspace" && !input) {
      if (stage === "value") {
        setStage("op");
        setDraft((d) => ({ field: d.field }));
        setTimeout(() => {
          setShowOperators(true);
          setActiveIdx(0);
        }, 0);
      } else if (stage === "op") {
        setStage("field");
        setDraft({});
        setShowOperators(false);
      } else if (stage === "field" && filters.length) {
        // Pop last filter
        const updated = [...filters];
        const last = updated.pop()!;
        setFilters(updated);
        setDraft({ field: last.field, op: last.operator, value: last.value });
        setStage("value");
        setInput(last.value);
      }
    }
  };

  // Show operator suggestions when in op stage
  useEffect(() => {
    const inputFocused = document.activeElement === inputRef.current;
    if (stage === "op" && draft.field) {
      if (inputFocused) {
        setShowOperators(true);
        setActiveIdx(0);
      }
    } else {
      setShowOperators(false);
    }
  }, [stage, draft.field]);

  // Auto-focus input when stage changes
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [stage]);

  // Close suggestions on outside click
  useEffect(() => {
    if (!showOperators) return;
    const handler = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) {
        setShowOperators(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showOperators]);

  return (
    <div ref={wrapperRef} className="relative rounded-xl border border-neutral-700 bg-neutral-800/80 backdrop-blur-sm">
      <div className="flex flex-wrap items-center gap-2 p-2.5 min-h-[44px]">
        {/* Filter icon and label */}
        <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
          </svg>
          Filters:
        </div>

        {filters.map((f, i) => (
          <div key={`${f.field}-${i}`} className="flex items-center gap-1.5 bg-[var(--nv-green)]/20 border border-[var(--nv-green)]/40 text-[var(--nv-green)] px-2.5 py-1 rounded-md text-xs font-medium">
            <span className="font-semibold">{f.field}</span>
            <span className="text-xs opacity-80">{f.operator}</span>
            <span className="font-medium">"{f.value}"</span>
            <button
              onClick={() => {
                const updated = filters.filter((_, idx) => idx !== i);
                setFilters(updated);
              }}
              className="ml-1 hover:text-red-400 transition-colors"
              aria-label="Remove filter"
              title="Remove filter"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}

        {/* Draft chip */}
        {draft.field && (
          <div className="flex items-center gap-1.5 bg-neutral-600/50 border border-neutral-600 text-gray-300 px-2.5 py-1 rounded-md text-xs opacity-70">
            <span className="font-semibold">{draft.field}</span>
            {draft.op && <span className="text-xs opacity-80">{draft.op}</span>}
            {stage === "value" && <span className="text-xs opacity-60">...</span>}
          </div>
        )}

        <div className="relative flex-1 min-w-[120px]">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              if (stage === "value") {
                setDraft((d) => ({ ...d, value: e.target.value }));
              }
            }}
            onBlur={() => {
              if (stage === "value") commitFilter();
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (stage === "op" && draft.field) {
                setShowOperators(true);
                setActiveIdx(0);
              }
            }}
            placeholder={
              stage === "field"
                ? "Type field name and press Enter..."
                : stage === "op"
                ? "Press Enter to see operators or use ↑↓ keys"
                : "Type value and press Enter..."
            }
            className="w-full bg-transparent text-white text-xs focus:outline-none placeholder-gray-500"
          />
        </div>
      </div>

      {showOperators && stage === "op" && (
        <ul className="absolute left-0 bottom-full mb-1 max-h-40 w-full overflow-y-auto rounded-lg border border-neutral-600 bg-neutral-900 shadow-xl z-50 backdrop-blur-sm">
          {operatorSuggestions.map((op, idx) => (
            <li
              key={op}
              className={`px-3 py-1.5 cursor-pointer text-xs transition-colors ${
                idx === activeIdx 
                  ? "bg-[var(--nv-green)]/20 text-[var(--nv-green)]" 
                  : "hover:bg-neutral-700 text-white"
              }`}
              onMouseDown={(e) => {
                e.preventDefault();
                chooseOperator(idx);
              }}
            >
              <span className="font-mono text-xs">{op}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
} 