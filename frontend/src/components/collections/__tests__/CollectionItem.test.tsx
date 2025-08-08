import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '../../../test/utils';
import { CollectionItem } from '../CollectionItem';

// Mock stores
const mockCollectionsStore = {
  selectedCollections: [] as string[],
  toggleCollection: vi.fn()
};

const mockDrawerStore = {
  openDrawer: vi.fn()
};

const mockTasksStore = {
  pendingTasks: [] as any[]
};

vi.mock('../../../store/useCollectionsStore', () => ({
  useCollectionsStore: () => mockCollectionsStore
}));

vi.mock('../../../store/useCollectionDrawerStore', () => ({
  useCollectionDrawerStore: () => mockDrawerStore
}));

vi.mock('../../../store/useIngestionTasksStore', () => ({
  useIngestionTasksStore: () => mockTasksStore
}));

describe('CollectionItem', () => {
  const mockCollection = {
    collection_name: 'test-collection',
    num_entities: 100,
    metadata_schema: []
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockCollectionsStore.selectedCollections = [];
    mockTasksStore.pendingTasks = [];
  });

  describe('Basic Rendering', () => {
    it('displays collection name', () => {
      render(<CollectionItem collection={mockCollection} />);
      
      expect(screen.getByText('test-collection')).toBeInTheDocument();
    });

    it('renders as clickable element', () => {
      const { container } = render(<CollectionItem collection={mockCollection} />);
      
      const clickableContainer = container.querySelector('.cursor-pointer');
      expect(clickableContainer).toBeInTheDocument();
    });
  });

  describe('Selection State', () => {
    it('shows unselected state when not in selectedCollections', () => {
      mockCollectionsStore.selectedCollections = ['other-collection'];
      
      const { container } = render(<CollectionItem collection={mockCollection} />);
      
      const checkbox = container.querySelector('.border-gray-600');
      expect(checkbox).toBeInTheDocument();
      expect(checkbox).not.toHaveClass('bg-[var(--nv-green)]');
    });

    it('shows selected state when in selectedCollections', () => {
      mockCollectionsStore.selectedCollections = ['test-collection'];
      
      render(<CollectionItem collection={mockCollection} />);
      
      const container = screen.getByText('test-collection').closest('div');
      expect(container).toBeInTheDocument();
    });

    it('calls toggleCollection when item clicked', () => {
      render(<CollectionItem collection={mockCollection} />);
      
      const item = screen.getByText('test-collection').closest('div');
      fireEvent.click(item!);
      
      expect(mockCollectionsStore.toggleCollection).toHaveBeenCalledWith('test-collection');
    });

    it('toggles different collections correctly', () => {
      const collection2 = { ...mockCollection, collection_name: 'other-collection' };
      render(<CollectionItem collection={collection2} />);
      
      const item = screen.getByText('other-collection').closest('div');
      fireEvent.click(item!);
      
      expect(mockCollectionsStore.toggleCollection).toHaveBeenCalledWith('other-collection');
    });
  });

  describe('Drawer Opening', () => {
    it('calls openDrawer when more button clicked', () => {
      render(<CollectionItem collection={mockCollection} />);
      
      const moreButton = screen.getByRole('button');
      fireEvent.click(moreButton);
      
      expect(mockDrawerStore.openDrawer).toHaveBeenCalledWith(mockCollection);
    });

    it('does not call toggleCollection when more button clicked', () => {
      render(<CollectionItem collection={mockCollection} />);
      
      const moreButton = screen.getByRole('button');
      fireEvent.click(moreButton);
      
      expect(mockCollectionsStore.toggleCollection).not.toHaveBeenCalled();
    });

    it('passes correct collection to openDrawer', () => {
      const customCollection = {
        collection_name: 'custom-collection',
        num_entities: 50,
        metadata_schema: [{ name: 'field1', type: 'string', description: 'desc' }]
      };
      
      render(<CollectionItem collection={customCollection} />);
      
      const moreButton = screen.getByRole('button');
      fireEvent.click(moreButton);
      
      expect(mockDrawerStore.openDrawer).toHaveBeenCalledWith(customCollection);
    });
  });

  describe('Pending Tasks Display', () => {
    it('shows more button when no pending tasks', () => {
      mockTasksStore.pendingTasks = [];
      
      render(<CollectionItem collection={mockCollection} />);
      
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('hides more button when collection has pending tasks', () => {
      mockTasksStore.pendingTasks = [{
        collection_name: 'test-collection',
        state: 'PENDING'
      }];
      
      render(<CollectionItem collection={mockCollection} />);
      
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('shows spinner when collection has pending tasks', () => {
      mockTasksStore.pendingTasks = [{
        collection_name: 'test-collection',
        state: 'PENDING'
      }];
      
      const { container } = render(<CollectionItem collection={mockCollection} />);
      
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('shows more button for collection without pending tasks while other has pending', () => {
      mockTasksStore.pendingTasks = [{
        collection_name: 'other-collection',
        state: 'PENDING'
      }];
      
      render(<CollectionItem collection={mockCollection} />);
      
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('ignores non-pending tasks', () => {
      mockTasksStore.pendingTasks = [{
        collection_name: 'test-collection',
        state: 'FINISHED'
      }];
      
      render(<CollectionItem collection={mockCollection} />);
      
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });
}); 