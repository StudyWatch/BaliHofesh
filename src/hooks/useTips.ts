
import { useQuery } from '@tanstack/react-query';
import { anonSupabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';

export interface Tip {
  id: string;
  title_he: string;
  title_en?: string;
  content_he: string;
  content_en?: string;
  category: string;
  rating: number;
  is_sponsored: boolean;
}

export const useTips = () => {
  const { language } = useLanguage();
  
  return useQuery({
    queryKey: ['tips'],
    queryFn: async () => {
      const { data, error } = await anonSupabase
        .from('tips')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Transform data to match existing interface
      return data.map(tip => ({
        id: tip.id,
        title: language === 'he' ? tip.title_he : (tip.title_en || tip.title_he),
        content: language === 'he' ? tip.content_he : (tip.content_en || tip.content_he),
        category: tip.category,
        rating: tip.rating,
        isSponsored: tip.is_sponsored
      }));
    }
  });
};
