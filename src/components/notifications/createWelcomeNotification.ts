// src/components/notifications/createWelcomeNotification.ts
import { createNotification } from './createNotification';

export const createWelcomeNotification = async (userId: string, lang: 'he' | 'en' = 'he') => {
  const messages = {
    he: {
      title: 'ברוך הבא לפלטפורמה שלנו! 🎉',
      message: `✨ כדי לקבל התראות על ממ״נים ובחינות, הוסף את הקורסים שלך בלחיצת כפתור.\n\n📅 כל המטלות והבחינות שלך יופיעו בלוח השנה אוטומטית – כולל תזכורות!\n\nבהצלחה! 🚀`,
    },
    en: {
      title: 'Welcome to our platform! 🎉',
      message: `✨ To get notifications about assignments and exams, just add your courses.\n\n📅 All your deadlines and exams will automatically appear in the calendar – with reminders!\n\nGood luck! 🚀`,
    },
  };

  const { title, message } = messages[lang] || messages.he;

  return await createNotification({
    user_id: userId,
    type: 'system',
    title,
    message,
    delivery_target: 'both',
    is_critical: false,
    push_to_phone: true,
    reminder_days_before: null,
    expires_at: null, // נשלט ע״י כניסות
  });
};
