
import { Button } from "@/components/ui/button";
import { Navigation } from "lucide-react";

interface LocationButtonProps {
  onClick: () => void;
  isDarkMode: boolean;
}

export const LocationButton = ({ onClick, isDarkMode }: LocationButtonProps) => {
  return (
    <button
      onClick={onClick}
      className={`${isDarkMode ? 'bg-zinc-700/90 text-zinc-100' : 'bg-zinc-900/95 text-zinc-100'} backdrop-blur-lg shadow-lg p-2 rounded-full border border-white/10 hover:bg-white/5 transition-colors`}
    >
      <Navigation className="w-5 h-5" />
    </button>
  );
};
