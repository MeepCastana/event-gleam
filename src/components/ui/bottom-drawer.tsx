
import * as React from "react";
import { motion, useAnimation, PanInfo, AnimatePresence } from "framer-motion";
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
  initialHeight = 15, // Changed from 30 to 15
  maxHeight = 75,
  snapThreshold = 50,
  onExpand,
  onContract,
}: BottomDrawerProps) {
  const controls = useAnimation();
  const [isExpanded, setIsExpanded] = React.useState(false);
  
  // Convert height percentages to pixels for calculations
  const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 0;
  const initialHeightPx = (initialHeight / 100) * windowHeight;
  const maxHeightPx = (maxHeight / 100) * windowHeight;
  const snapThresholdPx = ((maxHeightPx - initialHeightPx) * snapThreshold) / 100;

  React.useEffect(() => {
    if (isOpen) {
      controls.start({
        y: windowHeight - initialHeightPx,
        transition: { type: "spring", stiffness: 300, damping: 30 }
      });
    }
  }, [isOpen, controls, initialHeightPx, windowHeight]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    const yPosition = info.point.y;
    const dragDistance = info.offset.y;
    
    // Calculate positions
    const currentPosition = windowHeight - yPosition;
    const isMovingUp = dragDistance < 0;
    
    const shouldSnapToMax = isMovingUp && 
      (currentPosition > initialHeightPx + snapThresholdPx || 
       Math.abs(dragDistance) > snapThresholdPx);
    
    if (shouldSnapToMax) {
      controls.start({
        y: windowHeight - maxHeightPx,
        transition: { type: "spring", stiffness: 300, damping: 30 }
      });
      setIsExpanded(true);
      onExpand?.();
    } else {
      controls.start({
        y: windowHeight - initialHeightPx,
        transition: { type: "spring", stiffness: 300, damping: 30 }
      });
      setIsExpanded(false);
      onContract?.();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: windowHeight }}
          animate={controls}
          exit={{ y: windowHeight }}
          drag="y"
          dragConstraints={{
            top: windowHeight - maxHeightPx,
            bottom: windowHeight - initialHeightPx
          }}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
          className={cn(
            "fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-[20px] shadow-lg",
            className
          )}
          style={{ height: `${maxHeight}vh` }}
        >
          {/* Drag Handle */}
          <div className="absolute top-0 left-0 right-0 h-8 flex items-center justify-center cursor-grab active:cursor-grabbing touch-none">
            <div className="w-12 h-1.5 bg-white/20 rounded-full" />
          </div>
          
          {/* Content Area */}
          <div className="h-full pt-8 overflow-y-auto overscroll-contain">
            <div className="p-4">
              {children}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
