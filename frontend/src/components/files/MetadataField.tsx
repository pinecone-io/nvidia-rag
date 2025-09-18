import { useState, useCallback } from "react";
import type { UIMetadataField } from "../../types/collections";

interface MetadataFieldProps {
  fileName: string;
  field: UIMetadataField;
  value: string;
  onChange: (fieldName: string, value: string, fieldType: string) => void;
}

export const MetadataField = ({ 
  field, 
  value, 
  onChange 
}: MetadataFieldProps) => {
  const [arrayInputValue, setArrayInputValue] = useState("");
  
  // Parse array value (stored as JSON string)
  const arrayValue = field.type === "array" ? 
    (value ? JSON.parse(value || "[]") : []) : null;

  const handleArrayAdd = useCallback(() => {
    if (!arrayInputValue.trim() || !arrayValue) return;
    
    let processedValue: string | number | boolean = arrayInputValue.trim();
    
    // Convert based on array_type
    if (field.array_type === "integer") {
      const num = parseInt(processedValue);
      if (isNaN(num)) return;
      processedValue = num;
    } else if (field.array_type === "float" || field.array_type === "number") {
      const num = parseFloat(processedValue);
      if (isNaN(num)) return;
      processedValue = num;
    } else if (field.array_type === "boolean") {
      processedValue = processedValue.toLowerCase() === "true" || processedValue === "1";
    }
    
    const newArray = [...arrayValue, processedValue];
    onChange(field.name, JSON.stringify(newArray), field.type);
    setArrayInputValue("");
  }, [arrayInputValue, arrayValue, field, onChange]);

  const handleArrayRemove = useCallback((index: number) => {
    if (!arrayValue) return;
    const newArray = arrayValue.filter((_: any, i: number) => i !== index);
    onChange(field.name, JSON.stringify(newArray), field.type);
  }, [arrayValue, field, onChange]);

  const getInputType = () => {
    switch (field.type) {
      case "integer":
      case "number":
      case "float":
        return "number";
      case "datetime":
        return "datetime-local";
      case "boolean":
        return "checkbox";
      default:
        return "text";
    }
  };

  const getStepValue = () => {
    if (field.type === "float" || field.type === "number") {
      return "0.01";
    }
    if (field.type === "integer") {
      return "1";
    }
    return undefined;
  };

  const displayLabel = `${field.name}${field.required ? " *" : ""} (${field.type}${field.array_type ? `<${field.array_type}>` : ""})`;

  // Boolean field
  if (field.type === "boolean") {
    return (
      <div>
        <label className="flex items-start gap-3 text-xs">
          <input
            type="checkbox"
            checked={value === "true"}
            onChange={(e) => onChange(field.name, e.target.checked.toString(), field.type)}
            className="mt-0.5 rounded border-neutral-600 bg-neutral-700 text-[var(--nv-green)] focus:ring-2 focus:ring-[var(--nv-green)]/50"
          />
          <div>
            <span className="font-medium text-neutral-300">{displayLabel}</span>
            {field.description && (
              <div className="text-neutral-500 mt-1 leading-relaxed">
                {field.description}
              </div>
            )}
          </div>
        </label>
      </div>
    );
  }

  // Array field
  if (field.type === "array") {
    // Special handling for boolean arrays
    if (field.array_type === "boolean") {
      return (
        <div>
          <label className="block text-xs font-medium text-neutral-300 mb-2">
            {displayLabel}
            {field.description && (
              <div className="text-neutral-500 font-normal mt-1 leading-relaxed">
                {field.description}
              </div>
            )}
          </label>
          
          <div className="space-y-2">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  const newArray = [...(arrayValue || []), true];
                  onChange(field.name, JSON.stringify(newArray), field.type);
                }}
                className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-xs font-medium flex items-center gap-1"
              >
                <span>+ Add True</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const newArray = [...(arrayValue || []), false];
                  onChange(field.name, JSON.stringify(newArray), field.type);
                }}
                className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-xs font-medium flex items-center gap-1"
              >
                <span>+ Add False</span>
              </button>
            </div>
            
            {arrayValue && arrayValue.length > 0 && (
              <div className="space-y-1">
                {arrayValue.map((item: boolean, index: number) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-neutral-800 rounded-md">
                    <button
                      type="button"
                      onClick={() => {
                        const newArray = [...arrayValue];
                        newArray[index] = !newArray[index];
                        onChange(field.name, JSON.stringify(newArray), field.type);
                      }}
                      className={`flex-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                        item 
                          ? 'bg-green-600 text-white hover:bg-green-700' 
                          : 'bg-red-600 text-white hover:bg-red-700'
                      }`}
                    >
                      {item ? 'True' : 'False'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleArrayRemove(index)}
                      className="text-red-400 hover:text-red-300 text-xs px-2 py-1"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    }

    // Standard array implementation for non-boolean types
    return (
      <div>
        <label className="block text-xs font-medium text-neutral-300 mb-2">
          {displayLabel}
          {field.description && (
            <div className="text-neutral-500 font-normal mt-1 leading-relaxed">
              {field.description}
            </div>
          )}
        </label>
        
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={arrayInputValue}
              onChange={(e) => setArrayInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleArrayAdd()}
              placeholder={`Enter ${field.array_type || "text"} value`}
              className="flex-1 rounded-md px-3 py-2 bg-neutral-700 border border-neutral-600 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[var(--nv-green)]/50 focus:border-[var(--nv-green)] transition-colors"
            />
            <button
              type="button"
              onClick={handleArrayAdd}
              className="px-3 py-1 bg-[var(--nv-green)] text-black rounded-md hover:bg-[var(--nv-green)]/80 text-xs font-medium"
            >
              Add
            </button>
          </div>
          
          {arrayValue && arrayValue.length > 0 && (
            <div className="space-y-1">
              {arrayValue.map((item: any, index: number) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-neutral-800 rounded-md">
                  <span className="flex-1 text-xs text-white">{String(item)}</span>
                  <button
                    type="button"
                    onClick={() => handleArrayRemove(index)}
                    className="text-red-400 hover:text-red-300 text-xs"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Regular input fields
  return (
    <div>
      <label className="block text-xs font-medium text-neutral-300 mb-2">
        {displayLabel}
        {field.description && (
          <div className="text-neutral-500 font-normal mt-1 leading-relaxed">
            {field.description}
          </div>
        )}
      </label>
      <input
        type={getInputType()}
        value={value}
        onChange={(e) => {
          let processedValue = e.target.value;
          
          // Process datetime to ensure proper format
          if (field.type === "datetime" && processedValue && processedValue.length === 16) {
            processedValue = `${processedValue}:00`;
          }
          
          onChange(field.name, processedValue, field.type);
        }}
        step={getStepValue()}
        maxLength={field.max_length}
        className="w-full rounded-md px-3 py-2 bg-neutral-700 border border-neutral-600 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[var(--nv-green)]/50 focus:border-[var(--nv-green)] transition-colors"
        placeholder={
          field.type === "datetime" ? "YYYY-MM-DDTHH:MM" :
          field.type === "integer" ? "Enter whole number" :
          field.type === "float" || field.type === "number" ? "Enter decimal number" :
          field.max_length ? `Max ${field.max_length} characters` :
          `Enter ${field.type} value`
        }
      />
      
      {field.max_length && field.type === "string" && (
        <div className="text-xs text-neutral-500 mt-1">
          {value.length}/{field.max_length} characters
        </div>
      )}
    </div>
  );
}; 