import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '../../../test/utils';
import { DrawerContent } from '../DrawerContent';

// Mock store
const mockStore = {
  deleteError: null as string | null,
  showUploader: false
};

vi.mock('../../../store/useCollectionDrawerStore', () => ({
  useCollectionDrawerStore: () => mockStore
}));

// Mock child components
vi.mock('../../tasks/DocumentsList', () => ({
  DocumentsList: () => <div data-testid="documents-list">Documents List</div>
}));

vi.mock('../UploaderSection', () => ({
  UploaderSection: () => <div data-testid="uploader-section">Uploader Section</div>
}));

describe('DrawerContent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStore.deleteError = null;
    mockStore.showUploader = false;
  });

  describe('Basic Rendering', () => {
    it('always renders DocumentsList component', () => {
      render(<DrawerContent />);
      
      expect(screen.getByTestId('documents-list')).toBeInTheDocument();
    });
  });

  describe('Error Display', () => {
    it('shows error message when deleteError exists', () => {
      mockStore.deleteError = 'Failed to delete collection';
      
      render(<DrawerContent />);
      
      expect(screen.getByText('Failed to delete collection')).toBeInTheDocument();
    });

    it('does not show error message when deleteError is null', () => {
      mockStore.deleteError = null;
      
      render(<DrawerContent />);
      
      expect(screen.queryByText(/failed/i)).not.toBeInTheDocument();
    });

    it('shows different error messages correctly', () => {
      mockStore.deleteError = 'Network error occurred';
      
      render(<DrawerContent />);
      
      expect(screen.getByText('Network error occurred')).toBeInTheDocument();
    });

    it('shows error in styled container', () => {
      mockStore.deleteError = 'Test error';
      
      render(<DrawerContent />);
      
      const errorElement = screen.getByText('Test error');
      expect(errorElement.closest('div')).toHaveClass('bg-red-900/50');
    });
  });

  describe('Uploader Section Display', () => {
    it('shows uploader section when showUploader is true', () => {
      mockStore.showUploader = true;
      
      render(<DrawerContent />);
      
      expect(screen.getByTestId('uploader-section')).toBeInTheDocument();
    });

    it('does not show uploader section when showUploader is false', () => {
      mockStore.showUploader = false;
      
      render(<DrawerContent />);
      
      expect(screen.queryByTestId('uploader-section')).not.toBeInTheDocument();
    });
  });

  describe('Combined States', () => {
    it('shows all components when both error and uploader are active', () => {
      mockStore.deleteError = 'Error message';
      mockStore.showUploader = true;
      
      render(<DrawerContent />);
      
      expect(screen.getByTestId('documents-list')).toBeInTheDocument();
      expect(screen.getByText('Error message')).toBeInTheDocument();
      expect(screen.getByTestId('uploader-section')).toBeInTheDocument();
    });

    it('shows only documents list when no error and no uploader', () => {
      mockStore.deleteError = null;
      mockStore.showUploader = false;
      
      render(<DrawerContent />);
      
      expect(screen.getByTestId('documents-list')).toBeInTheDocument();
      expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
      expect(screen.queryByTestId('uploader-section')).not.toBeInTheDocument();
    });

    it('shows documents list and error but no uploader', () => {
      mockStore.deleteError = 'Some error';
      mockStore.showUploader = false;
      
      render(<DrawerContent />);
      
      expect(screen.getByTestId('documents-list')).toBeInTheDocument();
      expect(screen.getByText('Some error')).toBeInTheDocument();
      expect(screen.queryByTestId('uploader-section')).not.toBeInTheDocument();
    });

    it('shows documents list and uploader but no error', () => {
      mockStore.deleteError = null;
      mockStore.showUploader = true;
      
      render(<DrawerContent />);
      
      expect(screen.getByTestId('documents-list')).toBeInTheDocument();
      expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
      expect(screen.getByTestId('uploader-section')).toBeInTheDocument();
    });
  });
}); 