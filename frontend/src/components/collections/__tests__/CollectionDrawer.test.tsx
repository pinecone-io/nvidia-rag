import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '../../../test/utils';
import CollectionDrawer from '../CollectionDrawer';

// Mock all dependencies with simple functions
const mockReset = vi.fn();

vi.mock('../../../store/useNewCollectionStore', () => {
  const mockStore: any = vi.fn(() => ({
    setMetadataSchema: vi.fn()
  }));
  
  // Add the getState method to the store function
  mockStore.getState = vi.fn(() => ({
    reset: mockReset
  }));
  
  return {
    useNewCollectionStore: mockStore
  };
});

vi.mock('../../../store/useCollectionDrawerStore', () => ({
  useCollectionDrawerStore: vi.fn(() => ({
    activeCollection: {
      collection_name: 'Test Collection',
      metadata_schema: []
    },
    closeDrawer: vi.fn(),
    toggleUploader: vi.fn()
  }))
}));

vi.mock('../../../hooks/useCollectionActions', () => ({
  useCollectionActions: vi.fn(() => ({
    handleDeleteCollection: vi.fn(),
    isDeleting: false
  }))
}));

// Mock child components
vi.mock('../../drawer/DrawerHeader', () => ({
  DrawerHeader: ({ title, subtitle, onClose }: any) => (
    <div data-testid="drawer-header">
      <div data-testid="header-title">{title}</div>
      <div data-testid="header-subtitle">{subtitle}</div>
      <button data-testid="close-button" onClick={onClose}>Close</button>
    </div>
  )
}));

vi.mock('../../drawer/DrawerContent', () => ({
  DrawerContent: () => <div data-testid="drawer-content">Drawer Content</div>
}));

vi.mock('../../drawer/DrawerActions', () => ({
  DrawerActions: ({ onDelete, onAddSource, isDeleting }: any) => (
    <div data-testid="drawer-actions">
      <button data-testid="delete-button" onClick={onDelete} disabled={isDeleting}>
        {isDeleting ? 'Deleting...' : 'Delete'}
      </button>
      <button data-testid="add-source-button" onClick={onAddSource}>Add Source</button>
    </div>
  )
}));

vi.mock('../../drawer/DrawerContainer', () => ({
  DrawerContainer: ({ children }: any) => (
    <div data-testid="drawer-container">{children}</div>
  )
}));

describe('CollectionDrawer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Structure', () => {
    it('renders all main components', () => {
      render(<CollectionDrawer />);
      
      expect(screen.getByTestId('drawer-container')).toBeInTheDocument();
      expect(screen.getByTestId('drawer-header')).toBeInTheDocument();
      expect(screen.getByTestId('drawer-content')).toBeInTheDocument();
      expect(screen.getByTestId('drawer-actions')).toBeInTheDocument();
    });

    it('renders with collection name as title', () => {
      render(<CollectionDrawer />);
      
      expect(screen.getByTestId('header-title')).toHaveTextContent('Test Collection');
      expect(screen.getByTestId('header-subtitle')).toHaveTextContent('Collection Details');
    });
  });

  describe('Basic Interactions', () => {
    it('renders delete and add source buttons', () => {
      render(<CollectionDrawer />);
      
      expect(screen.getByTestId('delete-button')).toBeInTheDocument();
      expect(screen.getByTestId('add-source-button')).toBeInTheDocument();
    });

    it('has clickable close button', () => {
      render(<CollectionDrawer />);
      
      const closeButton = screen.getByTestId('close-button');
      expect(closeButton).toBeInTheDocument();
      
      // Test that clicking doesn't crash
      closeButton.click();
    });

    it('has clickable action buttons', () => {
      render(<CollectionDrawer />);
      
      const deleteButton = screen.getByTestId('delete-button');
      const addSourceButton = screen.getByTestId('add-source-button');
      
      // Test that clicking doesn't crash
      deleteButton.click();
      addSourceButton.click();
    });
  });

  describe('Component Integration', () => {
    it('renders without errors indicating proper imports', () => {
      render(<CollectionDrawer />);
      
      // If there are import issues, this test would fail
      expect(screen.getByTestId('drawer-container')).toBeInTheDocument();
    });
  });
}); 