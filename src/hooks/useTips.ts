import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';

// טיפוס חדש תואם לשפה נוכחית
export interface LocalizedTip {
  id: string;
  title: string;
  content: string;
  category: string;
  rating: number;
  isSponsored: boolean;
}

export const useTips = () => {
  const { language } = useLanguage();

  return useQuery({
    queryKey: ['tips', language],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tips')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data ?? []).map((tip) => ({
        id: tip.id,
        title: language === 'he' ? tip.title_he : tip.title_en || tip.title_he,
        content: language === 'he' ? tip.content_he : tip.content_en || tip.content_he,
        category: tip.category,
        rating: tip.rating,
        isSponsored: tip.is_sponsored,
      })) as LocalizedTip[];
    },
  });
};
