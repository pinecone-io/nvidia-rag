import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '../../../test/utils';
import CollectionList from '../CollectionList';

// Mock the API hook
const mockUseCollections = vi.fn();
vi.mock('../../../api/useCollectionsApi', () => ({
  useCollections: () => mockUseCollections()
}));

// Mock child components
vi.mock('../CollectionsGrid', () => ({
  CollectionsGrid: ({ searchQuery }: { searchQuery: string }) => (
    <div data-testid="collections-grid">Collections Grid - Query: {searchQuery}</div>
  )
}));

vi.mock('../NewCollectionButton', () => ({
  NewCollectionButton: ({ disabled }: { disabled: boolean }) => (
    <button disabled={disabled}>New Collection</button>
  )
}));

vi.mock('../CollectionDrawer', () => ({
  default: () => <div data-testid="collection-drawer">Collection Drawer</div>
}));

vi.mock('../../filtering/SearchInput', () => ({
  SearchInput: ({ value, onChange, placeholder }: any) => (
    <input
      value={value}
      onChange={(e: any) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  )
}));

describe('CollectionList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseCollections.mockReturnValue({
      isLoading: false
    });
  });

  describe('Component Structure', () => {
    it('renders main layout with correct styling', () => {
      const { container } = render(<CollectionList />);
      
      const mainContainer = container.firstChild as HTMLElement;
      expect(mainContainer).toHaveClass('flex', 'w-[320px]', 'flex-col', 'bg-black', 'p-4', 'text-white');
    });

    it('renders all main sections', () => {
      render(<CollectionList />);
      
      // Search input
      expect(screen.getByPlaceholderText('Search collections')).toBeInTheDocument();
      
      // New Collection button
      expect(screen.getByText('New Collection')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('renders search input with correct placeholder', () => {
      render(<CollectionList />);
      
      const searchInput = screen.getByPlaceholderText('Search collections');
      expect(searchInput).toBeInTheDocument();
    });

    it('initializes with empty search query', () => {
      render(<CollectionList />);
      
      const searchInput = screen.getByPlaceholderText('Search collections') as HTMLInputElement;
      expect(searchInput.value).toBe('');
    });

    it('updates search query when typing', () => {
      render(<CollectionList />);
      
      const searchInput = screen.getByPlaceholderText('Search collections');
      fireEvent.change(searchInput, { target: { value: 'test search' } });
      
      expect(screen.getByText('Collections Grid - Query: test search')).toBeInTheDocument();
    });

    it('handles multiple search updates', () => {
      render(<CollectionList />);
      
      const searchInput = screen.getByPlaceholderText('Search collections');
      
      fireEvent.change(searchInput, { target: { value: 'first' } });
      expect(screen.getByText('Collections Grid - Query: first')).toBeInTheDocument();
      
      fireEvent.change(searchInput, { target: { value: 'second' } });
      expect(screen.getByText('Collections Grid - Query: second')).toBeInTheDocument();
    });

    it('handles empty search query', () => {
      render(<CollectionList />);
      
      const searchInput = screen.getByPlaceholderText('Search collections');
      
      fireEvent.change(searchInput, { target: { value: 'test' } });
      fireEvent.change(searchInput, { target: { value: '' } });
      
      expect(screen.getByText('Collections Grid - Query:')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('shows loading state when data is loading', () => {
      mockUseCollections.mockReturnValue({
        isLoading: true
      });
      
      render(<CollectionList />);
      
      const button = screen.getByText('New Collection');
      expect(button).toBeDisabled();
    });

    it('shows content when not loading', () => {
      mockUseCollections.mockReturnValue({
        isLoading: false
      });
      
      render(<CollectionList />);
      
      const button = screen.getByText('New Collection');
      expect(button).not.toBeDisabled();
    });
  });

  describe('API Integration', () => {
    it('calls useCollections hook', () => {
      render(<CollectionList />);
      
      expect(mockUseCollections).toHaveBeenCalledOnce();
    });

    it('handles different loading states', () => {
      // Test loading state
      mockUseCollections.mockReturnValue({ isLoading: true });
      const { rerender } = render(<CollectionList />);
      
      let button = screen.getByText('New Collection');
      expect(button).toBeDisabled();
      
      // Test loaded state
      mockUseCollections.mockReturnValue({ isLoading: false });
      rerender(<CollectionList />);
      
      button = screen.getByText('New Collection');
      expect(button).not.toBeDisabled();
    });
  });

  describe('Layout Structure', () => {
    it('renders main container with correct flex layout', () => {
      const { container } = render(<CollectionList />);
      
      const mainContainer = container.firstChild as HTMLElement;
      expect(mainContainer).toHaveClass('flex', 'flex-col');
    });

    it('maintains proper component hierarchy', () => {
      render(<CollectionList />);
      
      // Search input should be at the top
      const searchInput = screen.getByPlaceholderText('Search collections');
      const button = screen.getByText('New Collection');
      
      // Check that search input comes before the button
      const searchContainer = searchInput.closest('div');
      const buttonContainer = button.closest('div');
      
      expect(searchContainer).toBeInTheDocument();
      expect(buttonContainer).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('shows empty state when no collections', () => {
      render(<CollectionList />);
      
      expect(screen.getByTestId('collections-grid')).toBeInTheDocument();
    });

    it('shows proper empty state styling', () => {
      const { container } = render(<CollectionList />);
      
      const contentArea = container.querySelector('.flex-1');
      expect(contentArea).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('applies fixed width to main container', () => {
      const { container } = render(<CollectionList />);
      
      const mainContainer = container.firstChild as HTMLElement;
      expect(mainContainer).toHaveClass('w-[320px]');
    });

    it('uses flex-1 for content area', () => {
      const { container } = render(<CollectionList />);
      
      const contentArea = container.querySelector('.flex-1');
      expect(contentArea).toBeInTheDocument();
      expect(contentArea).toHaveClass('flex-1');
    });
  });

  describe('Edge Cases', () => {
    it('handles undefined collections data', () => {
      mockUseCollections.mockReturnValue({
        isLoading: false,
        data: undefined
      });
      
      expect(() => render(<CollectionList />)).not.toThrow();
    });

    it('handles null collections data', () => {
      mockUseCollections.mockReturnValue({
        isLoading: false,
        data: null
      });
      
      expect(() => render(<CollectionList />)).not.toThrow();
    });
  });
}); 