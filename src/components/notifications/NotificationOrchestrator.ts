// NotificationOrchestrator.ts
import { useEffect } from 'react';
import { createNotificationsForAssignment } from './createNotificationsForAssignment';
import { createNotificationsForExam } from './createNotificationsForExam';
import { createNotificationsForExpiredPartners } from './createNotificationsForExpiredPartners';
// אם תרצה גם הודעות מערכת מתוזמנות:
// import { createSystemNotification } from './createSystemNotification';

const NotificationOrchestrator = () => {
  useEffect(() => {
    const runNotifications = async () => {
      try {
        await createNotificationsForAssignment();
        await createNotificationsForExam();
        await createNotificationsForExpiredPartners();
        // await createSystemNotification(...); אם יש
      } catch (error) {
        console.error('שגיאה בהפעלת התראות:', error);
      }
    };

    // הפעלה מיידית + כל 5 דקות
    runNotifications();
    const interval = setInterval(runNotifications, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return null;
};

export default NotificationOrchestrator;
