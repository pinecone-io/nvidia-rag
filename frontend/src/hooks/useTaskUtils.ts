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

interface TaskResult {
  documents?: any[];
  failed_documents?: any[];
  total_documents?: number;
  validation_errors?: any[];
  message?: string;
}

interface Task {
  state: string;
  result?: TaskResult;
}

export const useTaskUtils = () => {
  const formatTimestamp = useCallback((timestamp: number): string => {
    return new Date(timestamp).toLocaleString();
  }, []);

  const getTaskStatus = useCallback((task: Task): {
    text: string;
    color: string;
    isPartial: boolean;
    isSuccess: boolean;
    isFailed: boolean;
  } => {
    const { state, result } = task;
    const failedCount = result?.failed_documents?.length || 0;
    const successCount = result?.documents?.length || 0;

    switch (state) {
      case "PENDING":
        return {
          text: "Processing",
          color: "text-[var(--nv-green)]",
          isPartial: false,
          isSuccess: false,
          isFailed: false,
        };
      
      case "FINISHED":
        if (failedCount > 0 && successCount > 0) {
          // Partial completion - some succeeded, some failed
          return {
            text: "Partially Completed",
            color: "text-yellow-400",
            isPartial: true,
            isSuccess: false,
            isFailed: false,
          };
        } else if (failedCount > 0 && successCount === 0) {
          // Complete failure - all failed
          return {
            text: "Failed",
            color: "text-red-400",
            isPartial: false,
            isSuccess: false,
            isFailed: true,
          };
        } else {
          // Complete success - all succeeded
          return {
            text: "Completed",
            color: "text-[var(--nv-green)]",
            isPartial: false,
            isSuccess: true,
            isFailed: false,
          };
        }
      
      case "FAILED":
        return {
          text: "Failed",
          color: "text-red-400",
          isPartial: false,
          isSuccess: false,
          isFailed: true,
        };
      
      default:
        return {
          text: "Unknown",
          color: "text-gray-400",
          isPartial: false,
          isSuccess: false,
          isFailed: false,
        };
    }
  }, []);

  // Legacy functions for backward compatibility
  const getStatusText = useCallback((state: string): string => {
    switch (state) {
      case "PENDING": 
        return "Processing";
      case "FINISHED": 
        return "Completed";
      case "FAILED": 
        return "Failed";
      default: 
        return "Unknown";
    }
  }, []);

  const getStatusColor = useCallback((state: string): string => {
    switch (state) {
      case "PENDING": 
        return "text-[var(--nv-green)]";
      case "FINISHED": 
        return "text-[var(--nv-green)]";
      case "FAILED": 
        return "text-red-400";
      default: 
        return "text-gray-400";
    }
  }, []);

  const shouldShowSuccessMessage = useCallback((): boolean => {
    // Never show success message for completed tasks
    // Success is indicated by the status itself
    return false;
  }, []);

  const shouldHideTaskMessage = useCallback((task: Task): boolean => {
    const { state, result } = task;
    const message = result?.message || "";
    
    // Hide the generic success message
    if (message.includes("Document upload job successfully completed")) {
      return true;
    }
    
    // Hide message if task completed successfully with no failures
    if (state === "FINISHED" && (!result?.failed_documents?.length)) {
      return true;
    }
    
    return false;
  }, []);

  return {
    formatTimestamp,
    getTaskStatus,
    getStatusText,
    getStatusColor,
    shouldShowSuccessMessage,
    shouldHideTaskMessage,
  };
}; 