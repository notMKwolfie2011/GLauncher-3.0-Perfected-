import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface FileUploadZoneProps {
  onFileUpload: (file: File) => void;
  isLoading: boolean;
}

export default function FileUploadZone({ onFileUpload, isLoading }: FileUploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const validateFile = (file: File): boolean => {
    const validTypes = ['text/html', 'application/html', 'application/zip', 'application/x-zip-compressed', 'application/octet-stream'];
    const validExtensions = ['.html', '.htm', '.zip'];
    const maxSize = 80 * 1024 * 1024; // 80MB

    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: `${file.name} is too large. Maximum size is 80MB.`,
        variant: "destructive",
      });
      return false;
    }

    const hasValidType = validTypes.includes(file.type);
    const hasValidExtension = validExtensions.some(ext => 
      file.name.toLowerCase().endsWith(ext)
    );

    if (!hasValidType && !hasValidExtension) {
      toast({
        title: "Invalid file type",
        description: `${file.name} is not a valid file. Please upload HTML or ZIP files.`,
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    if (validateFile(file)) {
      onFileUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
    // Reset the input so the same file can be selected again
    e.target.value = '';
  };

  return (
    <>
      <div
        id="upload-zone"
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 cursor-pointer ${
          isDragOver
            ? 'border-[hsl(var(--gaming-primary))] bg-[hsl(var(--gaming-primary))]/5'
            : 'border-[hsl(var(--gaming-border))] hover:border-[hsl(var(--gaming-primary))] hover:bg-[hsl(var(--gaming-primary))]/5'
        } ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <div className="upload-content">
          <i className="fas fa-cloud-upload-alt text-3xl text-slate-400 mb-3"></i>
          <p className="text-slate-300 font-medium mb-2">
            {isLoading ? 'Processing...' : 'Drop HTML or ZIP files here'}
          </p>
          <p className="text-sm text-slate-400 mb-4">
            {isLoading ? 'Extracting and processing...' : 'or click to browse'}
          </p>
          <Button
            type="button"
            className="bg-[hsl(var(--gaming-primary))] hover:bg-[hsl(var(--gaming-primary))]/80 text-white"
            disabled={isLoading}
            onClick={(e) => {
              e.stopPropagation();
              handleClick();
            }}
          >
            <i className="fas fa-folder-open mr-2"></i>
            Choose Files
          </Button>
        </div>
      </div>

      <input
        id="file-input"
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".html,.htm,.zip"
        onChange={handleInputChange}
      />
    </>
  );
}