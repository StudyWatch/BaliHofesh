import { supabase } from '@/integrations/supabase/client';
import { createNotification } from './createNotification';

/**
 * שולח התראות לסטודנטים שהשותף שלהם ללמידה פג תוקפו,
 * אך רק אם לא נשלחה התראה קודמת מאותו סוג.
 */
export const createNotificationsForExpiredPartners = async () => {
  const now = new Date().toISOString();

  const { data: expiredPartners, error } = await supabase
    .from('study_partners')
    .select('id, user_id')
    .lt('expires_at', now);

  if (error || !expiredPartners) {
    console.error('שגיאה בשליפת שותפויות שפגו:', error);
    return;
  }

  for (const partner of expiredPartners) {
    // בדוק אם כבר קיימת התראה לשותפות זו
    const { data: existing, error: checkError } = await supabase
      .from('notifications')
      .select('id')
      .eq('user_id', partner.user_id)
      .eq('type', 'study_partner')
      .eq('title', 'השותף ללמידה הסתיים')
      .order('created_at', { ascending: false })
      .limit(1);

    if (checkError) {
      console.warn('שגיאה בבדיקת התראה קיימת:', checkError);
      continue;
    }

    if (existing && existing.length > 0) {
      continue; // התראה כבר קיימת – דלג
    }

    // צור התראה חדשה
    await createNotification({
      user_id: partner.user_id,
      type: 'study_partner',
      title: 'השותף ללמידה הסתיים',
      message: 'פג תוקף השותפות שלך ללמידה. תוכל להקים שותף חדש מהכרטיס האישי.',
      delivery_target: 'site',
      expires_at: null,
      is_critical: false,
      push_to_phone: false,
    });
  }
};
