import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface SimpleNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  isRead: boolean;
  autoDismiss?: boolean; // האם להעלם אוטומטית
  duration?: number;     // משך זמן להצגה בפופאפ (ms)
}

// Notification system for local-only messages (not stored in DB)
export const useSimpleNotifications = () => {
  const [notifications, setNotifications] = useState<SimpleNotification[]>([]);
  const { toast } = useToast();

  const addNotification = (
    notification: Omit<SimpleNotification, 'id' | 'timestamp' | 'isRead'> & {
      autoDismiss?: boolean;
      duration?: number;
    }
  ) => {
    const id = Math.random().toString(36);
    const newNotification: SimpleNotification = {
      ...notification,
      id,
      timestamp: new Date(),
      isRead: false
    };

    setNotifications(prev => [newNotification, ...prev]);

    toast({
      title: notification.title,
      description: notification.message,
      variant: notification.type === 'error' ? 'destructive' : 'default',
      duration: notification.duration ?? (notification.autoDismiss ? 4000 : Infinity)
    });

    // אם autoDismiss – נסיר מהמערך אחרי X זמן
    if (notification.autoDismiss) {
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }, notification.duration ?? 4000);
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification
  };
};
