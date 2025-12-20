// app/components/UploadZone.tsx
"use client";
import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface UploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  isLoading: boolean;
}

export default function UploadZone({ onFilesSelected, isLoading }: UploadZoneProps) {
  
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFilesSelected(acceptedFiles);
    }
  }, [onFilesSelected]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop, 
    accept: { 'video/*': [] }, // Only accept videos
    disabled: isLoading
  });

  return (
    <div 
      {...getRootProps()} 
      className={`
        border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all
        ${isDragActive ? 'border-blue-500 bg-blue-500/10' : 'border-gray-700 hover:border-gray-500 hover:bg-gray-900'}
        ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-4">
        <span className="text-5xl">📂</span>
        {isDragActive ? (
          <p className="text-blue-400 font-bold text-lg">Drop the videos here!</p>
        ) : (
          <div>
            <p className="text-xl font-medium mb-2">Drag & drop your clips here</p>
            <p className="text-sm text-gray-500">(or click to browse files)</p>
          </div>
        )}
      </div>
    </div>
  );
}