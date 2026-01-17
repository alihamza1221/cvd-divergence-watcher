import React from 'react';
import { useAlerts, SYMBOLS, TIMEFRAMES } from '@/contexts/AlertContext';
import { MatrixCell } from './MatrixCell';

export const MatrixGrid: React.FC = () => {
  const { getAlert } = useAlerts();

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] border-collapse">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 bg-background p-3 text-left text-sm font-medium text-muted-foreground">
              {/* Empty corner cell */}
            </th>
            {TIMEFRAMES.map((tf) => (
              <th
                key={tf}
                className="border-b border-border bg-background p-3 text-center text-sm font-medium text-muted-foreground"
              >
                {tf}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {SYMBOLS.map((symbol) => (
            <tr key={symbol} className="border-b border-border">
              <td className="sticky left-0 z-10 bg-background p-3 text-sm font-semibold text-primary">
                {symbol}
              </td>
              {TIMEFRAMES.map((tf) => {
                const alert = getAlert(symbol, tf);
                return (
                  <td key={`${symbol}-${tf}`} className="border border-border p-0">
                    <MatrixCell alert={alert} />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
