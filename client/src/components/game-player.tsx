import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import type { GameFile } from "@shared/schema";
import ClientInfoBadge from "./client-info-badge";
import AnimatedSettingsPanel from "./animated-settings-panel";

interface GamePlayerProps {
  currentFile: GameFile | null;
  onClose: () => void;
  onTriggerUpload: () => void;
}

export default function GamePlayer({ currentFile, onClose, onTriggerUpload }: GamePlayerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [showSettings, setShowSettings] = useState(false);

  const handleRefresh = () => {
    setIframeKey(prev => prev + 1);
  };

  const handleFullscreen = async () => {
    const iframe = document.getElementById('game-iframe');
    if (iframe) {
      try {
        if (!isFullscreen) {
          // Try different fullscreen methods for better browser compatibility
          if (iframe.requestFullscreen) {
            await iframe.requestFullscreen();
          } else if ((iframe as any).webkitRequestFullscreen) {
            await (iframe as any).webkitRequestFullscreen();
          } else if ((iframe as any).mozRequestFullScreen) {
            await (iframe as any).mozRequestFullScreen();
          } else if ((iframe as any).msRequestFullscreen) {
            await (iframe as any).msRequestFullscreen();
          }
        } else {
          // Exit fullscreen with browser compatibility
          if (document.exitFullscreen) {
            await document.exitFullscreen();
          } else if ((document as any).webkitExitFullscreen) {
            await (document as any).webkitExitFullscreen();
          } else if ((document as any).mozCancelFullScreen) {
            await (document as any).mozCancelFullScreen();
          } else if ((document as any).msExitFullscreen) {
            await (document as any).msExitFullscreen();
          }
        }
      } catch (error) {
        console.error('Fullscreen error:', error);
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      const fullscreenElement = document.fullscreenElement || 
                               (document as any).webkitFullscreenElement ||
                               (document as any).mozFullScreenElement ||
                               (document as any).msFullscreenElement;
      setIsFullscreen(!!fullscreenElement);
    };

    // Add event listeners for all browser types
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    // Keyboard shortcut for fullscreen (F11 alternative)
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'F11' || (e.ctrlKey && e.key === 'Enter')) {
        e.preventDefault();
        handleFullscreen();
      }
      // ESC to exit fullscreen
      if (e.key === 'Escape' && isFullscreen) {
        handleFullscreen();
      }
    };

    document.addEventListener('keydown', handleKeyPress);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [isFullscreen]);

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
            <div>
              <h2 className="font-semibold text-slate-200">{currentFile.originalName}</h2>
              <div className="flex items-center space-x-2 mt-1">
                <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs font-medium">
                  <i className="fas fa-circle text-green-400 text-xs mr-1"></i>
                  Running
                </span>
                <span className="text-xs text-slate-400">
                  Loaded {new Date(currentFile.uploadedAt).toLocaleDateString()}
                </span>
              </div>
              <div className="mt-2">
                <ClientInfoBadge file={currentFile} showWarnings={true} />
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              className="p-2 text-slate-400 hover:text-slate-200"
              onClick={handleRefresh}
              title="Refresh game"
            >
              <i className="fas fa-redo"></i>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="p-2 text-slate-400 hover:text-slate-200"
              onClick={() => setShowSettings(true)}
              title="Game settings"
            >
              <i className="fas fa-cog"></i>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`p-2 transition-colors ${isFullscreen 
                ? 'text-purple-400 hover:text-purple-300' 
                : 'text-slate-400 hover:text-slate-200'
              }`}
              onClick={handleFullscreen}
              title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              <i className={`fas fa-${isFullscreen ? 'compress' : 'expand'}`}></i>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="p-2 text-slate-400 hover:text-slate-200"
              onClick={onClose}
              title="Close game"
            >
              <i className="fas fa-times"></i>
            </Button>
          </div>
        </div>
      </div>

      {/* Player Area */}
      <div className="flex-1 p-4 relative">
        <div className="w-full h-full bg-black rounded-lg overflow-hidden shadow-2xl border border-[hsl(var(--gaming-border))] relative">
          <iframe
            id="game-iframe"
            key={iframeKey}
            src={`/api/files/${currentFile.id}/content`}
            className="w-full h-full border-0"
            title={currentFile.originalName}
            sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-orientation-lock allow-pointer-lock allow-popups allow-presentation"
            allowFullScreen
          />
          
          {/* Fullscreen hint overlay */}
          {!isFullscreen && (
            <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-2 rounded-lg text-sm opacity-60 hover:opacity-100 transition-opacity pointer-events-none">
              <i className="fas fa-expand mr-2"></i>
              Press F11 for fullscreen
            </div>
          )}
        </div>
      </div>

      {/* Settings Panel */}
      <AnimatedSettingsPanel 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
      />
    </>
  );
}
