import { supabase } from '@/integrations/supabase/client';
import { NotificationRecord } from '@/types/supabase-extensions';
import { notificationTemplates, NotificationType } from './notificationTemplates';

export class NotificationManager {
  // יצירת התראה חדשה
  static async createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    options?: {
      link?: string;
      delivery_target?: 'site' | 'push' | 'both';
      is_critical?: boolean;
      expires_at?: Date;
      assignment_id?: string;
      exam_id?: string;
    }
  ): Promise<{ data: NotificationRecord | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type,
          title,
          message,
          link: options?.link,
          delivery_target: options?.delivery_target || 'site',
          is_critical: options?.is_critical || false,
          expires_at: options?.expires_at?.toISOString(),
          assignment_id: options?.assignment_id,
          exam_id: options?.exam_id,
          is_read: false
        })
        .select()
        .single();

      return { data, error };
    } catch (error) {
      console.error('Error creating notification:', error);
      return { data: null, error };
    }
  }

  // שליחת התראה לכל המשתמשים בקורס
  static async notifyAllCourseUsers(
    courseId: string,
    type: NotificationType,
    title: string,
    message: string,
    options?: {
      link?: string;
      delivery_target?: 'site' | 'push' | 'both';
      is_critical?: boolean;
      expires_at?: Date;
    }
  ): Promise<{ success: boolean; error?: any }> {
    try {
      // קבלת כל המשתמשים הרשומים לקורס
      const { data: enrolledUsers, error: usersError } = await supabase
        .from('user_course_progress')
        .select('user_id')
        .eq('course_id', courseId);

      if (usersError || !enrolledUsers) {
        return { success: false, error: usersError };
      }

      // יצירת התראות לכל המשתמשים
      const notifications = enrolledUsers.map(user => ({
        user_id: user.user_id,
        type,
        title,
        message,
        link: options?.link,
        delivery_target: options?.delivery_target || 'site',
        is_critical: options?.is_critical || false,
        expires_at: options?.expires_at?.toISOString(),
        is_read: false
      }));

      const { error: insertError } = await supabase
        .from('notifications')
        .insert(notifications);

      return { success: !insertError, error: insertError };
    } catch (error) {
      return { success: false, error };
    }
  }

  // מחיקת התראות שפג תוקפן
  static async cleanupExpiredNotifications(): Promise<{ deletedCount: number; error?: any }> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .delete()
        .lt('expires_at', new Date().toISOString())
        .select();

      return { deletedCount: data?.length || 0, error };
    } catch (error) {
      return { deletedCount: 0, error };
    }
  }

  // סימון התראה כנקראה
  static async markAsRead(notificationId: string): Promise<{ success: boolean; error?: any }> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      return { success: !error, error };
    } catch (error) {
      return { success: false, error };
    }
  }

  // סימון כל ההתראות של המשתמש כנקראות
  static async markAllAsRead(userId: string): Promise<{ success: boolean; error?: any }> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      return { success: !error, error };
    } catch (error) {
      return { success: false, error };
    }
  }

  // קבלת מספר התראות שלא נקראו
  static async getUnreadCount(userId: string): Promise<{ count: number; error?: any }> {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false)
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);

      return { count: count || 0, error };
    } catch (error) {
      return { count: 0, error };
    }
  }

  // התראה למטלה חדשה
  static async notifyNewAssignment(
    courseId: string,
    courseName: string,
    assignmentTitle: string,
    dueDate: string,
    assignmentId: string
  ) {
    const template = notificationTemplates.assignmentDue(courseName, assignmentTitle, dueDate);
    return this.notifyAllCourseUsers(courseId, template.type, template.title, template.message, {
      delivery_target: template.delivery_target,
      is_critical: template.is_critical,
      expires_at: template.expires_at,
      link: `/course/${courseId}#assignments`,
      assignment_id: assignmentId
    });
  }

  // התראה לשותף לימודים חדש
  static async notifyNewStudyPartner(
    courseId: string,
    courseName: string,
    partnerName: string,
    partnerId: string
  ) {
    const template = notificationTemplates.newStudyPartner(courseName, partnerName);
    return this.notifyAllCourseUsers(courseId, template.type, template.title, template.message, {
      delivery_target: template.delivery_target,
      expires_at: template.expires_at,
      link: `/course/${courseId}#study-partners`
    });
  }

  // התראת מערכת כללית
  static async notifySystemUpdate(title: string, message: string, userIds?: string[]) {
    const template = notificationTemplates.systemUpdate(title, message);
    
    if (userIds) {
      // שליחה למשתמשים ספציפיים
      const notifications = userIds.map(userId => ({
        user_id: userId,
        type: template.type,
        title: template.title,
        message: template.message,
        delivery_target: template.delivery_target,
        expires_at: template.expires_at?.toISOString(),
        is_read: false
      }));

      const { error } = await supabase
        .from('notifications')
        .insert(notifications);

      return { success: !error, error };
    } else {
      // שליחה לכל המשתמשים - צריך לממש
      console.warn('Broadcast to all users not implemented yet');
      return { success: false, error: 'Broadcast not implemented' };
    }
  }
}