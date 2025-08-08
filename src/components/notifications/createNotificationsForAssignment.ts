import { supabase } from '@/integrations/supabase/client';
import { createNotification } from './createNotification';

// חישוב "ימים עד תאריך" לפי תאריך-בלבד (מונע החלקות DST/אזור-זמן)
const daysUntilDateOnly = (dateISO: string) => {
  const toYMD = (d: Date) => d.toISOString().slice(0, 10);
  const todayYMD = toYMD(new Date());
  const targetYMD = dateISO.slice(0, 10);
  const today = new Date(`${todayYMD}T00:00:00`);
  const target = new Date(`${targetYMD}T00:00:00`);
  return Math.round((+target - +today) / (1000 * 60 * 60 * 24));
};

type Assignment = {
  id: string;
  title: string;
  due_date: string;   // YYYY-MM-DD או ISO
  course_id: string;
};

type Prefs = {
  site_notifications?: boolean;     // ברירת מחדל: true
  push_notifications?: boolean;     // ברירת מחדל: false
  assignments?: {
    enabled?: boolean;              // ברירת מחדל: true
    reminders?: number[];           // ברירת מחדל: [2,1]
  };
} | null;

type StudentProfile = {
  id: string;
  notification_preferences: Prefs;
};

const parsePrefs = (p: any): Prefs => {
  try { return typeof p === 'string' ? JSON.parse(p) : p; }
  catch { return null; }
};

export const createNotificationsForAssignment = async (assignmentId?: string) => {
  // 1) הבאת מטלות רלוונטיות
  let assignments: Assignment[] = [];
  if (assignmentId) {
    const { data, error } = await supabase
      .from('course_assignments')
      .select('id, title, due_date, course_id')
      .eq('id', assignmentId)
      .single();
    if (error || !data) return;
    assignments = [data as Assignment];
  } else {
    const today = new Date().toISOString().slice(0, 10);
    const { data, error } = await supabase
      .from('course_assignments')
      .select('id, title, due_date, course_id')
      .gte('due_date', today); // ספוג רק קדימה בזמן
    if (error || !data) return;
    assignments = data as Assignment[];
  }

  for (const assignment of assignments) {
    const daysUntilDue = daysUntilDateOnly(assignment.due_date);

    // 2) ניקוי התראות ישנות אם המועד עבר
    if (daysUntilDue < 0) {
      await supabase
        .from('notifications')
        .delete()
        .eq('assignment_id', assignment.id)
        .eq('type', 'assignment');
      continue;
    }

    // 3) מי רשומים לקורס?
    const { data: users, error: usersErr } = await supabase
      .from('user_course_progress')
      .select('user_id')
      .eq('course_id', assignment.course_id);
    if (usersErr || !users?.length) continue;

    const userIds = Array.from(new Set(users.map(u => u.user_id)));

    // 4) פרופילים + העדפות בבאלק
    const { data: profiles, error: pErr } = await supabase
      .from('profiles')
      .select('id, notification_preferences')
      .in('id', userIds);
    if (pErr || !profiles?.length) continue;

    const students: StudentProfile[] = profiles.map((s: any) => ({
      id: s.id,
      notification_preferences: parsePrefs(s.notification_preferences),
    }));

    // 5) מי כבר קיבל התראה למרחק הימים הזה לאותה מטלה?
    const { data: existing } = await supabase
      .from('notifications')
      .select('user_id, reminder_days_before')
      .eq('assignment_id', assignment.id)
      .eq('type', 'assignment');

    const alreadyNotified = new Set(
      (existing || []).map(n => `${n.user_id}-${n.reminder_days_before ?? 'NA'}`)
    );

    // תפוגה: יום אחרי הדד־ליין
    const expiresAt = new Date(`${assignment.due_date.slice(0,10)}T00:00:00`);
    expiresAt.setDate(expiresAt.getDate() + 1);

    // 6) שליחה לפי העדפות החדשות
    for (const student of students) {
      const root = student.notification_preferences || {};
      const asn = root.assignments || {};

      // כבוי? דלג
      if (asn.enabled === false) continue;

      // ברירות מחדל
      const reminders =
        Array.isArray(asn.reminders) && asn.reminders.length > 0
          ? asn.reminders
          : [2, 1];

      if (!reminders.includes(daysUntilDue)) continue;

      const wantsSite = root.site_notifications !== false; // default true
      const wantsPush = root.push_notifications === true;  // default false

      if (!wantsSite && !wantsPush) continue;

      // אל תכפיל תזכורת לאותו מרחק ימים
      if (alreadyNotified.has(`${student.id}-${daysUntilDue}`)) continue;

      const delivery_target = wantsSite && wantsPush ? 'both' : wantsPush ? 'push' : 'site';

      try {
        await createNotification({
          user_id: student.id,
          type: 'assignment',
          title: 'תזכורת למטלה מתקרבת',
          message: `המטלה "${assignment.title}" תיסגר ${daysUntilDue === 0 ? 'היום' : `בעוד ${daysUntilDue} ימים`}.`,
          assignment_id: assignment.id,
          delivery_target,
          expires_at: expiresAt.toISOString(),
          is_critical: true,
          push_to_phone: wantsPush,
          reminder_days_before: daysUntilDue,
        });
      } catch (e) {
        // לא מפילים את כל הסבב בגלל כשל אחד
        console.error(`❌ כשל בשליחת התראה למשתמש ${student.id} על מטלה ${assignment.id}:`, e);
      }
    }
  }
};
