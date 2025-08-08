import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '../../../test/utils';
import { FieldDisplayCard } from '../FieldDisplayCard';
import type { UIMetadataField } from '../../../types/collections';

describe('FieldDisplayCard', () => {
  const mockField: UIMetadataField = {
    name: 'test_field',
    type: 'string',
    optional: false
  };

  it('displays field name and type', () => {
    render(<FieldDisplayCard field={mockField} onEdit={vi.fn()} onDelete={vi.fn()} />);
    
    expect(screen.getByText('test_field')).toBeInTheDocument();
    expect(screen.getByText('string')).toBeInTheDocument();
  });

  it('calls onEdit when edit button clicked', () => {
    const onEdit = vi.fn();
    render(<FieldDisplayCard field={mockField} onEdit={onEdit} onDelete={vi.fn()} />);
    
    fireEvent.click(screen.getByTestId('edit-button'));
    expect(onEdit).toHaveBeenCalledOnce();
  });

  it('calls onDelete when delete button clicked', () => {
    const onDelete = vi.fn();
    render(<FieldDisplayCard field={mockField} onEdit={vi.fn()} onDelete={onDelete} />);
    
    fireEvent.click(screen.getByTestId('delete-button'));
    expect(onDelete).toHaveBeenCalledOnce();
  });
}); 