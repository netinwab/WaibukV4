import { Search, Video, Play } from "lucide-react";
import type { Memory } from "@shared/schema";
import { getSecureImageUrl } from "@/lib/secure-image";

interface PhotoGalleryProps {
  memories: Memory[];
  viewerMode?: boolean;
  onImageClick?: (memory: Memory, index: number) => void;
}

export default function PhotoGallery({ memories, viewerMode = false, onImageClick }: PhotoGalleryProps) {
  const gridCols = viewerMode 
    ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6" 
    : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4";

  return (
    <div className={`grid ${gridCols} gap-4`}>
      {memories.map((memory, index) => (
        <div
          key={memory.id}
          className="group relative aspect-square rounded-lg overflow-hidden cursor-pointer hover:scale-105 transition-transform"
          onClick={() => onImageClick?.(memory, index)}
        >
          {memory.mediaType === 'image' && memory.imageUrl ? (
            <img
              src={getSecureImageUrl(memory.imageUrl) || '/placeholder-image.jpg'}
              alt={memory.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                console.error('Failed to load secure image:', memory.imageUrl);
                e.currentTarget.src = '/placeholder-image.jpg';
              }}
            />
          ) : memory.mediaType === 'video' && memory.videoUrl ? (
            <div className="relative w-full h-full">
              <video
                src={memory.videoUrl}
                className="w-full h-full object-cover"
                muted
                onMouseEnter={(e) => {
                  if (e.target instanceof HTMLVideoElement) {
                    e.target.play();
                  }
                }}
                onMouseLeave={(e) => {
                  if (e.target instanceof HTMLVideoElement) {
                    e.target.pause();
                    e.target.currentTime = 0;
                  }
                }}
              />
              <div className="absolute top-2 right-2 bg-black bg-opacity-60 rounded-full p-1">
                <Video className="h-4 w-4 text-white" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center group-hover:bg-black group-hover:bg-opacity-20 transition-all">
                <Play className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          ) : (
            // Fallback for memories with missing media or older format
            <img
              src={getSecureImageUrl(memory.imageUrl) || '/placeholder-image.jpg'}
              alt={memory.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                console.error('Failed to load secure image:', memory.imageUrl);
                e.currentTarget.src = '/placeholder-image.jpg';
              }}
            />
          )}
          
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity flex items-center justify-center">
            {viewerMode ? (
              <div className="text-white transform scale-0 group-hover:scale-100 transition-transform text-center">
                <Search className="mx-auto text-2xl mb-2" />
                <div className="text-sm font-medium">{memory.title}</div>
                <div className="text-xs">{memory.eventDate}</div>
                {memory.category && (
                  <div className="text-xs opacity-80 capitalize">{memory.category.replace('_', ' ')}</div>
                )}
              </div>
            ) : (
              <div className="p-3 text-white transform translate-y-full group-hover:translate-y-0 transition-transform flex items-end">
                <div>
                  <div className="text-sm font-medium">{memory.title}</div>
                  <div className="text-xs">{memory.eventDate}</div>
                  {memory.category && (
                    <div className="text-xs opacity-80 capitalize">{memory.category.replace('_', ' ')}</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
