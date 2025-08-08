import { supabase } from '@/integrations/supabase/client';
import { createNotification } from './createNotification';

type Prefs = {
  site_notifications?: boolean;     // ברירת מחדל: true
  push_notifications?: boolean;     // ברירת מחדל: false
  exams?: {
    enabled?: boolean;              // ברירת מחדל: true
    reminders?: number[];           // ברירת מחדל: [3, 1]
  };
} | null;

type StudentProfile = {
  id: string;
  notification_preferences: Prefs;
};

function parsePrefs(p: any): Prefs {
  try {
    return typeof p === 'string' ? JSON.parse(p) : p;
  } catch {
    return null;
  }
}

export const createNotificationsForExam = async () => {
  const now = new Date();
  const todayISO = now.toISOString();

  // 1) בחינות קדימה בזמן
  const { data: exams, error } = await supabase
    .from('exam_dates')
    .select('id, course_id, exam_date, exam_session')
    .gte('exam_date', todayISO);

  if (error || !exams?.length) {
    if (error) console.error('❌ שגיאה בטעינת בחינות:', error);
    return;
  }

  // 2) ניקוי ישנות שפגו
  await supabase
    .from('notifications')
    .delete()
    .eq('type', 'exam')
    .lt('expires_at', todayISO);

  for (const exam of exams) {
    const examDate = new Date(exam.exam_date!);
    const daysUntilExam = Math.ceil((examDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // 3) מי רשומים לקורס?
    const { data: users, error: uErr } = await supabase
      .from('user_course_progress')
      .select('user_id')
      .eq('course_id', exam.course_id);

    if (uErr || !users?.length) continue;
    const userIds = users.map(u => u.user_id);

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

    // 5) מי כבר קיבל התראה *למרחק הימים הזה* על אותה בחינה?
    const { data: existing } = await supabase
      .from('notifications')
      .select('user_id, reminder_days_before')
      .eq('exam_id', exam.id)
      .eq('type', 'exam');

    const alreadyNotified = new Set(
      (existing || []).map(n => `${n.user_id}-${n.reminder_days_before ?? 'NA'}`)
    );

    const expiresAt = new Date(examDate);
    expiresAt.setDate(expiresAt.getDate() + 1);

    // 6) שליחה לפי העדפות החדשות
    for (const student of students) {
      const prefs = student.notification_preferences || {};
      const examsPrefs = prefs.exams || {};

      // מושבת? דלג
      if (examsPrefs.enabled === false) continue;

      // ברירות מחדל: reminders=[3,1], site=true, push=false
      const reminders =
        (Array.isArray(examsPrefs.reminders) && examsPrefs.reminders.length > 0)
          ? examsPrefs.reminders
          : [3, 1];

      if (!reminders.includes(daysUntilExam)) continue;

      const wantsSite = prefs.site_notifications !== false;       // ברירת מחדל: true
      const wantsPush = prefs.push_notifications === true;        // ברירת מחדל: false

      // אין בכלל ערוץ לשלוח? דלג
      if (!wantsSite && !wantsPush) continue;

      // אל תשלח אם כבר נשלח למרחק הזה
      if (alreadyNotified.has(`${student.id}-${daysUntilExam}`)) continue;

      const delivery_target = wantsSite && wantsPush ? 'both' : wantsPush ? 'push' : 'site';

      await createNotification({
        user_id: student.id,
        type: 'exam',
        title: 'תזכורת לבחינה מתקרבת',
        message: `יש לך בחינה בקורס ${exam.course_id} ב-${exam.exam_session} (${exam.exam_date?.split('T')[0]}).`,
        exam_id: exam.id,
        delivery_target,
        expires_at: expiresAt.toISOString(),
        is_critical: true,
        push_to_phone: wantsPush,
        reminder_days_before: daysUntilExam, // לשמירת ייחודיות בין כמה תזכורות לאותה בחינה
      });
    }
  }
};
