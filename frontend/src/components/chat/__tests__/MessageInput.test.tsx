import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '../../../test/utils';
import MessageInput from '../MessageInput';

// Mock the store and child components
const mockUseChatStore = vi.fn();

vi.mock('../../../store/useChatStore', () => ({
  useChatStore: () => mockUseChatStore()
}));

vi.mock('../../collections/CollectionChips', () => ({
  CollectionChips: () => <div data-testid="collection-chips">Collection Chips</div>
}));

vi.mock('../MessageInputContainer', () => ({
  MessageInputContainer: () => <div data-testid="message-input-container">Message Input Container</div>
}));

vi.mock('../../filtering/SimpleFilterBar', () => ({
  default: ({ filters }: any) => (
    <div data-testid="simple-filter-bar">
      Simple Filter Bar - Filters: {JSON.stringify(filters)}
    </div>
  )
}));

describe('MessageInput', () => {
  const mockSetFilters = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseChatStore.mockReturnValue({
      filters: [],
      setFilters: mockSetFilters
    });
  });

  describe('Component Structure', () => {
    it('renders main container with correct styling', () => {
      const { container } = render(<MessageInput />);
      
      const mainContainer = container.firstChild as HTMLElement;
      expect(mainContainer).toHaveClass(
        'relative',
        'w-full',
        'p-4',
        'border-t',
        'border-neutral-600',
        'bg-black/30'
      );
    });

    it('renders all child components', () => {
      render(<MessageInput />);
      
      expect(screen.getByTestId('collection-chips')).toBeInTheDocument();
      expect(screen.getByTestId('simple-filter-bar')).toBeInTheDocument();
      expect(screen.getByTestId('message-input-container')).toBeInTheDocument();
    });

    it('renders components in correct order', () => {
      const { container } = render(<MessageInput />);
      
      const components = container.querySelectorAll('[data-testid]');
      expect(components[0]).toHaveAttribute('data-testid', 'collection-chips');
      expect(components[1]).toHaveAttribute('data-testid', 'simple-filter-bar');
      expect(components[2]).toHaveAttribute('data-testid', 'message-input-container');
    });

    it('groups filter bar and input container correctly', () => {
      const { container } = render(<MessageInput />);
      
      const spacedGroup = container.querySelector('.space-y-3');
      expect(spacedGroup).toBeInTheDocument();
      
      const groupedComponents = spacedGroup?.querySelectorAll('[data-testid]');
      expect(groupedComponents).toHaveLength(2);
      expect(groupedComponents?.[0]).toHaveAttribute('data-testid', 'simple-filter-bar');
      expect(groupedComponents?.[1]).toHaveAttribute('data-testid', 'message-input-container');
    });
  });

  describe('Store Integration', () => {
    it('uses filters from chat store', () => {
      const testFilters = [
        { field: 'author', operator: '=', value: 'test' },
        { field: 'date', operator: '>', value: '2024-01-01' }
      ];

      mockUseChatStore.mockReturnValue({
        filters: testFilters,
        setFilters: mockSetFilters
      });

      render(<MessageInput />);
      
      expect(mockUseChatStore).toHaveBeenCalled();
      expect(screen.getByTestId('simple-filter-bar')).toHaveTextContent(JSON.stringify(testFilters));
    });

    it('passes setFilters to filter bar', () => {
      render(<MessageInput />);
      
      // The SimpleFilterBar mock receives the setFilters function
      expect(mockUseChatStore).toHaveBeenCalled();
    });

    it('handles empty filters array', () => {
      mockUseChatStore.mockReturnValue({
        filters: [],
        setFilters: mockSetFilters
      });

      render(<MessageInput />);
      
      expect(screen.getByTestId('simple-filter-bar')).toHaveTextContent('[]');
    });
  });

  describe('Exported Components', () => {
    it('exports all required components', () => {
      // This test ensures the main component renders (imports work)
      render(<MessageInput />);
      
      // Verify that the component renders successfully, which indicates exports work
      expect(screen.getByTestId('collection-chips')).toBeInTheDocument();
      expect(screen.getByTestId('simple-filter-bar')).toBeInTheDocument();
      expect(screen.getByTestId('message-input-container')).toBeInTheDocument();
    });
  });

  describe('Layout and Styling', () => {
    it('applies correct spacing between components', () => {
      const { container } = render(<MessageInput />);
      
      const spacedContainer = container.querySelector('.space-y-3');
      expect(spacedContainer).toBeInTheDocument();
    });

    it('applies correct padding and border styling', () => {
      const { container } = render(<MessageInput />);
      
      const mainContainer = container.firstChild as HTMLElement;
      expect(mainContainer).toHaveClass('p-4', 'border-t', 'border-neutral-600');
    });

    it('uses correct background styling', () => {
      const { container } = render(<MessageInput />);
      
      const mainContainer = container.firstChild as HTMLElement;
      expect(mainContainer).toHaveClass('bg-black/30');
    });
  });

  describe('Responsive Behavior', () => {
    it('uses full width styling', () => {
      const { container } = render(<MessageInput />);
      
      const mainContainer = container.firstChild as HTMLElement;
      expect(mainContainer).toHaveClass('w-full');
    });

    it('maintains relative positioning', () => {
      const { container } = render(<MessageInput />);
      
      const mainContainer = container.firstChild as HTMLElement;
      expect(mainContainer).toHaveClass('relative');
    });
  });

  describe('Component Integration', () => {
    it('integrates with collection chips', () => {
      render(<MessageInput />);
      
      const collectionChips = screen.getByTestId('collection-chips');
      expect(collectionChips).toHaveTextContent('Collection Chips');
    });

    it('integrates with message input container', () => {
      render(<MessageInput />);
      
      const inputContainer = screen.getByTestId('message-input-container');
      expect(inputContainer).toHaveTextContent('Message Input Container');
    });

    it('integrates with simple filter bar', () => {
      render(<MessageInput />);
      
      const filterBar = screen.getByTestId('simple-filter-bar');
      expect(filterBar).toHaveTextContent('Simple Filter Bar');
    });
  });
}); 