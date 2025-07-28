// src/hooks/useRealUsers.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// 🎯 טיפוס מותאם לשדות בטבלת Supabase - profiles
export interface RealUser {
  id: string;
  name?: string | null;
  email?: string | null;
  role?: 'user' | 'admin' | null;
  avatar_url?: string | null;
  created_at: string;
  updated_at: string;
}

// 📦 שליפה של כל המשתמשים (admins + users)
export const useRealUsers = () => {
  return useQuery<RealUser[]>({
    queryKey: ['real-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          name,
          email,
          role,
          avatar_url,
          created_at,
          updated_at
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data ?? [];
    }
  });
};

// 🔧 עדכון תפקיד (user <-> admin)
export const useUpdateUserRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: 'user' | 'admin' }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['real-users'] });
    }
  });
};

// ❌ מחיקת משתמש מהטבלה (פרופיל בלבד)
export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['real-users'] });
    }
  });
};
