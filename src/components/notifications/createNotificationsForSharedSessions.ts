// src/components/notifications/createNotificationsForSharedSessions.ts
import { supabase } from '@/integrations/supabase/client';
import { createNotification } from './createNotification';

/**
 * יוצר התראות על מפגשי לימוד מתוזמנים ליום הבא
 */
export const createNotificationsForSharedSessions = async () => {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);

  const startOfDay = new Date(tomorrow);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(tomorrow);
  endOfDay.setHours(23, 59, 59, 999);

  const { data: sessions, error } = await supabase
    .from('shared_sessions')
    .select('id, course_id, user_id, title, scheduled_start_time')
    .gte('scheduled_start_time', startOfDay.toISOString())
    .lte('scheduled_start_time', endOfDay.toISOString())
    .eq('is_active', true)
    .eq('notification_sent', false);

  if (error || !sessions) {
    console.error('❌ שגיאה בטעינת מפגשים:', error?.message);
    return;
  }

  for (const session of sessions) {
    const {
      id: sessionId,
      user_id,
      title,
      course_id,
      scheduled_start_time,
    } = session;

    if (!user_id || !scheduled_start_time) continue;

    await createNotification({
      user_id,
      type: 'study_session',
      title: 'מחר יש לך מפגש לימוד',
      message: `המפגש "${title}" בקורס שלך יתקיים מחר.`,
      assignment_id: sessionId,
      delivery_target: 'site', // רק באתר
      push_to_phone: false,
      expires_at: scheduled_start_time,
      is_critical: false,
    });

    // עדכון כדי שלא נשלח שוב
    await supabase
      .from('shared_sessions')
      .update({ notification_sent: true })
      .eq('id', sessionId);
  }
};
