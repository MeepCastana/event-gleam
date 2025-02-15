
import { Navigation } from "lucide-react";

interface LocationButtonProps {
  onClick: () => void;
  isDarkMode: boolean;
}

export const LocationButton = ({ onClick, isDarkMode }: LocationButtonProps) => {
  return (
    <button
      onClick={onClick}
      className={`${
        isDarkMode 
          ? 'bg-zinc-700/90 hover:bg-white/5 active:bg-zinc-600/90' 
          : 'bg-zinc-900/95 hover:bg-white/5 active:bg-zinc-800/95'
      } backdrop-blur-lg shadow-lg p-2 rounded-full border border-white/10 transition-colors text-zinc-100`}
    >
      <Navigation className="w-5 h-5" />
    </button>
  );
};
