
import { BottomDrawer } from "@/components/ui/bottom-drawer";
import { Activity, MapPin, Thermometer, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface HeatspotInfo {
  cityName: string;
  coordinates: [number, number];
  intensity: number;
}

interface EventsDrawerProps {
  menuStyle: string;
  isDrawerExpanded: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  heatspotInfo?: HeatspotInfo;
}

interface LocationDetails {
  street?: string;
  district?: string;
  loading: boolean;
}

export const EventsDrawer = ({ 
  menuStyle, 
  isDrawerExpanded, 
  onClose, 
  isDarkMode,
  heatspotInfo 
}: EventsDrawerProps) => {
  const [locationDetails, setLocationDetails] = useState<LocationDetails>({
    loading: false
  });

  const getIntensityColor = (intensity: number) => {
    if (intensity > 1.5) return 'text-red-400';
    if (intensity > 1) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getIntensityPercentage = (intensity: number) => {
    return Math.min(Math.round((intensity / 2) * 100), 100);
  };

  useEffect(() => {
    const fetchLocationDetails = async () => {
      if (!heatspotInfo) {
        setLocationDetails({ loading: false });
        return;
      }

      setLocationDetails({ loading: true });

      try {
        // Get Mapbox token from Supabase config
        const { data: config } = await supabase
          .from('_config')
          .select('value')
          .eq('name', 'MAPBOX_TOKEN')
          .single();

        if (!config?.value) {
          console.error('Mapbox token not found');
          return;
        }

        const [lng, lat] = heatspotInfo.coordinates;
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${config.value}&types=address,district`
        );

        if (!response.ok) throw new Error('Geocoding failed');

        const data = await response.json();
        const features = data.features || [];
        
        // Find the street and district from the features
        const street = features.find((f: any) => f.place_type.includes('address'))?.text;
        const district = features.find((f: any) => f.place_type.includes('district'))?.text;

        setLocationDetails({
          street: street || 'Street name unavailable',
          district: district || 'District unavailable',
          loading: false
        });
      } catch (error) {
        console.error('Error fetching location details:', error);
        setLocationDetails({
          street: 'Unable to load address',
          district: 'Location unavailable',
          loading: false
        });
      }
    };

    fetchLocationDetails();
  }, [heatspotInfo]);

  return (
    <BottomDrawer 
      isOpen={true}
      onClose={onClose} 
      initialHeight={isDrawerExpanded ? 75 : 35} 
      maxHeight={75} 
      onExpand={() => console.log('Drawer expanded')} 
      onContract={() => console.log('Drawer contracted')} 
      className={`${menuStyle} backdrop-blur-xl shadow-lg border border-white/10 ${isDarkMode ? 'bg-zinc-700/95' : 'bg-zinc-900/95'} text-zinc-100`}
    >
      <div className="h-full w-full p-4">
        <div className="absolute top-0 left-0 right-0 h-12 flex items-center justify-center cursor-grab active:cursor-grabbing touch-none">
          <div className="w-12 h-1.5 bg-white/20 rounded-full" />
        </div>
        
        {heatspotInfo ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-8 space-y-6"
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                  {heatspotInfo.cityName}
                </h2>
                <p className="text-sm text-zinc-400 flex items-center gap-1 mt-1">
                  <Clock size={14} />
                  Last updated {new Date().toLocaleTimeString()}
                </p>
              </div>
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
                className={`p-2 rounded-full ${getIntensityColor(heatspotInfo.intensity)} bg-white/5`}
              >
                <Activity size={20} />
              </motion.div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="p-4 rounded-lg bg-white/5 border border-white/10 space-y-2"
              >
                <div className="flex items-center gap-2 text-zinc-400">
                  <MapPin size={16} />
                  <span className="text-sm font-medium">Location</span>
                </div>
                {locationDetails.loading ? (
                  <motion.div 
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="h-4 bg-white/10 rounded w-3/4"
                  />
                ) : (
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{locationDetails.street}</p>
                    <p className="text-sm text-zinc-400">{locationDetails.district}</p>
                  </div>
                )}
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="p-4 rounded-lg bg-white/5 border border-white/10 space-y-2"
              >
                <div className="flex items-center gap-2 text-zinc-400">
                  <Thermometer size={16} />
                  <span className="text-sm font-medium">Activity Level</span>
                </div>
                <div className="space-y-1">
                  <p className={`text-sm font-medium ${getIntensityColor(heatspotInfo.intensity)}`}>
                    {heatspotInfo.intensity > 1.5 ? 'High' : heatspotInfo.intensity > 1 ? 'Medium' : 'Low'}
                  </p>
                  <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${getIntensityPercentage(heatspotInfo.intensity)}%` }}
                      transition={{ delay: 0.3, duration: 0.5 }}
                      className={`h-full ${getIntensityColor(heatspotInfo.intensity)} opacity-80`}
                    />
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="mt-8 text-center space-y-2"
          >
            <Activity size={24} className="mx-auto text-zinc-400" />
            <p className="text-zinc-400">
              Click on a heatspot to see more information
            </p>
          </motion.div>
        )}
      </div>
    </BottomDrawer>
  );
}
