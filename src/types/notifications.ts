// כל סוגי ההתראות הנתמכים
export type NotificationType =
  | 'assignment'
  | 'exam'
  | 'study_session'
  | 'study_partner'
  | 'system'
  | 'message'
  | 'tip';

// ערוצי משלוח
export type DeliveryTarget = 'site' | 'push' | 'both';

// טיפוס שמייצג שורה קיימת בטבלה `notifications`
export interface NotificationRecord {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string | null;
  message: string;
  link: string | null;
  is_read: boolean;
  delivery_target: DeliveryTarget;
  is_critical: boolean;
  push_to_phone: boolean;
  reminder_days_before: number | null; // ← חובה לפי הסכימה שלך
  created_at: string;
  expires_at: string | null;
  assignment_id: string | null;
  exam_id: string | null;
}

// טיפוס לקלט בעת יצירת התראה חדשה
export interface CreateNotificationInput {
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string | null;
  delivery_target?: DeliveryTarget;
  expires_at?: string | null;
  assignment_id?: string | null;
  exam_id?: string | null;
  is_critical?: boolean;
  push_to_phone?: boolean;
  reminder_days_before?: number | null; // ← נוסיף גם כאן כברירת מחדל
}
