import { createNotification } from './createNotification';

/**
 * יוצרת התראת מערכת כללית למשתמש
 */
export const createSystemNotification = async (
  userId: string,
  title: string,
  message: string,
  link?: string,
  expiresAt?: string
) => {
  await createNotification({
    user_id: userId,
    type: 'system',
    title,
    message,
    link,
    delivery_target: 'site',
    expires_at: expiresAt || null,
    is_critical: true,
    push_to_phone: false
  });
};
