import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../../test/utils';
import { DocumentItem } from '../DocumentItem';

// Mock the file icon hook
vi.mock('../../../hooks/useFileIcons', () => ({
  useFileIcons: () => ({
    getFileIconByExtension: vi.fn().mockReturnValue(<div data-testid="file-icon" />)
  })
}));

describe('DocumentItem', () => {
  describe('Basic Rendering', () => {
    it('displays document name', () => {
      render(<DocumentItem name="test.pdf" metadata={{}} />);
      expect(screen.getByText('test.pdf')).toBeInTheDocument();
    });

    it('renders file icon', () => {
      render(<DocumentItem name="test.pdf" metadata={{}} />);
      expect(screen.getByTestId('file-icon')).toBeInTheDocument();
    });
  });

  describe('Metadata Display', () => {
    it('shows metadata when present', () => {
      const metadata = { author: 'John Doe', pages: '10' };
      render(<DocumentItem name="test.pdf" metadata={metadata} />);
      
      expect(screen.getByText('author:')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('pages:')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();
    });

    it('hides metadata section when no metadata', () => {
      render(<DocumentItem name="test.pdf" metadata={{}} />);
      expect(screen.queryByTestId('document-metadata')).not.toBeInTheDocument();
    });

    it('filters out filename from metadata display', () => {
      const metadata = { filename: 'test.pdf', author: 'John Doe' };
      render(<DocumentItem name="test.pdf" metadata={metadata} />);
      
      expect(screen.queryByText('filename:')).not.toBeInTheDocument();
      expect(screen.getByText('author:')).toBeInTheDocument();
    });

    it('hides metadata section when only filename present', () => {
      const metadata = { filename: 'test.pdf' };
      render(<DocumentItem name="test.pdf" metadata={metadata} />);
      
      expect(screen.queryByTestId('document-metadata')).not.toBeInTheDocument();
    });
  });
}); 