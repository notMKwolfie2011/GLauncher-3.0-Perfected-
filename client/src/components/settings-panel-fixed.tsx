import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import ThemeSharingModal from "./theme-sharing-modal";
import ThemeCreatorModal from "./theme-creator-modal";

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
  theme: 'dark' | 'light' | 'blue' | 'purple' | 'green' | 'red' | 'orange' | 'cyberpunk' | 'retro' | 'custom';
  customTheme?: any;
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
  theme: 'purple',
  showFPS: false,
  pauseOnBlur: true,
  mouseInvert: false,
  mouseSensitivity: 50,
  fullscreenMode: 'windowed',
  renderDistance: 75,
  textureQuality: 'high',
  shadows: true,
  particles: 'normal',
  uiScale: 100,
  chatEnabled: true,
  notifications: true,
  autoConnect: false,
};

export default function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const [settings, setSettings] = useState<GameSettings>(defaultSettings);
  const [isVisible, setIsVisible] = useState(false);
  const [showThemeSharing, setShowThemeSharing] = useState(false);
  const [showThemeCreator, setShowThemeCreator] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('glauncher-settings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (error) {
        console.error('Failed to parse saved settings:', error);
      }
    }
  }, []);

  // Save settings to localStorage with debouncing
  const debouncedSave = useCallback(
    debounce((newSettings: GameSettings) => {
      localStorage.setItem('glauncher-settings', JSON.stringify(newSettings));
    }, 300),
    []
  );

  useEffect(() => {
    debouncedSave(settings);
  }, [settings, debouncedSave]);

  // Apply theme changes to document
  useEffect(() => {
    applyTheme(settings.theme);
  }, [settings.theme]);

  // Handle panel visibility
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const updateSetting = useCallback(<K extends keyof GameSettings>(key: K, value: GameSettings[K]) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(defaultSettings);
    localStorage.removeItem('glauncher-settings');
  }, []);

  const handleSaveCustomTheme = useCallback((customTheme: any) => {
    // Apply the custom theme immediately
    const newSettings = {
      ...settings,
      theme: 'custom' as const,
      customTheme: customTheme
    };
    setSettings(newSettings);
    
    // Apply the custom theme colors
    const root = document.documentElement;
    Object.entries(customTheme.colors).forEach(([key, color]: [string, any]) => {
      const cssVar = `--gaming-${key.toLowerCase()}`;
      root.style.setProperty(cssVar, `${color.h} ${color.s}% ${color.l}%`);
    });
  }, [settings]);

  if (!isVisible) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${
      isOpen ? 'opacity-100 backdrop-blur-sm' : 'opacity-0 pointer-events-none'
    }`} style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}>
      <Card className={`w-full max-w-4xl bg-[hsl(var(--gaming-surface))] border-[hsl(var(--gaming-border))] transition-all duration-300 ${
        isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
      }`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
          <CardTitle className="text-2xl font-bold text-slate-200 flex items-center">
            <i className="fas fa-cog mr-3 text-[hsl(var(--gaming-primary))]"></i>
            Game Settings
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Anti-Aliasing</span>
                <Switch
                  checked={settings.antiAliasing}
                  onCheckedChange={(checked) => updateSetting('antiAliasing', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">VSync</span>
                <Switch
                  checked={settings.vsync}
                  onCheckedChange={(checked) => updateSetting('vsync', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Shadows</span>
                <Switch
                  checked={settings.shadows}
                  onCheckedChange={(checked) => updateSetting('shadows', checked)}
                />
              </div>
              <div className="space-y-2">
                <span className="text-sm text-slate-400">Frame Limit: {settings.frameLimit} FPS</span>
                <Slider
                  value={[settings.frameLimit]}
                  onValueChange={(value) => updateSetting('frameLimit', value[0])}
                  max={144}
                  min={30}
                  step={15}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          <Separator className="bg-[hsl(var(--gaming-border))]" />

          {/* Performance Settings */}
          <div className={`transition-all duration-700 ease-out ${
            isOpen ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'
          }`} style={{ transitionDelay: isOpen ? '200ms' : '0ms' }}>
            <h3 className="text-lg font-semibold text-slate-300 mb-3 flex items-center">
              <i className="fas fa-tachometer-alt mr-2 text-green-400"></i>
              Performance
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <span className="text-sm text-slate-400">Performance Mode</span>
                <Select value={settings.performanceMode} onValueChange={(value: 'high' | 'balanced' | 'battery') => updateSetting('performanceMode', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High Performance</SelectItem>
                    <SelectItem value="balanced">Balanced</SelectItem>
                    <SelectItem value="battery">Battery Saver</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <span className="text-sm text-slate-400">Texture Quality</span>
                <Select value={settings.textureQuality} onValueChange={(value: 'low' | 'medium' | 'high' | 'ultra') => updateSetting('textureQuality', value)}>
                  <SelectTrigger>
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
            </div>
          </div>

          <Separator className="bg-[hsl(var(--gaming-border))]" />

          {/* Theme Settings */}
          <div className={`transition-all duration-700 ease-out ${
            isOpen ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'
          }`} style={{ transitionDelay: isOpen ? '300ms' : '0ms' }}>
            <h3 className="text-lg font-semibold text-slate-300 mb-3 flex items-center">
              <i className="fas fa-palette mr-2 text-purple-400"></i>
              Theme & Appearance
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <span className="text-sm text-slate-400">Color Theme</span>
                <Select value={settings.theme} onValueChange={(value: GameSettings['theme']) => updateSetting('theme', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dark">Dark Gaming</SelectItem>
                    <SelectItem value="light">Light Mode</SelectItem>
                    <SelectItem value="blue">Ocean Blue</SelectItem>
                    <SelectItem value="purple">Purple Magic</SelectItem>
                    <SelectItem value="green">Forest Green</SelectItem>
                    <SelectItem value="red">Dragon Red</SelectItem>
                    <SelectItem value="orange">Sunset Orange</SelectItem>
                    <SelectItem value="cyberpunk">Cyberpunk Neon</SelectItem>
                    <SelectItem value="retro">Retro Gaming</SelectItem>
                    <SelectItem value="custom">Custom Theme</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 mt-3">
                <Button
                  variant="outline"
                  onClick={() => setShowThemeCreator(true)}
                  className="border-[hsl(var(--gaming-accent))]/50 text-[hsl(var(--gaming-accent))] hover:bg-[hsl(var(--gaming-accent))]/10 flex-1"
                >
                  <i className="fas fa-paint-brush mr-2"></i>
                  Create Custom Theme
                </Button>
              </div>
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

      <ThemeCreatorModal
        isOpen={showThemeCreator}
        onClose={() => setShowThemeCreator(false)}
        onSave={handleSaveCustomTheme}
      />
    </div>
  );
}

// Utility functions
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout;
  return ((...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T;
}

function applyTheme(theme: string) {
  const root = document.documentElement;
  
  const themes = {
    dark: {
      '--gaming-primary': '217 91% 60%',
      '--gaming-secondary': '217 91% 70%',
      '--gaming-accent': '142 86% 59%',
      '--gaming-surface': '222 84% 5%',
      '--gaming-card': '217 33% 17%',
      '--gaming-border': '217 91% 60%',
      '--gaming-text': '210 40% 98%',
    },
    light: {
      '--gaming-primary': '217 91% 50%',
      '--gaming-secondary': '217 91% 60%',
      '--gaming-accent': '142 86% 45%',
      '--gaming-surface': '0 0% 98%',
      '--gaming-card': '0 0% 100%',
      '--gaming-border': '217 91% 50%',
      '--gaming-text': '222 84% 15%',
    },
    blue: {
      '--gaming-primary': '200 100% 50%',
      '--gaming-secondary': '200 100% 60%',
      '--gaming-accent': '180 100% 50%',
      '--gaming-surface': '220 39% 11%',
      '--gaming-card': '215 28% 17%',
      '--gaming-border': '200 100% 50%',
      '--gaming-text': '210 40% 98%',
    },
    purple: {
      '--gaming-primary': '280 100% 70%',
      '--gaming-secondary': '280 100% 80%',
      '--gaming-accent': '300 100% 70%',
      '--gaming-surface': '260 15% 8%',
      '--gaming-card': '258 20% 15%',
      '--gaming-border': '280 100% 70%',
      '--gaming-text': '285 25% 95%',
    },
    green: {
      '--gaming-primary': '120 100% 50%',
      '--gaming-secondary': '120 100% 60%',
      '--gaming-accent': '140 100% 50%',
      '--gaming-surface': '120 20% 8%',
      '--gaming-card': '125 25% 15%',
      '--gaming-border': '120 100% 50%',
      '--gaming-text': '125 25% 95%',
    },
    red: {
      '--gaming-primary': '0 100% 60%',
      '--gaming-secondary': '0 100% 70%',
      '--gaming-accent': '20 100% 60%',
      '--gaming-surface': '0 20% 8%',
      '--gaming-card': '5 25% 15%',
      '--gaming-border': '0 100% 60%',
      '--gaming-text': '5 25% 95%',
    },
    orange: {
      '--gaming-primary': '30 100% 60%',
      '--gaming-secondary': '30 100% 70%',
      '--gaming-accent': '45 100% 60%',
      '--gaming-surface': '25 20% 8%',
      '--gaming-card': '30 25% 15%',
      '--gaming-border': '30 100% 60%',
      '--gaming-text': '30 25% 95%',
    },
    cyberpunk: {
      '--gaming-primary': '315 100% 60%',
      '--gaming-secondary': '180 100% 60%',
      '--gaming-accent': '60 100% 60%',
      '--gaming-surface': '300 15% 8%',
      '--gaming-card': '315 20% 15%',
      '--gaming-border': '315 100% 60%',
      '--gaming-text': '315 25% 95%',
    },
    retro: {
      '--gaming-primary': '50 100% 60%',
      '--gaming-secondary': '25 100% 60%',
      '--gaming-accent': '75 100% 60%',
      '--gaming-surface': '40 20% 8%',
      '--gaming-card': '45 25% 15%',
      '--gaming-border': '50 100% 60%',
      '--gaming-text': '45 25% 95%',
    },
  };

  const selectedTheme = themes[theme as keyof typeof themes] || themes.dark;
  
  Object.entries(selectedTheme).forEach(([property, value]) => {
    root.style.setProperty(property, value);
  });
}