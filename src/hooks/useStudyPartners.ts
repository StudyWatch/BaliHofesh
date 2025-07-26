import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// ממשק שותף לימוד
export interface StudyPartner {
  id: string;
  user_id: string;
  course_id: string;
  description: string;
  available_hours: string[];
  preferred_times: string[];
  contact_info?: string;
  avatar_url?: string;
  expires_at?: string;
  created_at: string;
  profiles?: {
    id: string;
    name: string;
    email?: string;
    avatar_url?: string;
  } | null;
}

// 1. טוען את כל הבקשות הפעילות לקורס מסוים, כולל פרטי פרופיל ע"י join
export const useStudyPartners = (courseId: string) => {
  return useQuery({
    queryKey: ['study-partners', courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('study_partners')
        .select('*, profiles(id, name, email, avatar_url)')
        .eq('course_id', courseId)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    }
  });
};

// 2. יצירת בקשה חדשה
export const useCreateStudyPartner = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<StudyPartner, 'id' | 'created_at' | 'profiles'>) => {
      const cleanData = {
        user_id: data.user_id,
        course_id: data.course_id,
        description: data.description,
        available_hours: data.available_hours || [],
        ...(data.preferred_times?.length && { preferred_times: data.preferred_times }),
        ...(data.contact_info && { contact_info: data.contact_info }),
        ...(data.avatar_url && { avatar_url: data.avatar_url }),
        ...(data.expires_at && { expires_at: data.expires_at }),
      };

      if (!cleanData.expires_at) {
        cleanData.expires_at = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
      }

      const { data: result, error } = await supabase
        .from('study_partners')
        .insert(cleanData)
        .select('*, profiles(id, name, email, avatar_url)')
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['study-partners', data.course_id] });
      queryClient.invalidateQueries({ queryKey: ['user-active-partner', data.course_id] });
    }
  });
};

// 3. מחיקת בקשה קיימת
export const useDeleteStudyPartner = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('study_partners')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['study-partners'] });
      queryClient.invalidateQueries({ queryKey: ['user-active-partner'] });
    }
  });
};

// 4. שליפת הבקשה הפעילה של המשתמש הנוכחי לקורס
export const useUserActiveStudyPartner = (courseId: string) => {
  return useQuery({
    queryKey: ['user-active-partner', courseId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('study_partners')
        .select('*, profiles(id, name, email, avatar_url)')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (error) {
        console.warn('Error fetching active study partner', error);
        return null;
      }

      return data;
    }
  });
};

// 5. הארכת בקשה קיימת (לפי ID)
export const useExtendStudyPartner = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, extraDays }: { id: string; extraDays: number }) => {
      const { data, error } = await supabase
        .from('study_partners')
        .select('expires_at')
        .eq('id', id)
        .maybeSingle();

      if (error || !data) throw error;

      const newDate = new Date(data.expires_at || new Date());
      newDate.setDate(newDate.getDate() + extraDays);

      const { error: updateError } = await supabase
        .from('study_partners')
        .update({ expires_at: newDate.toISOString() })
        .eq('id', id);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['study-partners'] });
      queryClient.invalidateQueries({ queryKey: ['user-active-partner'] });
    }
  });
};

// 6. עריכת בקשה קיימת
export const useUpdateStudyPartner = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Partial<Omit<StudyPartner, 'id' | 'created_at' | 'profiles'>> }) => {
      const { error } = await supabase
        .from('study_partners')
        .update(values)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['study-partners'] });
      queryClient.invalidateQueries({ queryKey: ['user-active-partner'] });
    }
  });
};
