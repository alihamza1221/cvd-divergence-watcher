import React from 'react';
import { CVDAlert } from '@/contexts/AlertContext';
import { cn } from '@/lib/utils';

interface MatrixCellProps {
  alert?: CVDAlert;
}


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
  // Show session_low for bullish (looking to buy low), session_high for bearish (looking to sell high)
  const targetPrice = isBullish ? alert.session_low : alert.session_high;

  return (
    <div
      className={cn(
        'flex h-full min-h-[80px] flex-col items-center justify-center p-2 transition-all',
        isBullish ? 'bg-matrix-bullish' : 'bg-matrix-bearish'
      )}
    >
      {alert.active_session && (
        <span className="mb-0.5 rounded bg-background/30  py-0.5 text-[10px] px-1 font-medium uppercase text-foreground">
          {alert.active_session}
        </span>
      )}
      <span className="text-sm font-bold text-white">
        {formatPrice(targetPrice)}
      </span>
      <div className="mt-1 text-[12px] text-white/80">
        <div>L1: {formatPrice(alert.pivot1)}</div>
        <div>L2: {formatPrice(alert.pivot2)}</div>
      </div>
    </div>
  );
};
