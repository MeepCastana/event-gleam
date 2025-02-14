
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
      initialHeight={15}
      maxHeight={75}
      onExpand={() => console.log('Drawer expanded')}
      onContract={() => console.log('Drawer contracted')}
      className="bg-transparent"
    >
      <div className={`${menuStyle} h-full rounded-t-[20px]`}>
        <div className="px-6 space-y-4"></div>
      </div>
    </BottomDrawer>
  );
}
