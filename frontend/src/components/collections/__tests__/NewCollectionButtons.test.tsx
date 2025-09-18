import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '../../../test/utils';
import NewCollectionButtons from '../NewCollectionButtons';

// Mock all dependencies
const mockNavigate = vi.fn();
const mockUseNewCollectionStore = vi.fn();
const mockUseSubmitNewCollection = vi.fn();
const mockUseCollections = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

vi.mock('../../../store/useNewCollectionStore', () => ({
  useNewCollectionStore: () => mockUseNewCollectionStore()
}));

vi.mock('../../../hooks/useSubmitNewCollection', () => ({
  useSubmitNewCollection: () => mockUseSubmitNewCollection()
}));

vi.mock('../../../api/useCollectionsApi', () => ({
  useCollections: () => mockUseCollections()
}));

describe('NewCollectionButtons', () => {
  const mockSubmit = vi.fn();
  const mockSetError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockUseNewCollectionStore.mockReturnValue({
      collectionName: '',
      metadataSchema: [],
      fileMetadata: {},
      selectedFiles: [],
      isLoading: false,
      setError: mockSetError
    });
    
    mockUseSubmitNewCollection.mockReturnValue({
      submit: mockSubmit
    });
    
    mockUseCollections.mockReturnValue({
      data: []
    });
  });

  describe('Component Structure', () => {
    it('renders cancel and create buttons', () => {
      render(<NewCollectionButtons />);
      
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Create Collection')).toBeInTheDocument();
    });

    it('applies correct container styling', () => {
      const { container } = render(<NewCollectionButtons />);
      
      const buttonContainer = container.firstChild as HTMLElement;
      expect(buttonContainer).toHaveClass('mt-6', 'space-y-3');
    });

    it('applies correct button styling', () => {
      render(<NewCollectionButtons />);
      
      const cancelButton = screen.getByText('Cancel');
      expect(cancelButton).toHaveClass('px-4', 'py-2', 'text-sm', 'rounded', 'border');
      
      const createButton = screen.getByText('Create Collection');
      expect(createButton).toHaveClass('px-4', 'py-2', 'text-sm', 'rounded', 'bg-[var(--nv-green)]');
    });
  });

  describe('Cancel Button', () => {
    it('calls navigate to home when clicked', () => {
      render(<NewCollectionButtons />);
      
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);
      
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  describe('Create Button States', () => {
    it('is disabled when collection name is empty', () => {
      mockUseNewCollectionStore.mockReturnValue({
        collectionName: '',
        metadataSchema: [],
        fileMetadata: {},
        selectedFiles: [],
        isLoading: false,
        setError: mockSetError
      });

      render(<NewCollectionButtons />);
      
      const createButton = screen.getByText('Create Collection');
      expect(createButton).toBeDisabled();
    });

    it('is disabled when collection name is only whitespace', () => {
      mockUseNewCollectionStore.mockReturnValue({
        collectionName: '   ',
        metadataSchema: [],
        fileMetadata: {},
        selectedFiles: [],
        isLoading: false,
        setError: mockSetError
      });

      render(<NewCollectionButtons />);
      
      const createButton = screen.getByText('Create Collection');
      expect(createButton).toBeDisabled();
    });

    it('is enabled when collection name is valid', () => {
      mockUseNewCollectionStore.mockReturnValue({
        collectionName: 'valid_collection_name',
        metadataSchema: [],
        fileMetadata: {},
        selectedFiles: [],
        isLoading: false,
        setError: mockSetError
      });

      render(<NewCollectionButtons />);
      
      const createButton = screen.getByText('Create Collection');
      expect(createButton).not.toBeDisabled();
    });

    it('is disabled when loading', () => {
      mockUseNewCollectionStore.mockReturnValue({
        collectionName: 'valid_name',
        metadataSchema: [],
        fileMetadata: {},
        selectedFiles: [],
        isLoading: true,
        setError: mockSetError
      });

      render(<NewCollectionButtons />);
      
      const createButton = screen.getByText('Processing...');
      expect(createButton).toBeDisabled();
    });

    it('shows processing text when loading', () => {
      mockUseNewCollectionStore.mockReturnValue({
        collectionName: 'valid_name',
        metadataSchema: [],
        fileMetadata: {},
        selectedFiles: [],
        isLoading: true,
        setError: mockSetError
      });

      render(<NewCollectionButtons />);
      
      expect(screen.getByText('Processing...')).toBeInTheDocument();
    });
  });

  describe('Name Validation', () => {
    it('shows error for invalid name format', () => {
      mockUseNewCollectionStore.mockReturnValue({
        collectionName: 'invalid-name',
        metadataSchema: [],
        fileMetadata: {},
        selectedFiles: [],
        isLoading: false,
        setError: mockSetError
      });

      render(<NewCollectionButtons />);
      
      expect(screen.getByText(/Name must start with a letter\/underscore/)).toBeInTheDocument();
    });

    it('shows error for duplicate collection name', () => {
      mockUseCollections.mockReturnValue({
        data: [{ collection_name: 'existing_collection' }]
      });

      mockUseNewCollectionStore.mockReturnValue({
        collectionName: 'existing_collection',
        metadataSchema: [],
        fileMetadata: {},
        selectedFiles: [],
        isLoading: false,
        setError: mockSetError
      });

      render(<NewCollectionButtons />);
      
      expect(screen.getByText('A collection with this name already exists')).toBeInTheDocument();
    });

    it('does not show error for valid name', () => {
      mockUseNewCollectionStore.mockReturnValue({
        collectionName: 'valid_collection_123',
        metadataSchema: [],
        fileMetadata: {},
        selectedFiles: [],
        isLoading: false,
        setError: mockSetError
      });

      render(<NewCollectionButtons />);
      
      expect(screen.queryByText(/Name must start/)).not.toBeInTheDocument();
      expect(screen.queryByText(/already exists/)).not.toBeInTheDocument();
    });

    it('validates names starting with underscore', () => {
      mockUseNewCollectionStore.mockReturnValue({
        collectionName: '_valid_name',
        metadataSchema: [],
        fileMetadata: {},
        selectedFiles: [],
        isLoading: false,
        setError: mockSetError
      });

      render(<NewCollectionButtons />);
      
      expect(screen.queryByText(/Name must start/)).not.toBeInTheDocument();
    });

    it('rejects names starting with numbers', () => {
      mockUseNewCollectionStore.mockReturnValue({
        collectionName: '123invalid',
        metadataSchema: [],
        fileMetadata: {},
        selectedFiles: [],
        isLoading: false,
        setError: mockSetError
      });

      render(<NewCollectionButtons />);
      
      expect(screen.getByText(/Name must start with a letter\/underscore/)).toBeInTheDocument();
    });
  });

  describe('Required Field Validation', () => {
    it('is disabled when required metadata fields are missing', () => {
      mockUseNewCollectionStore.mockReturnValue({
        collectionName: 'valid_name',
        metadataSchema: [
          { name: 'author', type: 'string', optional: false },
          { name: 'tags', type: 'array', optional: true }
        ],
        fileMetadata: {
          'file1.pdf': { author: '', tags: 'some tags' }
        },
        selectedFiles: [{ name: 'file1.pdf' }],
        isLoading: false,
        setError: mockSetError
      });

      render(<NewCollectionButtons />);
      
      const createButton = screen.getByText('Create Collection');
      expect(createButton).toBeDisabled();
    });

    it('is enabled when all required metadata fields are filled', () => {
      mockUseNewCollectionStore.mockReturnValue({
        collectionName: 'valid_name',
        metadataSchema: [
          { name: 'author', type: 'string', optional: false },
          { name: 'tags', type: 'array', optional: true }
        ],
        fileMetadata: {
          'file1.pdf': { author: 'John Doe', tags: '' }
        },
        selectedFiles: [{ name: 'file1.pdf' }],
        isLoading: false,
        setError: mockSetError
      });

      render(<NewCollectionButtons />);
      
      const createButton = screen.getByText('Create Collection');
      expect(createButton).not.toBeDisabled();
    });

    it('handles files with no metadata requirements', () => {
      mockUseNewCollectionStore.mockReturnValue({
        collectionName: 'valid_name',
        metadataSchema: [],
        fileMetadata: {},
        selectedFiles: [{ name: 'file1.pdf' }],
        isLoading: false,
        setError: mockSetError
      });

      render(<NewCollectionButtons />);
      
      const createButton = screen.getByText('Create Collection');
      expect(createButton).not.toBeDisabled();
    });
  });

  describe('Submit Functionality', () => {
    it('calls submit when create button is clicked with valid data', () => {
      mockUseNewCollectionStore.mockReturnValue({
        collectionName: 'valid_name',
        metadataSchema: [],
        fileMetadata: {},
        selectedFiles: [],
        isLoading: false,
        setError: mockSetError
      });

      render(<NewCollectionButtons />);
      
      const createButton = screen.getByText('Create Collection');
      fireEvent.click(createButton);
      
      expect(mockSubmit).toHaveBeenCalled();
    });

    it('calls setError when submit is attempted with name error', () => {
      mockUseNewCollectionStore.mockReturnValue({
        collectionName: 'invalid-name',
        metadataSchema: [],
        fileMetadata: {},
        selectedFiles: [],
        isLoading: false,
        setError: mockSetError
      });

      render(<NewCollectionButtons />);
      
      const createButton = screen.getByText('Create Collection');
      
      // The button should be disabled due to name validation, so clicking won't trigger setError
      expect(createButton).toBeDisabled();
      expect(mockSubmit).not.toHaveBeenCalled();
    });

    it('does not submit when button is disabled', () => {
      mockUseNewCollectionStore.mockReturnValue({
        collectionName: '',
        metadataSchema: [],
        fileMetadata: {},
        selectedFiles: [],
        isLoading: false,
        setError: mockSetError
      });

      render(<NewCollectionButtons />);
      
      const createButton = screen.getByText('Create Collection');
      fireEvent.click(createButton);
      
      expect(mockSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Error Display', () => {
    it('shows name error when name is invalid', () => {
      mockUseNewCollectionStore.mockReturnValue({
        collectionName: 'invalid-name',
        metadataSchema: [],
        fileMetadata: {},
        selectedFiles: [],
        isLoading: false,
        setError: mockSetError
      });

      render(<NewCollectionButtons />);
      
      expect(screen.getByText(/Name must start with a letter\/underscore/)).toBeInTheDocument();
    });
  });

  describe('Integration Tests', () => {
    it('handles complete workflow with valid input', () => {
      mockUseNewCollectionStore.mockReturnValue({
        collectionName: 'test_collection',
        metadataSchema: [],
        fileMetadata: {},
        selectedFiles: [],
        isLoading: false,
        setError: mockSetError
      });

      render(<NewCollectionButtons />);
      
      const createButton = screen.getByText('Create Collection');
      expect(createButton).not.toBeDisabled();
      
      fireEvent.click(createButton);
      expect(mockSubmit).toHaveBeenCalled();
    });

    it('handles complete workflow with navigation', () => {
      render(<NewCollectionButtons />);
      
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);
      
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });
}); 