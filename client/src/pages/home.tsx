import { useState } from "react";
import AppHeader from "@/components/app-header";
import FileUploadZone from "@/components/file-upload-zone";
import FileList from "@/components/file-list";
import GamePlayer from "@/components/game-player";
import { useFiles } from "@/hooks/use-files";
import type { GameFile } from "@shared/schema";

export default function Home() {
  const [currentFile, setCurrentFile] = useState<GameFile | null>(null);
  const { files, isLoading, uploadFile, deleteFile, clearAllFiles } = useFiles();

  const handleFileSelect = (file: GameFile) => {
    setCurrentFile(file);
  };

  const handleClosePlayer = () => {
    setCurrentFile(null);
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--gaming-dark))] text-slate-50">
      <AppHeader fileCount={files?.length || 0} onClearAll={clearAllFiles} />
      
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar */}
        <aside className="w-80 bg-[hsl(var(--gaming-surface))] border-r border-[hsl(var(--gaming-border))] flex flex-col overflow-hidden">
          {/* Upload Section */}
          <div className="p-6 border-b border-[hsl(var(--gaming-border))]">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <i className="fas fa-upload mr-2 text-[hsl(var(--gaming-primary))]"></i>
              Upload Client
            </h2>
            
            <FileUploadZone onFileUpload={uploadFile} isLoading={isLoading} />
            
            <div className="mt-4 text-xs text-slate-400">
              <p><i className="fas fa-info-circle mr-1"></i> Supports HTML and ZIP files up to 50MB</p>
              <p><i className="fas fa-magic mr-1"></i> ZIP files are auto-extracted with main HTML detection</p>
              <p><i className="fas fa-shield-alt mr-1"></i> Files are processed locally</p>
            </div>
          </div>

          {/* File List Section */}
          <div className="flex-1 flex flex-col">
            <div className="p-4 border-b border-[hsl(var(--gaming-border))]">
              <h3 className="font-semibold flex items-center justify-between">
                <span><i className="fas fa-files mr-2 text-[hsl(var(--gaming-secondary))]"></i>Uploaded Files</span>
                {files && files.length > 0 && (
                  <button 
                    onClick={clearAllFiles}
                    className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1 rounded hover:bg-[hsl(var(--gaming-border))] transition-colors"
                  >
                    <i className="fas fa-trash-alt mr-1"></i>Clear All
                  </button>
                )}
              </h3>
            </div>
            
            <FileList
              files={files || []}
              currentFile={currentFile}
              onFileSelect={handleFileSelect}
              onFileDelete={deleteFile}
              isLoading={isLoading}
            />
          </div>
        </aside>

        {/* Main Player */}
        <main className="flex-1 bg-[hsl(var(--gaming-dark))] flex flex-col">
          <GamePlayer
            currentFile={currentFile}
            onClose={handleClosePlayer}
            onTriggerUpload={() => document.getElementById('file-input')?.click()}
          />
        </main>
      </div>
    </div>
  );
}
