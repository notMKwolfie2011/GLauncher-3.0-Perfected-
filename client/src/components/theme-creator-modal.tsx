import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Palette, Save, X, Eye } from "lucide-react";

interface ThemeCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (theme: CustomTheme) => void;
}

interface CustomTheme {
  name: string;
  colors: {
    primary: { h: number; s: number; l: number };
    secondary: { h: number; s: number; l: number };
    accent: { h: number; s: number; l: number };
    surface: { h: number; s: number; l: number };
    card: { h: number; s: number; l: number };
    border: { h: number; s: number; l: number };
    text: { h: number; s: number; l: number };
  };
}

const defaultTheme: CustomTheme = {
  name: "My Custom Theme",
  colors: {
    primary: { h: 217, s: 91, l: 60 },
    secondary: { h: 217, s: 91, l: 70 },
    accent: { h: 142, s: 86, l: 59 },
    surface: { h: 222, s: 84, l: 5 },
    card: { h: 217, s: 33, l: 17 },
    border: { h: 217, s: 91, l: 60 },
    text: { h: 210, s: 40, l: 98 },
  },
};

export default function ThemeCreatorModal({ isOpen, onClose, onSave }: ThemeCreatorModalProps) {
  const [theme, setTheme] = useState<CustomTheme>(defaultTheme);
  const [previewMode, setPreviewMode] = useState(false);

  // Apply theme preview in real-time
  useEffect(() => {
    if (isOpen && previewMode) {
      applyThemePreview(theme.colors);
    }
    return () => {
      if (isOpen) {
        // Reset to original theme when closing
        const savedTheme = localStorage.getItem('glauncher-settings');
        if (savedTheme) {
          try {
            const settings = JSON.parse(savedTheme);
            applyTheme(settings.theme || 'dark');
          } catch {
            applyTheme('dark');
          }
        }
      }
    };
  }, [theme.colors, previewMode, isOpen]);

  const updateThemeName = (name: string) => {
    setTheme(prev => ({ ...prev, name }));
  };

  const updateColor = (colorKey: keyof CustomTheme['colors'], property: 'h' | 's' | 'l', value: number) => {
    setTheme(prev => ({
      ...prev,
      colors: {
        ...prev.colors,
        [colorKey]: {
          ...prev.colors[colorKey],
          [property]: value
        }
      }
    }));
  };

  const handleSave = () => {
    onSave(theme);
    onClose();
  };

  const handlePreviewToggle = () => {
    setPreviewMode(!previewMode);
  };

  const resetToDefault = () => {
    setTheme(defaultTheme);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-[hsl(var(--gaming-surface))] border-[hsl(var(--gaming-border))]">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl font-bold text-slate-200 flex items-center gap-2">
            <Palette className="h-5 w-5 text-[hsl(var(--gaming-primary))]" />
            Create Custom Theme
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviewToggle}
              className={previewMode ? "bg-[hsl(var(--gaming-primary))]/20" : ""}
            >
              <Eye className="h-4 w-4 mr-2" />
              {previewMode ? "Previewing" : "Preview"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Theme Name */}
          <div className="space-y-2">
            <Label htmlFor="themeName" className="text-slate-300">
              Theme Name
            </Label>
            <Input
              id="themeName"
              value={theme.name}
              onChange={(e) => updateThemeName(e.target.value)}
              placeholder="My Awesome Theme"
              maxLength={50}
            />
          </div>

          <Separator className="bg-[hsl(var(--gaming-border))]" />

          {/* Color Configuration */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Object.entries(theme.colors).map(([colorKey, color]) => (
              <ColorControl
                key={colorKey}
                label={colorKey.charAt(0).toUpperCase() + colorKey.slice(1)}
                color={color}
                onChange={(property, value) => updateColor(colorKey as keyof CustomTheme['colors'], property, value)}
              />
            ))}
          </div>

          <Separator className="bg-[hsl(var(--gaming-border))]" />

          {/* Preview Card */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-300">Theme Preview</h3>
            <div 
              className="p-4 rounded-lg border transition-all duration-300"
              style={{
                backgroundColor: `hsl(${theme.colors.card.h} ${theme.colors.card.s}% ${theme.colors.card.l}%)`,
                borderColor: `hsl(${theme.colors.border.h} ${theme.colors.border.s}% ${theme.colors.border.l}%)`,
                color: `hsl(${theme.colors.text.h} ${theme.colors.text.s}% ${theme.colors.text.l}%)`
              }}
            >
              <div className="space-y-3">
                <h4 
                  className="font-semibold"
                  style={{ color: `hsl(${theme.colors.primary.h} ${theme.colors.primary.s}% ${theme.colors.primary.l}%)` }}
                >
                  Sample Game Card
                </h4>
                <p className="text-sm">This is how your theme will look in the application.</p>
                <div className="flex gap-2">
                  <button 
                    className="px-3 py-1 rounded text-sm transition-colors"
                    style={{ 
                      backgroundColor: `hsl(${theme.colors.primary.h} ${theme.colors.primary.s}% ${theme.colors.primary.l}%)`,
                      color: `hsl(${theme.colors.surface.h} ${theme.colors.surface.s}% ${theme.colors.surface.l}%)`
                    }}
                  >
                    Primary Button
                  </button>
                  <button 
                    className="px-3 py-1 rounded text-sm border transition-colors"
                    style={{ 
                      borderColor: `hsl(${theme.colors.border.h} ${theme.colors.border.s}% ${theme.colors.border.l}%)`,
                      color: `hsl(${theme.colors.text.h} ${theme.colors.text.s}% ${theme.colors.text.l}%)`
                    }}
                  >
                    Secondary
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4">
            <Button
              variant="outline"
              onClick={resetToDefault}
              className="border-orange-500/50 text-orange-400 hover:bg-orange-500/10"
            >
              Reset to Default
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={!theme.name.trim()}
                className="bg-[hsl(var(--gaming-primary))] hover:bg-[hsl(var(--gaming-primary))]/80 gap-2"
              >
                <Save className="h-4 w-4" />
                Save Theme
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface ColorControlProps {
  label: string;
  color: { h: number; s: number; l: number };
  onChange: (property: 'h' | 's' | 'l', value: number) => void;
}

function ColorControl({ label, color, onChange }: ColorControlProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-slate-300 font-medium">{label}</Label>
        <div 
          className="w-8 h-8 rounded border-2 border-slate-600"
          style={{ backgroundColor: `hsl(${color.h} ${color.s}% ${color.l}%)` }}
        />
      </div>
      
      <div className="space-y-3">
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-slate-400">
            <span>Hue</span>
            <span>{color.h}°</span>
          </div>
          <Slider
            value={[color.h]}
            onValueChange={(value) => onChange('h', value[0])}
            max={360}
            min={0}
            step={1}
            className="w-full"
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-slate-400">
            <span>Saturation</span>
            <span>{color.s}%</span>
          </div>
          <Slider
            value={[color.s]}
            onValueChange={(value) => onChange('s', value[0])}
            max={100}
            min={0}
            step={1}
            className="w-full"
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-slate-400">
            <span>Lightness</span>
            <span>{color.l}%</span>
          </div>
          <Slider
            value={[color.l]}
            onValueChange={(value) => onChange('l', value[0])}
            max={100}
            min={0}
            step={1}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}

// Utility functions
function applyThemePreview(colors: CustomTheme['colors']) {
  const root = document.documentElement;
  
  Object.entries(colors).forEach(([key, color]) => {
    const cssVar = `--gaming-${key.toLowerCase()}`;
    root.style.setProperty(cssVar, `${color.h} ${color.s}% ${color.l}%`);
  });
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
  };

  const selectedTheme = themes[theme as keyof typeof themes] || themes.dark;
  
  Object.entries(selectedTheme).forEach(([property, value]) => {
    root.style.setProperty(property, value);
  });
}