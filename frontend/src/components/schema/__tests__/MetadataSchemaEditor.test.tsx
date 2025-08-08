import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../../test/utils';
import MetadataSchemaEditor from '../MetadataSchemaEditor';

// Mock the schema editor hook using working pattern
vi.mock('../../hooks/useSchemaEditor', () => ({
  useSchemaEditor: () => ({
    showSchemaEditor: false,
    toggleEditor: vi.fn()
  })
}));

describe('MetadataSchemaEditor', () => {
  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      expect(() => render(<MetadataSchemaEditor />)).not.toThrow();
    });

    it('renders header with correct text', () => {
      render(<MetadataSchemaEditor />);
      
      expect(screen.getByText('Metadata Schema')).toBeInTheDocument();
    });

    it('renders with correct container styling', () => {
      const { container } = render(<MetadataSchemaEditor />);
      
      const mainContainer = container.firstChild as HTMLElement;
      expect(mainContainer).toHaveClass('rounded-lg');
    });

    it('does not render schema content when closed by default', () => {
      render(<MetadataSchemaEditor />);
      
      // Content should not be visible when showSchemaEditor is false (default)
      expect(screen.queryByText('Schema Configuration')).not.toBeInTheDocument();
      expect(screen.queryByText('Define metadata fields for this collection.')).not.toBeInTheDocument();
    });
  });
}); 