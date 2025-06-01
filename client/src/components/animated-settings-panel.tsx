import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import ThemeSharingModal from "./theme-sharing-modal";

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface GameSettings {
  antiAliasing: boolean;
  vsync: boolean;
  frameLimit: number;
  audioEnabled: boolean;
  audioVolume: number;
  autoSave: boolean;
  performanceMode: 'high' | 'balanced' | 'battery';
  theme: 'dark' | 'light' | 'blue' | 'purple' | 'green' | 'red' | 'orange' | 'cyberpunk' | 'retro';
  showFPS: boolean;
  pauseOnBlur: boolean;
  mouseInvert: boolean;
  mouseSensitivity: number;
  fullscreenMode: 'windowed' | 'fullscreen' | 'borderless';
  renderDistance: number;
  textureQuality: 'low' | 'medium' | 'high' | 'ultra';
  shadows: boolean;
  particles: 'minimal' | 'reduced' | 'normal' | 'enhanced';
  uiScale: number;
  chatEnabled: boolean;
  notifications: boolean;
  autoConnect: boolean;
}

const defaultSettings: GameSettings = {
  antiAliasing: true,
  vsync: true,
  frameLimit: 60,
  audioEnabled: true,
  audioVolume: 80,
  autoSave: true,
  performanceMode: 'balanced',
  theme: 'dark',
  showFPS: false,
  pauseOnBlur: true,
  mouseInvert: false,
  mouseSensitivity: 50,
  fullscreenMode: 'windowed',
  renderDistance: 8,
  textureQuality: 'high',
  shadows: true,
  particles: 'normal',
  uiScale: 100,
  chatEnabled: true,
  notifications: true,
  autoConnect: false,
};

export default function AnimatedSettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const [settings, setSettings] = useState<GameSettings>(defaultSettings);
  const [isVisible, setIsVisible] = useState(false);
  const [showThemeSharing, setShowThemeSharing] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('glauncher-settings');
    if (savedSettings) {
      try {
        setSettings({ ...defaultSettings, ...JSON.parse(savedSettings) });
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    }
  }, []);

  // Handle animation state
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Debounced save to localStorage for performance
  useEffect(() => {
    const saveTimeout = setTimeout(() => {
      localStorage.setItem('glauncher-settings', JSON.stringify(settings));
    }, 200);
    
    // Apply theme changes to document
    document.documentElement.setAttribute('data-theme', settings.theme);
    
    // Apply performance optimizations
    if (settings.performanceMode === 'battery') {
      document.documentElement.style.setProperty('--animation-duration', '0.1s');
    } else if (settings.performanceMode === 'high') {
      document.documentElement.style.setProperty('--animation-duration', '0.3s');
    } else {
      document.documentElement.style.setProperty('--animation-duration', '0.2s');
    }
    
    return () => clearTimeout(saveTimeout);
  }, [settings]);

  const updateSetting = useCallback(<K extends keyof GameSettings>(key: K, value: GameSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(defaultSettings);
  }, []);

  const handleThemeSelect = useCallback((themeData: any) => {
    if (themeData) {
      Object.keys(themeData).forEach(key => {
        if (key in settings) {
          updateSetting(key as keyof GameSettings, themeData[key]);
        }
      });
    }
  }, [settings, updateSetting]);

  if (!isVisible && !isOpen) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${
      isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
    }`}>
      {/* Animated backdrop */}
      <div 
        className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-all duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />
      
      {/* Animated settings panel */}
      <Card className={`relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[hsl(var(--gaming-surface))] border-[hsl(var(--gaming-border))] 
        shadow-2xl transform transition-all duration-500 ease-out ${
          isOpen 
            ? 'translate-y-0 scale-100 opacity-100' 
            : 'translate-y-8 scale-95 opacity-0'
        }`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className={`text-xl font-bold text-slate-200 flex items-center transition-all duration-700 ${
            isOpen ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'
          }`}>
            <i className="fas fa-cog mr-2 text-[hsl(var(--gaming-primary))]"></i>
            Game Settings
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className={`text-slate-400 hover:text-slate-200 transition-all duration-700 ${
              isOpen ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'
            }`}
          >
            <i className="fas fa-times"></i>
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Graphics Settings */}
          <div className={`transition-all duration-700 ease-out ${
            isOpen ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'
          }`} style={{ transitionDelay: isOpen ? '100ms' : '0ms' }}>
            <h3 className="text-lg font-semibold text-slate-300 mb-3 flex items-center">
              <i className="fas fa-desktop mr-2 text-blue-400"></i>
              Graphics
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-slate-300 font-medium">Anti-Aliasing</label>
                  <p className="text-sm text-slate-400">Smooth out jagged edges</p>
                </div>
                <Switch
                  checked={settings.antiAliasing}
                  onCheckedChange={(checked) => updateSetting('antiAliasing', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-slate-300 font-medium">V-Sync</label>
                  <p className="text-sm text-slate-400">Prevent screen tearing</p>
                </div>
                <Switch
                  checked={settings.vsync}
                  onCheckedChange={(checked) => updateSetting('vsync', checked)}
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-2">
                  Frame Limit: {settings.frameLimit} FPS
                </label>
                <Slider
                  value={[settings.frameLimit]}
                  onValueChange={([value]) => updateSetting('frameLimit', value)}
                  max={144}
                  min={30}
                  step={15}
                  className="w-full"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-slate-300 font-medium">Performance Mode</label>
                  <p className="text-sm text-slate-400">Optimize for your device</p>
                </div>
                <Select
                  value={settings.performanceMode}
                  onValueChange={(value: 'high' | 'balanced' | 'battery') => updateSetting('performanceMode', value)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="balanced">Balanced</SelectItem>
                    <SelectItem value="battery">Battery</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-slate-300 font-medium">Texture Quality</label>
                  <p className="text-sm text-slate-400">Higher quality uses more memory</p>
                </div>
                <Select
                  value={settings.textureQuality}
                  onValueChange={(value) => updateSetting('textureQuality', value as GameSettings['textureQuality'])}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="ultra">Ultra</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-slate-300 font-medium">Shadows</label>
                  <p className="text-sm text-slate-400">Realistic shadow rendering</p>
                </div>
                <Switch
                  checked={settings.shadows}
                  onCheckedChange={(checked) => updateSetting('shadows', checked)}
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-2">
                  Render Distance: {settings.renderDistance} chunks
                </label>
                <Slider
                  value={[settings.renderDistance]}
                  onValueChange={([value]) => updateSetting('renderDistance', value)}
                  max={16}
                  min={2}
                  step={1}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          <Separator className="bg-[hsl(var(--gaming-border))]" />

          {/* Audio Settings */}
          <div className={`transition-all duration-700 ease-out ${
            isOpen ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'
          }`} style={{ transitionDelay: isOpen ? '200ms' : '0ms' }}>
            <h3 className="text-lg font-semibold text-slate-300 mb-3 flex items-center">
              <i className="fas fa-volume-up mr-2 text-green-400"></i>
              Audio
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-slate-300 font-medium">Enable Audio</label>
                  <p className="text-sm text-slate-400">Turn game sounds on/off</p>
                </div>
                <Switch
                  checked={settings.audioEnabled}
                  onCheckedChange={(checked) => updateSetting('audioEnabled', checked)}
                />
              </div>

              {settings.audioEnabled && (
                <div>
                  <label className="text-slate-300 font-medium block mb-2">
                    Volume: {settings.audioVolume}%
                  </label>
                  <Slider
                    value={[settings.audioVolume]}
                    onValueChange={([value]) => updateSetting('audioVolume', value)}
                    max={100}
                    min={0}
                    step={5}
                    className="w-full"
                  />
                </div>
              )}
            </div>
          </div>

          <Separator className="bg-[hsl(var(--gaming-border))]" />

          {/* Gameplay Settings */}
          <div className={`transition-all duration-700 ease-out ${
            isOpen ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'
          }`} style={{ transitionDelay: isOpen ? '300ms' : '0ms' }}>
            <h3 className="text-lg font-semibold text-slate-300 mb-3 flex items-center">
              <i className="fas fa-gamepad mr-2 text-purple-400"></i>
              Gameplay
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-slate-300 font-medium">Auto-Save</label>
                  <p className="text-sm text-slate-400">Automatically save progress</p>
                </div>
                <Switch
                  checked={settings.autoSave}
                  onCheckedChange={(checked) => updateSetting('autoSave', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-slate-300 font-medium">Show FPS Counter</label>
                  <p className="text-sm text-slate-400">Display frame rate</p>
                </div>
                <Switch
                  checked={settings.showFPS}
                  onCheckedChange={(checked) => updateSetting('showFPS', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-slate-300 font-medium">Pause on Tab Switch</label>
                  <p className="text-sm text-slate-400">Pause when switching browser tabs</p>
                </div>
                <Switch
                  checked={settings.pauseOnBlur}
                  onCheckedChange={(checked) => updateSetting('pauseOnBlur', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-slate-300 font-medium">Chat Enabled</label>
                  <p className="text-sm text-slate-400">Enable in-game chat</p>
                </div>
                <Switch
                  checked={settings.chatEnabled}
                  onCheckedChange={(checked) => updateSetting('chatEnabled', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-slate-300 font-medium">Notifications</label>
                  <p className="text-sm text-slate-400">Show system notifications</p>
                </div>
                <Switch
                  checked={settings.notifications}
                  onCheckedChange={(checked) => updateSetting('notifications', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-slate-300 font-medium">Auto-Connect</label>
                  <p className="text-sm text-slate-400">Auto-connect to servers</p>
                </div>
                <Switch
                  checked={settings.autoConnect}
                  onCheckedChange={(checked) => updateSetting('autoConnect', checked)}
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-2">
                  Mouse Sensitivity: {settings.mouseSensitivity}%
                </label>
                <Slider
                  value={[settings.mouseSensitivity]}
                  onValueChange={([value]) => updateSetting('mouseSensitivity', value)}
                  max={200}
                  min={10}
                  step={5}
                  className="w-full"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-slate-300 font-medium">Invert Mouse</label>
                  <p className="text-sm text-slate-400">Reverse mouse Y-axis</p>
                </div>
                <Switch
                  checked={settings.mouseInvert}
                  onCheckedChange={(checked) => updateSetting('mouseInvert', checked)}
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-2">
                  UI Scale: {settings.uiScale}%
                </label>
                <Slider
                  value={[settings.uiScale]}
                  onValueChange={([value]) => updateSetting('uiScale', value)}
                  max={150}
                  min={75}
                  step={5}
                  className="w-full"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-slate-300 font-medium">Display Mode</label>
                  <p className="text-sm text-slate-400">Choose display preference</p>
                </div>
                <Select
                  value={settings.fullscreenMode}
                  onValueChange={(value) => updateSetting('fullscreenMode', value as GameSettings['fullscreenMode'])}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="windowed">Windowed</SelectItem>
                    <SelectItem value="fullscreen">Fullscreen</SelectItem>
                    <SelectItem value="borderless">Borderless</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-slate-300 font-medium">Particle Effects</label>
                  <p className="text-sm text-slate-400">Visual particle density</p>
                </div>
                <Select
                  value={settings.particles}
                  onValueChange={(value) => updateSetting('particles', value as GameSettings['particles'])}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minimal">Minimal</SelectItem>
                    <SelectItem value="reduced">Reduced</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="enhanced">Enhanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator className="bg-[hsl(var(--gaming-border))]" />

          {/* Theme Settings */}
          <div className={`transition-all duration-700 ease-out ${
            isOpen ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'
          }`} style={{ transitionDelay: isOpen ? '400ms' : '0ms' }}>
            <h3 className="text-lg font-semibold text-slate-300 mb-3 flex items-center">
              <i className="fas fa-palette mr-2 text-pink-400"></i>
              Appearance
            </h3>
            <div className="flex items-center justify-between">
              <div>
                <label className="text-slate-300 font-medium">Theme</label>
                <p className="text-sm text-slate-400">Choose your preferred color scheme</p>
              </div>
              <Select
                value={settings.theme}
                onValueChange={(value) => updateSetting('theme', value as GameSettings['theme'])}
              >
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dark">🌙 Dark</SelectItem>
                  <SelectItem value="light">☀️ Light</SelectItem>
                  <SelectItem value="blue">🌊 Ocean Blue</SelectItem>
                  <SelectItem value="purple">🔮 Purple Magic</SelectItem>
                  <SelectItem value="green">🌿 Forest Green</SelectItem>
                  <SelectItem value="red">🔥 Fire Red</SelectItem>
                  <SelectItem value="orange">🎃 Sunset Orange</SelectItem>
                  <SelectItem value="cyberpunk">⚡ Cyberpunk</SelectItem>
                  <SelectItem value="retro">🕹️ Retro Gaming</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator className="bg-[hsl(var(--gaming-border))]" />

              {/* Action Buttons */}
              <div className={`flex items-center justify-between pt-4 transition-all duration-700 ease-out ${
                isOpen ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'
              }`} style={{ transitionDelay: isOpen ? '500ms' : '0ms' }}>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={resetSettings}
                    className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                  >
                    <i className="fas fa-undo mr-2"></i>
                    Reset to Defaults
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowThemeSharing(true)}
                    className="border-[hsl(var(--gaming-primary))]/50 text-[hsl(var(--gaming-primary))] hover:bg-[hsl(var(--gaming-primary))]/10"
                  >
                    <i className="fas fa-share mr-2"></i>
                    Share Theme
                  </Button>
                </div>
                <Button
                  onClick={onClose}
                  className="bg-[hsl(var(--gaming-primary))] hover:bg-[hsl(var(--gaming-primary))]/80"
                >
                  <i className="fas fa-check mr-2"></i>
                  Apply Settings
                </Button>
              </div>
        </CardContent>
      </Card>

      <ThemeSharingModal
        isOpen={showThemeSharing}
        onClose={() => setShowThemeSharing(false)}
        currentSettings={settings}
      />
    </div>
  );
}