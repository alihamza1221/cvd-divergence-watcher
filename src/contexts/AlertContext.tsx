import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export interface CVDAlert {
  symbol: string;
  timeframe: string;
  cvd_direction: 'bullish' | 'bearish';
  pivot1: number;
  pivot2: number;
  session_high: number;
  session_low: number;
  active_session: string;
  previous_session: string;
  isDivWithSweep: boolean;
  time: string;
  message: string;
  receivedAt: number;
}

interface Settings {
  telegramAlerts: boolean;
  refreshDuration: number; // in minutes
  allowedAlertTimeframes: string[]; // timeframes that trigger Telegram alerts
  telegramBotToken: string; // Masked bot token from backend
  telegramChatId: string;
  telegramConfigured: boolean;
  showOnlySweeps: boolean; // Only show alerts with sweeps
}

interface AlertContextType {
  alerts: Map<string, CVDAlert>;
  settings: Settings;
  settingsLoading: boolean;
  symbols: string[];
  symbolsLoading: boolean;
  updateSettings: (settings: Partial<Settings>) => void;
  addAlert: (alert: CVDAlert) => void;
  getAlert: (symbol: string, timeframe: string) => CVDAlert | undefined;
  currentTime: Date;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

const DEFAULT_SYMBOLS = ['BTC', 'ETH', 'BNB', 'SOL', 'SUI', 'XRP'];
const TIMEFRAMES = ['15m', '10m', '5m', '3m', '2m', '1m', '45s', '30s', '15s', '10s'];

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [alerts, setAlerts] = useState<Map<string, CVDAlert>>(new Map());
  const [settings, setSettings] = useState<Settings>({
    telegramAlerts: true,
    refreshDuration: 15,
    allowedAlertTimeframes: ['5m', '15m', '30m'],
    telegramBotToken: '',
    telegramChatId: '',
    telegramConfigured: false,
    showOnlySweeps: false,
  });
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [symbols, setSymbols] = useState<string[]>(DEFAULT_SYMBOLS);
  const [symbolsLoading, setSymbolsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch settings and symbols from backend on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/settings`);
        if (response.ok) {
          const data = await response.json();
          setSettings((prev) => ({
            ...prev,
            telegramAlerts: data.telegramAlertsEnabled ?? true,
            refreshDuration: data.expiryMinutes ?? 15,
            allowedAlertTimeframes: data.allowedAlertTimeframes ?? ['5m', '15m', '30m'],
            telegramBotToken: data.telegramBotToken ?? '',
            telegramChatId: data.telegramChatId ?? '',
            telegramConfigured: data.telegramConfigured ?? false,
          }));
        }
      } catch (err) {
        console.error('Failed to fetch settings from backend:', err);
      } finally {
        setSettingsLoading(false);
      }
    };

    const fetchSymbols = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/symbols`);
        if (response.ok) {
          const data = await response.json();
          setSymbols(data.symbols ?? DEFAULT_SYMBOLS);
        }
      } catch (err) {
        console.error('Failed to fetch symbols from backend:', err);
      } finally {
        setSymbolsLoading(false);
      }
    };

    fetchSettings();
    fetchSymbols();
  }, []);

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
    // Add symbol if not already in list
    setSymbols((prev) => {
      if (!prev.includes(alert.symbol)) {
        return [...prev, alert.symbol];
      }
      return prev;
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
        settingsLoading,
        symbols,
        symbolsLoading,
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

export { DEFAULT_SYMBOLS, TIMEFRAMES };
