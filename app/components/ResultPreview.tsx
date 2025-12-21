import React from 'react';

interface ResultPreviewProps {
  finalVideoUrl: string;
  onClose: () => void;
}

export const ResultPreview: React.FC<ResultPreviewProps> = ({
  finalVideoUrl,
  onClose,
}) => {
  return (
    <div className="relative w-full max-w-[350px] aspect-[9/16] shadow-2xl animate-fade-in-up">
      <video src={finalVideoUrl} controls className="w-full h-full object-cover rounded-lg" />
      <div className="absolute -bottom-20 w-full flex justify-center">
         <a href={finalVideoUrl} download className="bg-green-600 hover:bg-green-500 text-white px-8 py-3 rounded-full font-bold shadow-lg flex items-center gap-2 transition">
             ⬇ Download
         </a>
      </div>
      <button onClick={onClose} className="absolute top-4 right-4 bg-black/50 p-2 rounded-full text-white hover:bg-black/80">✕</button>
    </div>
  );
};
