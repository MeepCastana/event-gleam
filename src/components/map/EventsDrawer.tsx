import { BottomDrawer } from "@/components/ui/bottom-drawer";
import { Activity, MapPin, Thermometer, Clock, AlertTriangle, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import mapboxgl from 'mapbox-gl';

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
  const [activeTab, setActiveTab] = useState<'info' | 'alerts'>('info');

  useEffect(() => {
    if (heatspotInfo?.coordinates) {
      setLocationDetails(prev => ({ ...prev, loading: true }));
      fetchLocationDetails(heatspotInfo.coordinates).then(details => {
        setLocationDetails({
          ...details,
          loading: false
        });
      });
    }
  }, [heatspotInfo?.coordinates]);

  const fetchLocationDetails = async (coordinates: [number, number]) => {
    try {
      // Get Mapbox token from Supabase config
      const { data: config, error } = await supabase
        .from('_config')
        .select('value')
        .eq('name', 'MAPBOX_TOKEN')
        .single() as { data: { value: string } | null, error: Error | null };

      if (error || !config?.value) {
        console.error('Mapbox token not found');
        return {};
      }

      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${coordinates[0]},${coordinates[1]}.json?access_token=${config.value}`
      );
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const streetAddress = data.features.find((f: any) => f.place_type.includes('address'))?.text || '';
        const district = data.features.find((f: any) => f.place_type.includes('neighborhood'))?.text || '';
        
        return {
          street: streetAddress,
          district: district
        };
      }
    } catch (error) {
      console.error('Error fetching location details:', error);
    }
    return {};
  };

  const getIntensityColor = (intensity: number) => {
    if (intensity >= 1.5) return 'text-red-500';
    if (intensity >= 1) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getIntensityBgColor = (intensity: number) => {
    if (intensity >= 1.5) return 'bg-red-500';
    if (intensity >= 1) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getIntensityLabel = (intensity: number) => {
    if (intensity >= 1.5) return 'High';
    if (intensity >= 1) return 'Medium';
    return 'Low';
  };

  const getIntensityPercentage = (intensity: number) => {
    return Math.min(Math.max((intensity / 2) * 100, 0), 100);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'info':
        return (
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
                <p className={`text-sm font-medium ${getIntensityColor(heatspotInfo?.intensity || 0)}`}>
                  {getIntensityLabel(heatspotInfo?.intensity || 0)}
                </p>
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${getIntensityPercentage(heatspotInfo?.intensity || 0)}%` }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className={`h-full ${getIntensityBgColor(heatspotInfo?.intensity || 0)} opacity-80`}
                  />
                </div>
              </div>
            </motion.div>
          </div>
        );
      case 'alerts':
        return (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
              <div className="flex items-start gap-3">
                <AlertTriangle size={16} className="text-red-400 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-red-400">High Activity Alert</h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    This location has shown increased activity in the last 24 hours.
                  </p>
                </div>
              </div>
            </div>
            <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <div className="flex items-start gap-3">
                <Users size={16} className="text-yellow-400 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-yellow-400">Crowded Area</h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    This area typically experiences high foot traffic during these hours.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        );
    }
  };

  const handleDrawerHeightChange = (isExpanded: boolean) => {
    if (!isExpanded) {
      onClose();
    }
  };

  return (
    <BottomDrawer 
      isOpen={true}
      onClose={onClose} 
      initialHeight={isDrawerExpanded ? 80 : 33}
      maxHeight={80}
      onExpand={() => handleDrawerHeightChange(true)} 
      onContract={() => handleDrawerHeightChange(false)} 
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

            <div className="flex items-center justify-center gap-2 p-1 bg-white/5 rounded-lg">
              <button
                onClick={() => setActiveTab('info')}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'info' ? 'bg-white/10' : 'hover:bg-white/5'
                }`}
              >
                Info
              </button>
              <button
                onClick={() => setActiveTab('alerts')}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'alerts' ? 'bg-white/10' : 'hover:bg-white/5'
                }`}
              >
                Alerts
              </button>
            </div>

            <AnimatePresence mode="wait">
              {renderTabContent()}
            </AnimatePresence>
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
