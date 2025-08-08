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

import { useEffect } from "react";
import { useIngestionTasksStore } from "../../store/useIngestionTasksStore";
import { useDropdownToggle } from "../../hooks/useDropdownToggle";
import { NotificationDropdown } from "./NotificationDropdown";
import { NotificationBadge } from "./NotificationBadge";
import { TaskPoller } from "./TaskPoller";

/**
 * Global reference to notification toggle function for external access.
 */
let globalNotificationToggle: (() => void) | null = null;

/**
 * Global function to open the notification panel from anywhere in the application.
 * 
 * @example
 * ```tsx
 * import { openNotificationPanel } from './NotificationBell';
 * openNotificationPanel(); // Opens the notification dropdown
 * ```
 */
export const openNotificationPanel = () => {
  if (globalNotificationToggle) {
    globalNotificationToggle();
  }
};

/**
 * Notification bell component that displays task notifications and manages dropdown state.
 * 
 * Shows a bell icon with a badge indicating unread notifications. When clicked, opens
 * a dropdown showing pending and completed ingestion tasks. Automatically polls for
 * task updates and manages global notification panel access.
 * 
 * @returns Notification bell component with dropdown functionality
 */
export default function NotificationBell() {
  const { isOpen, ref, toggle, open } = useDropdownToggle();
  const { 
    getPendingTasks, 
    getCompletedTasks, 
    getUnreadCount,
    hydrate 
  } = useIngestionTasksStore();

  // Hydrate from localStorage on mount (only once)
  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Set global reference for external access
  useEffect(() => {
    globalNotificationToggle = open;
    return () => {
      globalNotificationToggle = null;
    };
  }, [open]);

  const pendingTasks = getPendingTasks();
  const completedTasks = getCompletedTasks();
  const unreadCount = getUnreadCount();

  return (
    <div ref={ref} className="relative">
      <button 
        onClick={toggle}
        className="flex items-center gap-2 p-2 text-gray-400 transition-colors hover:text-[var(--nv-green)] hover:bg-neutral-900 rounded-lg relative"
      >
        <NotificationBadge count={unreadCount} />
      </button>

      {isOpen && (
        <NotificationDropdown 
          pendingTasks={pendingTasks}
          completedTasks={completedTasks}
        />
      )}

      {pendingTasks.map((task) => (
        <TaskPoller key={task.id} taskId={task.id} />
      ))}
    </div>
  );
}
