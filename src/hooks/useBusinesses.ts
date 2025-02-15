
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Business } from '@/types/business';

export const useBusinesses = () => {
  return useQuery({
    queryKey: ['businesses'],
    queryFn: async (): Promise<Business[]> => {
      const { data, error } = await supabase
        .from('businesses')
        .select('*');

      if (error) {
        throw error;
      }

      return data;
    }
  });
};
