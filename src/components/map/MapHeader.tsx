
import { ArrowLeft, Menu } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { SearchBar } from "../business/SearchBar";
import { useState } from "react";
import { useBusinessSearch } from "@/hooks/useBusinessSearch";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { data: searchResults } = useBusinessSearch(searchTerm);

  return (
    <>
      <div className={`absolute top-0 left-0 right-0 z-10 p-4 ${menuStyle}`}>
        <div className="container mx-auto flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(true)}>
            <Menu className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
            />
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

      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <SheetContent side="left">
          <SheetHeader>
            <SheetTitle>Menu</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-4">
            <Button 
              variant="outline" 
              className="w-full justify-start" 
              onClick={() => {
                onThemeToggle();
                setIsSidebarOpen(false);
              }}
            >
              {isDarkMode ? 'Light Mode' : 'Dark Mode'}
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => {
                onLocationClick();
                setIsSidebarOpen(false);
              }}
            >
              Find My Location
            </Button>
            <Button 
              variant={isTracking ? "default" : "outline"}
              className="w-full justify-start"
              onClick={() => {
                onTrackingToggle();
                setIsSidebarOpen(false);
              }}
            >
              {isTracking ? 'Stop Tracking' : 'Start Tracking'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};
