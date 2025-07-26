// src/components/notifications/NotificationSystem.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/App';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';
import { Bell, Trash2, Check, CheckCheck, Calendar, BookOpen, Users, Star, Info } from 'lucide-react';
import type { Database } from '@/integrations/supabase/supabase.types';

type DeliveryTarget = 'site' | 'push' | 'both';

type NotificationRow = Database['public']['Tables']['notifications']['Row'] & {
  delivery_target: DeliveryTarget;
};

interface NotificationSystemProps {
  isOpen: boolean;
  onClose: () => void;
}

// אייקון לכל סוג התראה
const typeIcons: Record<string, React.ReactNode> = {
  exam: <Calendar className="w-4 h-4 text-red-500" />,
  assignment: <BookOpen className="w-4 h-4 text-blue-500" />,
  study_partner: <Users className="w-4 h-4 text-green-600" />,
  shared_session: <Users className="w-4 h-4 text-purple-500" />,
  system: <Star className="w-4 h-4 text-yellow-500" />,
  message: <Bell className="w-4 h-4 text-cyan-500" />,
  tip: <Info className="w-4 h-4 text-teal-500" />,
  default: <Bell className="w-4 h-4 text-gray-400" />,
};

const getTypeIcon = (type: string) => typeIcons[type] || typeIcons['default'];
const getTypeColor = (type: string) => {
  switch (type) {
    case 'exam': return 'border-red-400 bg-red-50';
    case 'assignment': return 'border-blue-400 bg-blue-50';
    case 'study_partner': return 'border-green-500 bg-green-50';
    case 'shared_session': return 'border-purple-500 bg-purple-50';
    case 'system': return 'border-yellow-400 bg-yellow-50';
    case 'message': return 'border-cyan-400 bg-cyan-50';
    case 'tip': return 'border-teal-400 bg-teal-50';
    default: return 'border-gray-300 bg-gray-50';
  }
};

const NotificationSystem: React.FC<NotificationSystemProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // --- קריאה לטעינת התראות מהטבלה ---
  const fetchNotifications = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .in('delivery_target', ['site', 'both'])
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const now = new Date();
      const filtered: NotificationRow[] = (data || [])
        .filter((n): n is NotificationRow =>
          (!n.expires_at || new Date(n.expires_at) > now) &&
          ['site', 'both'].includes(n.delivery_target ?? 'site')
        )
        .map(n => ({
          ...n,
          delivery_target: (n.delivery_target ?? 'site') as DeliveryTarget,
        }));

      setNotifications(filtered);
    } catch (error: any) {
      console.error(error);
      toast.error('שגיאה בטעינת התראות');
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && user) fetchNotifications();
  }, [isOpen, user]);

  // Polling (טעינה כל דקה)
  useEffect(() => {
    if (!user || !isOpen) return;
    pollingRef.current = setInterval(fetchNotifications, 60000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [user, isOpen]);

  // --- פעולות ניהול ---
  const markAsRead = async (notificationId: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
    } catch (error: any) {
      toast.error('שגיאה בסימון התראה');
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      toast.success('כל ההתראות סומנו כנקראו');
    } catch (error: any) {
      toast.error('שגיאה בסימון התראות');
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      toast.success('התראה נמחקה');
    } catch (error: any) {
      toast.error('שגיאה במחיקת התראה');
    }
  };

  const unreadNotifications = notifications.filter(n => !n.is_read);
  const readNotifications = notifications.filter(n => n.is_read);
  const unreadCount = unreadNotifications.length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="w-full max-w-md mx-auto bg-white border-2 shadow-2xl rounded-2xl h-[600px] flex flex-col p-0"
        dir="rtl"
      >
        <DialogHeader className="flex flex-row items-center justify-between pb-4 border-b bg-gradient-to-r from-blue-500/20 via-purple-300/30 to-pink-100/40 rounded-t-2xl">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-blue-900">
            <Bell className="w-5 h-5" />
            התראות
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs px-2">
                {unreadCount}
              </Badge>
            )}
          </DialogTitle>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs flex items-center gap-1 hover:text-green-700"
            >
              <CheckCheck className="w-3 h-3" />
              סמן הכל כנקרא
            </Button>
          )}
        </DialogHeader>

        <ScrollArea className="flex-1 w-full px-1">
          {loading ? (
            <div className="p-4 text-center text-gray-500">טוען התראות...</div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4 animate-bounce" />
              <p className="text-gray-500">אין התראות להציג</p>
            </div>
          ) : (
            <div className="space-y-2 p-2">
              {unreadNotifications.length > 0 && (
                <>
                  <div className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded shadow-sm mb-1">
                    התראות חדשות ({unreadNotifications.length})
                  </div>
                  {unreadNotifications.map(notification => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkAsRead={markAsRead}
                      onDelete={deleteNotification}
                    />
                  ))}
                </>
              )}
              {readNotifications.length > 0 && (
                <>
                  {unreadNotifications.length > 0 && (
                    <div className="px-2 py-1 text-xs font-medium text-gray-500 bg-gray-50 rounded mt-2">
                      התראות נקראות
                    </div>
                  )}
                  {readNotifications.map(notification => (
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
        <div className="flex justify-end pt-4 border-t px-4 pb-2">
          <Button variant="outline" onClick={onClose} className="rounded-full">
            סגור
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// --- קומפוננטת פריט התראה בודד ---
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
    <div
      className={`p-3 rounded-xl border cursor-pointer transition-all hover:shadow-md group relative ${colorClasses} ${
        notification.is_read ? 'opacity-60' : 'opacity-100'
      }`}
      onClick={handleClick}
      title={notification.title ?? ''}
      tabIndex={0}
      aria-label={`התראה: ${notification.title ?? ''}`}
      dir="rtl"
      style={{ direction: 'rtl', wordBreak: 'break-word' }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-shrink-0 mt-0.5">{getTypeIcon(notification.type)}</div>
        <div className="flex-1 min-w-0 pr-2">
          <h4
            className={`font-bold text-sm mb-1 truncate ${
              notification.is_read ? 'text-gray-700' : 'text-gray-900'
            }`}
          >
            {notification.title}
            {notification.is_critical && (
              <span className="ml-1 text-xs text-red-600 font-bold">חשוב</span>
            )}
          </h4>
          <p
            className={`text-xs leading-relaxed whitespace-pre-wrap ${
              notification.is_read ? 'text-gray-600' : 'text-gray-800'
            }`}
            dir="rtl"
            style={{ textAlign: 'right', direction: 'rtl' }}
          >
            {notification.message}
          </p>
          <p className="text-xs text-gray-400 mt-2">
            {notification.created_at &&
              formatDistanceToNow(new Date(notification.created_at), {
                addSuffix: true,
                locale: he,
              })}
          </p>
        </div>
        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity mr-2">
          {!notification.is_read && (
            <Button
              variant="ghost"
              size="sm"
              onClick={e => {
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
            onClick={e => {
              e.stopPropagation();
              onDelete(notification.id);
            }}
            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
            title="מחק התראה"
            aria-label="מחק התראה"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
        {!notification.is_read && (
          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1 absolute right-2 top-2 animate-pulse"></div>
        )}
      </div>
    </div>
  );
};

export default NotificationSystem;
