import React from 'react';
import { Settings } from 'lucide-react';
import { useAlerts } from '@/contexts/AlertContext';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

const REFRESH_OPTIONS = [
  { value: '5', label: '5 min' },
  { value: '10', label: '10 min' },
  { value: '15', label: '15 min' },
  { value: '30', label: '30 min' },
  { value: '60', label: '1 hour' },
];

export const SettingsSidebar: React.FC = () => {
  const { settings, updateSettings } = useAlerts();

  const handleRefreshDurationChange = async (value: string) => {
    const newDuration = parseInt(value, 10);
    updateSettings({ refreshDuration: newDuration });
    
    // Update backend expiry time
    try {
      await fetch(`${BACKEND_URL}/api/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expiryMinutes: newDuration }),
      });
    } catch (err) {
      console.error('Failed to update backend settings:', err);
    }
  };

  const handleTelegramToggle = async (checked: boolean) => {
    updateSettings({ telegramAlerts: checked });
    
    // Update backend Telegram setting
    try {
      await fetch(`${BACKEND_URL}/api/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramAlertsEnabled: checked }),
      });
    } catch (err) {
      console.error('Failed to update Telegram setting:', err);
    }
  };

  return (
    <div className="flex h-full w-64 flex-col border-l border-border bg-sidebar p-4">
      <div className="mb-6 flex items-center gap-2">
        <Settings className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">Settings</h2>
      </div>

      <div className="space-y-6">
        {/* Telegram Alerts Toggle */}
        <div className="flex items-center justify-between">
          <Label htmlFor="telegram-alerts" className="text-sm text-foreground">
            Telegram Alerts
          </Label>
          <Switch
            id="telegram-alerts"
            checked={settings.telegramAlerts}
            onCheckedChange={handleTelegramToggle}
          />
        </div>

        {/* Refresh Duration */}
        <div className="space-y-2">
          <Label htmlFor="refresh-duration" className="text-sm text-foreground">
            Refresh Duration
          </Label>
          <Select
            value={settings.refreshDuration.toString()}
            onValueChange={handleRefreshDurationChange}
          >
            <SelectTrigger id="refresh-duration" className="w-full">
              <SelectValue placeholder="Select duration" />
            </SelectTrigger>
            <SelectContent>
              {REFRESH_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status Info */}
        <div className="mt-8 rounded-md bg-muted p-3">
          <p className="text-xs text-muted-foreground">
            Alerts expire after <span className="font-semibold text-foreground">{settings.refreshDuration} minutes</span> unless updated.
          </p>
        </div>
      </div>
    </div>
  );
};
