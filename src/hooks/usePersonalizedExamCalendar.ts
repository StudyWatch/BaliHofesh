import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PersonalizedExam {
  id: string;
  course_id: string;
  course_name: string;
  course_code: string;
  exam_type: string;
  exam_date: string;
  exam_time: string;
  institution_name: string;
}

export const usePersonalizedExamCalendar = () => {
  return useQuery({
    queryKey: ['personalized-exam-calendar'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('exam_dates')
        .select(`
          *,
          courses!inner (
            id,
            name_he,
            code,
            institutions (
              name_he
            ),
            user_course_progress!inner (
              user_id
            )
          )
        `)
        .eq('courses.user_course_progress.user_id', user.id)
        .gte('exam_date', new Date().toISOString().split('T')[0])
        .order('exam_date', { ascending: true })
        .limit(10);

      if (error) throw error;

      return data.map(exam => ({
        id: exam.id,
        course_id: exam.course_id,
        course_name: exam.courses.name_he,
        course_code: exam.courses.code,
        exam_type: exam.exam_type,
        exam_date: exam.exam_date,
        exam_time: exam.exam_time,
        institution_name: exam.courses.institutions?.name_he || ''
      })) as PersonalizedExam[];
    },
    enabled: true
  });
};