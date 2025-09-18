import { useCallback } from "react";
import type { UIMetadataField } from "../../types/collections";

interface FieldDisplayCardProps {
  field: UIMetadataField;
  onEdit: () => void;
  onDelete: () => void;
}

const EditIcon = () => (
  <svg 
    className="w-4 h-4" 
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
    data-testid="edit-icon"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const DeleteIcon = () => (
  <svg 
    className="w-4 h-4" 
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
    data-testid="delete-icon"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

export const FieldDisplayCard = ({ field, onEdit, onDelete }: FieldDisplayCardProps) => {
  const handleEdit = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    onEdit();
  }, [onEdit]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    onDelete();
  }, [onDelete]);

  return (
    <div 
      className="rounded-lg border border-neutral-700 bg-neutral-900 p-4 hover:bg-neutral-800 transition-colors"
      data-testid="field-display-card"
    >
      <div className="flex justify-between items-start">
        <div 
          className="flex-1"
          data-testid="field-content"
        >
          <div className="flex items-center gap-3 mb-2">
            <span 
              className="text-base font-medium text-white capitalize"
              data-testid="field-name"
            >
              {field.name}
            </span>
            <span 
              className="text-xs bg-neutral-800 text-gray-300 px-2 py-1 rounded"
              data-testid="field-type"
            >
              {field.type}
            </span>
          </div>
        </div>
        <div 
          className="flex items-center gap-2"
          data-testid="field-actions"
        >
          <button 
            onClick={handleEdit} 
            title="Edit"
            className="p-2 text-gray-400 hover:text-[var(--nv-green)] hover:bg-neutral-800 rounded transition-colors"
            data-testid="edit-button"
          >
            <EditIcon />
          </button>
          <button 
            onClick={handleDelete} 
            title="Delete"
            className="p-2 text-gray-400 hover:text-red-400 hover:bg-neutral-800 rounded transition-colors"
            data-testid="delete-button"
          >
            <DeleteIcon />
          </button>
        </div>
      </div>
    </div>
  );
}; 