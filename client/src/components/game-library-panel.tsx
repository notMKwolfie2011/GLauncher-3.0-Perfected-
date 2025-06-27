import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface GameLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  files: any[];
  onFileSelect: (file: any) => void;
  onFileDelete: (id: number) => void;
}

interface GameMetadata {
  id: number;
  tags: string[];
  rating: number;
  playCount: number;
  lastPlayed: string;
  notes: string;
  favorite: boolean;
}

export default function GameLibraryPanel({ isOpen, onClose, files, onFileSelect, onFileDelete }: GameLibraryProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [filterBy, setFilterBy] = useState("all");
  const [gameMetadata, setGameMetadata] = useState<Record<number, GameMetadata>>({});

  useEffect(() => {
    // Load game metadata from localStorage
    const savedMetadata = localStorage.getItem('glauncher-game-metadata');
    if (savedMetadata) {
      try {
        setGameMetadata(JSON.parse(savedMetadata));
      } catch (error) {
        console.error('Failed to parse game metadata:', error);
      }
    }
  }, []);

  const saveMetadata = (updatedMetadata: Record<number, GameMetadata>) => {
    setGameMetadata(updatedMetadata);
    localStorage.setItem('glauncher-game-metadata', JSON.stringify(updatedMetadata));
  };

  const toggleFavorite = (fileId: number) => {
    const updated = {
      ...gameMetadata,
      [fileId]: {
        ...gameMetadata[fileId],
        id: fileId,
        tags: gameMetadata[fileId]?.tags || [],
        rating: gameMetadata[fileId]?.rating || 0,
        playCount: gameMetadata[fileId]?.playCount || 0,
        lastPlayed: gameMetadata[fileId]?.lastPlayed || '',
        notes: gameMetadata[fileId]?.notes || '',
        favorite: !gameMetadata[fileId]?.favorite
      }
    };
    saveMetadata(updated);
  };

  const addTag = (fileId: number, tag: string) => {
    if (!tag.trim()) return;
    const updated = {
      ...gameMetadata,
      [fileId]: {
        ...gameMetadata[fileId],
        id: fileId,
        tags: [...(gameMetadata[fileId]?.tags || []), tag.trim()],
        rating: gameMetadata[fileId]?.rating || 0,
        playCount: gameMetadata[fileId]?.playCount || 0,
        lastPlayed: gameMetadata[fileId]?.lastPlayed || '',
        notes: gameMetadata[fileId]?.notes || '',
        favorite: gameMetadata[fileId]?.favorite || false
      }
    };
    saveMetadata(updated);
  };

  const removeTag = (fileId: number, tagToRemove: string) => {
    const updated = {
      ...gameMetadata,
      [fileId]: {
        ...gameMetadata[fileId],
        tags: gameMetadata[fileId]?.tags?.filter(tag => tag !== tagToRemove) || []
      }
    };
    saveMetadata(updated);
  };

  const setRating = (fileId: number, rating: number) => {
    const updated = {
      ...gameMetadata,
      [fileId]: {
        ...gameMetadata[fileId],
        id: fileId,
        tags: gameMetadata[fileId]?.tags || [],
        rating: rating,
        playCount: gameMetadata[fileId]?.playCount || 0,
        lastPlayed: gameMetadata[fileId]?.lastPlayed || '',
        notes: gameMetadata[fileId]?.notes || '',
        favorite: gameMetadata[fileId]?.favorite || false
      }
    };
    saveMetadata(updated);
  };

  const filteredAndSortedFiles = files
    .filter(file => {
      const metadata = gameMetadata[file.id];
      const matchesSearch = file.originalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           metadata?.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      if (filterBy === "favorites") return matchesSearch && metadata?.favorite;
      if (filterBy === "recent") return matchesSearch && metadata?.lastPlayed;
      return matchesSearch;
    })
    .sort((a, b) => {
      const metadataA = gameMetadata[a.id];
      const metadataB = gameMetadata[b.id];
      
      switch (sortBy) {
        case "name":
          return a.originalName.localeCompare(b.originalName);
        case "rating":
          return (metadataB?.rating || 0) - (metadataA?.rating || 0);
        case "playCount":
          return (metadataB?.playCount || 0) - (metadataA?.playCount || 0);
        case "lastPlayed":
          return new Date(metadataB?.lastPlayed || 0).getTime() - new Date(metadataA?.lastPlayed || 0).getTime();
        default:
          return 0;
      }
    });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-6xl h-[90vh] bg-[hsl(var(--gaming-surface))] border-[hsl(var(--gaming-border))] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl font-bold text-slate-200 flex items-center gap-2">
            <i className="fas fa-gamepad text-[hsl(var(--gaming-primary))]"></i>
            Game Library
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

        <CardContent className="flex-1 flex flex-col space-y-4">
          {/* Search and Filters */}
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search games or tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-[hsl(var(--gaming-card))]"
              />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="rating">Rating</SelectItem>
                <SelectItem value="playCount">Play Count</SelectItem>
                <SelectItem value="lastPlayed">Last Played</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterBy} onValueChange={setFilterBy}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Games</SelectItem>
                <SelectItem value="favorites">Favorites</SelectItem>
                <SelectItem value="recent">Recently Played</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Games Grid */}
          <div className="flex-1 overflow-y-auto">
            {filteredAndSortedFiles.length === 0 ? (
              <div className="flex items-center justify-center h-full text-slate-400">
                <div className="text-center">
                  <i className="fas fa-search text-4xl mb-4"></i>
                  <p>No games found matching your criteria</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredAndSortedFiles.map((file) => {
                  const metadata = gameMetadata[file.id] || {};
                  return (
                    <Card key={file.id} className="bg-[hsl(var(--gaming-card))] border-[hsl(var(--gaming-border))] hover:border-[hsl(var(--gaming-primary))] transition-colors">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="font-semibold text-slate-200 truncate flex-1">
                            {file.originalName}
                          </h3>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleFavorite(file.id)}
                            className={`p-1 ${metadata.favorite ? 'text-yellow-400' : 'text-slate-500'}`}
                          >
                            <i className="fas fa-heart"></i>
                          </Button>
                        </div>

                        {/* Rating */}
                        <div className="flex items-center gap-1 mb-3">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              onClick={() => setRating(file.id, star)}
                              className={`text-lg ${star <= (metadata.rating || 0) ? 'text-yellow-400' : 'text-slate-600'}`}
                            >
                              <i className="fas fa-star"></i>
                            </button>
                          ))}
                        </div>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-1 mb-3">
                          {metadata.tags?.map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {tag}
                              <button
                                onClick={() => removeTag(file.id, tag)}
                                className="ml-1 text-slate-400 hover:text-slate-200"
                              >
                                ×
                              </button>
                            </Badge>
                          ))}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const tag = prompt("Enter tag:");
                              if (tag) addTag(file.id, tag);
                            }}
                            className="h-6 px-2 text-xs"
                          >
                            +
                          </Button>
                        </div>

                        {/* Stats */}
                        <div className="text-xs text-slate-400 mb-3 space-y-1">
                          <div>Plays: {metadata.playCount || 0}</div>
                          {metadata.lastPlayed && (
                            <div>Last played: {new Date(metadata.lastPlayed).toLocaleDateString()}</div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <Button
                            onClick={() => {
                              onFileSelect(file);
                              onClose();
                            }}
                            className="flex-1 bg-[hsl(var(--gaming-primary))] hover:bg-[hsl(var(--gaming-primary))]/80"
                            size="sm"
                          >
                            <i className="fas fa-play mr-2"></i>
                            Play
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onFileDelete(file.id)}
                            className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                          >
                            <i className="fas fa-trash"></i>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}