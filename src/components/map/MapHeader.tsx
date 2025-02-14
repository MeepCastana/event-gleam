
import { ArrowLeft, Menu, Search, Settings, Sun, User, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTrigger } from "@/components/ui/sheet";
import { LocationButton } from "./LocationButton";
import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface MapHeaderProps {
  menuStyle: string;
  isDarkMode: boolean;
  onThemeToggle: () => void;
  onLocationClick: () => void;
}

interface City {
  name: string;
  lat: number;
  lng: number;
}

const cities: City[] = [
  { name: "Bucharest", lat: 44.4268, lng: 26.1025 },
  { name: "London", lat: 51.5074, lng: -0.1278 },
  { name: "Paris", lat: 48.8566, lng: 2.3522 },
  { name: "Berlin", lat: 52.5200, lng: 13.4050 },
  { name: "Rome", lat: 41.9028, lng: 12.4964 },
  { name: "Madrid", lat: 40.4168, lng: -3.7038 },
  { name: "Vienna", lat: 48.2082, lng: 16.3738 },
  { name: "Amsterdam", lat: 52.3676, lng: 4.9041 },
  { name: "Prague", lat: 50.0755, lng: 14.4378 },
  { name: "New York", lat: 40.7128, lng: -74.0060 },
  { name: "Tokyo", lat: 35.6762, lng: 139.6503 },
  { name: "Singapore", lat: 1.3521, lng: 103.8198 }
];

export const MapHeader = ({
  menuStyle,
  isDarkMode,
  onThemeToggle,
  onLocationClick
}: MapHeaderProps) => {
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [open, setOpen] = useState(false);

  const handleCitySelect = async (city: City) => {
    setOpen(false);
    setSearchQuery(city.name);
    setIsSearching(false);

    // Get Mapbox token from config
    const { data: config } = await supabase
      .from('_config')
      .select('value')
      .eq('name', 'MAPBOX_TOKEN')
      .single();

    if (!config?.value) {
      console.error('Mapbox token not found');
      return;
    }

    // Get the map instance from window
    const map = (window as any).mapInstance;
    if (map) {
      const currentCenter = map.getCenter();
      const oldZoom = map.getZoom();
      
      // Store current layers and their visibility
      const heatmapVisible = map.getLayoutProperty('heatmap-layer', 'visibility') !== 'none';
      
      map.flyTo({
        center: [city.lng, city.lat],
        zoom: 12,
        duration: 2000,
        essential: true
      });

      // After animation, ensure heatmap layer is still visible if it was before
      if (heatmapVisible) {
        map.once('moveend', () => {
          if (map.getLayer('heatmap-layer')) {
            map.setLayoutProperty('heatmap-layer', 'visibility', 'visible');
          }
        });
      }
    }
  };

  const filteredCities = cities.filter(city => 
    searchQuery && city.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return <>
    <div className="absolute top-4 left-4 right-4 z-10">
      <div className="flex items-center gap-3">
        <div className={`${isDarkMode ? 'bg-zinc-700/90 text-zinc-100' : 'bg-zinc-900/95 text-zinc-100'} backdrop-blur-lg shadow-lg p-2 rounded-full border border-white/10`}>
          {isSearching ? (
            <button 
              onClick={() => {
                setIsSearching(false);
                setOpen(false);
                setSearchQuery("");
              }} 
              className="p-2 hover:bg-white/5 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : (
            <Sheet>
              <SheetTrigger asChild>
                <button className="p-2 hover:bg-white/5 rounded-full transition-colors">
                  <Menu className="w-5 h-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className={`${isDarkMode ? 'bg-zinc-700/95 text-zinc-100' : 'bg-zinc-900/95 text-zinc-100'} backdrop-blur-lg border-white/10`}>
                <div className="flex flex-col h-full">
                  <div className="flex items-center gap-4 p-4 border-b border-white/10">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xl font-semibold">
                      J
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">Jeremy Griffin</h3>
                      <p className="text-sm text-zinc-400">+1 xxxx yyyyy</p>
                    </div>
                  </div>
                  <nav className="flex-1 py-4">
                    <a href="#" className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors">
                      <User className="w-5 h-5" />
                      <span>PROFILE</span>
                    </a>
                    <button onClick={onThemeToggle} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors">
                      <Sun className="w-5 h-5" />
                      <span>THEME</span>
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
            </Sheet>
          )}
        </div>
        <Popover open={open && filteredCities.length > 0} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <div className={`${isDarkMode ? 'bg-zinc-700/90 text-zinc-100' : 'bg-zinc-900/95 text-zinc-100'} backdrop-blur-lg shadow-lg px-6 py-3 rounded-full flex-1 border border-white/10`}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-60" />
                <Input
                  value={searchQuery}
                  onChange={(e) => {
                    e.stopPropagation();
                    setSearchQuery(e.target.value);
                    setOpen(true);
                  }}
                  className="w-full pl-9 bg-white/5 border-none placeholder:text-inherit/60 rounded-full focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none"
                  placeholder="Search for city"
                  onFocus={() => {
                    setIsSearching(true);
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          </PopoverTrigger>
          <PopoverContent 
            className={cn(
              "w-[calc(100vw-2rem)] md:w-[500px] p-0",
              isDarkMode ? 'bg-zinc-700/95 text-zinc-100' : 'bg-zinc-900/95 text-zinc-100',
              "backdrop-blur-lg border-white/10"
            )}
            align="start"
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <Command>
              <CommandList>
                <CommandGroup>
                  {filteredCities.map(city => (
                    <CommandItem
                      key={city.name}
                      value={city.name}
                      onSelect={() => handleCitySelect(city)}
                      className="hover:bg-white/5 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        {city.name}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </div>
    <div className="absolute top-20 left-6 w-10 z-10 my-[10px]">
      <LocationButton onClick={onLocationClick} isDarkMode={isDarkMode} />
    </div>
  </>;
};
