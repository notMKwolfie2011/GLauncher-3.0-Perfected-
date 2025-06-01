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
            <div className="relative w-32 h-32 mx-auto mb-8">
              {/* Animated background rings */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-600/20 to-blue-600/20 animate-pulse"></div>
              <div className="absolute inset-2 rounded-full bg-gradient-to-r from-blue-500/30 to-purple-500/30 animate-pulse delay-75"></div>
              <div className="absolute inset-4 rounded-full bg-gradient-to-r from-purple-500/40 to-blue-500/40 animate-pulse delay-150"></div>
              
              {/* Center logo with glow effect */}
              <div className="absolute inset-8 rounded-full gaming-gradient flex items-center justify-center shadow-2xl">
                <div className="text-4xl font-black text-white drop-shadow-lg">
                  G
                </div>
              </div>
              
              {/* Floating particles */}
              <div className="absolute top-4 left-6 w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-300"></div>
              <div className="absolute top-8 right-4 w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce delay-500"></div>
              <div className="absolute bottom-6 left-8 w-1 h-1 bg-cyan-400 rounded-full animate-bounce delay-700"></div>
              <div className="absolute bottom-4 right-6 w-2 h-2 bg-violet-400 rounded-full animate-bounce delay-1000"></div>
            </div>
            
            <h3 className="text-3xl font-bold text-slate-200 mb-4 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Ready to Launch
            </h3>
            <p className="text-slate-400 mb-8 leading-relaxed">
              Upload your HTML client file to start your gaming experience. 
              <br />
              <span className="text-purple-400 font-medium">Powered by GLauncher</span>
            </p>
            <Button
              onClick={onTriggerUpload}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-purple-500/25 transition-all duration-300 transform hover:scale-105"
            >
              <i className="fas fa-rocket mr-3"></i>
              Launch Your Game
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
