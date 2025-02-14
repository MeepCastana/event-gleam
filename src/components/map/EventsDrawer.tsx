
import { BottomDrawer } from "@/components/ui/bottom-drawer";

interface EventsDrawerProps {
  menuStyle: string;
  isDrawerExpanded: boolean;
  onClose: () => void;
  isDarkMode: boolean;
}

export const EventsDrawer = ({ menuStyle, isDrawerExpanded, onClose, isDarkMode }: EventsDrawerProps) => {
  return (
    <BottomDrawer 
      isOpen={true} 
      onClose={onClose} 
      initialHeight={35} 
      maxHeight={75} 
      onExpand={() => console.log('Drawer expanded')} 
      onContract={() => console.log('Drawer contracted')} 
      className={`${menuStyle} backdrop-blur-xl shadow-lg border border-white/10 ${isDarkMode ? 'bg-zinc-700/95' : 'bg-zinc-900/95'} text-zinc-100`}
    >
      <div className="h-full w-full">
        <div className="absolute top-0 left-0 right-0 h-12 flex items-center justify-center cursor-grab active:cursor-grabbing touch-none">
          <div className="w-12 h-1.5 bg-white/20 rounded-full" />
        </div>
      </div>
    </BottomDrawer>
  );
}
