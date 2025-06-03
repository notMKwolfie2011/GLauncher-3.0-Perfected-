import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { GameFile } from "@shared/schema";
import { useState } from "react";

interface ClientInfoBadgeProps {
  file: GameFile;
  showWarnings?: boolean;
}

export default function ClientInfoBadge({ file, showWarnings = false }: ClientInfoBadgeProps) {
  const [dismissedWarnings, setDismissedWarnings] = useState<Set<number>>(new Set());

  const getClientTypeColor = (clientType?: string) => {
    if (!clientType) return "secondary";

    const type = clientType.toLowerCase();
    if (type.includes("1.8")) return "default";
    if (type.includes("1.5")) return "outline";
    if (type.includes("beta") || type.includes("alpha")) return "destructive";
    if (type.includes("resent") || type.includes("precision")) return "secondary";
    return "default";
  };

  const getVersionIcon = (clientType?: string) => {
    if (!clientType) return "fas fa-question-circle";

    const type = clientType.toLowerCase();
    if (type.includes("1.8")) return "fas fa-gem";
    if (type.includes("1.5")) return "fas fa-cube";
    if (type.includes("beta")) return "fas fa-flask";
    if (type.includes("alpha")) return "fas fa-exclamation-triangle";
    if (type.includes("resent")) return "fas fa-magic";
    if (type.includes("precision")) return "fas fa-crosshairs";
    if (type.includes("eaglerx")) return "fas fa-rocket";
    return "fas fa-gamepad";
  };

  const handleDismissWarning = (index: number) => {
    setDismissedWarnings(prev => new Set([...prev, index]));
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1">
        {file.clientType && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Badge variant={getClientTypeColor(file.clientType)} className="text-xs">
                  <i className={`${getVersionIcon(file.clientType)} mr-1`}></i>
                  {file.clientType}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>Client Type: {file.clientType}</p>
                {file.minecraftVersion && (
                  <p>Minecraft Version: {file.minecraftVersion}</p>
                )}
                {file.clientVersion && (
                  <p>Client Version: {file.clientVersion}</p>
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {file.minecraftVersion && (
          <Badge variant="outline" className="text-xs">
            <i className="fas fa-cube mr-1"></i>
            MC {file.minecraftVersion}
          </Badge>
        )}

        {file.clientVersion && (
          <Badge variant="secondary" className="text-xs">
            <i className="fas fa-tag mr-1"></i>
            v{file.clientVersion}
          </Badge>
        )}
      </div>

      {showWarnings && file.compatibilityWarnings && file.compatibilityWarnings.length > 0 && (
        <div className="space-y-1">
          {file.compatibilityWarnings.map((warning, index) => {
            if (dismissedWarnings.has(index)) {
              return null;
            }

            return (
              <Alert key={index} className="py-2 border-yellow-500/20 bg-yellow-500/5 flex items-center justify-between">
                <div className="flex items-center">
                  <i className="fas fa-exclamation-triangle text-yellow-500 text-sm"></i>
                  <AlertDescription className="text-xs text-yellow-600 dark:text-yellow-400 ml-2">
                    {warning}
                  </AlertDescription>
                </div>
                <button onClick={() => handleDismissWarning(index)} className="hover:text-yellow-700 dark:hover:text-yellow-300">
                  <i className="fas fa-times"></i>
                </button>
              </Alert>
            );
          })}
        </div>
      )}
    </div>
  );
}