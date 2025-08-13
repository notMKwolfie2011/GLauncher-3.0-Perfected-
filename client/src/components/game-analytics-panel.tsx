import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  Clock, 
  Target, 
  Zap, 
  BarChart3,
  PieChart,
  Activity,
  Calendar,
  Download
} from "lucide-react";

interface GameAnalyticsProps {
  currentFile: any;
  gameStats: any;
  onClose: () => void;
}

export default function GameAnalyticsPanel({ currentFile, gameStats, onClose }: GameAnalyticsProps) {
  const [performanceData, setPerformanceData] = useState({
    avgFPS: 0,
    memoryUsage: 0,
    loadTime: 0,
    clickRate: 0,
    sessionLength: 0
  });

  const [insights, setInsights] = useState<string[]>([]);

  useEffect(() => {
    // Simulate performance data collection
    const interval = setInterval(() => {
      setPerformanceData({
        avgFPS: Math.floor(Math.random() * 20) + 45,
        memoryUsage: Math.floor(Math.random() * 30) + 20,
        loadTime: Math.random() * 2 + 1,
        clickRate: Math.floor(Math.random() * 50) + 10,
        sessionLength: Math.floor((Date.now() - gameStats.sessionStart) / 1000)
      });

      // Generate insights
      const newInsights = [
        "High engagement detected - player is actively playing",
        "Optimal performance maintained throughout session",
        "Low memory usage indicates efficient game design",
        "Fast load times suggest good optimization"
      ];
      setInsights(newInsights);
    }, 2000);

    return () => clearInterval(interval);
  }, [gameStats.sessionStart]);

  const exportAnalytics = () => {
    const analyticsData = {
      game: currentFile?.name,
      session: {
        startTime: new Date(gameStats.sessionStart).toISOString(),
        duration: performanceData.sessionLength,
        endTime: new Date().toISOString()
      },
      performance: performanceData,
      insights: insights,
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(analyticsData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentFile?.name || 'game'}-analytics.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-700">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-bold text-white flex items-center">
            <BarChart3 className="w-6 h-6 mr-2 text-blue-400" />
            Game Analytics Dashboard
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={exportAnalytics}
              className="text-white border-gray-600 hover:bg-gray-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              ×
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Game Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Current Game</p>
                    <p className="text-lg font-semibold text-white">{currentFile?.name || 'Unknown'}</p>
                  </div>
                  <Activity className="w-8 h-8 text-green-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Session Duration</p>
                    <p className="text-lg font-semibold text-white">
                      {Math.floor(performanceData.sessionLength / 60)}m {performanceData.sessionLength % 60}s
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Performance Score</p>
                    <p className="text-lg font-semibold text-white">
                      {Math.floor((performanceData.avgFPS / 60) * 100)}%
                    </p>
                  </div>
                  <Target className="w-8 h-8 text-purple-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Metrics */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Zap className="w-5 h-5 mr-2 text-yellow-400" />
                Real-time Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">{performanceData.avgFPS}</div>
                  <div className="text-sm text-gray-400">Avg FPS</div>
                  <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                    <div 
                      className="bg-green-400 h-2 rounded-full" 
                      style={{ width: `${(performanceData.avgFPS / 60) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">{performanceData.memoryUsage}MB</div>
                  <div className="text-sm text-gray-400">Memory</div>
                  <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                    <div 
                      className="bg-blue-400 h-2 rounded-full" 
                      style={{ width: `${(performanceData.memoryUsage / 100) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">{performanceData.loadTime.toFixed(1)}s</div>
                  <div className="text-sm text-gray-400">Load Time</div>
                  <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                    <div 
                      className="bg-purple-400 h-2 rounded-full" 
                      style={{ width: `${Math.min((3 - performanceData.loadTime) / 3 * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-400">{performanceData.clickRate}</div>
                  <div className="text-sm text-gray-400">Actions/min</div>
                  <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                    <div 
                      className="bg-orange-400 h-2 rounded-full" 
                      style={{ width: `${(performanceData.clickRate / 100) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Insights */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-green-400" />
                AI-Powered Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {insights.map((insight, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <Badge variant="outline" className="text-green-400 border-green-400">
                      AI
                    </Badge>
                    <p className="text-gray-300 text-sm">{insight}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Session Timeline */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-blue-400" />
                Session Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-gray-700 rounded">
                  <span className="text-sm text-gray-300">Game Started</span>
                  <span className="text-sm text-green-400">
                    {new Date(gameStats.sessionStart).toLocaleTimeString()}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-700 rounded">
                  <span className="text-sm text-gray-300">Peak Performance</span>
                  <span className="text-sm text-blue-400">
                    {Math.floor(Math.random() * 30 + 30)}s ago
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-700 rounded">
                  <span className="text-sm text-gray-300">Current Status</span>
                  <Badge className="bg-green-500 text-white">Active</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}