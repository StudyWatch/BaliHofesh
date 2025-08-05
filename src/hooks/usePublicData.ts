import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// קריאה לנתוני מוסד ציבוריים (פתוחה לציבור)
export const usePublicInstitution = () => {
  return useQuery({
    queryKey: ['public-institution'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('institutions')
        .select('*')
        .eq('name_he', 'האוניברסיטה הפתוחה')
        .single();

      if (error) {
        console.warn('Institution fetch failed, using fallback:', error);
        return {
          id: '1',
          name_he: 'האוניברסיטה הפתוחה',
          name_en: 'The Open University',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      }

      return data;
    },
    staleTime: 10 * 60 * 1000, // 10 דקות
    retry: 1
  });
};

// קריאה לקורסים ציבוריים לפי מזהה מוסד
export const usePublicCourses = (institutionId?: string) => {
  return useQuery({
    queryKey: ['public-courses', institutionId],
    queryFn: async () => {
      if (!institutionId) return [];

      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('institution_id', institutionId)
        .order('name_he');

      if (error) {
        console.warn('Courses fetch failed, using fallback:', error);
        return [
          {
            id: 'mock-1',
            name_he: 'מבוא למדעי המחשב',
            name_en: 'Introduction to Computer Science',
            code: '20441',
            institution_id: institutionId,
            semester: 'א',
            exam_date: '2024-02-15',
            enable_collaboration: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'mock-2',
            name_he: 'מתמטיקה דיסקרטית',
            name_en: 'Discrete Mathematics',
            code: '20109',
            institution_id: institutionId,
            semester: 'א',
            exam_date: '2024-02-20',
            enable_collaboration: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ];
      }

      return data || [];
    },
    enabled: !!institutionId,
    staleTime: 5 * 60 * 1000, // 5 דקות
    retry: 1
  });
};
