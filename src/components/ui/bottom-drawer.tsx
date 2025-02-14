
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
}

export function BottomDrawer({
  isOpen,
  onClose,
  children,
  className,
  initialHeight = 30,
  maxHeight = 75,
}: BottomDrawerProps) {
  return (
    <Drawer.Root 
      open={isOpen} 
      onOpenChange={(open) => !open && onClose()}
      dismissible
      modal
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-40" />
        <Drawer.Content
          className={cn(
            "bg-white dark:bg-gray-900 flex flex-col rounded-t-[20px] fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ease-in-out",
            className
          )}
          style={{
            height: `${maxHeight}vh`,
            transform: `translateY(${100 - initialHeight}%)`,
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
