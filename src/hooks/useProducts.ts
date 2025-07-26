
import { useQuery } from '@tanstack/react-query';
import { anonSupabase } from '@/integrations/supabase/client';

export interface Product {
  id: string;
  name_he: string;
  name_en?: string;
  description_he?: string;
  description_en?: string;
  price: number;
  original_price?: number;
  category: string;
  tags?: string[];
  image_url?: string;
  link?: string;
  is_subsidized: boolean;
  is_popular: boolean;
  is_new: boolean;
  is_exclusive: boolean;
}

export const useProducts = () => {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await anonSupabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Product[];
    }
  });
};
