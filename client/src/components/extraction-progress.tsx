import { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { FileArchive, FileText, CheckCircle2, AlertCircle } from "lucide-react";

interface ExtractionProgressProps {
  isExtracting: boolean;
  fileName: string;
  onComplete?: (result: ExtractionResult) => void;
}

interface ExtractionResult {
  success: boolean;
  mainFile?: string;
  totalFiles?: number;
  detectionMethod?: string;
  warnings?: string[];
}

export default function ExtractionProgress({ isExtracting, fileName, onComplete }: ExtractionProgressProps) {
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState<string>("Preparing extraction...");
  const [result, setResult] = useState<ExtractionResult | null>(null);

  useEffect(() => {
    if (!isExtracting) {
      setProgress(0);
      setStage("Preparing extraction...");
      setResult(null);
      return;
    }

    // Simulate extraction stages
    const stages = [
      { progress: 20, stage: "Reading ZIP archive..." },
      { progress: 40, stage: "Extracting files..." },
      { progress: 60, stage: "Scanning HTML files..." },
      { progress: 80, stage: "Detecting main file..." },
      { progress: 100, stage: "Extraction complete!" }
    ];

    let currentStage = 0;
    const interval = setInterval(() => {
      if (currentStage < stages.length) {
        setProgress(stages[currentStage].progress);
        setStage(stages[currentStage].stage);
        currentStage++;
      } else {
        clearInterval(interval);
        // Simulate completion result
        const mockResult: ExtractionResult = {
          success: true,
          mainFile: "index.html",
          totalFiles: 15,
          detectionMethod: "pattern-match",
          warnings: []
        };
        setResult(mockResult);
        onComplete?.(mockResult);
      }
    }, 800);

    return () => clearInterval(interval);
  }, [isExtracting, onComplete]);

  if (!isExtracting && !result) return null;

  return (
    <div className="p-4 border rounded-lg bg-muted/50 space-y-3">
      <div className="flex items-center gap-2">
        <FileArchive className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Extracting: {fileName}</span>
      </div>
      
      {isExtracting && (
        <>
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground">{stage}</p>
        </>
      )}

      {result && (
        <div className="space-y-2">
          {result.success ? (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-sm font-medium">Extraction successful!</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Extraction failed</span>
            </div>
          )}
          
          {result.success && (
            <div className="flex flex-wrap gap-2 text-xs">
              <Badge variant="secondary" className="gap-1">
                <FileText className="h-3 w-3" />
                Main: {result.mainFile}
              </Badge>
              <Badge variant="outline">
                {result.totalFiles} files extracted
              </Badge>
              <Badge variant="outline">
                Detection: {result.detectionMethod === 'pattern-match' ? 'Smart' : 'Fallback'}
              </Badge>
            </div>
          )}

          {result.warnings && result.warnings.length > 0 && (
            <div className="text-xs text-amber-600">
              <p className="font-medium">Warnings:</p>
              <ul className="list-disc list-inside">
                {result.warnings.map((warning, i) => (
                  <li key={i}>{warning}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}