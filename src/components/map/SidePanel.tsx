
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Sun, Moon } from 'lucide-react';

interface SidePanelProps {
  showRandomPoints: boolean;
  onRandomPointsToggle: (checked: boolean) => void;
  isDarkMode: boolean;
  onThemeToggle: () => void;
}

export const SidePanel = ({ 
  showRandomPoints, 
  onRandomPointsToggle,
  isDarkMode,
  onThemeToggle
}: SidePanelProps) => {
  return (
    <div className="absolute top-20 right-4 p-4 rounded-lg backdrop-blur-md bg-zinc-900/90 border border-white/10 w-64">
      <div className="space-y-4">
        <div className="flex items-center justify-between space-x-2">
          <Label htmlFor="random-points" className="text-white text-sm">
            Show Random Hotspots
          </Label>
          <Switch
            id="random-points"
            checked={showRandomPoints}
            onCheckedChange={onRandomPointsToggle}
          />
        </div>

        <div className="flex items-center justify-between space-x-2">
          <Label htmlFor="theme-toggle" className="text-white text-sm flex items-center gap-2">
            {isDarkMode ? <Moon size={16} className="text-white" /> : <Sun size={16} className="text-white" />}
            {isDarkMode ? 'Dark Mode' : 'Light Mode'}
          </Label>
          <Switch
            id="theme-toggle"
            checked={isDarkMode}
            onCheckedChange={onThemeToggle}
          />
        </div>
      </div>
    </div>
  );
};
