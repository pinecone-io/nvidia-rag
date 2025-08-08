import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '../../../test/utils';
import { DrawerHeader } from '../DrawerHeader';

describe('DrawerHeader', () => {
  const defaultProps = {
    title: 'Test Collection',
    onClose: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Title Display', () => {
    it('displays the title', () => {
      render(<DrawerHeader {...defaultProps} />);
      
      expect(screen.getByText('Test Collection')).toBeInTheDocument();
    });

    it('displays different titles correctly', () => {
      render(<DrawerHeader {...defaultProps} title="Another Collection" />);
      
      expect(screen.getByText('Another Collection')).toBeInTheDocument();
    });
  });

  describe('Subtitle Display', () => {
    it('displays subtitle when provided', () => {
      render(<DrawerHeader {...defaultProps} subtitle="Collection description" />);
      
      expect(screen.getByText('Collection description')).toBeInTheDocument();
    });

    it('does not display subtitle when not provided', () => {
      render(<DrawerHeader {...defaultProps} />);
      
      // Look for any subtitle-like elements, but there shouldn't be any
      const subtitleElements = screen.queryAllByText(/description|subtitle/i);
      expect(subtitleElements).toHaveLength(0);
    });

    it('displays different subtitles correctly', () => {
      render(<DrawerHeader {...defaultProps} subtitle="Different subtitle" />);
      
      expect(screen.getByText('Different subtitle')).toBeInTheDocument();
    });
  });

  describe('Close Functionality', () => {
    it('calls onClose when close button clicked', () => {
      render(<DrawerHeader {...defaultProps} />);
      
      const closeButton = screen.getByRole('button');
      fireEvent.click(closeButton);
      
      expect(defaultProps.onClose).toHaveBeenCalledOnce();
    });

    it('renders close button', () => {
      render(<DrawerHeader {...defaultProps} />);
      
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('Component Structure', () => {
    it('renders title and close button together', () => {
      render(<DrawerHeader {...defaultProps} />);
      
      expect(screen.getByText('Test Collection')).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('renders all elements when subtitle provided', () => {
      render(<DrawerHeader {...defaultProps} subtitle="Test subtitle" />);
      
      expect(screen.getByText('Test Collection')).toBeInTheDocument();
      expect(screen.getByText('Test subtitle')).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });
}); 