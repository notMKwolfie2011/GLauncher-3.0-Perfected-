import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FileText, FolderOpen, AlertTriangle, CheckCircle2, Info } from "lucide-react";

interface ZipAnalysisPanelProps {
  analysisData: {
    mainFile: string;
    totalFiles: number;
    detectionMethod: string;
    warnings: string[];
    fileTypes?: Record<string, number>;
    structure?: string[];
  };
}

export default function ZipAnalysisPanel({ analysisData }: ZipAnalysisPanelProps) {
  const { mainFile, totalFiles, detectionMethod, warnings, fileTypes = {}, structure = [] } = analysisData;

  const getDetectionBadgeVariant = (method: string) => {
    return method === 'pattern-match' ? 'default' : 'secondary';
  };

  return (
    <Card className="mt-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <FolderOpen className="h-5 w-5" />
          ZIP Analysis Results
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main file detection */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Main File:</span>
            <code className="text-xs bg-muted px-2 py-1 rounded">{mainFile}</code>
          </div>
          <Badge variant={getDetectionBadgeVariant(detectionMethod)} className="text-xs">
            {detectionMethod === 'pattern-match' ? 'Smart Detection' : 'Fallback Used'}
          </Badge>
        </div>

        <Separator />

        {/* File statistics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{totalFiles}</div>
            <div className="text-xs text-muted-foreground">Total Files</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{Object.keys(fileTypes).length}</div>
            <div className="text-xs text-muted-foreground">File Types</div>
          </div>
        </div>

        {/* File types breakdown */}
        {Object.keys(fileTypes).length > 0 && (
          <>
            <Separator />
            <div>
              <h4 className="text-sm font-medium mb-2">File Types Found:</h4>
              <div className="flex flex-wrap gap-1">
                {Object.entries(fileTypes).map(([type, count]) => (
                  <Badge key={type} variant="outline" className="text-xs">
                    {type}: {count}
                  </Badge>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Warnings */}
        {warnings.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-medium">Analysis Warnings:</span>
              </div>
              <div className="space-y-1">
                {warnings.map((warning, index) => (
                  <div key={index} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <Info className="h-3 w-3 mt-0.5 text-amber-500 flex-shrink-0" />
                    <span>{warning}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Success indicator */}
        {warnings.length === 0 && (
          <>
            <Separator />
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-sm">ZIP extraction completed successfully with no issues detected</span>
            </div>
          </>
        )}

        {/* Directory structure preview */}
        {structure.length > 0 && (
          <>
            <Separator />
            <div>
              <h4 className="text-sm font-medium mb-2">Directory Structure:</h4>
              <div className="bg-muted p-2 rounded text-xs font-mono max-h-32 overflow-y-auto">
                {structure.slice(0, 10).map((path, index) => (
                  <div key={index} className="text-muted-foreground">
                    {path === mainFile ? (
                      <span className="text-primary font-medium">📄 {path} (main)</span>
                    ) : (
                      <span>📄 {path}</span>
                    )}
                  </div>
                ))}
                {structure.length > 10 && (
                  <div className="text-muted-foreground mt-1">
                    ... and {structure.length - 10} more files
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}