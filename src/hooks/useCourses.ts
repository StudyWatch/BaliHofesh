import { useQuery } from '@tanstack/react-query';
import { anonSupabase } from '@/integrations/supabase/client';

export interface Course {
  id: string;
  name_he: string;
  name_en?: string;
  code?: string;
  institution_id: string;
  semester?: string;
  exam_date?: string;
  enable_collaboration: boolean;
  created_at: string;
  updated_at: string;
  institutions?: {
    id: string;
    name_he: string;
    name_en?: string;
    color?: string;
    type?: string;
  };
}

export const useCourses = (institutionId?: string) => {
  return useQuery({
    queryKey: ['courses', institutionId],
    queryFn: async () => {
      const query = anonSupabase
        .from('courses')
        .select(`
          *,
          institutions (
            id,
            name_he,
            name_en,
            color,
            type
          )
        `)
        .order('name_he');

      if (institutionId) {
        query.eq('institution_id', institutionId);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data as Course[];
    }
  });
};

export const useAllCourses = () => {
  return useQuery({
    queryKey: ['all-courses'],
    queryFn: async () => {
      const { data, error } = await anonSupabase
        .from('courses')
        .select(`
          *,
          institutions (
            id,
            name_he,
            name_en,
            color,
            type
          )
        `)
        .order('name_he');
      
      if (error) throw error;
      return data as Course[];
    }
  });
};