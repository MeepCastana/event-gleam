
import * as React from "react";
import { Drawer } from "vaul";
import { cn } from "@/lib/utils";

export interface BottomDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  initialHeight?: number;
  maxHeight?: number;
  snapThreshold?: number;
  onExpand?: () => void;
  onContract?: () => void;
}

export function BottomDrawer({
  isOpen,
  onClose,
  children,
  className,
  initialHeight = 30,
  maxHeight = 75,
  snapThreshold = 50,
  onExpand,
  onContract,
}: BottomDrawerProps) {
  const [currentHeight, setCurrentHeight] = React.useState(initialHeight);
  const snapPoints = React.useMemo(() => [initialHeight, maxHeight], [initialHeight, maxHeight]);
  const lastSnapPoint = React.useRef<number>(initialHeight);

  const handleSnapPointChange = React.useCallback((snapPoint: number | string) => {
    const newHeight = typeof snapPoint === 'string' ? parseInt(snapPoint, 10) : snapPoint;
    setCurrentHeight(newHeight);
  }, []);

  const handleDrag = React.useCallback((_: React.PointerEvent<HTMLDivElement>, percentageDragged: number) => {
    const midPoint = (initialHeight + maxHeight) / 2;
    const drawerHeight = maxHeight - ((1 - percentageDragged) * (maxHeight - initialHeight));
    
    // Determine which snap point to use based on drag position
    const shouldSnapToMax = drawerHeight > midPoint;
    const targetHeight = shouldSnapToMax ? maxHeight : initialHeight;

    // Only trigger callbacks if we're actually changing positions
    if (targetHeight !== lastSnapPoint.current) {
      if (shouldSnapToMax) {
        onExpand?.();
      } else {
        onContract?.();
      }
      lastSnapPoint.current = targetHeight;
    }

    setCurrentHeight(targetHeight);
  }, [initialHeight, maxHeight, onExpand, onContract]);

  // Reset to initial height when isOpen changes
  React.useEffect(() => {
    if (isOpen) {
      setCurrentHeight(initialHeight);
    }
  }, [isOpen, initialHeight]);

  return (
    <Drawer.Root 
      open={isOpen} 
      onOpenChange={(open) => !open && onClose()}
      dismissible={false}
      modal={false}
      snapPoints={snapPoints}
      activeSnapPoint={currentHeight}
      setActiveSnapPoint={handleSnapPointChange}
      onDrag={handleDrag}
    >
      <Drawer.Portal>
        <Drawer.Content
          className={cn(
            "fixed bottom-0 left-0 right-0 z-50 rounded-t-[20px] bg-background transition-transform duration-300 ease-spring",
            className
          )}
          style={{
            height: `${maxHeight}vh`,
            transform: `translateY(${(maxHeight - currentHeight)}vh)`,
          }}
        >
          <div className="p-4 cursor-grab active:cursor-grabbing">
            <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full mx-auto" />
          </div>
          <div className="p-4 flex-1 overflow-y-auto">
            {children}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
