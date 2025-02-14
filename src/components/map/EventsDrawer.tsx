import { BottomDrawer } from "@/components/ui/bottom-drawer";
interface EventsDrawerProps {
  menuStyle: string;
  isDrawerExpanded: boolean;
  onClose: () => void;
}
export const EventsDrawer = ({
  menuStyle,
  isDrawerExpanded,
  onClose
}: EventsDrawerProps) => {
  return <BottomDrawer isOpen={true} onClose={onClose} initialHeight={35} maxHeight={75} onExpand={() => console.log('Drawer expanded')} onContract={() => console.log('Drawer contracted')} className={`${menuStyle} backdrop-blur-lg shadow-lg border border-white/10`}>
      <div className="h-full w-full">
        <div className="absolute top-0 left-0 right-0 h-12 flex items-center justify-center cursor-grab active:cursor-grabbing touch-none">
          
        </div>
      </div>
    </BottomDrawer>;
};