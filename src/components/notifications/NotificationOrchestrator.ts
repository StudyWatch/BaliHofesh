import { useEffect } from 'react';
import { createNotificationsForAssignment } from './createNotificationsForAssignment';
import { createNotificationsForExam } from './createNotificationsForExam';
import { createNotificationsForExpiredPartners } from './createNotificationsForExpiredPartners';
import { useAuth } from '@/contexts/AuthProvider';

// דגל תחזוקה מה־ENV
const IS_MAINTENANCE =
  (import.meta as any).env?.VITE_MAINTENANCE_MODE === 'true';

// זמן מרווח בין ריצות (ברירת מחדל 5 דקות)
const INTERVAL_MINUTES = 5;

const NotificationOrchestrator = () => {
  const { user } = useAuth() as any;

  useEffect(() => {
    // מניעת ריצה במצבים לא רצויים
    if (IS_MAINTENANCE) {
      console.log('⏸ התראות מושבתות – מצב תחזוקה פעיל');
      return;
    }
    if (!user) {
      console.log('⏸ התראות מושבתות – אין משתמש מחובר');
      return;
    }

    let cancelled = false;

    const runNotifications = async () => {
      if (cancelled) return;
      try {
        await createNotificationsForAssignment();
        await createNotificationsForExam();
        await createNotificationsForExpiredPartners();
        // await createSystemNotification(...); אם יש
      } catch (error) {
        console.error('שגיאה בהפעלת התראות:', error);
      }
    };

    // הפעלה מיידית + מחזורית
    runNotifications();
    const interval = setInterval(runNotifications, INTERVAL_MINUTES * 60 * 1000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [user]);

  return null;
};

export default NotificationOrchestrator;
