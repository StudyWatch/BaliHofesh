// src/components/notifications/NotificationSystem.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthProvider';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';
import {
  Bell,
  Trash2 as Trash,
  Check,
  CheckCheck,
  Calendar,
  BookOpen,
  Users,
  Star,
  Info,
  Inbox,
  HelpCircle,
  X,
  DownloadCloud,
} from 'lucide-react';
import type { Database } from '@/integrations/supabase/supabase.types';

type DeliveryTarget = 'site' | 'push' | 'both';
type NotificationRow = Database['public']['Tables']['notifications']['Row'] & {
  delivery_target: DeliveryTarget;
};

interface NotificationSystemProps {
  isOpen: boolean;
  onClose: () => void;
  appName?: string;
  appIconUrl?: string;
}

/* =========================
   עזרים לזיהוי התקנה/מובייל
   ========================= */
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice?: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

const isStandalone = () =>
  (typeof window !== 'undefined' &&
    ((window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
      // @ts-ignore iOS Safari
      (window.navigator as any)?.standalone === true));

const isIOS = () => typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent);
const isAndroid = () => typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent);
const uaIsMobile = () =>
  typeof navigator !== 'undefined' && /android|iphone|ipad|ipod/i.test(navigator.userAgent);

// “מובייל סביר” גם כשבודקים ב-DevTools
const isLikelyMobile = () => {
  try {
    const coarse = window.matchMedia?.('(pointer: coarse)')?.matches;
    const narrow = window.matchMedia?.('(max-width: 820px)')?.matches;
    return uaIsMobile() || (coarse && narrow);
  } catch {
    return uaIsMobile();
  }
};

/* =========================
   אייקונים/צבעים לפי סוג
   ========================= */
const typeIcons: Record<string, React.ReactNode> = {
  exam: <Calendar className="w-4 h-4 text-red-500 dark:text-red-400" />,
  assignment: <BookOpen className="w-4 h-4 text-blue-500 dark:text-blue-400" />,
  study_partner: <Users className="w-4 h-4 text-green-600 dark:text-green-400" />,
  shared_session: <Users className="w-4 h-4 text-purple-500 dark:text-purple-300" />,
  system: <Star className="w-4 h-4 text-yellow-500 dark:text-yellow-300" />,
  message: <Bell className="w-4 h-4 text-cyan-500 dark:text-cyan-300" />,
  tip: <Info className="w-4 h-4 text-teal-500 dark:text-teal-300" />,
  default: <Inbox className="w-4 h-4 text-gray-400 dark:text-gray-300" />,
};
const getTypeIcon = (t: string) => typeIcons[t] || typeIcons.default;

const getTypeColor = (t: string) => {
  switch (t) {
    case 'exam':
      return 'border-red-300 bg-red-50 dark:border-red-900/40 dark:bg-red-950/30';
    case 'assignment':
      return 'border-blue-300 bg-blue-50 dark:border-blue-900/40 dark:bg-blue-950/30';
    case 'study_partner':
      return 'border-green-400 bg-green-50 dark:border-green-900/40 dark:bg-green-950/30';
    case 'shared_session':
      return 'border-purple-300 bg-purple-50 dark:border-purple-900/40 dark:bg-purple-950/30';
    case 'system':
      return 'border-yellow-300 bg-yellow-50 dark:border-yellow-900/40 dark:bg-yellow-950/30';
    case 'message':
      return 'border-cyan-300 bg-cyan-50 dark:border-cyan-900/40 dark:bg-cyan-950/30';
    case 'tip':
      return 'border-teal-300 bg-teal-50 dark:border-teal-900/40 dark:bg-teal-950/30';
    default:
      return 'border-gray-300 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/40';
  }
};

/* =========================
   NotificationSystem
   ========================= */
const NotificationSystem: React.FC<NotificationSystemProps> = ({
  isOpen,
  onClose,
  appName = 'האפליקציה שלנו',
  appIconUrl = '/icons/icon-192.png',
}) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ====== התקנת PWA (מובייל: הבאנר נשאר עד התקנה בפועל) ====== */
  const INSTALLED_KEY = 'pwa_installed_v1';
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [mobile, setMobile] = useState(false);
  const [installed, setInstalled] = useState<boolean>(() => {
    try {
      return localStorage.getItem(INSTALLED_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [showHelp, setShowHelp] = useState(false);

  // זיהוי מובייל/סטנדאלון בזמן פתיחת הדיאלוג
  useEffect(() => {
    setMobile(isLikelyMobile());
    if (isStandalone()) {
      setInstalled(true);
      try {
        localStorage.setItem(INSTALLED_KEY, '1');
      } catch {}
    }
  }, [isOpen]);

  // לכידת beforeinstallprompt + appinstalled + שינוי display-mode
  useEffect(() => {
    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setShowHelp(false);
      try {
        localStorage.setItem(INSTALLED_KEY, '1');
      } catch {}
    };

    window.addEventListener('beforeinstallprompt', onBip);
    window.addEventListener('appinstalled', onInstalled);

    // מעקב אחרי שינוי מצב תצוגה (למקרה שהמשתמש פתח כאפליקציה)
    const mm = window.matchMedia?.('(display-mode: standalone)');
    const onChange = () => {
      if (mm?.matches) onInstalled();
    };
    try {
      mm?.addEventListener('change', onChange);
    } catch {
      // older Safari
      // @ts-ignore
      mm?.addListener?.(onChange);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onBip);
      window.removeEventListener('appinstalled', onInstalled);
      try {
        mm?.removeEventListener?.('change', onChange);
      } catch {
        // @ts-ignore
        mm?.removeListener?.(onChange);
      }
    };
  }, []);

  // מוצג תמיד בנייד כל עוד לא מותקן
  const shouldShowInstallBar = mobile && !installed;

  const handleInstallClick = async () => {
    // לא מסתירים את הבאנר כאן – הוא ייעלם רק אחרי התקנה אמיתית
    if (deferredPrompt?.prompt) {
      try {
        await deferredPrompt.prompt(); // יפתח דיאלוג "הוספה למסך הבית" באנדרואיד/כרום
      } catch {
        /* no-op */
      }
      // לא מאפסים את deferredPrompt — ייתכן שהמשתמש ירצה לנסות שוב
    } else {
      // iOS וכד' — אין prompt. פותחים מדריך. הבאנר נשאר.
      setShowHelp(true);
    }
  };

  /* ====== טעינת התראות ====== */
  const fetchNotifications = async () => {
    if (!user) return setNotifications([]);
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .in('delivery_target', ['site', 'both'])
        .order('created_at', { ascending: false })
        .limit(70);
      if (error) throw error;

      const now = new Date();
      const filtered = (data || [])
        .filter(
          (n) =>
            (!n.expires_at || new Date(n.expires_at) > now) &&
            (n.title?.trim() || n.message?.trim()) &&
            ['site', 'both'].includes((n.delivery_target as DeliveryTarget) ?? 'site')
        )
        .map((n) => ({
          ...n,
          delivery_target: (n.delivery_target ?? 'site') as DeliveryTarget,
        }));
      setNotifications(filtered);
    } catch {
      toast.error('שגיאה בטעינת התראות');
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && user) fetchNotifications();
  }, [isOpen, user]);

  useEffect(() => {
    if (!user || !isOpen) return;
    pollingRef.current = setInterval(fetchNotifications, 60_000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [user, isOpen]);

  // קיצורי מקשים
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key.toLowerCase() === 'a' && !e.metaKey && !e.ctrlKey) markAllAsRead();
      if (e.key === 'Delete') deleteAllNotifications();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  /* ====== פעולות ====== */
  const markAsRead = async (notificationId: string) => {
    try {
      await supabase.from('notifications').update({ is_read: true }).eq('id', notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
    } catch {
      toast.error('שגיאה בסימון התראה');
    }
  };
  const deleteNotification = async (notificationId: string) => {
    try {
      await supabase.from('notifications').delete().eq('id', notificationId);
    } catch {
      toast.error('שגיאה במחיקת התראה');
      return;
    }
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    toast.success('התראה נמחקה');
  };
  const markAllAsRead = async () => {
    if (!user) return;
    setBulkLoading(true);
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false)
        .in('delivery_target', ['site', 'both']);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      toast.success('כל ההתראות סומנו כנקראו');
    } catch {
      toast.error('שגיאה בסימון התראות');
    }
    setBulkLoading(false);
  };
  const deleteAllNotifications = async () => {
    if (!user) return;
    setBulkLoading(true);
    try {
      const idsToDelete = notifications.map((n) => n.id);
      if (idsToDelete.length === 0) return;
      await supabase.from('notifications').delete().in('id', idsToDelete);
      setNotifications([]);
      toast.success('כל ההתראות נמחקו!');
    } catch {
      toast.error('שגיאה במחיקת כל ההתראות');
    }
    setBulkLoading(false);
  };

  /* ====== חישובי תצוגה ====== */
  const unread = useMemo(() => notifications.filter((n) => !n.is_read), [notifications]);
  const read = useMemo(() => notifications.filter((n) => n.is_read), [notifications]);
  const unreadCount = unread.length;
  const hasNotifications = unread.length > 0 || read.length > 0;

  /* ====== רנדר ====== */
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        dir="rtl"
        aria-label="מרכז התראות"
        className="
          w-full max-w-[720px] md:max-w-[640px] mx-auto bg-white dark:bg-gray-900
          border border-gray-200 dark:border-gray-800 shadow-2xl rounded-2xl
          h-[80vh] md:h-[640px] flex flex-col p-0
          /* מסתיר את כפתור הסגירה המובנה של shadcn */
          [&>[aria-label='Close']]:hidden
          [&_button[aria-label='Close']]:hidden
          [&_button.absolute.right-4.top-4]:hidden
        "
      >
        {/* טופ־בר: פעולות בשמאל, כותרת במרכז, X בימין */}
        <div
          dir="ltr"
          className="
            grid grid-cols-[auto_1fr_auto] items-center gap-2 px-3 sm:px-4 pt-3 pb-3
            border-b border-gray-100 dark:border-gray-800
            bg-gradient-to-r from-blue-500/10 via-purple-300/20 to-pink-100/20
            dark:from-blue-900/10 dark:via-purple-900/10 dark:to-pink-900/10
            rounded-t-2xl
          "
        >
          {/* פעולות — שמאל */}
          <div className="flex items-center gap-1 sm:gap-2 justify-start">
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs sm:text-sm flex items-center gap-1 hover:text-green-700 dark:hover:text-green-400"
              disabled={bulkLoading || unreadCount === 0}
              title="סמן הכל כנקרא (A)"
            >
              <CheckCheck className="w-4 h-4" />
              <span className="hidden sm:inline">סמן הכל כנקרא</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={deleteAllNotifications}
              className="text-xs sm:text-sm flex items-center gap-1 hover:text-red-700 dark:hover:text-red-400"
              disabled={bulkLoading || !hasNotifications}
              title="מחק הכל (Del)"
            >
              <Trash className="w-4 h-4" />
              <span className="hidden sm:inline">מחק הכל</span>
            </Button>
          </div>

          {/* כותרת — מרכז */}
          <div className="flex items-center justify-center gap-2 min-w-0">
            <Bell className="w-5 h-5 shrink-0 text-blue-900 dark:text-blue-100" />
            <DialogTitle className="truncate text-lg font-bold text-blue-900 dark:text-blue-100">
              התראות
            </DialogTitle>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs px-2 shrink-0">
                {unreadCount}
              </Badge>
            )}
          </div>

          {/* X — ימין (יחיד) */}
          <div className="flex items-center justify-end">
            <DialogClose asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full h-9 w-9 sm:h-10 sm:w-10 text-gray-700 dark:text-gray-100
                           bg-white/30 dark:bg-white/10 hover:bg-white/50 dark:hover:bg-white/20
                           border border-white/40"
                aria-label="סגור"
                title="סגור (Esc)"
              >
                <X className="w-5 h-5" />
              </Button>
            </DialogClose>
          </div>
        </div>

        {/* גוף הרשימה */}
        <ScrollArea className="flex-1 w-full px-0.5">
          {loading ? (
            <div className="p-10 flex flex-col items-center text-center">
              <Bell className="w-10 h-10 text-blue-400 animate-bounce mb-2" />
              <span className="text-blue-800 dark:text-blue-200 font-semibold">טוען התראות...</span>
            </div>
          ) : !hasNotifications ? (
            <div className="flex flex-col items-center py-20 opacity-80">
              <Inbox className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-2" />
              <div className="font-bold text-lg text-gray-700 dark:text-gray-200">אין התראות להצגה</div>
              <div className="text-gray-400 dark:text-gray-500 text-xs mt-1">לא התקבלו התראות חדשות לאחרונה</div>
            </div>
          ) : (
            <div className="space-y-2 p-2 pb-6">
              {unread.length > 0 && (
                <>
                  <div className="px-2 py-1 text-xs font-semibold text-blue-800 dark:text-blue-200 bg-blue-50 dark:bg-blue-900/20 rounded shadow-sm mb-1 border border-blue-100 dark:border-blue-900/30">
                    התראות חדשות ({unread.length})
                  </div>
                  {unread.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkAsRead={markAsRead}
                      onDelete={deleteNotification}
                    />
                  ))}
                </>
              )}

              {read.length > 0 && (
                <>
                  {unread.length > 0 && (
                    <div className="px-2 py-1 text-xs font-semibold text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 rounded mt-2 border border-gray-100 dark:border-gray-800">
                      התראות שנקראו
                    </div>
                  )}
                  {read.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkAsRead={markAsRead}
                      onDelete={deleteNotification}
                    />
                  ))}
                </>
              )}
            </div>
          )}
        </ScrollArea>

        {/* פוטר – הבאנר יושב כאן ותמיד בתחתית במובייל עד התקנה */}
        <div className="border-t border-gray-100 dark:border-gray-800 px-3 sm:px-4 pt-2 pb-[max(14px,env(safe-area-inset-bottom))]">
          {/* בלוק העזרה (נסגר עם X קטן) */}
          {shouldShowInstallBar && showHelp && (
            <div className="md:hidden mb-2 relative rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-3 text-sm">
              <button
                onClick={() => setShowHelp(false)}
                aria-label="סגור עזרה"
                className="absolute left-2 top-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="font-bold mb-2 pr-1">איך מתקינים כאפליקציה ומפעילים התראות?</div>
              {isIOS() && (
                <ol className="list-decimal mr-5 space-y-1 text-gray-700 dark:text-gray-300">
                  <li>פתח/י את האתר ב־Safari.</li>
                  <li>לחצ/י על כפתור השיתוף.</li>
                  <li>בחר/י <b>הוספה למסך הבית</b>.</li>
                  <li>פתח/י את האפליקציה והפעל/י התראות בהגדרות.</li>
                </ol>
              )}
              {isAndroid() && (
                <ol className="list-decimal mr-5 space-y-1 text-gray-700 dark:text-gray-300">
                  <li>ב־Chrome/Android יופיע “הוספה למסך הבית” או דרך ⋮.</li>
                  <li>בחר/י <b>הוספה למסך הבית</b>.</li>
                  <li>פתח/י את האפליקציה והפעל/י התראות בהגדרות.</li>
                </ol>
              )}
              {!isIOS() && !isAndroid() && (
                <div className="text-gray-700 dark:text-gray-300">
                  ניתן להוסיף למסך הבית דרך תפריט הדפדפן ולהפעיל התראות בהגדרות.
                </div>
              )}
            </div>
          )}

          {shouldShowInstallBar && (
            <div className="md:hidden w-full rounded-xl border border-blue-200/60 dark:border-blue-900/50 bg-blue-50/80 dark:bg-blue-950/30 shadow-sm px-3 py-2">
              <div className="flex items-center gap-3">
                <img
                  src={appIconUrl}
                  alt={appName}
                  className="w-9 h-9 rounded-xl border border-blue-300/40 dark:border-blue-700/40 object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-blue-900 dark:text-blue-100 truncate">
                    התקינו את {appName}
                  </div>
                  <div className="text-[11px] text-blue-900/70 dark:text-blue-200/80 truncate">
                    גישה מהמסך הראשי · התראות מרוכזות · חוויית מובייל חלקה
                  </div>
                </div>
                <Button onClick={handleInstallClick} className="h-9 px-3 text-xs flex items-center gap-2">
                  <DownloadCloud className="w-4 h-4" />
                  התקנה
                </Button>
                <Button variant="ghost" className="h-9 px-2" onClick={() => setShowHelp((v) => !v)}>
                  <HelpCircle className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* כפתור סגירה של הדיאלוג */}
          <div className="mt-2 flex justify-end">
            <Button
              variant="outline"
              onClick={onClose}
              className="rounded-full font-bold shadow-sm hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              סגור
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

/* =========================
   פריט התראה
   ========================= */
const NotificationItem: React.FC<{
  notification: NotificationRow;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}> = ({ notification, onMarkAsRead, onDelete }) => {
  const colorClasses = getTypeColor(notification.type);

  const handleClick = () => {
    if (notification.link) {
      if (notification.link.startsWith('/')) {
        window.location.href = notification.link;
      } else {
        window.open(notification.link, '_blank', 'noopener,noreferrer');
      }
    }
  };

  return (
    <article
      className={`relative p-4 rounded-2xl border shadow-sm cursor-pointer transition-all group ${colorClasses}
        ${notification.is_read ? 'opacity-60' : 'opacity-100'} hover:shadow-lg`}
      onClick={handleClick}
      title={notification.title ?? ''}
      tabIndex={0}
      aria-label={`התראה: ${notification.title ?? ''}`}
      dir="rtl"
      style={{ direction: 'rtl', wordBreak: 'break-word' }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-shrink-0 mt-1">{getTypeIcon(notification.type)}</div>

        <div className="flex-1 min-w-0 pr-2">
          <div className="flex items-center gap-1">
            <h4
              className={`font-bold text-base mb-0 truncate ${
                notification.is_read
                  ? 'text-gray-700 dark:text-gray-300'
                  : 'text-blue-900 dark:text-blue-100'
              }`}
            >
              {notification.title}
            </h4>
            {notification.is_critical && (
              <span className="ml-1 text-xs text-red-700 dark:text-red-300 font-bold px-2 py-0.5 bg-red-100 dark:bg-red-900/30 rounded">
                חשוב
              </span>
            )}
          </div>

          <p
            className={`text-xs leading-relaxed mt-1 whitespace-pre-wrap ${
              notification.is_read ? 'text-gray-600 dark:text-gray-400' : 'text-gray-800 dark:text-gray-200'
            }`}
            style={{ textAlign: 'right', direction: 'rtl' }}
          >
            {notification.message}
          </p>

          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {notification.created_at &&
                formatDistanceToNow(new Date(notification.created_at), {
                  addSuffix: true,
                  locale: he,
                })}
            </span>
            {notification.assignment_id && (
              <span className="text-xs px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 font-bold">
                מטלה
              </span>
            )}
            {notification.exam_id && (
              <span className="text-xs px-2 py-0.5 rounded bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-200 font-bold">
                בחינה
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity mr-2">
          {!notification.is_read && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onMarkAsRead(notification.id);
              }}
              className="h-6 w-6 p-0"
              title="סמן כנקרא"
              aria-label="סמן כנקרא"
            >
              <Check className="w-3 h-3" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(notification.id);
            }}
            className="h-6 w-6 p-0 text-red-500 hover:text-red-700 dark:text-red-300 dark:hover:text-red-200"
            title="מחק התראה"
            aria-label="מחק התראה"
          >
            <Trash className="w-3 h-3" />
          </Button>
        </div>

        {!notification.is_read && (
          <div className="w-2 h-2 bg-blue-500 dark:bg-blue-300 rounded-full flex-shrink-0 mt-1 absolute right-2 top-2 animate-pulse" />
        )}
      </div>
    </article>
  );
};

export default NotificationSystem;
