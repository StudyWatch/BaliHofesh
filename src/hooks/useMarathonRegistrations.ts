import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface MarathonRegistration {
  id: string;
  course_id: string;
  user_id?: string;
  user_name: string;
  user_email: string;
  registration_date: string;
  status: string;
  created_at: string;
}

export const useMarathonRegistrations = (courseId: string) => {
  return useQuery({
    queryKey: ['marathon-registrations', courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marathon_registrations')
        .select('*')
        .eq('course_id', courseId)
        .order('registration_date', { ascending: false });
      
      if (error) throw error;
      return data as MarathonRegistration[];
    }
  });
};

export const useCreateMarathonRegistration = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Omit<MarathonRegistration, 'id' | 'registration_date' | 'created_at'>) => {
      const { data: result, error } = await supabase
        .from('marathon_registrations')
        .insert(data)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['marathon-registrations', data.course_id] });
    }
  });
};

export const useDeleteMarathonRegistration = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('marathon_registrations')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marathon-registrations'] });
    }
  });
};