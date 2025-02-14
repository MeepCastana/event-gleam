
import * as React from "react";
import { Drawer } from "vaul";
import { cn } from "@/lib/utils";

export interface BottomDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

export function BottomDrawer({
  isOpen,
  onClose,
  children,
  className,
}: BottomDrawerProps) {
  return (
    <Drawer.Root 
      open={isOpen} 
      onOpenChange={(open) => !open && onClose()}
      dismissible
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-40" />
        <Drawer.Content
          className={cn(
            "bg-white dark:bg-gray-900 flex flex-col rounded-t-[20px] h-[96vh] mt-24 fixed bottom-0 left-0 right-0 z-50",
            className
          )}
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
