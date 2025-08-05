import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthProvider';

export type DeliveryTarget = 'site' | 'push' | 'both';

export interface NotificationRecord {
  id: string;
  user_id: string;
  type: string;
  title: string | null;
  message: string;
  link: string | null;
  is_read: boolean;
  delivery_target: DeliveryTarget;
  is_critical: boolean;
  push_to_phone: boolean;
  reminder_days_before: number; // ← חובה
  created_at: string;
  expires_at: string | null;
  assignment_id: string | null; // ← חובה
  exam_id: string | null;       // ← חובה
}


// 👇 פונקציית Type Guard מלאה כולל reminder_days_before
function isNotificationRecord(n: any): n is NotificationRecord {
  return (
    typeof n?.id === 'string' &&
    typeof n?.user_id === 'string' &&
    typeof n?.type === 'string' &&
    typeof n?.message === 'string' &&
    typeof n?.is_read === 'boolean' &&
    typeof n?.delivery_target === 'string' &&
    ['site', 'push', 'both'].includes(n.delivery_target) &&
    (typeof n?.reminder_days_before === 'number' || n?.reminder_days_before === null || typeof n?.reminder_days_before === 'undefined')
  );
}

// ✅ טוען את כל ההתראות התקפות למשתמש
export const useSystemNotifications = () => {
  const { user } = useAuth();

  return useQuery<NotificationRecord[]>({
    queryKey: ['system-notifications', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ useSystemNotifications error:', error.message);
        return [];
      }

      const now = new Date();

      return (data || [])
        .filter((n): n is NotificationRecord =>
          isNotificationRecord(n) &&
          (!n.expires_at || new Date(n.expires_at) > now)
        )
        .map(n => ({
          ...n,
          delivery_target: n.delivery_target as DeliveryTarget,
        }));
    },
    enabled: !!user?.id,
    refetchInterval: 60000, // כל דקה
  });
};

// ✅ סימון התראה כנקראה
export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      if (!user?.id) throw new Error('Missing user ID');

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-notifications', user?.id] });
    },
  });
};

// ✅ מחיקת התראה
export const useDeleteNotification = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      if (!user?.id) throw new Error('Missing user ID');

      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-notifications', user?.id] });
    },
  });
};

// ✅ סימון כל ההתראות כנקראו
export const useMarkAllNotificationsAsRead = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Missing user ID');

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-notifications', user?.id] });
    },
  });
};
