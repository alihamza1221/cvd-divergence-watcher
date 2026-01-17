import React, { useState, useEffect, useCallback } from 'react';
import { MatrixGrid } from '@/components/MatrixGrid';
import { MatrixHeader } from '@/components/MatrixHeader';
import { SettingsSidebar } from '@/components/SettingsSidebar';
import { useAlerts, CVDAlert } from '@/contexts/AlertContext';
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  const [showSettings, setShowSettings] = useState(true);
  const { addAlert } = useAlerts();

  // Fetch alerts from backend on mount and subscribe to updates
  const fetchAlerts = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('cvd-alerts', {
        method: 'GET',
      });

      if (error) {
        console.error('Error fetching alerts:', error);
        return;
      }

      if (data?.alerts) {
        Object.values(data.alerts).forEach((alert: any) => {
          addAlert(alert as CVDAlert);
        });
      }
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
    }
  }, [addAlert]);

  useEffect(() => {
    fetchAlerts();
    
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  return (
    <div className="flex h-screen flex-col bg-background">
      <MatrixHeader onToggleSettings={() => setShowSettings(!showSettings)} showSettings={showSettings} />
      
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-auto p-4">
          <MatrixGrid />
        </main>
        
        {showSettings && <SettingsSidebar />}
      </div>
    </div>
  );
};

export default Index;
