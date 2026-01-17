import React from 'react';
import { Filter, ChevronDown, Settings } from 'lucide-react';
import { useAlerts, SYMBOLS, TIMEFRAMES } from '@/contexts/AlertContext';
import { Button } from '@/components/ui/button';

interface MatrixHeaderProps {
  onToggleSettings: () => void;
  showSettings: boolean;
}

export const MatrixHeader: React.FC<MatrixHeaderProps> = ({ onToggleSettings, showSettings }) => {
  const { currentTime } = useAlerts();

  const formatDate = (date: Date) => {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }) + ' UTC';
  };

  return (
    <header className="flex items-center justify-between border-b border-border bg-card px-6 py-4">
      <div>
        <h1 className="text-xl font-bold text-foreground">CVDD Matrix</h1>
        <p className="text-sm text-muted-foreground">Real-time CVDD monitoring</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="rounded-md bg-muted px-3 py-1.5 text-sm font-mono text-foreground">
          {formatDate(currentTime)}
        </div>

        <Button variant="ghost" size="sm" className="gap-2">
          <Filter className="h-4 w-4" />
        </Button>

        <Button variant="outline" size="sm" className="gap-2">
          Symbols ({SYMBOLS.length})
          <ChevronDown className="h-4 w-4" />
        </Button>

        <Button variant="outline" size="sm" className="gap-2">
          Timeframes ({TIMEFRAMES.length})
          <ChevronDown className="h-4 w-4" />
        </Button>

        <Button
          variant={showSettings ? 'secondary' : 'ghost'}
          size="icon"
          onClick={onToggleSettings}
        >
          <Settings className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
};
