import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Palette, Save, X } from "lucide-react";

interface ThemeSharingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSettings: any;
}

export default function ThemeSharingModal({ isOpen, onClose, currentSettings }: ThemeSharingModalProps) {
  const [themeName, setThemeName] = useState("");
  const [description, setDescription] = useState("");
  const [authorName, setAuthorName] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createThemeMutation = useMutation({
    mutationFn: async (themeData: any) => {
      const response = await fetch("/api/themes", {
        method: "POST",
        body: JSON.stringify(themeData),
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error("Failed to create theme");
      return response.json();
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
      tags: null,
    };

    createThemeMutation.mutate(themeData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-lg bg-[hsl(var(--gaming-surface))] border-[hsl(var(--gaming-border))]">
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

        <CardContent className="space-y-4">
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
              placeholder="Describe your theme..."
              rows={3}
              maxLength={500}
            />
          </div>

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