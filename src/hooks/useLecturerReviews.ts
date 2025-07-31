import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// הטיפוס המדויק מהטבלה עצמה
interface LecturerReviewRaw {
  id: string;
  lecturer_id: string;
  course_id: string;
  user_id: string;
  rating: number;
  comment: string;
  is_positive: boolean;
  created_at: string;
  updated_at: string;
  teaching_quality: number;
  lecturer_availability: number;
  personal_approach: number;
}

// הטיפוס שאתה מחזיר בפועל כולל שדות נוספים
export interface LecturerReview extends LecturerReviewRaw {
  lecturer_name: string;
  user_profile: { name: string };
}

export const useLecturerReviews = (lecturerId: string) => {
  return useQuery<LecturerReview[]>({
    queryKey: ['lecturer-reviews', lecturerId],
    enabled: !!lecturerId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lecturer_reviews')
        .select('*')
        .eq('lecturer_id', lecturerId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching lecturer reviews:', error);
        throw error;
      }

      // המרה לכלול שדות נוספים
      return (data || []).map((review) => ({
        ...review,
        lecturer_name: 'מרצה לא ידוע',
        user_profile: { name: 'סטודנט אנונימי' },
      }));
    }
  });
};
