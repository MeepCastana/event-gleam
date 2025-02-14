
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

  const handleDrag = React.useCallback((height: number) => {
    const screenHeight = window.innerHeight;
    const currentHeightPx = (height / screenHeight) * 100;
    const midPoint = (initialHeight + maxHeight) / 2;

    // Determine which snap point to use based on drag position and direction
    const shouldSnapToMax = currentHeightPx > midPoint;
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

  return (
    <Drawer.Root 
      open={isOpen} 
      onOpenChange={(open) => !open && onClose()}
      dismissible={false}
      modal={false}
      snapPoints={snapPoints}
      activeSnapPoint={currentHeight}
      setActiveSnapPoint={setCurrentHeight}
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
            transform: `translateY(${100 - currentHeight}%)`,
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
