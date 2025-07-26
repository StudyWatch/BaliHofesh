import { AssignmentType } from '@/types/supabase-extensions';

export type NotificationType = 'assignment' | 'exam' | 'session' | 'partner' | 'system' | 'message';

export interface NotificationTemplate {
  type: NotificationType;
  title: string;
  message: string;
  delivery_target: 'site' | 'push' | 'both';
  is_critical?: boolean;
  expires_at?: Date;
}

export const notificationTemplates = {
  assignmentDue: (courseName: string, assignmentTitle: string, dueDate: string): NotificationTemplate => ({
    type: 'assignment',
    title: 'מטלה מתקרבת!',
    message: `המטלה "${assignmentTitle}" בקורס ${courseName} מועד ההגשה: ${dueDate}`,
    delivery_target: 'both',
    is_critical: true,
    expires_at: new Date(dueDate)
  }),

  newStudyPartner: (courseName: string, partnerName: string): NotificationTemplate => ({
    type: 'partner',
    title: 'שותף לימודים חדש!',
    message: `${partnerName} מחפש שותף לימודים בקורס ${courseName}`,
    delivery_target: 'site',
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  }),

  examReminder: (courseName: string, examDate: string): NotificationTemplate => ({
    type: 'exam',
    title: 'תזכורת בחינה',
    message: `בחינה בקורס ${courseName} מתקיימת ב-${examDate}`,
    delivery_target: 'both',
    is_critical: true,
    expires_at: new Date(examDate)
  }),

  sessionStarting: (sessionName: string, startTime: string): NotificationTemplate => ({
    type: 'session',
    title: 'מפגש מתחיל בקרוב',
    message: `המפגש "${sessionName}" מתחיל ב-${startTime}`,
    delivery_target: 'push',
    is_critical: true,
    expires_at: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
  }),

  systemUpdate: (title: string, message: string): NotificationTemplate => ({
    type: 'system',
    title,
    message,
    delivery_target: 'site',
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
  }),

  newMessage: (senderName: string, messagePreview: string): NotificationTemplate => ({
    type: 'message',
    title: 'הודעה חדשה',
    message: `הודעה מ-${senderName}: ${messagePreview}`,
    delivery_target: 'both',
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  })
};

export const getNotificationIcon = (type: NotificationType): string => {
  const icons = {
    assignment: '📝',
    exam: '📊',
    session: '👥',
    partner: '🤝',
    system: '⚙️',
    message: '💬'
  };
  return icons[type] || '📢';
};

export const getNotificationColor = (type: NotificationType): string => {
  const colors = {
    assignment: '#3b82f6', // blue
    exam: '#ef4444',       // red
    session: '#10b981',    // green
    partner: '#f59e0b',    // yellow
    system: '#6b7280',     // gray
    message: '#8b5cf6'     // purple
  };
  return colors[type] || '#6b7280';
};

export const shouldAutoDelete = (type: NotificationType): boolean => {
  // מקיים מעקב אחר סוגי התראות שצריכות להימחק אוטומטית
  return ['session'].includes(type);
};

export const getDefaultExpiryHours = (type: NotificationType): number => {
  const defaultHours = {
    assignment: 24 * 7,    // שבוע
    exam: 24 * 3,          // 3 ימים
    session: 2,            // שעתיים
    partner: 24 * 7,       // שבוע
    system: 24 * 30,       // חודש
    message: 24 * 7        // שבוע
  };
  return defaultHours[type] || 24;
};