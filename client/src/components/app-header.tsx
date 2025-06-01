import logoPath from "@assets/Screenshot 2025-06-01 7.44.56 AM.png";

interface AppHeaderProps {
  fileCount: number;
  onClearAll: () => void;
}

export default function AppHeader({ fileCount, onClearAll }: AppHeaderProps) {
  return (
    <header className="bg-[hsl(var(--gaming-surface))] border-b border-[hsl(var(--gaming-border))] shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <div className="w-16 h-10 flex items-center justify-center rounded-lg overflow-hidden">
              <img 
                src={logoPath} 
                alt="GLauncher Logo" 
                className="w-24 h-14 object-cover scale-110"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-50">GLauncher</h1>
              <p className="text-xs text-slate-400">Upload & Play HTML Clients</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-slate-400">
              {fileCount} file{fileCount !== 1 ? 's' : ''} uploaded
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
