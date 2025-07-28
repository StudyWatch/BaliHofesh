// src/hooks/useProfile.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/supabase.types';
import { useAuth } from '@/App';

// --- טיפוס מלא לפרופיל כולל שדות נוספים ---
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  bio?: string;
  avatar_url?: string;
  phone?: string;
  whatsapp_url?: string;
  location?: string;
  university?: string;
  study_year?: string;
  telegram_username?: string;
  instagram_username?: string;
  show_contact_info: boolean;
  show_email: boolean;
  show_phone: boolean;
  role: string;
  is_tutor?: boolean;
  notification_preferences?: Json;
  created_at: string;
  updated_at: string;
}

export interface ProfileUpdateData extends Partial<Omit<UserProfile, 'id' | 'email' | 'created_at' | 'updated_at'>> {}

// --- פרופיל המשתמש הנוכחי ---
export const useUserProfile = () => {
  const { user } = useAuth();
  return useQuery<UserProfile>({
    queryKey: ['user-profile'],
    enabled: !!user,
    retry: false,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user!.id)
        .single();
      if (error) throw error;
      if (!data.role) data.role = 'user';
      return data as UserProfile;
    }
  });
};

// --- פרופיל לפי ID ---
export const useProfileById = (userId: string) => {
  return useQuery<UserProfile>({
    queryKey: ['profile', userId],
    enabled: !!userId,
    retry: false,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (error) throw error;
      if (!data.role) data.role = 'user';
      return data as UserProfile;
    }
  });
};

// --- עדכון פרופיל ---
export const useUpdateProfile = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation<UserProfile, Error, ProfileUpdateData>({
    mutationFn: async (profileData: ProfileUpdateData) => {
      const { data, error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', user!.id)
        .select()
        .single();
      if (error) throw error;
      return data as UserProfile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    }
  });
};

// --- קורסים מועדפים של המשתמש ---
export const useUserFavoriteCourses = () => {
  const { user } = useAuth();
  return useQuery<any[]>({
    queryKey: ['user-favorite-courses'],
    enabled: !!user,
    retry: false,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_course_progress')
        .select(`
          id,
          semester,
          status,
          is_favorite,
          courses!inner (
            id,
            name_he,
            code,
            semester,
            institutions (
              name_he,
              color
            )
          )
        `)
        .eq('user_id', user!.id);
      if (error) return [];
      return data?.filter((item: any) =>
        item.is_favorite === true || item.status === 'active'
      ) || [];
    }
  });
};

// --- פעילויות המשתמש ---
export const useUserActivities = (limit: number = 10) => {
  const { user } = useAuth();
  return useQuery<any[]>({
    queryKey: ['user-activities', limit],
    enabled: !!user,
    retry: false,
    queryFn: async () => {
      const [partnerships, sessions] = await Promise.all([
        supabase
          .from('study_partners')
          .select('id, course_id, created_at, description')
          .eq('user_id', user!.id)
          .order('created_at', { ascending: false })
          .limit(Math.floor(limit / 2)),
        supabase
          .from('shared_sessions')
          .select('id, course_id, created_at, title')
          .eq('user_id', user!.id)
          .order('created_at', { ascending: false })
          .limit(Math.floor(limit / 2))
      ]);
      const activities = [
        ...(partnerships.data || []).map(p => ({
          id: p.id,
          type: 'study_partner',
          description: `שותפות ללמידה - ${p.description || 'ללא תיאור'}`,
          created_at: p.created_at
        })),
        ...(sessions.data || []).map(s => ({
          id: s.id,
          type: 'shared_session',
          description: `מפגש: ${s.title}`,
          created_at: s.created_at
        }))
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      return activities.slice(0, limit);
    }
  });
};

// --- שותפויות פעילות של המשתמש ---
export const useUserActivePartnerships = () => {
  const { user } = useAuth();
  return useQuery<any[]>({
    queryKey: ['user-active-partnerships'],
    enabled: !!user,
    retry: false,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('study_partners')
        .select('*')
        .eq('user_id', user!.id)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });
};

// --- מפגשים פעילים של המשתמש ---
export const useUserActiveSessions = () => {
  const { user } = useAuth();
  return useQuery<any[]>({
    queryKey: ['user-active-sessions'],
    enabled: !!user,
    retry: false,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shared_sessions')
        .select('*')
        .eq('user_id', user!.id)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });
};

// --- סטטיסטיקות פרופיל ---
export const useProfileStats = () => {
  const { user } = useAuth();
  return useQuery<any>({
    queryKey: ['profile-stats'],
    enabled: !!user,
    retry: false,
    queryFn: async () => {
      try {
        const partnershipsCount = await supabase
          .from('study_partners')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user!.id);
        const sessionsCount = await supabase
          .from('shared_sessions')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user!.id);
        return {
          partnershipsCreated: partnershipsCount.count || 0,
          sessionsCreated: sessionsCount.count || 0,
          favoriteCourses: 0,
          messagesSent: 0
        };
      } catch {
        return {
          partnershipsCreated: 0,
          sessionsCreated: 0,
          favoriteCourses: 0,
          messagesSent: 0
        };
      }
    }
  });
};
