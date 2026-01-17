import React from 'react';
import { CVDAlert } from '@/contexts/AlertContext';
import { cn } from '@/lib/utils';

interface MatrixCellProps {
  alert?: CVDAlert;
}

const formatTime = (timeStr: string) => {
  try {
    const date = new Date(timeStr);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch {
    return timeStr;
  }
};

const formatPrice = (price: number) => {
  if (price >= 1000) {
    return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `$${price.toFixed(price < 1 ? 4 : 2)}`;
};

export const MatrixCell: React.FC<MatrixCellProps> = ({ alert }) => {
  if (!alert) {
    return (
      <div className="flex h-full min-h-[80px] items-center justify-center bg-matrix-empty">
        <span className="text-muted-foreground">— —</span>
      </div>
    );
  }

  const isBullish = alert.cvd_direction === 'bullish';

  return (
    <div
      className={cn(
        'flex h-full min-h-[80px] flex-col items-center justify-center p-2 transition-all',
        isBullish ? 'bg-matrix-bullish' : 'bg-matrix-bearish'
      )}
    >
      {alert.active_session && (
        <span className="mb-0.5 rounded bg-background/30 px-1.5 py-0.5 text-[10px] font-medium uppercase text-foreground">
          {alert.active_session}
        </span>
      )}
      <span className="text-[11px] font-semibold text-foreground">CVDD</span>
      <span className="text-sm font-bold text-foreground">{formatPrice(alert.pivot1)}</span>
      <div className="mt-1 text-[9px] text-foreground/80">
        <div>L1 {formatTime(alert.time)}</div>
        <div>L2 {formatTime(alert.time)}</div>
      </div>
    </div>
  );
};
