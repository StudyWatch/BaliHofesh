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
import {
  Bell, Trash2, Check, CheckCheck, Trash, Calendar,
  BookOpen, Users, Star, Info, Inbox
} from 'lucide-react';
import type { Database } from '@/integrations/supabase/supabase.types';

type DeliveryTarget = 'site' | 'push' | 'both';
type NotificationRow = Database['public']['Tables']['notifications']['Row'] & { delivery_target: DeliveryTarget; };

interface NotificationSystemProps {
  isOpen: boolean;
  onClose: () => void;
}

const typeIcons: Record<string, React.ReactNode> = {
  exam: <Calendar className="w-4 h-4 text-red-500" />,
  assignment: <BookOpen className="w-4 h-4 text-blue-500" />,
  study_partner: <Users className="w-4 h-4 text-green-600" />,
  shared_session: <Users className="w-4 h-4 text-purple-500" />,
  system: <Star className="w-4 h-4 text-yellow-500" />,
  message: <Bell className="w-4 h-4 text-cyan-500" />,
  tip: <Info className="w-4 h-4 text-teal-500" />,
  default: <Inbox className="w-4 h-4 text-gray-400" />,
};

const getTypeIcon = (type: string) => typeIcons[type] || typeIcons['default'];
const getTypeColor = (type: string) => {
  switch (type) {
    case 'exam': return 'border-red-300 bg-red-50';
    case 'assignment': return 'border-blue-300 bg-blue-50';
    case 'study_partner': return 'border-green-400 bg-green-50';
    case 'shared_session': return 'border-purple-300 bg-purple-50';
    case 'system': return 'border-yellow-300 bg-yellow-50';
    case 'message': return 'border-cyan-300 bg-cyan-50';
    case 'tip': return 'border-teal-300 bg-teal-50';
    default: return 'border-gray-300 bg-gray-50';
  }
};

const NotificationSystem: React.FC<NotificationSystemProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // טעינת התראות מהשרת
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
        .limit(50);
      if (error) throw error;
      const now = new Date();
      setNotifications((data || []).filter(
        n =>
          (!n.expires_at || new Date(n.expires_at) > now) &&
          (n.title?.trim() || n.message?.trim()) &&
          ['site', 'both'].includes(n.delivery_target ?? 'site')
      ).map(n => ({
        ...n,
        delivery_target: (n.delivery_target ?? 'site') as DeliveryTarget,
      })));
    } catch (e) {
      toast.error('שגיאה בטעינת התראות');
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (isOpen && user) fetchNotifications(); }, [isOpen, user]);
  useEffect(() => {
    if (!user || !isOpen) return;
    pollingRef.current = setInterval(fetchNotifications, 60000);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [user, isOpen]);

  // פעולות ניהול
  const markAsRead = async (notificationId: string) => {
    try {
      await supabase.from('notifications').update({ is_read: true }).eq('id', notificationId);
      setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n));
    } catch { toast.error('שגיאה בסימון התראה'); }
  };
  const deleteNotification = async (notificationId: string) => {
    try {
      await supabase.from('notifications').delete().eq('id', notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      toast.success('התראה נמחקה');
    } catch { toast.error('שגיאה במחיקת התראה'); }
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
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      toast.success('כל ההתראות סומנו כנקראו');
    } catch { toast.error('שגיאה בסימון התראות'); }
    setBulkLoading(false);
  };
  const deleteAllNotifications = async () => {
    if (!user) return;
    setBulkLoading(true);
    try {
      const idsToDelete = notifications.map(n => n.id);
      if (idsToDelete.length === 0) return;
      await supabase.from('notifications').delete().in('id', idsToDelete);
      setNotifications([]);
      toast.success('כל ההתראות נמחקו!');
    } catch { toast.error('שגיאה במחיקת כל ההתראות'); }
    setBulkLoading(false);
  };

  // הצגה
  const unread = notifications.filter(n => !n.is_read);
  const read = notifications.filter(n => n.is_read);
  const unreadCount = unread.length;
  const hasNotifications = unread.length > 0 || read.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-md mx-auto bg-white border-2 shadow-2xl rounded-2xl h-[600px] flex flex-col p-0" dir="rtl">
        <DialogHeader className="flex flex-row items-center justify-between pb-3 border-b bg-gradient-to-r from-blue-500/10 via-purple-300/20 to-pink-100/20 rounded-t-2xl">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-blue-900">
            <Bell className="w-5 h-5" />
            התראות
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs px-2">{unreadCount}</Badge>
            )}
          </DialogTitle>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs flex items-center gap-1 hover:text-green-700"
              disabled={bulkLoading || unreadCount === 0}
              title="סמן הכל כנקרא"
            >
              <CheckCheck className="w-4 h-4" />
              <span className="hidden sm:inline">סמן הכל כנקרא</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={deleteAllNotifications}
              className="text-xs flex items-center gap-1 hover:text-red-700"
              disabled={bulkLoading || !hasNotifications}
              title="מחק הכל"
            >
              <Trash className="w-4 h-4" />
              <span className="hidden sm:inline">מחק הכל</span>
            </Button>
          </div>
        </DialogHeader>
        <ScrollArea className="flex-1 w-full px-0.5">
          {loading ? (
            <div className="p-8 flex flex-col items-center text-center">
              <Bell className="w-10 h-10 text-blue-400 animate-bounce mb-2" />
              <span className="text-blue-800 font-semibold">טוען התראות...</span>
            </div>
          ) : !hasNotifications ? (
            <div className="flex flex-col items-center py-20 opacity-80">
              <Inbox className="w-16 h-16 text-gray-300 mb-2" />
              <div className="font-bold text-lg text-gray-700">אין התראות להצגה</div>
              <div className="text-gray-400 text-xs mt-1">לא התקבלו התראות חדשות לאחרונה</div>
            </div>
          ) : (
            <div className="space-y-2 p-2 pb-5">
              {unread.length > 0 && (
                <>
                  <div className="px-2 py-1 text-xs font-semibold text-blue-800 bg-blue-50 rounded shadow-sm mb-1 border border-blue-100">
                    התראות חדשות ({unread.length})
                  </div>
                  {unread.map(notification => (
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
                    <div className="px-2 py-1 text-xs font-semibold text-gray-600 bg-gray-50 rounded mt-2 border border-gray-100">
                      התראות שנקראו
                    </div>
                  )}
                  {read.map(notification => (
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
          <Button variant="outline" onClick={onClose} className="rounded-full font-bold shadow-sm hover:bg-gray-100">
            סגור
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

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
      className={
        `relative p-4 rounded-2xl border shadow-sm cursor-pointer transition-all group ${colorClasses} 
        ${notification.is_read ? 'opacity-60' : 'opacity-100'} hover:shadow-lg`
      }
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
            <h4 className={`font-bold text-base mb-0 truncate ${notification.is_read ? 'text-gray-700' : 'text-blue-900'}`}>
              {notification.title}
            </h4>
            {notification.is_critical && (
              <span className="ml-1 text-xs text-red-600 font-bold px-2 py-0.5 bg-red-100 rounded">
                חשוב
              </span>
            )}
          </div>
          <p
            className={`text-xs leading-relaxed mt-1 whitespace-pre-wrap ${notification.is_read ? 'text-gray-600' : 'text-gray-800'}`}
            style={{ textAlign: 'right', direction: 'rtl' }}
          >
            {notification.message}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-gray-400">
              {notification.created_at &&
                formatDistanceToNow(new Date(notification.created_at), {
                  addSuffix: true,
                  locale: he,
                })}
            </span>
            {notification.assignment_id && (
              <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">
                מטלה
              </span>
            )}
            {notification.exam_id && (
              <span className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-700 font-bold">
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
