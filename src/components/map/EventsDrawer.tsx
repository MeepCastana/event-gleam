import { BottomDrawer } from "@/components/ui/bottom-drawer";
import { Activity, MapPin, Thermometer, Clock, ChevronLeft, ChevronRight, Users, TrendingUp, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

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
  const [activeTab, setActiveTab] = useState<'info' | 'trends' | 'alerts'>('info');
  const [historicalData] = useState([
    { date: new Date(2024, 1, 1), value: 1.2 },
    { date: new Date(2024, 1, 2), value: 1.4 },
    { date: new Date(2024, 1, 3), value: 1.8 },
    { date: new Date(2024, 1, 4), value: 1.3 },
    { date: new Date(2024, 1, 5), value: 1.6 },
  ]);

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
                  {heatspotInfo?.intensity && (
                    heatspotInfo.intensity > 1.5 ? 'High' : heatspotInfo.intensity > 1 ? 'Medium' : 'Low'
                  )}
                </p>
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${getIntensityPercentage(heatspotInfo?.intensity || 0)}%` }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className={`h-full ${getIntensityColor(heatspotInfo?.intensity || 0)} opacity-80`}
                  />
                </div>
              </div>
            </motion.div>
          </div>
        );
      case 'trends':
        return (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <h3 className="text-sm font-medium text-zinc-400 mb-4">Activity Trend (Last 5 Days)</h3>
              <div className="h-32 relative">
                <div className="absolute inset-0 flex items-end justify-between">
                  {historicalData.map((data, index) => (
                    <div key={index} className="flex flex-col items-center gap-2 flex-1">
                      <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: `${(data.value / 2) * 100}%` }}
                        transition={{ delay: index * 0.1 }}
                        className={`w-2 rounded-full ${getIntensityColor(data.value)}`}
                      />
                      <span className="text-xs text-zinc-400 rotate-45 origin-left translate-y-4">
                        {format(data.date, 'MMM d')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-400">Average Activity</span>
                <span className="font-medium">1.46</span>
              </div>
            </div>
          </motion.div>
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
                onClick={() => setActiveTab('trends')}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'trends' ? 'bg-white/10' : 'hover:bg-white/5'
                }`}
              >
                Trends
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
