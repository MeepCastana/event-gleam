
import { ArrowLeft, Menu, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { 
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface MapHeaderProps {
  menuStyle: string;
}

export const MapHeader = ({ menuStyle }: MapHeaderProps) => {
  const [isSearching, setIsSearching] = useState(false);

  return (
    <div className="absolute top-4 left-4 right-4 z-10 flex items-center gap-3">
      <div className={`${menuStyle} backdrop-blur-lg shadow-lg p-2 rounded-full border border-white/10`}>
        {isSearching ? (
          <button 
            onClick={() => setIsSearching(false)}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        ) : (
          <Sheet>
            <SheetTrigger asChild>
              <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <Menu className="w-5 h-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className={`${menuStyle} backdrop-blur-lg border-white/10`}>
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              {/* Add your menu items here */}
              <div className="py-4">
                <nav className="flex flex-col gap-2">
                  <a href="#" className="px-4 py-2 hover:bg-white/10 rounded-lg transition-colors">Home</a>
                  <a href="#" className="px-4 py-2 hover:bg-white/10 rounded-lg transition-colors">Events</a>
                  <a href="#" className="px-4 py-2 hover:bg-white/10 rounded-lg transition-colors">Profile</a>
                  <a href="#" className="px-4 py-2 hover:bg-white/10 rounded-lg transition-colors">Settings</a>
                </nav>
              </div>
            </SheetContent>
          </Sheet>
        )}
      </div>
      <div className={`${menuStyle} backdrop-blur-lg shadow-lg px-6 py-3 rounded-full flex-1 border border-white/10`}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-60" />
          <Input
            className="w-full pl-9 bg-white/10 border-none placeholder:text-inherit/60 rounded-full"
            placeholder="Search for fun"
            onFocus={() => setIsSearching(true)}
            onBlur={() => setIsSearching(false)}
          />
        </div>
      </div>
    </div>
  );
};
