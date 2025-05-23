import { useState, useRef, useCallback, useEffect } from 'react';
import { Search, ArrowLeft } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import debounce from 'lodash/debounce';
import { supabase } from "@/integrations/supabase/client";

interface SearchResult {
  place_name: string;
  center: [number, number];
  text: string;
}

interface SearchBoxProps {
  isDarkMode: boolean;
  onLocationSelect: (lng: number, lat: number) => void;
}

export const SearchBox = ({ isDarkMode, onLocationSelect }: SearchBoxProps) => {
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [selectedPlace, setSelectedPlace] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (!query.trim()) {
        setResults([]);
        return;
      }

      try {
        const { data: config, error } = await supabase
          .from('_config')
          .select('value')
          .eq('name', 'MAPBOX_TOKEN')
          .maybeSingle() as { data: { value: string } | null, error: Error | null };

        if (error || !config?.value) {
          throw new Error('Mapbox token not found');
        }

        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
            query
          )}.json?access_token=${config.value}&types=place,address,locality,neighborhood`
        );

        if (!response.ok) throw new Error('Search failed');

        const data = await response.json();
        setResults(data.features.map((feature: any) => ({
          place_name: feature.place_name,
          center: feature.center,
          text: feature.text,
        })));
      } catch (error) {
        console.error('Search error:', error);
        toast({
          variant: "destructive",
          title: "Search failed",
          description: "Please try again later"
        });
      }
    }, 300),
    []
  );

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    setIsSearching(true);
    setShowResults(true);
    setSelectedPlace(null);
    debouncedSearch(value);
  };

  const handleResultClick = (result: SearchResult) => {
    onLocationSelect(result.center[0], result.center[1]);
    setShowResults(false);
    setResults([]);
    setInputValue(result.place_name);
    setSelectedPlace(result.place_name);
  };

  const handleReset = () => {
    setInputValue('');
    setShowResults(false);
    setResults([]);
    setSelectedPlace(null);
    setIsSearching(false);
    inputRef.current?.blur();
    // Reset marker without flying to location
    onLocationSelect(0, 0);
  };

  return (
    <div className="relative w-full">
      <div className="flex items-center w-full">
        <button
          onClick={handleReset}
          className={`absolute left-3 p-1 rounded-full transition-colors ${
            isDarkMode 
              ? 'hover:bg-white/10' 
              : 'hover:bg-black/10'
          }`}
        >
          {isSearching || selectedPlace ? (
            <ArrowLeft className="w-4 h-4 opacity-60" />
          ) : (
            <Search className="w-4 h-4 opacity-60" />
          )}
        </button>
        <Input
          ref={inputRef}
          value={inputValue}
          className="w-full h-9 pl-12 bg-white/5 border-none placeholder:text-inherit/60 rounded-full focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none"
          placeholder="Search location"
          onChange={handleSearch}
          onFocus={() => setIsSearching(true)}
        />
      </div>
      {showResults && results.length > 0 && (
        <div 
          ref={dropdownRef}
          className={`absolute mt-2 w-full rounded-lg shadow-lg overflow-hidden z-50 ${
            isDarkMode 
              ? 'bg-zinc-700/90 border border-white/10' 
              : 'bg-zinc-900/95 border border-white/10'
          }`}
        >
          {results.map((result, index) => (
            <button
              key={index}
              className={`w-full px-4 py-2.5 text-left transition-colors ${
                isDarkMode
                  ? 'hover:bg-zinc-700/70 text-white'
                  : 'hover:bg-zinc-900/70 text-white'
              } ${index !== results.length - 1 ? 'border-b border-white/10' : ''}`}
              onClick={() => handleResultClick(result)}
            >
              <div className="font-medium">{result.text}</div>
              <div className="text-sm text-gray-400">
                {result.place_name}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
