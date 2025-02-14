
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
      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors`}
    >
      <Navigation className="w-5 h-5" />
      <span>MY LOCATION</span>
    </button>
  );
};
