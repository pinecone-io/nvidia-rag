import { FileUploadZone } from './FileUploadZone';
import { FileList } from './FileList';
import { useUploadFileState } from '../../hooks/useUploadFileState';

// Export all upload components for external use
export { FileUploadZone } from './FileUploadZone';
export { FileList } from './FileList';
export { FileItem } from './FileItem';
export { FileMetadataForm } from './FileMetadataForm';

interface NvidiaUploadProps {
  onFilesChange?: (files: File[]) => void;
  onUpload?: (files: File[]) => Promise<void>;
  acceptedTypes?: string[];
  maxFileSize?: number; // in MB
  maxFiles?: number;
  className?: string;
}

export default function NvidiaUpload({
  onFilesChange,
  acceptedTypes = ['.bmp', '.docx', '.html', '.jpeg', '.json', '.md', '.pdf', '.png', '.pptx', '.sh', '.tiff', '.txt', '.mp3', '.wav'],
  maxFileSize = 50,
  maxFiles = 10,
  className = ''
}: NvidiaUploadProps) {
  const { uploadFiles, addFiles, removeFile } = useUploadFileState({
    acceptedTypes,
    maxFileSize,
    maxFiles,
    onFilesChange,
  });

  return (
    <div className={`space-y-4 ${className}`}>
      <FileUploadZone
        acceptedTypes={acceptedTypes}
        maxFileSize={maxFileSize}
        onFilesSelected={addFiles}
      />
      
      <FileList
        uploadFiles={uploadFiles}
        onRemoveFile={removeFile}
      />
    </div>
  );
} 