import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Video, 
  Wifi, 
  Users, 
  Share2, 
  Settings,
  Monitor,
  Mic,
  MicOff,
  Camera,
  CameraOff,
  Square,
  Play,
  Pause
} from "lucide-react";

interface GameStreamingProps {
  currentFile: any;
  onClose: () => void;
}

export default function GameStreamingPanel({ currentFile, onClose }: GameStreamingProps) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [viewers, setViewers] = useState(0);
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [streamQuality, setStreamQuality] = useState<'720p' | '1080p' | '4K'>('1080p');
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('disconnected');
  const [streamKey, setStreamKey] = useState('');
  
  const streamPreviewRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Generate a random stream key
    setStreamKey(`glauncher_${Math.random().toString(36).substring(2, 15)}`);
    
    // Simulate viewer count changes
    if (isStreaming) {
      const interval = setInterval(() => {
        setViewers(prev => {
          const change = Math.floor(Math.random() * 5) - 2; // -2 to +2
          return Math.max(0, prev + change);
        });
      }, 3000);
      
      return () => clearInterval(interval);
    }
  }, [isStreaming]);

  const startStreaming = async () => {
    try {
      setConnectionStatus('connecting');
      
      // Simulate getting user media
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { 
          width: streamQuality === '4K' ? 3840 : streamQuality === '1080p' ? 1920 : 1280,
          height: streamQuality === '4K' ? 2160 : streamQuality === '1080p' ? 1080 : 720
        },
        audio: micEnabled
      });
      
      if (streamPreviewRef.current) {
        streamPreviewRef.current.srcObject = stream;
      }
      
      setIsStreaming(true);
      setConnectionStatus('connected');
      setViewers(Math.floor(Math.random() * 10) + 1);
      
      toast({
        title: "Stream Started",
        description: `Broadcasting ${currentFile?.name} in ${streamQuality}`,
      });
      
      // Handle stream end
      stream.getVideoTracks()[0].addEventListener('ended', () => {
        stopStreaming();
      });
      
    } catch (error) {
      setConnectionStatus('disconnected');
      toast({
        title: "Stream Failed",
        description: "Could not start stream. Check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopStreaming = () => {
    if (streamPreviewRef.current?.srcObject) {
      const stream = streamPreviewRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      streamPreviewRef.current.srcObject = null;
    }
    
    setIsStreaming(false);
    setConnectionStatus('disconnected');
    setViewers(0);
    
    toast({
      title: "Stream Ended",
      description: "Stream has been stopped",
    });
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    toast({
      title: isRecording ? "Recording Stopped" : "Recording Started",
      description: isRecording ? "Recording saved to downloads" : "Recording gameplay...",
    });
  };

  const shareStream = async () => {
    const shareUrl = `https://glauncher.stream/${streamKey}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${currentFile?.name} - Live Stream`,
          text: `Watch me play ${currentFile?.name} live!`,
          url: shareUrl,
        });
      } catch (error) {
        // Fall back to clipboard
        navigator.clipboard.writeText(shareUrl);
        toast({
          title: "Stream Link Copied",
          description: "Stream URL copied to clipboard",
        });
      }
    } else {
      // Fall back to clipboard
      navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Stream Link Copied",
        description: "Stream URL copied to clipboard",
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-700">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-bold text-white flex items-center">
            <Video className="w-6 h-6 mr-2 text-red-400" />
            Live Streaming & Recording
            {isStreaming && (
              <Badge className="ml-2 bg-red-500 text-white animate-pulse">
                LIVE
              </Badge>
            )}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            ×
          </Button>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Stream Preview */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <span className="flex items-center">
                  <Monitor className="w-5 h-5 mr-2 text-blue-400" />
                  Stream Preview
                </span>
                <div className="flex items-center space-x-2">
                  <Badge 
                    variant="outline" 
                    className={connectionStatus === 'connected' ? 'text-green-400 border-green-400' : 
                               connectionStatus === 'connecting' ? 'text-yellow-400 border-yellow-400' : 
                               'text-red-400 border-red-400'}
                  >
                    {connectionStatus === 'connected' && <Wifi className="w-3 h-3 mr-1" />}
                    {connectionStatus.toUpperCase()}
                  </Badge>
                  {isStreaming && (
                    <Badge className="bg-blue-500 text-white">
                      <Users className="w-3 h-3 mr-1" />
                      {viewers} viewers
                    </Badge>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
                <video
                  ref={streamPreviewRef}
                  autoPlay
                  muted
                  className="w-full h-full object-cover"
                />
                {!isStreaming && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                    <div className="text-center text-gray-400">
                      <Monitor className="w-12 h-12 mx-auto mb-2" />
                      <p>Stream preview will appear here</p>
                    </div>
                  </div>
                )}
                
                {isRecording && (
                  <div className="absolute top-4 right-4 bg-red-500 text-white px-2 py-1 rounded text-sm flex items-center animate-pulse">
                    <div className="w-2 h-2 bg-white rounded-full mr-2"></div>
                    REC
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Stream Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Main Controls */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-lg">Stream Controls</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex space-x-2">
                  {!isStreaming ? (
                    <Button 
                      onClick={startStreaming}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                      disabled={connectionStatus === 'connecting'}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      {connectionStatus === 'connecting' ? 'Connecting...' : 'Start Stream'}
                    </Button>
                  ) : (
                    <Button 
                      onClick={stopStreaming}
                      variant="outline"
                      className="flex-1 border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                    >
                      <Square className="w-4 h-4 mr-2" />
                      Stop Stream
                    </Button>
                  )}
                  
                  <Button
                    onClick={toggleRecording}
                    variant="outline"
                    className={`border-blue-500 ${isRecording ? 'bg-blue-500 text-white' : 'text-blue-500 hover:bg-blue-500 hover:text-white'}`}
                  >
                    {isRecording ? <Pause className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                  </Button>
                </div>

                <div className="flex space-x-2">
                  <Button
                    onClick={() => setMicEnabled(!micEnabled)}
                    variant="outline"
                    className={`flex-1 ${micEnabled ? 'border-green-500 text-green-500' : 'border-red-500 text-red-500'}`}
                  >
                    {micEnabled ? <Mic className="w-4 h-4 mr-2" /> : <MicOff className="w-4 h-4 mr-2" />}
                    {micEnabled ? 'Mic On' : 'Mic Off'}
                  </Button>
                  
                  <Button
                    onClick={() => setCameraEnabled(!cameraEnabled)}
                    variant="outline"
                    className={`flex-1 ${cameraEnabled ? 'border-green-500 text-green-500' : 'border-red-500 text-red-500'}`}
                  >
                    {cameraEnabled ? <Camera className="w-4 h-4 mr-2" /> : <CameraOff className="w-4 h-4 mr-2" />}
                    {cameraEnabled ? 'Cam On' : 'Cam Off'}
                  </Button>
                </div>

                {isStreaming && (
                  <Button
                    onClick={shareStream}
                    variant="outline"
                    className="w-full border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share Stream
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Settings */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-lg flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Stream Quality
                  </label>
                  <select 
                    value={streamQuality}
                    onChange={(e) => setStreamQuality(e.target.value as any)}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                    disabled={isStreaming}
                  >
                    <option value="720p">720p (1280x720)</option>
                    <option value="1080p">1080p (1920x1080)</option>
                    <option value="4K">4K (3840x2160)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Stream Key
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={streamKey}
                      readOnly
                      className="flex-1 p-2 bg-gray-700 border border-gray-600 rounded text-white font-mono text-sm"
                    />
                    <Button
                      onClick={() => navigator.clipboard.writeText(streamKey)}
                      variant="outline"
                      size="sm"
                      className="border-gray-600 text-gray-300"
                    >
                      Copy
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Stream URL:</span>
                    <span className="text-blue-400">glauncher.stream/{streamKey.substring(0, 8)}...</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Game:</span>
                    <span className="text-white">{currentFile?.name || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Platform:</span>
                    <span className="text-green-400">GLauncher Live</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Stream Stats */}
          {isStreaming && (
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-lg">Live Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-400">{viewers}</div>
                    <div className="text-sm text-gray-400">Current Viewers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">
                      {Math.floor(Math.random() * 5000) + 2000} kbps
                    </div>
                    <div className="text-sm text-gray-400">Bitrate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">
                      {Math.floor(Math.random() * 30) + 50} fps
                    </div>
                    <div className="text-sm text-gray-400">Frames/sec</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-400">
                      {Math.floor(Math.random() * 50) + 20} ms
                    </div>
                    <div className="text-sm text-gray-400">Latency</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}