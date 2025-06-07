import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import type { GameFile } from "@shared/schema";
import ClientInfoBadge from "./client-info-badge";
import { memo, useMemo } from "react";

interface FileListProps {
  files: GameFile[];
  currentFile: GameFile | null;
  onFileSelect: (file: GameFile) => void;
  onFileDelete: (id: number) => void;
  isLoading: boolean;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

const FileList = memo(function FileList({ files, currentFile, onFileSelect, onFileDelete, isLoading }: FileListProps) {
  // Memoize sorted files to prevent unnecessary re-renders
  const sortedFiles = useMemo(() => {
    return [...files].sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  }, [files]);

  if (files.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div id="empty-state" className="p-8 text-center text-slate-400">
          <i className="fas fa-folder-open text-4xl mb-4 opacity-50"></i>
          <p className="font-medium mb-2">No files uploaded</p>
          <p className="text-sm">Upload HTML client files to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {sortedFiles.map((file) => (
        <div
          key={file.id}
          className={`file-item p-4 border-b border-[hsl(var(--gaming-border))]/50 hover:bg-[hsl(var(--gaming-border))]/10 cursor-pointer transition-colors ${
            currentFile?.id === file.id ? 'bg-[hsl(var(--gaming-primary))]/10 border-l-2 border-l-[hsl(var(--gaming-primary))]' : ''
          }`}
          onClick={() => onFileSelect(file)}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-slate-200 truncate">{file.originalName}</p>
              <p className="text-sm text-slate-400">
                {formatFileSize(file.size)} • Uploaded {formatDistanceToNow(new Date(file.uploadedAt), { addSuffix: true })}
              </p>
              <div className="mt-2">
                <ClientInfoBadge file={file} />
              </div>
            </div>
            <div className="flex items-center space-x-2 ml-2">
              <Button
                variant="ghost"
                size="sm"
                className="p-1 text-[hsl(var(--gaming-primary))] hover:text-[hsl(var(--gaming-primary))]/80 h-auto"
                onClick={(e) => {
                  e.stopPropagation();
                  onFileSelect(file);
                }}
              >
                <i className="fas fa-play"></i>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="p-1 text-red-400 hover:text-red-300 h-auto"
                onClick={(e) => {
                  e.stopPropagation();
                  onFileDelete(file.id);
                }}
                disabled={isLoading}
              >
                <i className="fas fa-trash"></i>
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
});

export default FileList;