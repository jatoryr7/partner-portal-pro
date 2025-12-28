import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Image, 
  Video, 
  FileText, 
  ExternalLink, 
  Download, 
  ZoomIn,
  X,
  Play
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface AssetItem {
  url: string;
  type: 'image' | 'video' | 'document';
  channel: string;
}

interface AssetGalleryProps {
  assets: Array<{
    id: string;
    channel: string;
    fileUrls: string[];
    isComplete: boolean;
  }>;
}

const getFileType = (url: string): 'image' | 'video' | 'document' => {
  const ext = url.split('.').pop()?.toLowerCase() || '';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) return 'image';
  if (['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(ext)) return 'video';
  return 'document';
};

const getFileIcon = (type: 'image' | 'video' | 'document') => {
  switch (type) {
    case 'image': return Image;
    case 'video': return Video;
    default: return FileText;
  }
};

export function AssetGallery({ assets }: AssetGalleryProps) {
  const [previewAsset, setPreviewAsset] = useState<AssetItem | null>(null);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Flatten all assets into a single array with metadata
  const allAssets: AssetItem[] = assets.flatMap(asset => 
    asset.fileUrls.map(url => ({
      url,
      type: getFileType(url),
      channel: asset.channel,
    }))
  );

  if (allAssets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Image className="w-12 h-12 mb-4 opacity-40" />
        <p className="text-sm">No assets uploaded yet</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {allAssets.map((asset, idx) => {
          const Icon = getFileIcon(asset.type);
          const isHovered = hoveredIdx === idx;

          return (
            <motion.div
              key={`${asset.url}-${idx}`}
              className="relative group aspect-square rounded-lg overflow-hidden bg-muted/50 border border-border cursor-pointer"
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              onClick={() => setPreviewAsset(asset)}
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              {/* Preview Content */}
              {asset.type === 'image' ? (
                <img
                  src={asset.url}
                  alt={`Asset from ${asset.channel}`}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : asset.type === 'video' ? (
                <div className="relative w-full h-full bg-secondary">
                  <video
                    src={asset.url}
                    className="w-full h-full object-cover"
                    muted
                    playsInline
                    onMouseEnter={(e) => e.currentTarget.play()}
                    onMouseLeave={(e) => {
                      e.currentTarget.pause();
                      e.currentTarget.currentTime = 0;
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-12 h-12 rounded-full bg-primary/80 flex items-center justify-center group-hover:opacity-0 transition-opacity">
                      <Play className="w-5 h-5 text-primary-foreground ml-0.5" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-secondary/50">
                  <Icon className="w-12 h-12 text-muted-foreground mb-2" />
                  <span className="text-xs text-muted-foreground">Document</span>
                </div>
              )}

              {/* Fallback Icon (hidden by default) */}
              <div className="hidden absolute inset-0 flex items-center justify-center bg-secondary/50">
                <Icon className="w-12 h-12 text-muted-foreground" />
              </div>

              {/* Overlay */}
              <AnimatePresence>
                {isHovered && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-foreground/60 backdrop-blur-[2px] flex flex-col items-center justify-center gap-2"
                  >
                    <ZoomIn className="w-6 h-6 text-background" />
                    <span className="text-xs text-background font-medium">Preview</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Channel Badge */}
              <div className="absolute top-2 left-2">
                <Badge variant="secondary" className="text-[10px] bg-background/80 backdrop-blur-sm">
                  {asset.channel}
                </Badge>
              </div>

              {/* Type Indicator */}
              <div className="absolute bottom-2 right-2">
                <div className="w-6 h-6 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center">
                  <Icon className="w-3 h-3 text-foreground" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Preview Dialog */}
      <Dialog open={!!previewAsset} onOpenChange={() => setPreviewAsset(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          {previewAsset && (
            <div className="relative">
              {/* Header */}
              <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-foreground/60 to-transparent">
                <Badge variant="secondary">{previewAsset.channel}</Badge>
                <div className="flex gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-background hover:bg-background/20"
                    onClick={() => window.open(previewAsset.url, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-background hover:bg-background/20"
                    asChild
                  >
                    <a href={previewAsset.url} download>
                      <Download className="w-4 h-4" />
                    </a>
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-background hover:bg-background/20"
                    onClick={() => setPreviewAsset(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Content */}
              <div className="flex items-center justify-center min-h-[400px] max-h-[80vh] bg-secondary">
                {previewAsset.type === 'image' ? (
                  <img
                    src={previewAsset.url}
                    alt="Preview"
                    className="max-w-full max-h-[80vh] object-contain"
                  />
                ) : previewAsset.type === 'video' ? (
                  <video
                    src={previewAsset.url}
                    controls
                    autoPlay
                    className="max-w-full max-h-[80vh]"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center py-12">
                    <FileText className="w-16 h-16 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Document Preview</p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => window.open(previewAsset.url, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open Document
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
