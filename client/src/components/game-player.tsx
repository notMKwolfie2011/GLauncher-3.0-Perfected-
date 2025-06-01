import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import type { GameFile } from "@shared/schema";

interface GamePlayerProps {
  currentFile: GameFile | null;
  onClose: () => void;
  onTriggerUpload: () => void;
}

export default function GamePlayer({ currentFile, onClose, onTriggerUpload }: GamePlayerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  const handleRefresh = () => {
    setIframeKey(prev => prev + 1);
  };

  const handleFullscreen = () => {
    const iframe = document.getElementById('game-iframe');
    if (iframe) {
      if (!isFullscreen) {
        iframe.requestFullscreen?.();
        setIsFullscreen(true);
      } else {
        document.exitFullscreen?.();
        setIsFullscreen(false);
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  if (!currentFile) {
    return (
      <div className="flex-1 p-4">
        <div className="w-full h-full bg-black rounded-lg overflow-hidden shadow-2xl border border-[hsl(var(--gaming-border))] flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="w-24 h-24 gaming-gradient rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="fas fa-gamepad text-3xl text-white"></i>
            </div>
            <h3 className="text-2xl font-bold text-slate-200 mb-4">Ready to Play</h3>
            <p className="text-slate-400 mb-6">
              Upload an Eaglercraft HTML client file to start playing. Your games will run directly in your browser with full functionality.
            </p>
            <Button
              onClick={onTriggerUpload}
              className="bg-[hsl(var(--gaming-primary))] hover:bg-[hsl(var(--gaming-primary))]/80 text-white"
            >
              <i className="fas fa-upload mr-2"></i>
              Upload Your First Game
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Player Controls */}
      <div className="bg-[hsl(var(--gaming-surface))] border-b border-[hsl(var(--gaming-border))] p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="font-semibold text-slate-200">{currentFile.originalName}</h2>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs font-medium">
                <i className="fas fa-circle text-green-400 text-xs mr-1"></i>
                Running
              </span>
              <span className="text-xs text-slate-400">
                Loaded {new Date(currentFile.uploadedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              className="p-2 text-slate-400 hover:text-slate-200"
              onClick={handleRefresh}
            >
              <i className="fas fa-redo"></i>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="p-2 text-slate-400 hover:text-slate-200"
              onClick={handleFullscreen}
            >
              <i className={`fas fa-${isFullscreen ? 'compress' : 'expand'}`}></i>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="p-2 text-slate-400 hover:text-slate-200"
              onClick={onClose}
            >
              <i className="fas fa-times"></i>
            </Button>
          </div>
        </div>
      </div>

      {/* Player Area */}
      <div className="flex-1 p-4">
        <div className="w-full h-full bg-black rounded-lg overflow-hidden shadow-2xl border border-[hsl(var(--gaming-border))]">
          <iframe
            id="game-iframe"
            key={iframeKey}
            src={`/api/files/${currentFile.id}/content`}
            className="w-full h-full"
            title={currentFile.originalName}
            sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-orientation-lock allow-pointer-lock allow-popups allow-presentation"
          />
        </div>
      </div>
    </>
  );
}
