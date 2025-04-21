
import EventMap from "@/components/EventMap";
import { Toaster } from "@/components/ui/toaster";
import { useState, useEffect } from "react";

const Index = () => {
  const [isLoading, setIsLoading] = useState(true);

  // Set loading to false after a short delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <main className="fixed inset-0 w-full h-full">
      {isLoading && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/80 z-50">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-t-blue-500 border-r-transparent border-b-blue-500 border-l-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white text-lg">Loading map...</p>
          </div>
        </div>
      )}
      <EventMap />
      <Toaster />
    </main>
  );
};

export default Index;
