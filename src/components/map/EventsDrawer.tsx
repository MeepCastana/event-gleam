
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
      initialHeight={55} 
      maxHeight={75} 
      onExpand={() => console.log('Drawer expanded')} 
      onContract={() => console.log('Drawer contracted')} 
      className="bg-transparent"
    >
    </BottomDrawer>
  );
}
