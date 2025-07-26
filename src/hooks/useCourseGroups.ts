
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CourseGroup {
  id: string;
  course_id: string;
  whatsapp_link?: string;
  discord_link?: string;
  created_at: string;
  updated_at: string;
}

export const useCourseGroups = (courseId: string) => {
  return useQuery({
    queryKey: ['course-groups', courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_groups')
        .select('*')
        .eq('course_id', courseId)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data as CourseGroup | null;
    }
  });
};

export const useCreateCourseGroup = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Omit<CourseGroup, 'id' | 'created_at' | 'updated_at'>) => {
      const { data: result, error } = await supabase
        .from('course_groups')
        .insert(data)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['course-groups', data.course_id] });
    }
  });
};

export const useUpdateCourseGroup = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<CourseGroup> & { id: string }) => {
      const { data: result, error } = await supabase
        .from('course_groups')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['course-groups', data.course_id] });
    }
  });
};
