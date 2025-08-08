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
import { useNewCollectionStore } from "../store/useNewCollectionStore";
import type { MetadataFieldType } from "../types/collections";

/**
 * Custom hook for handling metadata input validation and processing.
 * 
 * Provides validation, parsing, and formatting functions for different metadata
 * field types including strings, numbers, booleans, dates, and arrays. Handles
 * value conversion and updates to the collection store.
 * 
 * @returns Object with validation and handling functions for metadata inputs
 * 
 * @example
 * ```tsx
 * const { handleInputChange, validateValue, parseValue } = useMetadataInput();
 * handleInputChange("tags", "tag1, tag2, tag3", "array");
 * ```
 */
export const useMetadataInput = () => {
  const { updateMetadataField } = useNewCollectionStore();

  const validateValue = useCallback((value: string, fieldType: MetadataFieldType): string => {
    if (!value) return value;

    switch (fieldType) {
      case "datetime":
        // Fix datetime format if needed (add seconds if missing)
        if (value.length === 16) {
          return `${value}:00`;
        }
        return value;
      
      case "integer":
        // Validate integer
        const intVal = parseInt(value);
        if (isNaN(intVal)) {
          throw new Error(`Invalid integer value: ${value}`);
        }
        return intVal.toString();
      
      case "float":
      case "number":
        // Validate float/number
        const floatVal = parseFloat(value);
        if (isNaN(floatVal)) {
          throw new Error(`Invalid number value: ${value}`);
        }
        return floatVal.toString();
      
      case "boolean":
        // Normalize boolean values
        const lowerValue = value.toLowerCase();
        if (["true", "1", "yes", "on"].includes(lowerValue)) {
          return "true";
        } else if (["false", "0", "no", "off"].includes(lowerValue)) {
          return "false";
        } else {
          throw new Error(`Invalid boolean value: ${value}. Use true/false, 1/0, yes/no, or on/off`);
        }
      
      case "array":
        // Arrays are handled specially in the component as JSON strings
        try {
          JSON.parse(value);
          return value;
        } catch {
          throw new Error(`Invalid array value: ${value}`);
        }
      
      case "string":
      default:
        return value;
    }
  }, []);

  const handleFieldChange = useCallback((
    fileName: string, 
    fieldName: string, 
    value: string, 
    fieldType: MetadataFieldType
  ) => {
    try {
      const processedValue = validateValue(value, fieldType);
      updateMetadataField(fileName, fieldName, processedValue);
    } catch (error) {
      console.warn(`Metadata validation error for ${fieldName}:`, error);
      // Still update with the raw value to allow user to see and fix
      updateMetadataField(fileName, fieldName, value);
    }
  }, [updateMetadataField, validateValue]);

  const createChangeHandler = useCallback((
    fileName: string, 
    fieldName: string, 
    fieldType: MetadataFieldType
  ) => (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    // Handle checkbox inputs for boolean fields
    if (fieldType === "boolean" && e.target.type === "checkbox") {
      value = e.target.checked.toString();
    }
    
    handleFieldChange(fileName, fieldName, value, fieldType);
  }, [handleFieldChange]);

  const validateFieldValue = useCallback((
    value: string, 
    fieldType: MetadataFieldType, 
    required: boolean = false,
    maxLength?: number
  ): { isValid: boolean; error?: string } => {
    // Check required fields - for boolean fields, "false" is a valid value
    if (required) {
      if (fieldType === "boolean") {
        // For boolean fields, any value that can be parsed as boolean is valid
        const lowerValue = value.toLowerCase().trim();
        const validBooleanValues = ["true", "false", "1", "0", "yes", "no", "on", "off"];
        if (!lowerValue || !validBooleanValues.includes(lowerValue)) {
          return { isValid: false, error: "This field is required" };
        }
      } else {
        // For non-boolean fields, check if value is empty
        if (!value.trim()) {
          return { isValid: false, error: "This field is required" };
        }
      }
    }

    // Skip validation for empty optional fields
    if (!value.trim() && !required) {
      return { isValid: true };
    }

    // Check max length for strings
    if (fieldType === "string" && maxLength && value.length > maxLength) {
      return { isValid: false, error: `Maximum length is ${maxLength} characters` };
    }

    // Check array max length
    if (fieldType === "array" && maxLength) {
      try {
        const arrayValue = JSON.parse(value);
        if (Array.isArray(arrayValue) && arrayValue.length > maxLength) {
          return { isValid: false, error: `Maximum ${maxLength} items allowed` };
        }
      } catch {
        return { isValid: false, error: "Invalid array format" };
      }
    }

    try {
      validateValue(value, fieldType);
      return { isValid: true };
    } catch (error) {
      return { isValid: false, error: (error as Error).message };
    }
  }, [validateValue]);

  return {
    handleFieldChange,
    createChangeHandler,
    validateFieldValue,
    validateValue,
  };
}; 