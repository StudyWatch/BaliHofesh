// NotificationOrchestrator.tsx
import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthProvider';

import { createNotificationsForAssignment } from './createNotificationsForAssignment';
import { createNotificationsForExam } from './createNotificationsForExam';
import { createNotificationsForExpiredPartners } from './createNotificationsForExpiredPartners';
import { createNotificationsForSharedSessions } from './createNotificationsForSharedSessions';

// דגלי ENV
const IS_MAINTENANCE = (import.meta as any).env?.VITE_MAINTENANCE_MODE === 'true';
const INTERVAL_MINUTES = Number((import.meta as any).env?.VITE_NOTIF_INTERVAL_MINUTES ?? 5);
// להריץ גם התראות על מפגשי לימוד? (ברירת מחדל: כבוי)
const ENABLE_SHARED_SESSIONS =
  ((import.meta as any).env?.VITE_ENABLE_SHARED_SESSION_NOTIFS ?? 'false') === 'true';

// ריצה רק לאדמין? (ברירת מחדל: כן - כדי לעמוד ב-RLS)
const REQUIRE_ADMIN =
  ((import.meta as any).env?.VITE_NOTIF_REQUIRE_ADMIN ?? 'true') === 'true';

// Utils
const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

/** בדיקת הרשאות אדמין לפי RLS שקיים אצלך */
async function isCurrentUserAdmin(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (error) {
    console.warn('[Orchestrator] Failed to fetch role:', error.message);
    return false;
  }
  return data?.role === 'admin';
}

/** האם מותר לנו לרוץ כעת? (לא תחזוקה, און־ליין, הדף נראה לעין) */
function canRunNow() {
  if (IS_MAINTENANCE) return false;
  if (typeof navigator !== 'undefined' && navigator && 'onLine' in navigator) {
    if (!navigator.onLine) return false;
  }
  if (typeof document !== 'undefined' && document?.visibilityState) {
    if (document.visibilityState !== 'visible') return false;
  }
  return true;
}

const NotificationOrchestrator = () => {
  const { user } = useAuth() as any;
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const runningRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  // בדיקה חד־פעמית אם המשתמש אדמין (כאשר מחליפים משתמש – נבדוק שוב)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user) { setIsAdmin(false); return; }
      const ok = await isCurrentUserAdmin();
      if (!cancelled) setIsAdmin(ok);
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  useEffect(() => {
    if (!user) {
      console.log('⏸ התראות מושבתות – אין משתמש מחובר');
      return;
    }
    if (REQUIRE_ADMIN && !isAdmin) {
      console.log('⏸ התראות מושבתות – נדרשת הרשאת אדמין לפי RLS');
      return;
    }
    if (IS_MAINTENANCE) {
      console.log('⏸ התראות מושבתות – מצב תחזוקה פעיל');
      return;
    }

    let cancelled = false;
    abortRef.current = new AbortController();

    const safeTask = async (name: string, fn: () => Promise<any>) => {
      try {
        await fn();
      } catch (err: any) {
        // התעלמות מאזהרות כפילות (23505) – נובע מה-unique indexes שביססנו
        const msg = err?.message || err?.toString?.() || '';
        if (msg.includes('duplicate key value') || msg.includes('23505')) {
          console.debug(`ℹ️ [${name}] duplicate ignored`);
          return;
        }
        console.error(`❌ [${name}]`, err);
      }
    };

    const runOnce = async () => {
      if (cancelled || runningRef.current) return;
      if (!canRunNow()) return;

      runningRef.current = true;
      try {
        // מריצים סדרתית כדי לא להציף את ה-DB (לשיקולך לשנות ל-Promise.allSettled)
        await safeTask('assignments', createNotificationsForAssignment);
        await safeTask('exams', createNotificationsForExam);
        await safeTask('expired_partners', createNotificationsForExpiredPartners);

        if (ENABLE_SHARED_SESSIONS) {
          await safeTask('shared_sessions', createNotificationsForSharedSessions);
        }
      } finally {
        runningRef.current = false;
      }
    };

    // הפעלה מיידית + מחזורית
    runOnce();

    const intervalMs = Math.max(1, INTERVAL_MINUTES) * 60 * 1000;
    const interval = setInterval(runOnce, intervalMs);

    // ריצה גם כאשר העמוד חוזר לפוקוס / חוזרים לאון-ליין
    const onVisibility = () => runOnce();
    const onOnline = () => runOnce();

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', onVisibility);
    window.addEventListener('online', onOnline);

    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', onVisibility);
      window.removeEventListener('online', onOnline);
      abortRef.current?.abort();
    };
  }, [user?.id, isAdmin]);

  return null;
};

export default NotificationOrchestrator;
