import { supabase } from '@/integrations/supabase/client';

export type NotificationType = 'assignment' | 'exam' | 'study_session' | 'study_partner' | 'message' | 'tip' | 'system';

export interface CreateNotificationInput {
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  delivery_target?: 'site' | 'push' | 'both';
  expires_at?: string;
  assignment_id?: string;
  exam_id?: string;
  is_critical?: boolean;
  push_to_phone?: boolean;
}

/**
 * יוצר התראה חדשה במסד הנתונים
 */
export const createNotification = async (input: CreateNotificationInput) => {
  const { data, error } = await supabase.from('notifications').insert([{
    user_id: input.user_id,
    type: input.type,
    title: input.title,
    message: input.message,
    link: input.link || null,
    delivery_target: input.delivery_target || 'site',
    expires_at: input.expires_at || null,
    assignment_id: input.assignment_id || null,
    exam_id: input.exam_id || null,
    is_critical: input.is_critical ?? false,
    push_to_phone: input.push_to_phone ?? false,
    is_read: false
  }]);

  if (error) {
    console.error('Error creating notification:', error.message);
    throw error;
  }

  return data;
};
