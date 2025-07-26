// src/components/notifications/createNotification.ts
import { supabase } from '@/integrations/supabase/client';
import type { CreateNotificationInput } from '@/types/notifications';

/**
 * יוצר התראה חדשה בטבלת Supabase `notifications`
 * @param input אובייקט עם כל פרטי ההתראה
 * @returns ההתראה שנוצרה, או שגיאה אם נכשלה
 */
export const createNotification = async (input: CreateNotificationInput) => {
  const {
    user_id,
    type,
    title,
    message,
    link = null,
    delivery_target = 'site',
    expires_at = null,
    assignment_id = null,
    exam_id = null,
    is_critical = false,
    push_to_phone = false,
  } = input;

  const reminder_days_before =
    input.reminder_days_before ??
    (type === 'exam' ? 3 : type === 'assignment' ? 2 : 1);

  const { data, error } = await supabase
    .from('notifications')
    .insert([
      {
        user_id,
        type,
        title,
        message,
        link,
        delivery_target,
        expires_at,
        assignment_id,
        exam_id,
        is_critical,
        push_to_phone,
        reminder_days_before,
        is_read: false,
      },
    ])
    .select()
    .single();

  if (error || !data) {
    console.error('❌ שגיאה ביצירת התראה:', error?.message || 'No data returned');
    throw new Error(error?.message || 'Unknown error while creating notification');
  }

  console.log(`🔔 נוצרה התראה: [${type}] "${title}" למשתמש ${user_id}`);
  return data;
};
