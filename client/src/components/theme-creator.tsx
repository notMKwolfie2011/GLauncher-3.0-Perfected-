import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Palette, Save, X, Plus } from "lucide-react";

interface ThemeCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  currentSettings: any;
}

export default function ThemeCreator({ isOpen, onClose, currentSettings }: ThemeCreatorProps) {
  const [themeName, setThemeName] = useState("");
  const [description, setDescription] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createThemeMutation = useMutation({
    mutationFn: async (themeData: any) => {
      return await fetch("/api/themes", {
        method: "POST",
        body: JSON.stringify(themeData),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      toast({
        title: "Theme shared successfully!",
        description: "Your theme is now available in the community gallery.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/themes"] });
      resetForm();
      onClose();
    },
    onError: () => {
      toast({
        title: "Failed to share theme",
        description: "Please check your input and try again.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setThemeName("");
    setDescription("");
    setAuthorName("");
    setTags([]);
    setNewTag("");
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim()) && tags.length < 5) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = () => {
    if (!themeName.trim() || !authorName.trim()) {
      toast({
        title: "Missing required fields",
        description: "Please fill in the theme name and author name.",
        variant: "destructive",
      });
      return;
    }

    const themeData = {
      name: themeName.trim(),
      description: description.trim() || null,
      authorName: authorName.trim(),
      themeData: currentSettings,
      tags: tags.join(", ") || null,
    };

    createThemeMutation.mutate(themeData);
  };

  const extractedColors = {
    primary: getComputedStyle(document.documentElement).getPropertyValue('--gaming-primary').trim(),
    secondary: getComputedStyle(document.documentElement).getPropertyValue('--gaming-secondary').trim(),
    background: getComputedStyle(document.documentElement).getPropertyValue('--background').trim(),
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[hsl(var(--gaming-surface))] border-[hsl(var(--gaming-border))]">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl font-bold text-slate-200 flex items-center gap-2">
            <Palette className="h-5 w-5 text-[hsl(var(--gaming-primary))]" />
            Share Your Theme
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Theme Preview */}
          <div className="space-y-3">
            <Label className="text-slate-300">Theme Preview</Label>
            <div className="p-4 rounded-lg border border-[hsl(var(--gaming-border))] bg-gradient-to-r from-[hsl(var(--gaming-primary))]/10 to-[hsl(var(--gaming-secondary))]/10">
              <div className="flex items-center gap-3 mb-2">
                <div 
                  className="w-4 h-4 rounded-full border-2 border-white/20"
                  style={{ backgroundColor: `hsl(${extractedColors.primary})` }}
                />
                <div 
                  className="w-4 h-4 rounded-full border-2 border-white/20"
                  style={{ backgroundColor: `hsl(${extractedColors.secondary})` }}
                />
                <span className="text-sm text-slate-300">Current Theme Colors</span>
              </div>
              <p className="text-xs text-slate-400">
                Theme: {currentSettings.theme} | Performance: {currentSettings.performanceMode}
              </p>
            </div>
          </div>

          <Separator />

          {/* Basic Information */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="themeName" className="text-slate-300">
                Theme Name <span className="text-red-400">*</span>
              </Label>
              <Input
                id="themeName"
                value={themeName}
                onChange={(e) => setThemeName(e.target.value)}
                placeholder="My Awesome Gaming Theme"
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="authorName" className="text-slate-300">
                Your Name <span className="text-red-400">*</span>
              </Label>
              <Input
                id="authorName"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="ThemeCreator123"
                maxLength={50}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-slate-300">
                Description
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your theme, its style, and what makes it special..."
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-slate-400">
                {description.length}/500 characters
              </p>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-3">
            <Label className="text-slate-300">Tags (optional)</Label>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="gaming, dark, neon..."
                onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                maxLength={20}
              />
              <Button 
                type="button" 
                onClick={handleAddTag}
                disabled={!newTag.trim() || tags.length >= 5}
                size="sm"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="gap-1">
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:text-red-400"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            <p className="text-xs text-slate-400">
              Add up to 5 tags to help others discover your theme
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={createThemeMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createThemeMutation.isPending || !themeName.trim() || !authorName.trim()}
              className="bg-[hsl(var(--gaming-primary))] hover:bg-[hsl(var(--gaming-primary))]/80 gap-2"
            >
              <Save className="h-4 w-4" />
              {createThemeMutation.isPending ? "Sharing..." : "Share Theme"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}