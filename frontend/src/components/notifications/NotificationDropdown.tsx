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
import type { IngestionTask } from "../../types/api";
import { TaskDisplay } from "../tasks/TaskDisplay";
import { useIngestionTasksStore } from "../../store/useIngestionTasksStore";

type NotificationTask = IngestionTask & { completedAt?: number; read?: boolean };

interface NotificationDropdownProps {
  pendingTasks: NotificationTask[];
  completedTasks: NotificationTask[];
}

export const NotificationDropdown = ({ pendingTasks, completedTasks }: NotificationDropdownProps) => {
  const { markAsRead, removeTask } = useIngestionTasksStore();

  // Sort all tasks by newest first, prioritizing unread tasks
  const sortedTasks = useMemo(() => {
    const allTasksWithMeta = [
      ...pendingTasks.map(task => ({ 
        task, 
        key: `pending-${task.id}`, 
        isCompleted: false,
        sortTime: new Date(task.created_at).getTime(),
        isRead: task.read || false
      })),
      ...completedTasks.map(task => ({ 
        task, 
        key: `completed-${task.id}`, 
        isCompleted: true,
        sortTime: task.completedAt || new Date(task.created_at).getTime(),
        isRead: task.read || false
      }))
    ];

    return allTasksWithMeta.sort((a, b) => {
      // Unread tasks first
      if (a.isRead !== b.isRead) {
        return a.isRead ? 1 : -1;
      }
      // Then by time (newest first)
      return b.sortTime - a.sortTime;
    });
  }, [pendingTasks, completedTasks]);

  const handleMarkAsRead = useCallback((taskId: string) => {
    markAsRead(taskId);
  }, [markAsRead]);

  const handleRemove = useCallback((taskId: string) => {
    removeTask(taskId);
  }, [removeTask]);

  if (sortedTasks.length === 0) {
    return (
      <div className="absolute right-0 mt-2 w-[600px] max-h-96 overflow-y-auto bg-black text-white p-3 rounded text-sm z-50 border border-neutral-700 shadow-xl">
        <div className="text-neutral-400">No tasks</div>
      </div>
    );
  }

  return (
    <ul className="absolute right-0 mt-2 w-[600px] max-h-96 overflow-y-auto bg-black text-white p-3 rounded text-sm z-50 space-y-2 border border-neutral-700 shadow-xl">
      {sortedTasks.map(({ task, key }) => (
        <TaskDisplay 
          key={key}
          task={task}
          onMarkRead={() => handleMarkAsRead(task.id)}
          onRemove={() => handleRemove(task.id)}
        />
      ))}
    </ul>
  );
}; 