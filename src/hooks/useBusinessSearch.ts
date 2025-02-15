
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Business } from '@/types/business';

export const useBusinessSearch = (searchTerm: string) => {
  return useQuery({
    queryKey: ['businesses', 'search', searchTerm],
    queryFn: async (): Promise<Business[]> => {
      if (!searchTerm) return [];
      
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,address.ilike.%${searchTerm}%`)
        .order('name');

      if (error) throw error;
      return data;
    },
    enabled: !!searchTerm
  });
};
