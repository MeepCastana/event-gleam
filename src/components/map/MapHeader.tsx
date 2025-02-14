
import { ArrowLeft, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface MapHeaderProps {
  menuStyle: string;
}

export const MapHeader = ({ menuStyle }: MapHeaderProps) => {
  return (
    <div className="absolute top-4 left-4 right-4 z-10 flex items-center gap-3">
      <div className={`${menuStyle} backdrop-blur-lg shadow-lg p-2 rounded-full border border-white/10`}>
        <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>
      <div className={`${menuStyle} backdrop-blur-lg shadow-lg px-6 py-3 rounded-full flex-1 border border-white/10`}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-60" />
          <Input
            className="w-full pl-9 bg-white/10 border-none placeholder:text-inherit/60 rounded-full"
            placeholder="Search for fun"
          />
        </div>
      </div>
    </div>
  );
};
