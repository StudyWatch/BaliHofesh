import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, anonSupabase } from '@/integrations/supabase/client';

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
  role?: string;
  notification_preferences?: Json;
  created_at: string;
  updated_at: string;
}

export interface ProfileUpdateData {
  name?: string;
  bio?: string;
  avatar_url?: string;
  phone?: string;
  whatsapp_url?: string;
  location?: string;
  university?: string;
  study_year?: string;
  telegram_username?: string;
  instagram_username?: string;
  show_contact_info?: boolean;
  show_email?: boolean;
  show_phone?: boolean;
}

// פרופיל המשתמש הנוכחי
export const useUserProfile = () => {
  return useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('לא מחובר');

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      return data as UserProfile;
    }
  });
};

// פרופיל משתמש לפי ID
export const useProfileById = (userId: string) => {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      return data as UserProfile;
    },
    enabled: !!userId
  });
};

// עדכון פרופיל
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (profileData: ProfileUpdateData) => {
      const { data, error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    }
  });
};

// קורסים מועדפים של המשתמש
export const useUserFavoriteCourses = () => {
  return useQuery({
    queryKey: ['user-favorite-courses'],
    queryFn: async (): Promise<any[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('user_course_progress')
        .select(`
          id,
          semester,
          status,
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
        .eq('user_id', user.id);
        
      if (error) {
        console.error('Error fetching user favorite courses:', error);
        return [];
      }
      
      // Filter for favorites manually to avoid column errors
      return data?.filter((item: any) => 
        item.is_favorite === true || item.status === 'active'
      ) || [];
    }
  });
};

// פעילויות המשתמש - מוקטן לטבלאות קיימות
export const useUserActivities = (limit: number = 10) => {
  return useQuery({
    queryKey: ['user-activities', limit],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // חזרה על בסיס הטבלאות הקיימות
      const [partnerships, sessions] = await Promise.all([
        supabase
          .from('study_partners')
          .select('id, course_id, created_at, description')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(Math.floor(limit / 2)),
        supabase
          .from('shared_sessions')
          .select('id, course_id, created_at, title')
          .eq('user_id', user.id)
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

// שותפויות פעילות של המשתמש
export const useUserActivePartnerships = () => {
  return useQuery({
    queryKey: ['user-active-partnerships'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('study_partners')
        .select('*')
        .eq('user_id', user.id)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });
};

// מפגשים פעילים של המשתמש
export const useUserActiveSessions = () => {
  return useQuery({
    queryKey: ['user-active-sessions'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('shared_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });
};

// סטטיסטיקות פרופיל
export const useProfileStats = () => {
  return useQuery<any>({
    queryKey: ['profile-stats'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      try {
        // ספירות פשוטות עם type casting מפורש
        const partnershipsCount = await supabase
          .from('study_partners')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);
          
        const sessionsCount = await supabase
          .from('shared_sessions')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);
          
        return {
          partnershipsCreated: partnershipsCount.count || 0,
          sessionsCreated: sessionsCount.count || 0,
          favoriteCourses: 0,
          messagesSent: 0
        };
      } catch (error) {
        console.error('Error fetching profile stats:', error);
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