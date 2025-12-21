import { useState, useCallback } from "react";
import { Upload, X, Image as ImageIcon, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface FileUploadZoneProps {
  files: string[];
  onFilesChange: (files: string[]) => void;
  maxFiles?: number;
  acceptedTypes?: string[];
  className?: string;
}

interface FilePreview {
  url: string;
  name: string;
}

export function FileUploadZone({
  files,
  onFilesChange,
  maxFiles = 10,
  acceptedTypes = ["image/png", "image/jpeg", "image/jpg"],
  className,
}: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [previews, setPreviews] = useState<FilePreview[]>([]);
  const { toast } = useToast();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const validateFile = (file: File): boolean => {
    if (!acceptedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: `Only ${acceptedTypes.map(t => t.split('/')[1]).join(', ')} files are allowed.`,
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const processFiles = async (fileList: FileList) => {
    const remainingSlots = maxFiles - files.length;
    if (remainingSlots <= 0) {
      toast({
        title: "Upload limit reached",
        description: `Maximum ${maxFiles} files allowed.`,
        variant: "destructive",
      });
      return;
    }

    const validFiles: File[] = [];
    for (let i = 0; i < Math.min(fileList.length, remainingSlots); i++) {
      if (validateFile(fileList[i])) {
        validFiles.push(fileList[i]);
      }
    }

    // Create local previews (in production, these would be uploaded to storage)
    const newPreviews: FilePreview[] = [];
    const newUrls: string[] = [];

    for (const file of validFiles) {
      const url = URL.createObjectURL(file);
      newPreviews.push({ url, name: file.name });
      newUrls.push(url);
    }

    setPreviews(prev => [...prev, ...newPreviews]);
    onFilesChange([...files, ...newUrls]);
  };

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    await processFiles(e.dataTransfer.files);
  }, [files, maxFiles]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      await processFiles(e.target.files);
    }
  };

  const removeFile = (index: number) => {
    const newFiles = [...files];
    const newPreviews = [...previews];
    
    // Revoke object URL to prevent memory leaks
    if (newPreviews[index]) {
      URL.revokeObjectURL(newPreviews[index].url);
    }
    
    newFiles.splice(index, 1);
    newPreviews.splice(index, 1);
    
    setPreviews(newPreviews);
    onFilesChange(newFiles);
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200",
          "hover:border-primary/50 hover:bg-primary/5",
          isDragging && "border-primary bg-primary/10",
          files.length >= maxFiles && "opacity-50 pointer-events-none"
        )}
      >
        <input
          type="file"
          id="file-upload"
          className="hidden"
          multiple
          accept={acceptedTypes.join(",")}
          onChange={handleFileSelect}
          disabled={files.length >= maxFiles}
        />
        <label
          htmlFor="file-upload"
          className="flex flex-col items-center gap-3 cursor-pointer"
        >
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Upload className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="font-medium text-foreground">
              Drop files here or click to upload
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              PNG, JPEG up to 10MB • {files.length}/{maxFiles} files
            </p>
          </div>
        </label>
      </div>

      {/* File Previews */}
      {previews.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {previews.map((preview, index) => (
            <div
              key={index}
              className="relative group rounded-lg overflow-hidden border bg-muted aspect-square"
            >
              <img
                src={preview.url}
                alt={preview.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button
                  variant="destructive"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => removeFile(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-foreground/80 px-2 py-1">
                <p className="text-xs text-background truncate">{preview.name}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {previews.length === 0 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ImageIcon className="h-4 w-4" />
          <span>No files uploaded yet</span>
        </div>
      )}
    </div>
  );
}
