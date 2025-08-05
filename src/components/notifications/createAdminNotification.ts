import { supabase } from "@/integrations/supabase/client";

// טיפוס של ההתראה לאדמין
export type AdminNotificationPayload = {
  title: string;                      // כותרת ההתראה
  message?: string;                  // תוכן נוסף (אופציונלי)
  metadata?: Record<string, any>;    // מטא־מידע (JSON)
  triggered_by?: string | null;      // מזהה פרופיל שיזם (אם קיים)
};

// תשובת הפונקציה
export type AdminNotificationResult = {
  success: boolean;
  error?: string;
};

/**
 * שומר התראה חדשה בטבלת admin_notifications
 * 
 * שימושים מומלצים:
 * - יצירת שיבוץ חדש
 * - מחיקת קורס/משתמש
 * - פעולות רגישות כמו התחברות חריגה
 * - כל אירוע שדורש מעקב אדמין
 */
export const createAdminNotification = async (
  payload: AdminNotificationPayload
): Promise<AdminNotificationResult> => {
  const { title, message = "", metadata = {}, triggered_by = null } = payload;

  // אימות בסיסי
  if (!title || typeof title !== "string") {
    return { success: false, error: "Missing or invalid title" };
  }

  const { error } = await supabase.from("admin_notifications").insert([
    {
      title: title.trim(),
      message: message.trim(),
      metadata,
      triggered_by,
    },
  ]);

  if (error) {
    console.error("[createAdminNotification] Supabase error:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
};
