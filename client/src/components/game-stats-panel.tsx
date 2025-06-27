import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface GameStatsProps {
  isOpen: boolean;
  onClose: () => void;
  currentFile: any;
}

interface GameStats {
  sessionTime: number;
  totalPlayTime: number;
  gamesPlayed: number;
  favoriteGames: string[];
  lastPlayed: string;
}

export default function GameStatsPanel({ isOpen, onClose, currentFile }: GameStatsProps) {
  const [stats, setStats] = useState<GameStats>({
    sessionTime: 0,
    totalPlayTime: 0,
    gamesPlayed: 0,
    favoriteGames: [],
    lastPlayed: ''
  });
  const [sessionStart, setSessionStart] = useState<number>(Date.now());

  useEffect(() => {
    // Load stats from localStorage
    const savedStats = localStorage.getItem('glauncher-stats');
    if (savedStats) {
      try {
        setStats(JSON.parse(savedStats));
      } catch (error) {
        console.error('Failed to parse stats:', error);
      }
    }
  }, []);

  useEffect(() => {
    if (currentFile) {
      setSessionStart(Date.now());
    }
  }, [currentFile]);

  useEffect(() => {
    // Update session time every second
    const interval = setInterval(() => {
      if (currentFile) {
        const currentSessionTime = Math.floor((Date.now() - sessionStart) / 1000);
        setStats(prev => ({
          ...prev,
          sessionTime: currentSessionTime
        }));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentFile, sessionStart]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const achievements = [
    { name: "First Launch", description: "Launched your first game", unlocked: stats.gamesPlayed > 0 },
    { name: "Gaming Marathon", description: "Play for 30 minutes straight", unlocked: stats.sessionTime >= 1800 },
    { name: "Game Explorer", description: "Try 5 different games", unlocked: stats.gamesPlayed >= 5 },
    { name: "Dedicated Player", description: "Total play time over 2 hours", unlocked: stats.totalPlayTime >= 7200 },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-2xl bg-[hsl(var(--gaming-surface))] border-[hsl(var(--gaming-border))] max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl font-bold text-slate-200 flex items-center gap-2">
            <i className="fas fa-chart-line text-[hsl(var(--gaming-primary))]"></i>
            Gaming Statistics
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
          {/* Current Session */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-slate-300 flex items-center gap-2">
              <i className="fas fa-play-circle text-green-400"></i>
              Current Session
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[hsl(var(--gaming-card))] p-4 rounded-lg">
                <div className="text-2xl font-bold text-[hsl(var(--gaming-primary))]">
                  {formatTime(stats.sessionTime)}
                </div>
                <div className="text-sm text-slate-400">Session Time</div>
              </div>
              <div className="bg-[hsl(var(--gaming-card))] p-4 rounded-lg">
                <div className="text-2xl font-bold text-[hsl(var(--gaming-secondary))]">
                  {currentFile ? currentFile.originalName.substring(0, 15) + '...' : 'No Game'}
                </div>
                <div className="text-sm text-slate-400">Currently Playing</div>
              </div>
            </div>
          </div>

          {/* Overall Stats */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-slate-300 flex items-center gap-2">
              <i className="fas fa-trophy text-yellow-400"></i>
              Overall Statistics
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[hsl(var(--gaming-card))] p-4 rounded-lg">
                <div className="text-2xl font-bold text-yellow-400">
                  {stats.gamesPlayed}
                </div>
                <div className="text-sm text-slate-400">Games Played</div>
              </div>
              <div className="bg-[hsl(var(--gaming-card))] p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-400">
                  {formatTime(stats.totalPlayTime)}
                </div>
                <div className="text-sm text-slate-400">Total Play Time</div>
              </div>
            </div>
          </div>

          {/* Achievements */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-slate-300 flex items-center gap-2">
              <i className="fas fa-medal text-purple-400"></i>
              Achievements
            </h3>
            <div className="space-y-3">
              {achievements.map((achievement, index) => (
                <div key={index} className={`flex items-center justify-between p-3 rounded-lg ${
                  achievement.unlocked 
                    ? 'bg-green-500/20 border border-green-500/30' 
                    : 'bg-[hsl(var(--gaming-card))] border border-slate-600'
                }`}>
                  <div className="flex items-center gap-3">
                    <i className={`fas fa-star text-lg ${
                      achievement.unlocked ? 'text-yellow-400' : 'text-slate-500'
                    }`}></i>
                    <div>
                      <div className={`font-medium ${
                        achievement.unlocked ? 'text-slate-200' : 'text-slate-400'
                      }`}>
                        {achievement.name}
                      </div>
                      <div className="text-sm text-slate-500">
                        {achievement.description}
                      </div>
                    </div>
                  </div>
                  <Badge variant={achievement.unlocked ? "default" : "secondary"}>
                    {achievement.unlocked ? "Unlocked" : "Locked"}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={() => {
                localStorage.removeItem('glauncher-stats');
                setStats({
                  sessionTime: 0,
                  totalPlayTime: 0,
                  gamesPlayed: 0,
                  favoriteGames: [],
                  lastPlayed: ''
                });
              }}
              className="border-red-500/50 text-red-400 hover:bg-red-500/10"
            >
              Reset Stats
            </Button>
            <Button onClick={onClose}>
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}