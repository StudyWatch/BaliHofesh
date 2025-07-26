
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface StudyRoom {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  link: string;
  contact_info?: string;
  platform?: string;
  expires_at: string;
  created_by: string;
  status: 'open' | 'closed';
  created_at: string;
  profiles?: {
    name: string;
  };
}

export const useStudyRooms = (courseId: string) => {
  return useQuery({
    queryKey: ['study-rooms', courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('study_rooms')
        .select(`
          *,
          profiles (
            name
          )
        `)
        .eq('course_id', courseId)
        .eq('status', 'open')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as StudyRoom[];
    }
  });
};

export const useCreateStudyRoom = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Omit<StudyRoom, 'id' | 'created_at' | 'profiles'>) => {
      const { data: result, error } = await supabase
        .from('study_rooms')
        .insert(data)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['study-rooms', data.course_id] });
    }
  });
};

export const useUpdateStudyRoom = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<StudyRoom> & { id: string }) => {
      const { data: result, error } = await supabase
        .from('study_rooms')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['study-rooms', data.course_id] });
    }
  });
};
