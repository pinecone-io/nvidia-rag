import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '../../../test/utils';
import { DocumentsList } from '../DocumentsList';
import * as useCollectionDocumentsModule from '../../../api/useCollectionDocuments';
import * as useCollectionDrawerStoreModule from '../../../store/useCollectionDrawerStore';

describe('DocumentsList', () => {
  beforeEach(() => {
    vi.spyOn(useCollectionDrawerStoreModule, 'useCollectionDrawerStore').mockReturnValue({
      activeCollection: 'test-collection'
    });
  });

  it('shows loading state when loading', () => {
    vi.spyOn(useCollectionDocumentsModule, 'useCollectionDocuments').mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null
    } as any);

    render(<DocumentsList />);
    expect(screen.getByText('Loading documents...')).toBeInTheDocument();
  });

  it('shows error state when error occurs', () => {
    vi.spyOn(useCollectionDocumentsModule, 'useCollectionDocuments').mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to fetch')
    } as any);

    render(<DocumentsList />);
    expect(screen.getByText('Failed to load documents')).toBeInTheDocument();
  });

  it('shows empty state when no documents', () => {
    vi.spyOn(useCollectionDocumentsModule, 'useCollectionDocuments').mockReturnValue({
      data: { documents: [] },
      isLoading: false,
      error: null
    } as any);

    render(<DocumentsList />);
    expect(screen.getByText('No documents yet')).toBeInTheDocument();
  });

  it('renders documents when data available', () => {
    vi.spyOn(useCollectionDocumentsModule, 'useCollectionDocuments').mockReturnValue({
      data: {
        documents: [
          { document_name: 'doc1.pdf', metadata: {} },
          { document_name: 'doc2.txt', metadata: {} }
        ]
      },
      isLoading: false,
      error: null
    } as any);

    render(<DocumentsList />);
    expect(screen.getByText('doc1.pdf')).toBeInTheDocument();
    expect(screen.getByText('doc2.txt')).toBeInTheDocument();
  });
}); 