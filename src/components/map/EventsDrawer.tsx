
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
      <div className="h-full w-full p-4 bg-gray-950">
        <div className={`${menuStyle} h-full rounded-t-[20px] px-6 space-y-4`}>
          <h2 className="text-xl font-semibold mb-4">
            Nearby Events
          </h2>
          {[...Array(6)].map((_, i) => (
            <div 
              key={i} 
              className={`h-20 ${menuStyle} backdrop-blur-lg shadow-lg rounded-xl border border-white/10`}
            />
          ))}
        </div>
      </div>
    </BottomDrawer>
  );
}
