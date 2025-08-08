import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '../../../test/utils';
import { DrawerActions } from '../DrawerActions';

describe('DrawerActions', () => {
  const defaultProps = {
    onDelete: vi.fn(),
    onAddSource: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Button Interactions', () => {
    it('calls onDelete when delete button clicked', () => {
      render(<DrawerActions {...defaultProps} />);
      
      fireEvent.click(screen.getByText('Delete Collection'));
      
      expect(defaultProps.onDelete).toHaveBeenCalledOnce();
    });

    it('calls onAddSource when add source button clicked', () => {
      render(<DrawerActions {...defaultProps} />);
      
      fireEvent.click(screen.getByText('Add Source to Collection'));
      
      expect(defaultProps.onAddSource).toHaveBeenCalledOnce();
    });

    it('does not call onDelete when button is disabled', () => {
      render(<DrawerActions {...defaultProps} isDeleting={true} />);
      
      const deleteButton = screen.getByRole('button', { name: /deleting/i });
      fireEvent.click(deleteButton);
      
      expect(defaultProps.onDelete).not.toHaveBeenCalled();
    });
  });

  describe('Delete Button States', () => {
    it('shows normal delete text when not deleting', () => {
      render(<DrawerActions {...defaultProps} isDeleting={false} />);
      
      expect(screen.getByText('Delete Collection')).toBeInTheDocument();
      expect(screen.queryByText('Deleting...')).not.toBeInTheDocument();
    });

    it('shows deleting text when isDeleting is true', () => {
      render(<DrawerActions {...defaultProps} isDeleting={true} />);
      
      expect(screen.getByText('Deleting...')).toBeInTheDocument();
      expect(screen.queryByText('Delete Collection')).not.toBeInTheDocument();
    });

    it('disables delete button when isDeleting is true', () => {
      render(<DrawerActions {...defaultProps} isDeleting={true} />);
      
      const deleteButton = screen.getByRole('button', { name: /deleting/i });
      expect(deleteButton).toBeDisabled();
    });

    it('enables delete button when isDeleting is false', () => {
      render(<DrawerActions {...defaultProps} isDeleting={false} />);
      
      const deleteButton = screen.getByRole('button', { name: /delete collection/i });
      expect(deleteButton).not.toBeDisabled();
    });

    it('defaults to not deleting when isDeleting prop not provided', () => {
      render(<DrawerActions {...defaultProps} />);
      
      expect(screen.getByText('Delete Collection')).toBeInTheDocument();
      const deleteButton = screen.getByRole('button', { name: /delete collection/i });
      expect(deleteButton).not.toBeDisabled();
    });
  });

  describe('Add Source Button', () => {
    it('always shows add source text', () => {
      render(<DrawerActions {...defaultProps} isDeleting={true} />);
      
      expect(screen.getByText('Add Source to Collection')).toBeInTheDocument();
    });

    it('add source button is never disabled', () => {
      render(<DrawerActions {...defaultProps} isDeleting={true} />);
      
      const addButton = screen.getByRole('button', { name: /add source to collection/i });
      expect(addButton).not.toBeDisabled();
    });
  });

  describe('Button Presence', () => {
    it('renders both action buttons', () => {
      render(<DrawerActions {...defaultProps} />);
      
      expect(screen.getByRole('button', { name: /delete collection/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add source to collection/i })).toBeInTheDocument();
    });
  });
}); 