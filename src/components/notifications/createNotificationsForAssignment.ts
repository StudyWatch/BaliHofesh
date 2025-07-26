import { supabase } from '@/integrations/supabase/client';
import { createNotification } from './createNotification';
import { Database } from '@/integrations/supabase/supabase.types';

type Assignment = {
  id: string;
  title: string;
  due_date: string;
  course_id: string;
};

type StudentProfile = {
  id: string;
  notification_preferences: {
    assignments?: {
      reminder_days_before?: number;
      push?: boolean;
      site?: boolean;
    };
  } | null;
};

export const createNotificationsForAssignment = async (assignmentId?: string) => {
  const now = new Date();
  const today = now.toISOString();

  // --- שליפת המטלות הרלוונטיות ---
  let assignments: Assignment[] = [];
  if (assignmentId) {
    const { data, error } = await supabase
      .from('course_assignments')
      .select('id, title, due_date, course_id')
      .eq('id', assignmentId)
      .single();
    if (error || !data) return;
    assignments = [data];
  } else {
    const { data, error } = await supabase
      .from('course_assignments')
      .select('id, title, due_date, course_id');
    if (error || !data) return;
    assignments = data;
  }

  for (const assignment of assignments) {
    const dueDate = new Date(assignment.due_date);
    const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // --- מחיקת התראות של מטלות שכבר עבר זמנן ---
    if (daysUntilDue < 0) {
      await supabase
        .from('notifications')
        .delete()
        .eq('assignment_id', assignment.id)
        .eq('type', 'assignment');
      continue; // לא שולחים התראות עליהן
    }

    // --- שליפת הסטודנטים שנרשמו לקורס ---
    const { data: users, error: usersErr } = await supabase
      .from('user_course_progress')
      .select('user_id')
      .eq('course_id', assignment.course_id);
    if (usersErr || !users?.length) continue;
    const userIds = users.map(u => u.user_id);

    // --- שליפת פרופילים והעדפות ---
    const { data: studentsRaw, error: sErr } = await supabase
      .from('profiles')
      .select('id, notification_preferences')
      .in('id', userIds);
    if (sErr || !studentsRaw) continue;

    const students: StudentProfile[] = studentsRaw.map(s => {
      let prefs = null;
      try {
        prefs = typeof s.notification_preferences === 'string'
          ? JSON.parse(s.notification_preferences)
          : s.notification_preferences;
      } catch { prefs = null; }

      return { id: s.id, notification_preferences: prefs };
    });

    // --- שליפת משתמשים שכבר קיבלו התראה על המטלה ---
    const { data: existing, error: nErr } = await supabase
      .from('notifications')
      .select('user_id')
      .eq('assignment_id', assignment.id)
      .eq('type', 'assignment');
    const alreadyNotified = new Set(existing?.map(n => n.user_id));

    const expiresAt = new Date(assignment.due_date);
    expiresAt.setDate(expiresAt.getDate() + 1);

    // --- שליחת התראות רק למי שצריך ---
    for (const student of students) {
      const prefs = student.notification_preferences?.assignments ?? {};
      const reminderDays = prefs.reminder_days_before ?? 2;
      if (daysUntilDue !== reminderDays) continue;
      if (alreadyNotified.has(student.id)) continue;

      const push = prefs.push ?? true;
      const site = prefs.site ?? true;
      const delivery_target = push && site ? 'both' : push ? 'push' : 'site';

      await createNotification({
        user_id: student.id,
        type: 'assignment',
        title: 'תזכורת לממן בקורס',
        message: `הממן "${assignment.title}" יסתיים בעוד ${reminderDays} ימים`,
        assignment_id: assignment.id,
        delivery_target,
        expires_at: expiresAt.toISOString(),
        is_critical: true,
        push_to_phone: push,
      });
    }
  }
};
