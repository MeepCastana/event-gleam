
import { BottomDrawer } from "@/components/ui/bottom-drawer";

interface EventsDrawerProps {
  menuStyle: string;
  isDrawerExpanded: boolean;
  onClose: () => void;
}

export const EventsDrawer = ({ menuStyle, isDrawerExpanded, onClose }: EventsDrawerProps) => {
  return (
    <BottomDrawer 
      isOpen={true} 
      onClose={onClose} 
      initialHeight={40} 
      maxHeight={75} 
      onExpand={() => console.log('Drawer expanded')} 
      onContract={() => console.log('Drawer contracted')} 
      className={`${menuStyle} backdrop-blur-lg shadow-lg border border-white/10`}
    >
      <div className="h-full w-full">
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-white/30 rounded-full cursor-grab active:cursor-grabbing touch-none" />
      </div>
    </BottomDrawer>
  );
}
