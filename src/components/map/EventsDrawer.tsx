
import { BottomDrawer } from "@/components/ui/bottom-drawer";

interface HeatspotInfo {
  cityName: string;
  coordinates: [number, number];
  intensity: number;
}

interface EventsDrawerProps {
  menuStyle: string;
  isDrawerExpanded: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  heatspotInfo?: HeatspotInfo;
}

export const EventsDrawer = ({ 
  menuStyle, 
  isDrawerExpanded, 
  onClose, 
  isDarkMode,
  heatspotInfo 
}: EventsDrawerProps) => {
  return (
    <BottomDrawer 
      isOpen={heatspotInfo !== undefined} 
      onClose={onClose} 
      initialHeight={isDrawerExpanded ? 75 : 35} 
      maxHeight={75} 
      onExpand={() => console.log('Drawer expanded')} 
      onContract={() => console.log('Drawer contracted')} 
      className={`${menuStyle} backdrop-blur-xl shadow-lg border border-white/10 ${isDarkMode ? 'bg-zinc-700/95' : 'bg-zinc-900/95'} text-zinc-100`}
    >
      <div className="h-full w-full p-4">
        <div className="absolute top-0 left-0 right-0 h-12 flex items-center justify-center cursor-grab active:cursor-grabbing touch-none">
          <div className="w-12 h-1.5 bg-white/20 rounded-full" />
        </div>
        
        {heatspotInfo ? (
          <div className="mt-8 space-y-4">
            <h2 className="text-xl font-semibold">{heatspotInfo.cityName}</h2>
            <div className="space-y-2">
              <p className="text-sm text-zinc-300">
                Location: {heatspotInfo.coordinates[1].toFixed(4)}°N, {heatspotInfo.coordinates[0].toFixed(4)}°E
              </p>
              <p className="text-sm text-zinc-300">
                Activity Level: {heatspotInfo.intensity > 1.5 ? 'High' : heatspotInfo.intensity > 1 ? 'Medium' : 'Low'}
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-8 text-center text-zinc-400">
            Click on a heatspot to see more information
          </div>
        )}
      </div>
    </BottomDrawer>
  );
}
