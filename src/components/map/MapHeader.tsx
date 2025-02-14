
import { ArrowLeft, Menu, Search, Settings, Sun, Moon, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTrigger } from "@/components/ui/sheet";
import { LocationButton } from "./LocationButton";

interface MapHeaderProps {
  menuStyle: string;
  isDarkMode: boolean;
  onThemeToggle: () => void;
  onLocationClick: () => void;
}

export const MapHeader = ({
  menuStyle,
  isDarkMode,
  onThemeToggle,
  onLocationClick
}: MapHeaderProps) => {
  const [isSearching, setIsSearching] = useState(false);
  return <>
      <div className="absolute top-4 left-4 right-4 z-10">
        <div className="flex items-center gap-3">
          <div className={`${isDarkMode ? 'bg-zinc-700/90 text-zinc-100' : 'bg-zinc-900/95 text-zinc-100'} backdrop-blur-lg shadow-lg p-2 rounded-full border border-white/10`}>
            {isSearching ? <button onClick={() => setIsSearching(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button> : <Sheet>
                <SheetTrigger asChild>
                  <button className="p-2 hover:bg-white/5 rounded-full transition-colors">
                    <Menu className="w-5 h-5" />
                  </button>
                </SheetTrigger>
                <SheetContent side="left" className={`${isDarkMode ? 'bg-zinc-700/95 text-zinc-100' : 'bg-zinc-900/95 text-zinc-100'} backdrop-blur-lg border-white/10`}>
                  <div className="flex flex-col h-full">
                    <div className="flex items-center gap-4 p-4 border-b border-white/10">
                      <h3 className="font-comfortaa text-2xl font-bold text-primary">HotSpot</h3>
                    </div>
                    <nav className="flex-1 py-4">
                      <a href="#" className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors">
                        <User className="w-5 h-5" />
                        <span>PROFILE</span>
                      </a>
                      <button 
                        onClick={onThemeToggle} 
                        className={`w-full flex items-center gap-3 px-4 py-3 transition-all duration-300 ${
                          isDarkMode 
                            ? 'bg-zinc-800 hover:bg-zinc-700 text-yellow-300' 
                            : 'bg-blue-50 hover:bg-blue-100 text-blue-600'
                        }`}
                      >
                        {isDarkMode ? (
                          <>
                            <Moon className="w-5 h-5" />
                            <span>NIGHT MODE</span>
                          </>
                        ) : (
                          <>
                            <Sun className="w-5 h-5" />
                            <span>DAY MODE</span>
                          </>
                        )}
                      </button>
                      <a href="#" className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors">
                        <Settings className="w-5 h-5" />
                        <span>SETTINGS</span>
                      </a>
                    </nav>
                    <div className="p-4 border-t border-white/10">
                      <p className="text-sm text-zinc-400">App Version - v2.0</p>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>}
          </div>
          <div className={`${isDarkMode ? 'bg-zinc-700/90 text-zinc-100' : 'bg-zinc-900/95 text-zinc-100'} backdrop-blur-lg shadow-lg px-6 py-3 rounded-full flex-1 border border-white/10`}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-60" />
              <Input className="w-full pl-9 bg-white/5 border-none placeholder:text-inherit/60 rounded-full focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none" placeholder="Search for fun" onFocus={() => setIsSearching(true)} onBlur={() => setIsSearching(false)} />
            </div>
          </div>
        </div>
      </div>
      <div className="absolute top-20 left-6 w-10 z-10 my-[10px]">
        <LocationButton onClick={onLocationClick} isDarkMode={isDarkMode} />
      </div>
    </>;
};
