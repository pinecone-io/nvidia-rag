import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '../../../test/utils';
import { SchemaHeader } from '../SchemaHeader';

describe('SchemaHeader', () => {
  const defaultProps = {
    isOpen: false,
    onToggle: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the schema header button', () => {
      render(<SchemaHeader {...defaultProps} />);
      
      expect(screen.getByTestId('schema-header-button')).toBeInTheDocument();
    });

    it('renders the title', () => {
      render(<SchemaHeader {...defaultProps} />);
      
      expect(screen.getByTestId('schema-header-title')).toHaveTextContent('Metadata Schema');
    });

    it('renders the schema icon', () => {
      render(<SchemaHeader {...defaultProps} />);
      
      expect(screen.getByTestId('schema-icon')).toBeInTheDocument();
    });

    it('renders the toggle button', () => {
      render(<SchemaHeader {...defaultProps} />);
      
      expect(screen.getByTestId('toggle-button')).toBeInTheDocument();
    });
  });

  describe('Interaction', () => {
    it('calls onToggle when header button is clicked', () => {
      const onToggle = vi.fn();
      render(<SchemaHeader {...defaultProps} onToggle={onToggle} />);
      
      fireEvent.click(screen.getByTestId('schema-header-button'));
      expect(onToggle).toHaveBeenCalledOnce();
    });

    it('has button type attribute', () => {
      render(<SchemaHeader {...defaultProps} />);
      
      const button = screen.getByTestId('schema-header-button');
      expect(button).toHaveAttribute('type', 'button');
    });
  });

  describe('Toggle Button States', () => {
    it('shows plus icon when closed', () => {
      render(<SchemaHeader {...defaultProps} isOpen={false} />);
      
      expect(screen.getByTestId('toggle-icon')).toHaveTextContent('+');
    });

    it('shows minus icon when open', () => {
      render(<SchemaHeader {...defaultProps} isOpen={true} />);
      
      expect(screen.getByTestId('toggle-icon')).toHaveTextContent('−');
    });

    it('applies correct styling when closed', () => {
      render(<SchemaHeader {...defaultProps} isOpen={false} />);
      
      const toggleButton = screen.getByTestId('toggle-button');
      expect(toggleButton).toHaveClass('text-neutral-400');
      expect(toggleButton).not.toHaveClass('border-[var(--nv-green)]');
    });

    it('applies correct styling when open', () => {
      render(<SchemaHeader {...defaultProps} isOpen={true} />);
      
      const toggleButton = screen.getByTestId('toggle-button');
      expect(toggleButton).toHaveClass('border-[var(--nv-green)]', 'text-[var(--nv-green)]');
    });
  });

  describe('Styling', () => {
    it('has correct button styling classes', () => {
      render(<SchemaHeader {...defaultProps} />);
      
      const button = screen.getByTestId('schema-header-button');
      expect(button).toHaveClass(
        'w-full',
        'flex',
        'justify-between',
        'items-center',
        'px-6',
        'py-4',
        'text-base',
        'font-semibold'
      );
    });

    it('has correct content styling', () => {
      render(<SchemaHeader {...defaultProps} />);
      
      const content = screen.getByTestId('schema-header-content');
      expect(content).toHaveClass('flex', 'items-center', 'gap-3');
    });

    it('has correct toggle button base styling', () => {
      render(<SchemaHeader {...defaultProps} />);
      
      const toggleButton = screen.getByTestId('toggle-button');
      expect(toggleButton).toHaveClass(
        'w-6',
        'h-6',
        'rounded-full',
        'border-2',
        'border-neutral-600',
        'flex',
        'items-center',
        'justify-center',
        'text-sm',
        'transition-all'
      );
    });
  });

  describe('Schema Icon', () => {
    it('has correct icon styling', () => {
      render(<SchemaHeader {...defaultProps} />);
      
      const icon = screen.getByTestId('schema-icon');
      expect(icon).toHaveClass('w-5', 'h-5', 'text-[var(--nv-green)]');
    });

    it('has correct SVG attributes', () => {
      render(<SchemaHeader {...defaultProps} />);
      
      const icon = screen.getByTestId('schema-icon');
      expect(icon).toHaveAttribute('fill', 'none');
      expect(icon).toHaveAttribute('stroke', 'currentColor');
      expect(icon).toHaveAttribute('viewBox', '0 0 24 24');
    });

    it('contains the correct path element', () => {
      render(<SchemaHeader {...defaultProps} />);
      
      const icon = screen.getByTestId('schema-icon');
      const path = icon.querySelector('path');
      expect(path).toBeInTheDocument();
      expect(path).toHaveAttribute('stroke-linecap', 'round');
      expect(path).toHaveAttribute('stroke-linejoin', 'round');
      expect(path).toHaveAttribute('stroke-width', '2');
    });
  });

  describe('Accessibility', () => {
    it('renders as a button element', () => {
      render(<SchemaHeader {...defaultProps} />);
      
      const button = screen.getByTestId('schema-header-button');
      expect(button.tagName).toBe('BUTTON');
    });

    it('title is rendered as span element', () => {
      render(<SchemaHeader {...defaultProps} />);
      
      const title = screen.getByTestId('schema-header-title');
      expect(title.tagName).toBe('SPAN');
    });
  });

  describe('Component Structure', () => {
    it('has the correct hierarchical structure', () => {
      render(<SchemaHeader {...defaultProps} />);
      
      const button = screen.getByTestId('schema-header-button');
      const content = screen.getByTestId('schema-header-content');
      const toggleButton = screen.getByTestId('toggle-button');
      
      expect(button).toContainElement(content);
      expect(button).toContainElement(toggleButton);
      expect(content).toContainElement(screen.getByTestId('schema-icon'));
      expect(content).toContainElement(screen.getByTestId('schema-header-title'));
    });
  });
}); 