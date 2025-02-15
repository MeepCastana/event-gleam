
import { useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface POI {
  id: string;
  name: string;
  category: 'bar' | 'restaurant' | 'hotel' | 'plaza' | 'mall';
  latitude: number;
  longitude: number;
  description: string | null;
  rating: number | null;
}

const categoryColors = {
  bar: '#FF6B6B',
  restaurant: '#4ECDC4',
  hotel: '#45B7D1',
  plaza: '#96CEB4',
  mall: '#D4A5A5'
};

const categoryIcons = {
  bar: '🍺',
  restaurant: '🍽️',
  hotel: '🏨',
  plaza: '🏛️',
  mall: '🛍️'
};

interface PointsOfInterestProps {
  map: mapboxgl.Map | null;
  mapLoaded: boolean;
}

export const PointsOfInterest = ({ map, mapLoaded }: PointsOfInterestProps) => {
  const [pois, setPois] = useState<POI[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const fetchPOIs = async () => {
      try {
        const { data, error } = await supabase
          .from('points_of_interest')
          .select('*');

        if (error) throw error;
        setPois(data || []);
      } catch (error) {
        console.error('Error fetching POIs:', error);
        toast({
          variant: "destructive",
          title: "Error loading points of interest",
          description: "Failed to load locations. Please try again later."
        });
      }
    };

    fetchPOIs();
  }, [toast]);

  useEffect(() => {
    if (!map || !mapLoaded || pois.length === 0) return;

    // Add markers for each POI
    const markers: mapboxgl.Marker[] = [];

    pois.forEach((poi) => {
      // Create custom marker element
      const el = document.createElement('div');
      el.className = 'poi-marker';
      el.innerHTML = `
        <div class="relative group">
          <div class="w-8 h-8 rounded-full flex items-center justify-center text-lg"
               style="background-color: ${categoryColors[poi.category]}">
            ${categoryIcons[poi.category]}
          </div>
          <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-zinc-800/90 
                      text-white text-sm rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity 
                      whitespace-nowrap pointer-events-none">
            ${poi.name}
            ${poi.rating ? ` • ${poi.rating}⭐` : ''}
          </div>
        </div>
      `;

      // Create and add the marker
      const marker = new mapboxgl.Marker(el)
        .setLngLat([poi.longitude, poi.latitude])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 })
            .setHTML(`
              <div class="p-2">
                <h3 class="font-bold">${poi.name}</h3>
                <p class="text-sm text-gray-600">${categoryIcons[poi.category]} ${poi.category}</p>
                ${poi.description ? `<p class="mt-1 text-sm">${poi.description}</p>` : ''}
                ${poi.rating ? `<p class="mt-1 text-sm">Rating: ${poi.rating}⭐</p>` : ''}
              </div>
            `)
        )
        .addTo(map);

      markers.push(marker);
    });

    // Add custom CSS for markers
    const style = document.createElement('style');
    style.textContent = `
      .poi-marker {
        cursor: pointer;
      }
      .poi-marker:hover {
        z-index: 1;
      }
    `;
    document.head.appendChild(style);

    // Cleanup
    return () => {
      markers.forEach(marker => marker.remove());
      style.remove();
    };
  }, [map, mapLoaded, pois]);

  return null;
};
