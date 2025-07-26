import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, anonSupabase } from '@/integrations/supabase/client';

export interface ExamDate {
  id: string;
  course_id: string;
  exam_type: string;
  exam_date: string;
  exam_time: string;
  created_at: string;
  updated_at: string;
}

export const useExamDates = (courseId: string) => {
  return useQuery({
    queryKey: ['exam-dates', courseId],
    queryFn: async () => {
      const { data, error } = await anonSupabase
        .from('exam_dates')
        .select('*')
        .eq('course_id', courseId)
        .order('exam_date', { ascending: true });
      
      if (error) throw error;
      return data as ExamDate[];
    }
  });
};

export const useCreateExamDate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Omit<ExamDate, 'id' | 'created_at' | 'updated_at'>) => {
      const { data: result, error } = await supabase
        .from('exam_dates')
        .insert(data)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['exam-dates', data.course_id] });
    }
  });
};

export const useDeleteExamDate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('exam_dates')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam-dates'] });
    }
  });
};