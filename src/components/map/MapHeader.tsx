import { Sun, Moon, Locate } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { SearchBar } from "../business/SearchBar";
import { useState } from "react";
import { useBusinessSearch } from "@/hooks/useBusinessSearch";

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
  onTrackingToggle,
}: MapHeaderProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: searchResults } = useBusinessSearch(searchTerm);

  return (
    <div
      className={`absolute top-0 left-0 right-0 z-10 p-4 ${menuStyle}`}
    >
      <div className="container mx-auto flex items-center justify-between gap-4">
        <div className="flex-1 max-w-md">
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
          />
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={onThemeToggle}>
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
          <Button variant="outline" size="icon" onClick={onLocationClick}>
            <Locate className="h-4 w-4" />
          </Button>
          <Button variant={isTracking ? "default" : "outline"} onClick={onTrackingToggle}>
            {isTracking ? 'Stop Tracking' : 'Start Tracking'}
          </Button>
        </div>
      </div>
      
      {searchResults && searchResults.length > 0 && (
        <div className="container mx-auto mt-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 max-h-60 overflow-y-auto">
            <div className="space-y-2">
              {searchResults.map((business) => (
                <div
                  key={business.id}
                  className="flex items-center justify-between p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md cursor-pointer"
                  onClick={() => {
                    // Handle business selection
                    setSearchTerm("");
                  }}
                >
                  <div>
                    <h3 className="font-medium">{business.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{business.address}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
