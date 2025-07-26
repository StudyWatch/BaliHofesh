import { supabase } from '@/integrations/supabase/client';
import { createNotification } from './createNotification';

type StudentProfile = {
  id: string;
  notification_preferences: {
    exams?: {
      reminder_days_before?: number;
      push?: boolean;
      site?: boolean;
    };
  } | null;
};

export const createNotificationsForExam = async () => {
  const now = new Date();
  const todayISO = now.toISOString();

  // שלב 1: שליפת כל הבחינות שעדיין לא עברו
  const { data: exams, error } = await supabase
    .from('exam_dates')
    .select('id, course_id, exam_date, exam_session')
    .gte('exam_date', todayISO);

  if (error || !exams) {
    console.error('❌ שגיאה בטעינת בחינות:', error);
    return;
  }

  // שלב 2: מחיקת התראות ישנות על בחינות שכבר עברו
  await supabase
    .from('notifications')
    .delete()
    .eq('type', 'exam')
    .lt('expires_at', todayISO);

  for (const exam of exams) {
    const examDate = new Date(exam.exam_date!);
    const daysUntilExam = Math.ceil((examDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // שלב 3: שליפת המשתמשים בקורס
    const { data: users, error: uErr } = await supabase
      .from('user_course_progress')
      .select('user_id')
      .eq('course_id', exam.course_id);

    if (uErr || !users?.length) continue;
    const userIds = users.map(u => u.user_id);

    // שלב 4: שליפת פרופילים
    const { data: profiles, error: pErr } = await supabase
      .from('profiles')
      .select('id, notification_preferences')
      .in('id', userIds);

    if (pErr || !profiles) continue;

    const students: StudentProfile[] = profiles.map((s: any) => {
      let prefs = null;
      try {
        prefs = typeof s.notification_preferences === 'string'
          ? JSON.parse(s.notification_preferences)
          : s.notification_preferences;
      } catch { prefs = null; }

      return { id: s.id, notification_preferences: prefs };
    });

    // שלב 5: בדיקה למי כבר נשלחה התראה
    const { data: existing, error: nErr } = await supabase
      .from('notifications')
      .select('user_id')
      .eq('exam_id', exam.id)
      .eq('type', 'exam');

    const alreadyNotified = new Set(existing?.map(n => n.user_id) || []);
    const expiresAt = new Date(examDate);
    expiresAt.setDate(expiresAt.getDate() + 1);

    // שלב 6: שליחת התראות למי שצריך לפי העדפות
    for (const student of students) {
      if (alreadyNotified.has(student.id)) continue;

      const prefs = student.notification_preferences?.exams ?? {};
      const reminderDays = prefs.reminder_days_before ?? 3;
      if (daysUntilExam !== reminderDays) continue;

const push = prefs.push !== false; // ברירת מחדל: כן
      const site = prefs.site ?? true;
      const delivery_target = push && site ? 'both' : push ? 'push' : 'site';

      await createNotification({
        user_id: student.id,
        type: 'exam',
        title: 'תזכורת לבחינה מתקרבת',
        message: `יש לך בחינה בקורס מספר ${exam.course_id} ב-${exam.exam_session} (${exam.exam_date?.split('T')[0]}).`,
        exam_id: exam.id,
        delivery_target,
        expires_at: expiresAt.toISOString(),
        is_critical: true,
        push_to_phone: push,
      });
    }
  }
};
