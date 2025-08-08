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

import { useCallback } from "react";
import type { IngestionTask } from "../../types/api";
import { TaskStatusIcon } from "./TaskStatusIcons";
import { useTaskUtils } from "../../hooks/useTaskUtils";

interface TaskDisplayProps {
  task: IngestionTask & { completedAt?: number; read?: boolean };
  onMarkRead?: () => void;
  onRemove?: () => void;
}

const RemoveIcon = () => (
  <svg 
    className="w-4 h-4" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    viewBox="0 0 24 24"
    data-testid="remove-icon"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

interface TaskHeaderProps {
  task: IngestionTask & { completedAt?: number; read?: boolean };
}

const TaskHeader = ({ task }: TaskHeaderProps) => {
  const { getTaskStatus } = useTaskUtils();

  const status = getTaskStatus(task);

  return (
    <div className="flex items-start justify-between mb-3 pr-6" data-testid="task-header">
      <div className="flex items-start gap-3">
        <div className="flex items-center mt-0.5">
          <TaskStatusIcon state={task.state} task={task} />
        </div>
        <div>
          <h4 
            className={`font-semibold ${task.read ? 'text-neutral-400' : 'text-white'}`}
            data-testid="task-collection-name"
          >
            {task.collection_name}
          </h4>
          <div 
            className={`text-xs mt-1 ${status.color}`}
            data-testid="task-status-text"
          >
            {status.text}
          </div>
        </div>
      </div>
    </div>
  );
};

const TaskProgress = ({ task }: { task: TaskDisplayProps['task'] }) => {
  const { getTaskStatus, formatTimestamp } = useTaskUtils();
  const { documents = [], total_documents = 0 } = task.result || {};
  const progress = total_documents > 0 ? (documents.length / total_documents) * 100 : 0;
  const status = getTaskStatus(task);

  return (
    <div className="space-y-2" data-testid="task-progress">
      <div className="flex items-center justify-between text-sm">
        <span 
          className={task.read ? 'text-neutral-500' : 'text-gray-300'}
          data-testid="progress-text"
        >
          Uploaded: {documents.length} / {total_documents}
        </span>
        {task.completedAt && (
          <span 
            className="text-xs text-neutral-500"
            data-testid="completion-time"
          >
            {formatTimestamp(task.completedAt)}
          </span>
        )}
      </div>

      <div className="w-full bg-neutral-800 rounded-full h-1.5" data-testid="progress-bar-container">
        <div
          className={`h-1.5 rounded-full transition-all duration-300 ${
            status.isSuccess ? 'bg-[var(--nv-green)]' : 
            status.isPartial ? 'bg-yellow-400' :
            status.isFailed ? 'bg-red-500' :
            'bg-[var(--nv-green)]' // pending
          }`}
          style={{ width: `${progress}%` }}
          data-testid="progress-bar"
        />
      </div>
    </div>
  );
};

const TaskErrors = ({ task }: { task: TaskDisplayProps['task'] }) => {
  const { shouldHideTaskMessage } = useTaskUtils();
  const { message = "", failed_documents = [], validation_errors = [] } = task.result || {};
  const shouldHideMessage = shouldHideTaskMessage(task);

  return (
    <>
      {message && !shouldHideMessage && (
        <div className="bg-black/80 border border-red-500/30 rounded p-3">
          <div className="text-[10px] text-red-100 font-mono leading-relaxed whitespace-pre-wrap break-words">
            {message}
          </div>
        </div>
      )}

      {failed_documents.length > 0 && (
        <div className="bg-red-500/20 border border-red-400/40 rounded p-3">
          <div className="text-xs text-red-300 font-medium mb-2">
            Failed: {failed_documents.length} document{failed_documents.length > 1 ? 's' : ''}
          </div>
          <div className="space-y-3 max-h-32 overflow-y-auto">
            {failed_documents.map((doc, i) => (
              <div key={i} className="border-l-2 border-red-400/50 pl-3">
                <div className="font-medium text-red-200 mb-2">{doc.document_name}</div>
                <div className="text-xs text-red-100 bg-black/80 rounded p-2 font-mono leading-relaxed whitespace-pre-wrap break-words border border-red-500/30">
                  {doc.error_message}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {validation_errors.length > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded p-2">
          <div className="text-xs text-yellow-400">
            Validation Errors: {validation_errors.length}
          </div>
        </div>
      )}
    </>
  );
};

export const TaskDisplay = ({ task, onMarkRead, onRemove }: TaskDisplayProps) => {
  const handleMarkAsRead = useCallback(() => {
    // Only mark as read if it's unread and onMarkRead is available
    if (onMarkRead && !task.read) {
      onMarkRead();
    }
  }, [onMarkRead, task.read]);

  const clickableProps = onMarkRead && !task.read
    ? {
        tabIndex: 0,
        onClick: handleMarkAsRead,
        onFocus: handleMarkAsRead,
        onKeyDown: (e: React.KeyboardEvent) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleMarkAsRead();
          }
        },
      }
    : {};

  return (
    <li
      className={`group relative rounded-lg border transition-all duration-200 ${
        task.read 
          ? 'border-neutral-700 bg-neutral-900/50' 
          : 'border-[var(--nv-green)] bg-neutral-900 shadow-lg shadow-[var(--nv-green)]/20 ring-1 ring-[var(--nv-green)]/30'
      } ${onMarkRead && !task.read ? 'cursor-pointer hover:shadow-[var(--nv-green)]/30' : ''}`}
      data-testid="task-display"
      {...clickableProps}
    >
      <div className="p-4 relative">
        {/* Remove button - only shows if onRemove is provided */}
        {onRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            title="Remove notification"
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 text-neutral-400 hover:text-red-400 rounded z-10"
            data-testid="remove-button"
          >
            <RemoveIcon />
          </button>
        )}

        <TaskHeader task={task} />
        
        <div className="space-y-2" data-testid="task-content">
          <TaskProgress task={task} />
          <TaskErrors task={task} />
        </div>
      </div>
    </li>
  );
}; 