import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '../../../test/utils';
import { UploaderSection } from '../UploaderSection';

vi.mock('../../../store/useCollectionDrawerStore', () => ({
  useCollectionDrawerStore: () => ({
    toggleUploader: vi.fn()
  })
}));

vi.mock('../../../hooks/useCollectionActions', () => ({
  useCollectionActions: () => ({
    handleUploadDocuments: vi.fn()
  })
}));

vi.mock('../../../store/useNewCollectionStore', () => {
  const mockStore = {
    selectedFiles: [],
    reset: vi.fn(),
    addFiles: vi.fn()
  };
  
  const useNewCollectionStore = () => mockStore;
  useNewCollectionStore.getState = () => mockStore;
  
  return { useNewCollectionStore };
});

// Mock child components
vi.mock('../../../components/files/NvidiaUpload', () => ({
  default: ({ onFilesChange }: any) => (
    <div data-testid="nvidia-upload">
      <button onClick={() => onFilesChange([new File([''], 'test.pdf')])}>
        Add Files
      </button>
    </div>
  )
}));

describe('UploaderSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders section header', () => {
      render(<UploaderSection />);
      
      expect(screen.getByText('Add New Documents')).toBeInTheDocument();
    });

    it('renders close button', () => {
      render(<UploaderSection />);
      
      const buttons = screen.getAllByRole('button');
      const closeButton = buttons.find(button => button.classList.contains('p-1'));
      expect(closeButton).toBeInTheDocument();
    });

    it('renders NvidiaUpload component', () => {
      render(<UploaderSection />);
      
      expect(screen.getByTestId('nvidia-upload')).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('has clickable close button', () => {
      render(<UploaderSection />);
      
      const buttons = screen.getAllByRole('button');
      const closeButton = buttons.find(button => button.classList.contains('p-1'));
      expect(closeButton).toBeInTheDocument();
      
      // Test that clicking doesn't crash
      fireEvent.click(closeButton!);
    });

    it('handles file addition through NvidiaUpload', () => {
      render(<UploaderSection />);
      
      // Test that clicking doesn't crash
      fireEvent.click(screen.getByText('Add Files'));
    });
  });
}); 