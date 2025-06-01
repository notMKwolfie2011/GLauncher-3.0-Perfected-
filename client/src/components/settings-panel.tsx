import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

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
  theme: 'dark' | 'blue' | 'purple';
  showFPS: boolean;
  pauseOnBlur: boolean;
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
  pauseOnBlur: true
};

export default function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const [settings, setSettings] = useState<GameSettings>(defaultSettings);

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

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('glauncher-settings', JSON.stringify(settings));
    
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
  }, [settings]);

  const updateSetting = <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[hsl(var(--gaming-surface))] border-[hsl(var(--gaming-border))]">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl font-bold text-slate-200 flex items-center">
            <i className="fas fa-cog mr-2 text-[hsl(var(--gaming-primary))]"></i>
            Game Settings
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200"
          >
            <i className="fas fa-times"></i>
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Graphics Settings */}
          <div>
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
            </div>
          </div>

          <Separator className="bg-[hsl(var(--gaming-border))]" />

          {/* Audio Settings */}
          <div>
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
          <div>
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
            </div>
          </div>

          <Separator className="bg-[hsl(var(--gaming-border))]" />

          {/* Theme Settings */}
          <div>
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
                onValueChange={(value: 'dark' | 'blue' | 'purple') => updateSetting('theme', value)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="blue">Ocean Blue</SelectItem>
                  <SelectItem value="purple">Purple Haze</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator className="bg-[hsl(var(--gaming-border))]" />

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4">
            <Button
              variant="outline"
              onClick={resetSettings}
              className="border-red-500/50 text-red-400 hover:bg-red-500/10"
            >
              <i className="fas fa-undo mr-2"></i>
              Reset to Defaults
            </Button>
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
    </div>
  );
}