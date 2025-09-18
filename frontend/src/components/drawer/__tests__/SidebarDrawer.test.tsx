import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '../../../test/utils';
import SidebarDrawer from '../SidebarDrawer';

// Mock store
const mockSidebarStore = {
  view: null as string | null,
  citations: [] as any[],
  closeSidebar: vi.fn()
};

vi.mock('../../../store/useSidebarStore', () => ({
  useSidebarStore: () => mockSidebarStore
}));

// Mock Citations component
vi.mock('../../chat/Citations', () => ({
  default: ({ citations }: { citations: any[] }) => (
    <div data-testid="citations">Citations: {citations?.length || 0}</div>
  )
}));

describe('SidebarDrawer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSidebarStore.view = null;
    mockSidebarStore.citations = [];
  });

  describe('Visibility Control', () => {
    it('renders nothing when view is null', () => {
      mockSidebarStore.view = null;
      
      const { container } = render(<SidebarDrawer />);
      
      expect(container.firstChild).toBeNull();
    });

    it('renders drawer when view is set', () => {
      mockSidebarStore.view = 'citations';
      
      render(<SidebarDrawer />);
      
      expect(screen.getByText('Source Citations')).toBeInTheDocument();
    });

    it('renders drawer for different views', () => {
      mockSidebarStore.view = 'citations';
      
      render(<SidebarDrawer />);
      
      // Should render the drawer structure regardless of view type
      expect(screen.getByRole('button')).toBeInTheDocument(); // Close button
    });
  });

  describe('Citations View', () => {
    it('shows correct title for citations view', () => {
      mockSidebarStore.view = 'citations';
      mockSidebarStore.citations = [];
      
      render(<SidebarDrawer />);
      
      expect(screen.getByText('Source Citations')).toBeInTheDocument();
    });

    it('shows citation count in subtitle', () => {
      mockSidebarStore.view = 'citations';
      mockSidebarStore.citations = [{ id: 1 }, { id: 2 }, { id: 3 }];
      
      render(<SidebarDrawer />);
      
      expect(screen.getByText('3 sources found')).toBeInTheDocument();
    });

    it('shows zero count when no citations', () => {
      mockSidebarStore.view = 'citations';
      mockSidebarStore.citations = [];
      
      render(<SidebarDrawer />);
      
      expect(screen.getByText('0 sources found')).toBeInTheDocument();
    });

    it('handles null citations array', () => {
      mockSidebarStore.view = 'citations';
      mockSidebarStore.citations = null as any;
      
      render(<SidebarDrawer />);
      
      expect(screen.getByText('0 sources found')).toBeInTheDocument();
    });

    it('renders Citations component for citations view', () => {
      mockSidebarStore.view = 'citations';
      mockSidebarStore.citations = [{ id: 1 }, { id: 2 }];
      
      render(<SidebarDrawer />);
      
      expect(screen.getByTestId('citations')).toBeInTheDocument();
      expect(screen.getByText('Citations: 2')).toBeInTheDocument();
    });
  });

  describe('Close Functionality', () => {
    it('calls closeSidebar when close button clicked', () => {
      mockSidebarStore.view = 'citations';
      
      render(<SidebarDrawer />);
      
      fireEvent.click(screen.getByRole('button'));
      
      expect(mockSidebarStore.closeSidebar).toHaveBeenCalledOnce();
    });

    it('calls closeSidebar when backdrop clicked', () => {
      mockSidebarStore.view = 'citations';
      
      const { container } = render(<SidebarDrawer />);
      
      const backdrop = container.firstChild as HTMLElement;
      fireEvent.click(backdrop);
      
      expect(mockSidebarStore.closeSidebar).toHaveBeenCalledOnce();
    });


  });

  describe('Content Rendering', () => {
    it('renders header with title and close button', () => {
      mockSidebarStore.view = 'citations';
      
      render(<SidebarDrawer />);
      
      expect(screen.getByText('Source Citations')).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('renders content area', () => {
      mockSidebarStore.view = 'citations';
      mockSidebarStore.citations = [];
      
      render(<SidebarDrawer />);
      
      expect(screen.getByTestId('citations')).toBeInTheDocument();
    });
  });
}); 