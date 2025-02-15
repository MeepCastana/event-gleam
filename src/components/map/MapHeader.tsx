
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
  isTracking: boolean;
  onTrackingToggle: () => void;
}

export const MapHeader = ({
  menuStyle,
  isDarkMode,
  onThemeToggle,
  onLocationClick,
  isTracking,
  onTrackingToggle
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
                      <img src="/lovable-uploads/6efcda78-32dd-4003-8c7c-0d4bf2c5ab1c.png" alt="Wherry" className="h-8 w-auto" />
                    </div>
                    <nav className="flex-1 py-4">
                      <a href="#" className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors">
                        <User className="w-5 h-5" />
                        <span>PROFILE</span>
                      </a>
                      <button 
                        onClick={onThemeToggle} 
                        className={`group w-full flex items-center justify-between px-4 py-3 transition-all duration-300 ${
                          isDarkMode 
                            ? 'hover:bg-zinc-800/70' 
                            : 'hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full transition-all duration-300 ${
                            isDarkMode 
                              ? 'bg-zinc-800 text-yellow-300 group-hover:bg-zinc-700' 
                              : 'bg-blue-500/10 text-blue-500 group-hover:bg-blue-500/20'
                          }`}>
                            {isDarkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                          </div>
                          <span className="font-medium">{isDarkMode ? 'Dark' : 'Light'}</span>
                        </div>
                        <div className={`text-xs px-2 py-1 rounded-full transition-all duration-300 ${
                          isDarkMode 
                            ? 'bg-zinc-800 text-zinc-400' 
                            : 'bg-white/10 text-zinc-300'
                        }`}>
                          {isDarkMode ? 'ON' : 'OFF'}
                        </div>
                      </button>
                      <button 
                        onClick={onTrackingToggle}
                        className={`group w-full flex items-center justify-between px-4 py-3 transition-all duration-300 hover:bg-white/5`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full transition-all duration-300 ${
                            isTracking 
                              ? 'bg-green-500/10 text-green-500' 
                              : 'bg-zinc-500/10 text-zinc-400'
                          }`}>
                            <Settings className="w-4 h-4" />
                          </div>
                          <span className="font-medium">Location Tracking</span>
                        </div>
                        <div className={`text-xs px-2 py-1 rounded-full transition-all duration-300 ${
                          isTracking 
                            ? 'bg-green-500/10 text-green-500' 
                            : 'bg-zinc-500/10 text-zinc-400'
                        }`}>
                          {isTracking ? 'ON' : 'OFF'}
                        </div>
                      </button>
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
