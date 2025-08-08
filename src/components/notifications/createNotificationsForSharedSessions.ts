// src/components/notifications/createNotificationsForSharedSessions.ts
import { supabase } from '@/integrations/supabase/client';
import { createNotification } from './createNotification';

type RawPrefs = {
  site_notifications?: boolean;
  show_shared_sessions_scheduled?: boolean;
} | null;

function parsePrefs(p: any): RawPrefs {
  try {
    return typeof p === 'string' ? JSON.parse(p) : p;
  } catch {
    return null;
  }
}

/**
 * יוצר התראות על מפגשי לימוד מתוכננים ל־"מחר",
 * רק למשתמשים שביקשו לקבל התראות אלה.
 */
export const createNotificationsForSharedSessions = async () => {
  const now = new Date();

  // גבולות היום של "מחר"
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);

  const startOfDay = new Date(tomorrow);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(tomorrow);
  endOfDay.setHours(23, 59, 59, 999);

  // 1) שולפים את המפגשים של מחר שעדיין לא נשלחה עליהם התראה
  const { data: sessions, error: sessionsErr } = await supabase
    .from('shared_sessions')
    .select('id, course_id, user_id, title, scheduled_start_time, notification_sent, is_active')
    .gte('scheduled_start_time', startOfDay.toISOString())
    .lte('scheduled_start_time', endOfDay.toISOString())
    .eq('is_active', true)
    .eq('notification_sent', false);

  if (sessionsErr) {
    console.error('❌ שגיאה בטעינת מפגשים:', sessionsErr.message);
    return;
  }
  if (!sessions || sessions.length === 0) return;

  // 2) טוענים העדפות למשתמשים רלוונטיים בבאלק
  const userIds = Array.from(new Set(sessions.map(s => s.user_id).filter(Boolean))) as string[];
  if (userIds.length === 0) return;

  const { data: profiles, error: profErr } = await supabase
    .from('profiles')
    .select('id, notification_preferences')
    .in('id', userIds);

  if (profErr) {
    console.error('❌ שגיאה בטעינת פרופילים:', profErr.message);
    return;
  }

  const prefsByUser = new Map<string, RawPrefs>();
  for (const p of profiles || []) {
    prefsByUser.set(p.id, parsePrefs(p.notification_preferences));
  }

  // 3) שולחים התראה רק למי שמפעיל: site_notifications && show_shared_sessions_scheduled
  for (const session of sessions) {
    const { id: sessionId, user_id, title, scheduled_start_time } = session;
    if (!user_id || !scheduled_start_time) continue;

    const prefs = prefsByUser.get(user_id) || {};
    const wantsSite = prefs?.site_notifications !== false; // ברירת מחדל: כן
    const wantsScheduledSessions = prefs?.show_shared_sessions_scheduled === true;

    if (!(wantsSite && wantsScheduledSessions)) {
      // לא מסמנים notification_sent כדי שאם המשתמש יפעיל בעתיד — עדיין נוכל לשלוח
      continue;
    }

    try {
      await createNotification({
        user_id,
        type: 'study_session',
        title: 'מחר יש לך מפגש לימוד',
        message: `המפגש "${title}" יתקיים מחר.`,
        link: `/shared-sessions/${sessionId}`, // עדיף להצמיד לינק מאשר assignment_id שלא רלוונטי לטבלת מטלות
        delivery_target: 'site', // לא שולחים Push עבור מפגשים
        push_to_phone: false,
        expires_at: scheduled_start_time,
        is_critical: false,
      });

      // מסמנים שנשלחה התראה כדי להימנע מכפילויות
      const { error: updErr } = await supabase
        .from('shared_sessions')
        .update({ notification_sent: true })
        .eq('id', sessionId);

      if (updErr) {
        // לא מפסיקים את הריצה בגלל זה — מדווחים וממשיכים
        console.warn(`⚠️ לא הצלחנו לסמן notification_sent עבור מפגש ${sessionId}:`, updErr.message);
      }
    } catch (e: any) {
      console.error(`❌ שגיאה בשליחת התראה למשתמש ${user_id} על מפגש ${sessionId}:`, e?.message || e);
      // לא מסמנים notification_sent במקרה של כשל כדי שנוכל לנסות שוב במחזור הבא
    }
  }
};
