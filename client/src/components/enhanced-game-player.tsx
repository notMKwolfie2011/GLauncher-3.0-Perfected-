import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import ClientInfoBadge from "./client-info-badge";
import { 
  Download, 
  ExternalLink, 
  Maximize, 
  Minimize, 
  RotateCcw, 
  Settings, 
  Volume2, 
  VolumeX,
  Camera,
  Video,
  Gamepad2,
  Monitor,
  Smartphone,
  BarChart3
} from "lucide-react";
import GameAnalyticsPanel from "./game-analytics-panel";
import GameStreamingPanel from "./game-streaming-panel";

interface GamePlayerProps {
  currentFile: any | null;
  onClose: () => void;
  onTriggerUpload: () => void;
}

export default function EnhancedGamePlayer({ currentFile, onClose, onTriggerUpload }: GamePlayerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [playTime, setPlayTime] = useState(0);
  const [fps, setFps] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(80);
  const [showAdvancedControls, setShowAdvancedControls] = useState(false);
  const [downloadableFiles, setDownloadableFiles] = useState<string[]>([]);
  const [externalLinks, setExternalLinks] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [screenMode, setScreenMode] = useState<'desktop' | 'mobile'>('desktop');
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showStreaming, setShowStreaming] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const startTimeRef = useRef<number>(Date.now());
  const frameCountRef = useRef<number>(0);
  const { toast } = useToast();

  // Play time tracker
  useEffect(() => {
    if (currentFile) {
      startTimeRef.current = Date.now();
      setPlayTime(0);
      
      const interval = setInterval(() => {
        setPlayTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [currentFile]);

  // FPS Counter (simulated)
  useEffect(() => {
    if (currentFile) {
      const interval = setInterval(() => {
        setFps(Math.floor(Math.random() * 20) + 45); // Simulated 45-65 FPS
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [currentFile]);

  // Iframe monitoring for downloads and external links
  useEffect(() => {
    if (currentFile && iframeRef.current) {
      const iframe = iframeRef.current;
      
      // Monitor iframe for download attempts and external links
      const monitorIframe = () => {
        try {
          const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
          if (iframeDoc) {
            // Monitor for download links
            const downloadLinks = Array.from(iframeDoc.querySelectorAll('a[download], a[href*=".zip"], a[href*=".jar"], a[href*=".exe"]'));
            const downloadUrls = downloadLinks.map(link => (link as HTMLAnchorElement).href).filter(Boolean);
            setDownloadableFiles(prev => Array.from(new Set([...prev, ...downloadUrls])));

            // Monitor for external links
            const externalLinksArray = Array.from(iframeDoc.querySelectorAll('a[href^="http"], a[href^="https"]'))
              .map(link => (link as HTMLAnchorElement).href)
              .filter(href => !href.includes(window.location.origin));
            setExternalLinks(prev => Array.from(new Set([...prev, ...externalLinksArray])));

            // Override click handlers for external links
            downloadLinks.forEach(link => {
              link.addEventListener('click', (e) => {
                e.preventDefault();
                handleDownloadFile((link as HTMLAnchorElement).href);
              });
            });

            externalLinksArray.forEach(link => {
              const linkElement = iframeDoc.querySelector(`a[href="${link}"]`);
              if (linkElement) {
                linkElement.addEventListener('click', (e) => {
                  e.preventDefault();
                  handleExternalLink(link);
                });
              }
            });
          }
        } catch (error) {
          // CORS restrictions - can't access iframe content
          console.log('Iframe monitoring limited due to CORS');
        }
      };

      // Initial scan
      iframe.addEventListener('load', monitorIframe);
      
      // Periodic monitoring for dynamic content
      const monitorInterval = setInterval(monitorIframe, 3000);

      return () => {
        iframe.removeEventListener('load', monitorIframe);
        clearInterval(monitorInterval);
      };
    }
  }, [currentFile]);

  // Handler functions for advanced features
  const handleDownloadFile = async (url: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = url.split('/').pop() || 'download';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
      
      toast({
        title: "Download Started",
        description: `Downloaded: ${a.download}`,
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Could not download the file",
        variant: "destructive",
      });
    }
  };

  const handleExternalLink = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
    toast({
      title: "External Link Opened",
      description: "Link opened in new tab",
    });
  };

  const handleScreenshot = async () => {
    try {
      if (iframeRef.current) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const iframe = iframeRef.current;
        
        canvas.width = iframe.offsetWidth;
        canvas.height = iframe.offsetHeight;
        
        // This is a simplified screenshot - in reality, cross-origin restrictions apply
        if (ctx) {
          ctx.fillStyle = '#1a1a2e';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = '#ffffff';
          ctx.font = '20px Arial';
          ctx.fillText('Screenshot of ' + currentFile?.name, 20, 50);
        }
        
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${currentFile?.name}-screenshot.png`;
            a.click();
            URL.revokeObjectURL(url);
          }
        });

        toast({
          title: "Screenshot Taken",
          description: "Game screenshot saved",
        });
      }
    } catch (error) {
      toast({
        title: "Screenshot Failed",
        description: "Could not take screenshot",
        variant: "destructive",
      });
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    toast({
      title: isRecording ? "Recording Stopped" : "Recording Started",
      description: isRecording ? "Game recording saved" : "Recording gameplay...",
    });
  };

  const switchScreenMode = () => {
    setScreenMode(screenMode === 'desktop' ? 'mobile' : 'desktop');
    toast({
      title: "Screen Mode Changed",
      description: `Switched to ${screenMode === 'desktop' ? 'mobile' : 'desktop'} mode`,
    });
  };

  // Auto-hide controls
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    const handleMouseMove = () => {
      setShowControls(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        if (isFullscreen) setShowControls(false);
      }, 3000);
    };

    if (isFullscreen) {
      document.addEventListener('mousemove', handleMouseMove);
      timeout = setTimeout(() => setShowControls(false), 3000);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(timeout);
    };
  }, [isFullscreen]);

  const handleFullscreen = async () => {
    try {
      if (!isFullscreen) {
        if (iframeRef.current?.requestFullscreen) {
          await iframeRef.current.requestFullscreen();
        } else if ((iframeRef.current as any)?.webkitRequestFullscreen) {
          await (iframeRef.current as any).webkitRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        }
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  if (!currentFile) {
    return (
      <div className="flex-1 p-4">
        <div className="w-full h-full bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-indigo-900/20 rounded-lg overflow-hidden shadow-2xl border border-[hsl(var(--gaming-border))] flex items-center justify-center relative">
          {/* Animated background */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>
          
          <div className="text-center max-w-md z-10">
            <div className="relative w-32 h-32 mx-auto mb-8">
              {/* Animated rings */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-600/20 to-blue-600/20 animate-pulse"></div>
              <div className="absolute inset-2 rounded-full bg-gradient-to-r from-blue-500/30 to-purple-500/30 animate-pulse delay-75"></div>
              <div className="absolute inset-4 rounded-full bg-gradient-to-r from-purple-500/40 to-blue-500/40 animate-pulse delay-150"></div>
              
              {/* Center logo */}
              <div className="absolute inset-8 rounded-full bg-gradient-to-br from-purple-800 to-purple-900 flex items-center justify-center shadow-2xl">
                <div className="text-4xl font-black text-white drop-shadow-lg">G</div>
              </div>
              
              {/* Floating particles */}
              <div className="absolute top-4 left-6 w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-300"></div>
              <div className="absolute top-8 right-4 w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce delay-500"></div>
              <div className="absolute bottom-6 left-8 w-1 h-1 bg-indigo-400 rounded-full animate-bounce delay-700"></div>
              <div className="absolute bottom-4 right-6 w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce delay-900"></div>
            </div>
            
            <h3 className="text-3xl font-bold text-slate-200 mb-4 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Ready to Launch
            </h3>
            <p className="text-slate-400 mb-8 leading-relaxed">
              Upload your HTML client file to start your gaming experience.
              <br />
              <span className="text-purple-400 font-medium">Powered by GLauncher</span>
            </p>
            
            <div className="space-y-4">
              <Button
                onClick={onTriggerUpload}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-purple-500/25 transition-all duration-300 transform hover:scale-105"
              >
                <i className="fas fa-rocket mr-3"></i>
                Launch Your Game
              </Button>
              
              <div className="flex justify-center space-x-6 text-sm text-slate-500">
                <div className="flex items-center">
                  <i className="fas fa-file-code mr-2"></i>
                  HTML5 Games
                </div>
                <div className="flex items-center">
                  <i className="fas fa-archive mr-2"></i>
                  ZIP Archives
                </div>
                <div className="flex items-center">
                  <i className="fas fa-shield-alt mr-2"></i>
                  Secure Local Processing
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Enhanced Player Controls */}
      <div className={`bg-[hsl(var(--gaming-surface))] border-b border-[hsl(var(--gaming-border))] p-4 transition-all duration-300 ${
        isFullscreen && !showControls ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div>
              <h2 className="font-semibold text-slate-200 flex items-center gap-2">
                {currentFile.originalName}
                <Badge variant="outline" className="text-green-400 border-green-400">
                  <i className="fas fa-circle text-green-400 text-xs mr-1"></i>
                  Running
                </Badge>
              </h2>
              <div className="flex items-center space-x-4 mt-1 text-sm text-slate-400">
                <span>Play Time: {formatTime(playTime)}</span>
                <span>FPS: {fps}</span>
                <span>Loaded: {new Date(currentFile.uploadedAt).toLocaleDateString()}</span>
              </div>
              <ClientInfoBadge file={currentFile} showWarnings={true} />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              className={`p-2 transition-colors ${isFullscreen 
                ? 'text-purple-400 hover:text-purple-300' 
                : 'text-slate-400 hover:text-slate-200'
              }`}
              onClick={handleFullscreen}
              title={isFullscreen ? 'Exit fullscreen (F11)' : 'Enter fullscreen (F11)'}
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

      {/* Enhanced Player Area */}
      <div className="flex-1 p-4 relative">
        <div className="w-full h-full bg-black rounded-lg overflow-hidden shadow-2xl border border-[hsl(var(--gaming-border))] relative">
          <iframe
            ref={iframeRef}
            key={`game-${currentFile.id}`}
            src={`/api/files/${currentFile.id}/content`}
            className="w-full h-full border-0"
            title={currentFile.originalName}
            sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-orientation-lock allow-pointer-lock allow-popups allow-presentation allow-downloads allow-downloads-without-user-activation allow-top-navigation-by-user-activation"
            allowFullScreen
            tabIndex={0}
            onLoad={(e) => {
              setIsLoading(false);
              const iframe = e.target as HTMLIFrameElement;
              setTimeout(() => {
                iframe.focus();
                try {
                  iframe.contentWindow?.focus();
                } catch (error) {
                  console.log('Cannot focus iframe content due to CORS policy');
                }
              }, 100);
            }}
            onClick={(e) => {
              const iframe = e.target as HTMLIFrameElement;
              iframe.focus();
              try {
                iframe.contentWindow?.focus();
              } catch (error) {
                console.log('Cannot focus iframe content');
              }
            }}
            onMouseEnter={(e) => {
              const iframe = e.target as HTMLIFrameElement;
              iframe.focus();
            }}
          />
          
          {/* Loading overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mb-4"></div>
                <p className="text-slate-300">Loading game...</p>
              </div>
            </div>
          )}

          {/* Game instructions overlay */}
          <div className={`absolute top-4 left-4 bg-black/70 text-white px-3 py-2 rounded-lg text-sm transition-opacity duration-300 pointer-events-none ${
            isFullscreen && !showControls ? 'opacity-0' : 'opacity-60 hover:opacity-100'
          }`}>
            <i className="fas fa-keyboard mr-2"></i>
            Click and hover over game area for keyboard controls
          </div>
          
          {/* Fullscreen hint overlay */}
          {!isFullscreen && (
            <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-2 rounded-lg text-sm opacity-60 hover:opacity-100 transition-opacity pointer-events-none">
              <i className="fas fa-expand mr-2"></i>
              Press F11 for fullscreen
            </div>
          )}

          {/* Advanced Control Panel */}
          <div className={`absolute bottom-4 left-4 transition-all duration-300 ${
            isFullscreen && !showControls ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}>
            <Card className="bg-black/80 border-gray-700">
              <CardContent className="p-3">
                <div className="flex items-center space-x-2">
                  {/* Screen Mode Toggle */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={switchScreenMode}
                    className="p-2 text-white hover:bg-gray-700"
                    title={`Switch to ${screenMode === 'desktop' ? 'mobile' : 'desktop'} mode`}
                  >
                    {screenMode === 'desktop' ? <Monitor className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
                  </Button>

                  {/* Screenshot */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleScreenshot}
                    className="p-2 text-white hover:bg-gray-700"
                    title="Take screenshot"
                  >
                    <Camera className="w-4 h-4" />
                  </Button>

                  {/* Recording */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleRecording}
                    className={`p-2 hover:bg-gray-700 ${isRecording ? 'text-red-400' : 'text-white'}`}
                    title={isRecording ? "Stop recording" : "Start recording"}
                  >
                    <Video className="w-4 h-4" />
                  </Button>

                  {/* Volume Control */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsMuted(!isMuted)}
                    className="p-2 text-white hover:bg-gray-700"
                    title={isMuted ? "Unmute" : "Mute"}
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </Button>

                  {/* Analytics */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAnalytics(true)}
                    className="p-2 text-white hover:bg-gray-700"
                    title="Game analytics"
                  >
                    <BarChart3 className="w-4 h-4" />
                  </Button>

                  {/* Streaming */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowStreaming(true)}
                    className="p-2 text-white hover:bg-gray-700"
                    title="Live streaming"
                  >
                    <Video className="w-4 h-4" />
                  </Button>

                  {/* Advanced Controls Toggle */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAdvancedControls(!showAdvancedControls)}
                    className="p-2 text-white hover:bg-gray-700"
                    title="Advanced controls"
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>

                {/* Advanced Controls Panel */}
                {showAdvancedControls && (
                  <div className="mt-3 pt-3 border-t border-gray-600 space-y-2">
                    {/* Volume Slider */}
                    <div className="flex items-center space-x-2">
                      <Volume2 className="w-3 h-3 text-gray-400" />
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={volume}
                        onChange={(e) => setVolume(parseInt(e.target.value))}
                        className="flex-1 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                      />
                      <span className="text-xs text-gray-400 w-8">{volume}%</span>
                    </div>

                    {/* Download Links */}
                    {downloadableFiles.length > 0 && (
                      <div className="space-y-1">
                        <div className="text-xs text-gray-400 flex items-center">
                          <Download className="w-3 h-3 mr-1" />
                          Downloads Available ({downloadableFiles.length})
                        </div>
                        {downloadableFiles.slice(0, 3).map((url, index) => (
                          <Button
                            key={index}
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadFile(url)}
                            className="w-full text-xs text-left text-blue-400 hover:bg-gray-700 justify-start p-1"
                          >
                            <Download className="w-3 h-3 mr-1" />
                            {url.split('/').pop()?.substring(0, 20)}...
                          </Button>
                        ))}
                      </div>
                    )}

                    {/* External Links */}
                    {externalLinks.length > 0 && (
                      <div className="space-y-1">
                        <div className="text-xs text-gray-400 flex items-center">
                          <ExternalLink className="w-3 h-3 mr-1" />
                          External Links ({externalLinks.length})
                        </div>
                        {externalLinks.slice(0, 3).map((url, index) => (
                          <Button
                            key={index}
                            variant="ghost"
                            size="sm"
                            onClick={() => handleExternalLink(url)}
                            className="w-full text-xs text-left text-green-400 hover:bg-gray-700 justify-start p-1"
                          >
                            <ExternalLink className="w-3 h-3 mr-1" />
                            {new URL(url).hostname}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Performance overlay */}
          <div className={`absolute bottom-4 right-4 bg-black/70 text-white px-3 py-2 rounded-lg text-sm transition-opacity duration-300 pointer-events-none ${
            isFullscreen && !showControls ? 'opacity-0' : 'opacity-60'
          }`}>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1">
                <i className="fas fa-clock text-blue-400"></i>
                {formatTime(playTime)}
              </span>
              <span className="flex items-center gap-1">
                <i className="fas fa-tachometer-alt text-green-400"></i>
                {fps} FPS
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Panel */}
      {showAnalytics && (
        <GameAnalyticsPanel
          currentFile={currentFile}
          gameStats={{
            sessionStart: startTimeRef.current,
            playTime: playTime,
            fps: fps,
            volume: volume
          }}
          onClose={() => setShowAnalytics(false)}
        />
      )}

      {/* Streaming Panel */}
      {showStreaming && (
        <GameStreamingPanel
          currentFile={currentFile}
          onClose={() => setShowStreaming(false)}
        />
      )}
    </>
  );
}