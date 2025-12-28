import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  FileText, 
  Image, 
  X, 
  ExternalLink, 
  Maximize2,
  ZoomIn,
  ZoomOut,
  Download,
  File,
} from 'lucide-react';

interface Document {
  id: string;
  name: string;
  url: string;
  type: 'pdf' | 'image' | 'doc';
}

interface DocumentPreviewerProps {
  documents: Document[];
  selectedDocument: Document | null;
  onSelectDocument: (doc: Document | null) => void;
}

export function DocumentPreviewer({ 
  documents, 
  selectedDocument, 
  onSelectDocument 
}: DocumentPreviewerProps) {
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [zoom, setZoom] = useState(100);

  const getDocumentIcon = (type: Document['type']) => {
    switch (type) {
      case 'pdf': return <FileText className="h-4 w-4 text-red-500" />;
      case 'image': return <Image className="h-4 w-4 text-[hsl(var(--pulse-blue))]" />;
      default: return <File className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const renderPreview = (doc: Document, fullscreen = false) => {
    const containerClass = fullscreen 
      ? 'w-full h-[80vh]' 
      : 'w-full h-[400px]';

    if (doc.type === 'pdf') {
      return (
        <iframe
          src={doc.url}
          className={`${containerClass} border-0`}
          title={doc.name}
          style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top left' }}
        />
      );
    }

    if (doc.type === 'image') {
      return (
        <div className={`${containerClass} flex items-center justify-center bg-muted/50 overflow-auto`}>
          <img
            src={doc.url}
            alt={doc.name}
            className="max-w-full max-h-full object-contain"
            style={{ transform: `scale(${zoom / 100})` }}
          />
        </div>
      );
    }

    return (
      <div className={`${containerClass} flex flex-col items-center justify-center bg-muted/50`}>
        <File className="h-16 w-16 text-muted-foreground mb-4" />
        <p className="text-muted-foreground text-sm">Preview not available</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4 rounded-none"
          onClick={() => window.open(doc.url, '_blank')}
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Open in new tab
        </Button>
      </div>
    );
  };

  return (
    <Card className="rounded-none border-border/50 overflow-hidden">
      {/* Header */}
      <div className="p-3 bg-[hsl(var(--medical-slate))] text-[hsl(var(--medical-slate-foreground))]">
        <h3 className="font-semibold text-sm">Document Viewer</h3>
        <p className="text-xs opacity-75">Lab COAs & Clinical Trials</p>
      </div>

      {/* Document List */}
      <ScrollArea className="h-32 border-b border-border/50">
        <div className="p-2 space-y-1">
          {documents.length === 0 ? (
            <div className="py-4 text-center text-muted-foreground text-sm">
              No documents uploaded
            </div>
          ) : (
            documents.map((doc) => (
              <button
                key={doc.id}
                onClick={() => onSelectDocument(doc)}
                className={`w-full flex items-center gap-2 p-2 text-left text-sm transition-colors ${
                  selectedDocument?.id === doc.id
                    ? 'bg-[hsl(var(--pulse-blue-light))] border-l-2 border-[hsl(var(--pulse-blue))]'
                    : 'hover:bg-muted/50'
                }`}
              >
                {getDocumentIcon(doc.type)}
                <span className="truncate flex-1">{doc.name}</span>
              </button>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Preview Area */}
      {selectedDocument ? (
        <div className="relative">
          {/* Toolbar */}
          <div className="absolute top-2 right-2 z-10 flex items-center gap-1 bg-background/90 backdrop-blur-sm border border-border/50 p-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-none"
              onClick={() => setZoom(Math.max(50, zoom - 25))}
              disabled={zoom <= 50}
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </Button>
            <span className="text-xs px-2 min-w-[3rem] text-center">{zoom}%</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-none"
              onClick={() => setZoom(Math.min(200, zoom + 25))}
              disabled={zoom >= 200}
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>
            <div className="w-px h-4 bg-border/50 mx-1" />
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-none"
              onClick={() => setShowFullscreen(true)}
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-none"
              onClick={() => window.open(selectedDocument.url, '_blank')}
            >
              <Download className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-none"
              onClick={() => onSelectDocument(null)}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>

          {renderPreview(selectedDocument)}
        </div>
      ) : (
        <div className="h-[400px] flex flex-col items-center justify-center bg-[hsl(210,20%,98%)] text-muted-foreground">
          <FileText className="h-12 w-12 mb-3 opacity-40" />
          <p className="text-sm font-medium">Select a document to preview</p>
          <p className="text-xs mt-1">View Lab COAs, Clinical Trials, and more</p>
        </div>
      )}

      {/* Fullscreen Dialog */}
      <Dialog open={showFullscreen} onOpenChange={setShowFullscreen}>
        <DialogContent className="rounded-none max-w-[95vw] max-h-[95vh] p-0">
          <DialogHeader className="p-4 bg-[hsl(var(--medical-slate))] text-[hsl(var(--medical-slate-foreground))]">
            <DialogTitle className="flex items-center gap-2">
              {selectedDocument && getDocumentIcon(selectedDocument.type)}
              {selectedDocument?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="p-4">
            {selectedDocument && renderPreview(selectedDocument, true)}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
