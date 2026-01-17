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

const REFRESH_OPTIONS = [
  { value: '5', label: '5 min' },
  { value: '10', label: '10 min' },
  { value: '15', label: '15 min' },
  { value: '30', label: '30 min' },
  { value: '60', label: '1 hour' },
];

export const SettingsSidebar: React.FC = () => {
  const { settings, updateSettings } = useAlerts();

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
            onCheckedChange={(checked) => updateSettings({ telegramAlerts: checked })}
          />
        </div>

        {/* Refresh Duration */}
        <div className="space-y-2">
          <Label htmlFor="refresh-duration" className="text-sm text-foreground">
            Refresh Duration
          </Label>
          <Select
            value={settings.refreshDuration.toString()}
            onValueChange={(value) => updateSettings({ refreshDuration: parseInt(value, 10) })}
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
