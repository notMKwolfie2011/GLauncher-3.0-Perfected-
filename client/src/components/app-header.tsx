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
            <div className="w-10 h-10 gaming-gradient rounded-lg flex items-center justify-center">
              <i className="fas fa-gamepad text-white text-lg"></i>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-50">Eaglercraft Player</h1>
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
