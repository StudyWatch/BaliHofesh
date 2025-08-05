import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Tutor {
  id: string;
  name: string;
  subjects?: string[]; // ← הפך לאופציונלי כדי למנוע בעיית טיפוס
  courses: string[];
  rating: number;
  reviews_count: number;
  hourly_rate: number;
  location: string;
  avatar_url?: string;
  phone?: string;
  email?: string;
  experience?: string;
  description?: string;
  availability?: string;
  is_online: boolean;
  is_verified: boolean;
  tutor_courses: {
    id: string;
    course_id: string;
    course: {
      id: string;
      name_he: string;
      name_en?: string;
      code?: string;
      category?: string;
    };
  }[];
}

export const useTutors = () => {
  return useQuery({
    queryKey: ['tutors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tutors')
        .select(`
          *,
          tutor_courses (
            id,
            course_id,
            course: courses (
              id, name_he, name_en, code, category
            )
          )
        `)
        .order('rating', { ascending: false });

      if (error) throw error;

      // טיפוס בטוח
      return (data ?? []) as Tutor[];
    }
  });
};
