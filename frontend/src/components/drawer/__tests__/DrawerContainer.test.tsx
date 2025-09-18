import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '../../../test/utils';
import { DrawerContainer } from '../DrawerContainer';

// Mock stores
const mockCollectionDrawerStore = {
  isOpen: false,
  closeDrawer: vi.fn()
};

const mockNewCollectionStore = {
  reset: vi.fn()
};

vi.mock('../../../store/useCollectionDrawerStore', () => ({
  useCollectionDrawerStore: () => mockCollectionDrawerStore
}));

vi.mock('../../../store/useNewCollectionStore', () => ({
  useNewCollectionStore: {
    getState: () => mockNewCollectionStore
  }
}));

describe('DrawerContainer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCollectionDrawerStore.isOpen = false;
  });

  describe('Visibility Behavior', () => {
    it('renders children when open', () => {
      mockCollectionDrawerStore.isOpen = true;
      
      render(
        <DrawerContainer>
          <div data-testid="test-content">Test Content</div>
        </DrawerContainer>
      );
      
      expect(screen.getByTestId('test-content')).toBeInTheDocument();
    });

    it('renders children when closed', () => {
      mockCollectionDrawerStore.isOpen = false;
      
      render(
        <DrawerContainer>
          <div data-testid="test-content">Test Content</div>
        </DrawerContainer>
      );
      
      expect(screen.getByTestId('test-content')).toBeInTheDocument();
    });

    it('applies correct classes when open', () => {
      mockCollectionDrawerStore.isOpen = true;
      
      const { container } = render(
        <DrawerContainer>
          <div>Content</div>
        </DrawerContainer>
      );
      
      const backdrop = container.firstChild as HTMLElement;
      expect(backdrop).toHaveClass('backdrop-blur-sm', 'bg-black/30');
      expect(backdrop).not.toHaveClass('pointer-events-none', 'opacity-0');
    });

    it('applies correct classes when closed', () => {
      mockCollectionDrawerStore.isOpen = false;
      
      const { container } = render(
        <DrawerContainer>
          <div>Content</div>
        </DrawerContainer>
      );
      
      const backdrop = container.firstChild as HTMLElement;
      expect(backdrop).toHaveClass('pointer-events-none', 'opacity-0');
    });


  });

  describe('Backdrop Click Behavior', () => {
    it('calls closeDrawer when backdrop clicked', () => {
      const { container } = render(
        <DrawerContainer>
          <div>Content</div>
        </DrawerContainer>
      );
      
      const backdrop = container.firstChild as HTMLElement;
      fireEvent.click(backdrop);
      
      expect(mockCollectionDrawerStore.closeDrawer).toHaveBeenCalledOnce();
    });

    it('calls reset on new collection store when backdrop clicked', () => {
      mockCollectionDrawerStore.isOpen = true;
      render(
        <DrawerContainer>
          <div>Test content</div>
        </DrawerContainer>
      );
      
      const backdrop = screen.getByRole('button', { hidden: true });
      fireEvent.click(backdrop);
      
      expect(mockCollectionDrawerStore.closeDrawer).toHaveBeenCalled();
      expect(mockNewCollectionStore.reset).toHaveBeenCalled();
    });
  });

  describe('Children Rendering', () => {
    it('renders multiple children', () => {
      render(
        <DrawerContainer>
          <div data-testid="child-1">Child 1</div>
          <div data-testid="child-2">Child 2</div>
        </DrawerContainer>
      );
      
      expect(screen.getByTestId('child-1')).toBeInTheDocument();
      expect(screen.getByTestId('child-2')).toBeInTheDocument();
    });

    it('renders any react node as children', () => {
      render(
        <DrawerContainer>
          <span>Text content</span>
          <button>Button content</button>
        </DrawerContainer>
      );
      
      expect(screen.getByText('Text content')).toBeInTheDocument();
      expect(screen.getByText('Button content')).toBeInTheDocument();
    });
  });
}); 