import { useCollections } from "../../api/useCollectionsApi";
import { EmptyState, ErrorState, LoadingState } from "./CollectionDrawer";
import { CollectionItem } from "./CollectionItem";

const CollectionsEmptyIcon = () => (
  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
  </svg>
);

interface CollectionsGridProps {
  searchQuery: string;
}

export const CollectionsGrid = ({ searchQuery }: CollectionsGridProps) => {
  const { data, isLoading, error } = useCollections();

  // Frontend filtering and sorting of collections for consistent order
  const filteredCollections = (data || [])
    .filter((collection: any) =>
      collection.collection_name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a: any, b: any) => 
      a.collection_name.toLowerCase().localeCompare(b.collection_name.toLowerCase())
    );

  if (isLoading) {
    return <LoadingState message="Loading collections..." />;
  }

  if (error) {
    return (
      <ErrorState 
        message="Failed to load collections" 
        onRetry={() => window.location.reload()} 
      />
    );
  }

  if (!data?.length) {
    return (
      <EmptyState
        title="No collections"
        description="Create your first collection and add files to customize your model response."
        icon={<CollectionsEmptyIcon />}
      />
    );
  }

  if (!filteredCollections.length && searchQuery) {
    return (
      <EmptyState
        title="No matches found"
        description={`No collections match "${searchQuery}"`}
        icon={<CollectionsEmptyIcon />}
      />
    );
  }

  return (
    <div className="max-h-[calc(100vh-200px)] overflow-y-auto pr-2 custom-scrollbar">
      {filteredCollections.map((collection: any) => (
        <CollectionItem 
          key={collection.collection_name} 
          collection={collection} 
        />
      ))}
    </div>
  );
}; 