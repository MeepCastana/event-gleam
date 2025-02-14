
import { ArrowLeft, Menu, Moon, Search, Sun } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { 
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTrigger,
} from "@/components/ui/sheet";

interface MapHeaderProps {
  menuStyle: string;
  isDarkMode: boolean;
  onThemeToggle: () => void;
}

export const MapHeader = ({ menuStyle, isDarkMode, onThemeToggle }: MapHeaderProps) => {
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
              <div className="flex flex-col h-full">
                <div className="flex items-center gap-4 p-4 border-b border-white/10">
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white text-xl font-semibold">
                    J
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">Jeremy Griffin</h3>
                    <p className="text-sm opacity-60">+1 xxxx yyyyy</p>
                  </div>
                </div>
                <nav className="flex-1 py-4">
                  <a href="#" className="flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors">
                    <div className="w-5 h-5">🏠</div>
                    <span>HOME</span>
                  </a>
                  <a href="#" className="flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors">
                    <div className="w-5 h-5">👤</div>
                    <span>PROFILE</span>
                  </a>
                  <a href="#" className="flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors">
                    <div className="w-5 h-5">ℹ️</div>
                    <span>ABOUT US</span>
                  </a>
                  <a href="#" className="flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors">
                    <div className="w-5 h-5">✈️</div>
                    <span>PLANS</span>
                  </a>
                  <a href="#" className="flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors">
                    <div className="w-5 h-5">💬</div>
                    <span>MESSAGE</span>
                  </a>
                  <a href="#" className="flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors">
                    <div className="w-5 h-5">💳</div>
                    <span>PAYMENT</span>
                  </a>
                  <a href="#" className="flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors">
                    <div className="w-5 h-5">📅</div>
                    <span>SCHEDULE</span>
                  </a>
                  <a href="#" className="flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors">
                    <div className="w-5 h-5">🛒</div>
                    <span>MY CART</span>
                  </a>
                  <a href="#" className="flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors">
                    <div className="w-5 h-5">🎯</div>
                    <span>PROMOTION</span>
                  </a>
                  <a href="#" className="flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors">
                    <div className="w-5 h-5">🎧</div>
                    <span>SUPPORT</span>
                  </a>
                  <button
                    onClick={onThemeToggle}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors"
                  >
                    <div className="w-5 h-5">
                      {isDarkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                    </div>
                    <span>THEME</span>
                  </button>
                  <a href="#" className="flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors">
                    <div className="w-5 h-5">⚙️</div>
                    <span>SETTINGS</span>
                  </a>
                </nav>
                <div className="p-4 border-t border-white/10">
                  <p className="text-sm opacity-60">App Version - v2.0</p>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        )}
      </div>
      <div className={`${menuStyle} backdrop-blur-lg shadow-lg px-6 py-3 rounded-full flex-1 border border-white/10`}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-60" />
          <Input
            className="w-full pl-9 bg-white/10 border-none placeholder:text-inherit/60 rounded-full focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
            placeholder="Search for fun"
            onFocus={() => setIsSearching(true)}
            onBlur={() => setIsSearching(false)}
          />
        </div>
      </div>
    </div>
  );
};
