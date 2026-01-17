import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';

export interface CVDAlert {
  symbol: string;
  timeframe: string;
  cvd_direction: 'bullish' | 'bearish';
  pivot1: number;
  pivot2: number;
  session_high: number;
  session_low: number;
  active_session: string;
  time: string;
  message: string;
  receivedAt: number;
}

interface Settings {
  telegramAlerts: boolean;
  refreshDuration: number; // in minutes
}

interface AlertContextType {
  alerts: Map<string, CVDAlert>;
  settings: Settings;
  updateSettings: (settings: Partial<Settings>) => void;
  addAlert: (alert: CVDAlert) => void;
  getAlert: (symbol: string, timeframe: string) => CVDAlert | undefined;
  currentTime: Date;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

const SYMBOLS = ['BTC', 'ETH', 'BNB', 'SOL', 'SUI', 'XRP'];
const TIMEFRAMES = ['15m', '10m', '5m', '3m', '2m', '1m', '45s', '30s', '15s', '10s'];

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [alerts, setAlerts] = useState<Map<string, CVDAlert>>(new Map());
  const [settings, setSettings] = useState<Settings>({
    telegramAlerts: true,
    refreshDuration: 15,
  });
  const [currentTime, setCurrentTime] = useState(new Date());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Clean up expired alerts based on refresh duration
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const expiryMs = settings.refreshDuration * 60 * 1000;

      setAlerts((prev) => {
        const newAlerts = new Map(prev);
        let hasChanges = false;

        for (const [key, alert] of newAlerts) {
          if (now - alert.receivedAt > expiryMs) {
            newAlerts.delete(key);
            hasChanges = true;
          }
        }

        return hasChanges ? newAlerts : prev;
      });
    }, 10000); // Check every 10 seconds

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [settings.refreshDuration]);

  const updateSettings = useCallback((newSettings: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  }, []);

  const addAlert = useCallback((alert: CVDAlert) => {
    const key = `${alert.symbol}-${alert.timeframe}`;
    setAlerts((prev) => {
      const newAlerts = new Map(prev);
      newAlerts.set(key, { ...alert, receivedAt: Date.now() });
      return newAlerts;
    });
  }, []);

  const getAlert = useCallback(
    (symbol: string, timeframe: string): CVDAlert | undefined => {
      const key = `${symbol}-${timeframe}`;
      return alerts.get(key);
    },
    [alerts]
  );

  return (
    <AlertContext.Provider
      value={{
        alerts,
        settings,
        updateSettings,
        addAlert,
        getAlert,
        currentTime,
      }}
    >
      {children}
    </AlertContext.Provider>
  );
};

export const useAlerts = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlerts must be used within an AlertProvider');
  }
  return context;
};

export { SYMBOLS, TIMEFRAMES };
