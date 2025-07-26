import { supabase } from '@/integrations/supabase/client';
import { createNotificationsForAssignment } from './createNotificationsForAssignment';

export const generateMissingAssignmentNotifications = async () => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  // טען את כל המטלות שעדיין לא נוצרו להן התראות
  const { data: assignments, error } = await supabase
    .from('course_assignments')
    .select('id, due_date')
    .gte('due_date', today.toISOString().slice(0, 10))
    .lte('due_date', tomorrow.toISOString().slice(0, 10));

  if (error || !assignments) {
    console.error('שגיאה בטעינת ממנים קרובים', error);
    return;
  }

  for (const assignment of assignments) {
    try {
      await createNotificationsForAssignment(assignment.id);
      console.log(`✅ נוצרו התראות לממן: ${assignment.id}`);
    } catch (err) {
      console.error(`❌ שגיאה בהתראה לממן ${assignment.id}:`, err);
    }
  }
};
