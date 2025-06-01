import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Star, Download, Search, Plus, Share2 } from "lucide-react";

interface CommunityTheme {
  id: number;
  name: string;
  description: string;
  authorName: string;
  themeData: any;
  downloads: number;
  rating: string;
  ratingCount: number;
  tags: string;
  createdAt: string;
}

interface CommunityThemesBrowserProps {
  onThemeSelect: (themeData: any) => void;
  onCreateTheme: () => void;
  currentTheme: any;
}

export default function CommunityThemesBrowser({ onThemeSelect, onCreateTheme, currentTheme }: CommunityThemesBrowserProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: themes = [], isLoading } = useQuery({
    queryKey: ["/api/themes"],
  });

  const downloadMutation = useMutation({
    mutationFn: async (themeId: number) => {
      return await fetch(`/api/themes/${themeId}/download`, { method: "POST" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/themes"] });
    },
  });

  const rateMutation = useMutation({
    mutationFn: async ({ themeId, rating }: { themeId: number; rating: number }) => {
      return await fetch(`/api/themes/${themeId}/rate`, {
        method: "POST",
        body: JSON.stringify({ rating }),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      toast({
        title: "Rating submitted",
        description: "Thank you for rating this theme!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/themes"] });
    },
  });

  const handleDownloadTheme = (theme: CommunityTheme) => {
    downloadMutation.mutate(theme.id);
    onThemeSelect(theme.themeData);
    toast({
      title: "Theme downloaded",
      description: `"${theme.name}" has been applied to your settings!`,
    });
  };

  const handleRateTheme = (themeId: number, rating: number) => {
    rateMutation.mutate({ themeId, rating });
  };

  const filteredThemes = (themes as CommunityTheme[]).filter((theme: CommunityTheme) =>
    theme.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    theme.authorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    theme.tags?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderStars = (rating: string, ratingCount: number, themeId: number) => {
    const stars = [];
    const avgRating = parseFloat(rating) || 0;
    
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <button
          key={i}
          onClick={() => handleRateTheme(themeId, i)}
          className={`text-lg ${
            i <= avgRating 
              ? "text-yellow-400" 
              : "text-gray-400 hover:text-yellow-300"
          } transition-colors`}
          disabled={rateMutation.isPending}
        >
          <Star className="h-4 w-4" fill={i <= avgRating ? "currentColor" : "none"} />
        </button>
      );
    }
    
    return (
      <div className="flex items-center gap-1">
        {stars}
        <span className="text-xs text-muted-foreground ml-1">
          ({ratingCount} {ratingCount === 1 ? 'rating' : 'ratings'})
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-200">Community Themes</h2>
        <div className="flex gap-2">
          <Button onClick={onCreateTheme} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Theme
          </Button>
          <Button variant="outline" className="gap-2">
            <Share2 className="h-4 w-4" />
            Share Current
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search themes by name, author, or tags..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <Separator />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-3 bg-muted rounded w-full mb-2"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredThemes.map((theme: CommunityTheme) => (
            <Card key={theme.id} className="bg-[hsl(var(--gaming-surface))] border-[hsl(var(--gaming-border))] hover:border-[hsl(var(--gaming-primary))] transition-colors">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-slate-200">{theme.name}</CardTitle>
                <p className="text-sm text-muted-foreground">by {theme.authorName}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-slate-300 line-clamp-2">{theme.description}</p>
                
                {theme.tags && (
                  <div className="flex flex-wrap gap-1">
                    {theme.tags.split(',').map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag.trim()}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Download className="h-3 w-3" />
                    {theme.downloads}
                  </div>
                  {renderStars(theme.rating, theme.ratingCount, theme.id)}
                </div>

                <Button
                  onClick={() => handleDownloadTheme(theme)}
                  disabled={downloadMutation.isPending}
                  className="w-full bg-[hsl(var(--gaming-primary))] hover:bg-[hsl(var(--gaming-primary))]/80"
                >
                  {downloadMutation.isPending ? "Downloading..." : "Apply Theme"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filteredThemes.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No themes found matching your search.</p>
          <Button onClick={onCreateTheme} className="mt-4 gap-2">
            <Plus className="h-4 w-4" />
            Create the first theme
          </Button>
        </div>
      )}
    </div>
  );
}