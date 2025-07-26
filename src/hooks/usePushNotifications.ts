import { useState, useEffect } from 'react';
import { useAuth } from '@/App';
import { useToast } from '@/hooks/use-toast';

// Firebase Cloud Messaging configuration
interface FCMConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

// This would be configured in your Firebase project
const fcmConfig: FCMConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

export const usePushNotifications = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSupported, setIsSupported] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // בדיקת תמיכה ב-Push Notifications
    const checkSupport = () => {
      const supported = 'serviceWorker' in navigator && 'PushManager' in window;
      setIsSupported(supported);
      setIsLoading(false);
      
      if (!supported) {
        console.warn('Push notifications are not supported in this browser');
      }
    };

    checkSupport();
  }, []);

  // בקשת הרשאה להתראות Push
  const requestPermission = async (): Promise<boolean> => {
    if (!isSupported) {
      toast({
        title: 'התראות לא נתמכות',
        description: 'הדפדפן שלך לא תומך בהתראות Push',
        variant: 'destructive'
      });
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        setIsEnabled(true);
        await initializeFirebase();
        toast({
          title: 'התראות הופעלו',
          description: 'תקבל התראות על עדכונים חשובים'
        });
        return true;
      } else {
        toast({
          title: 'התראות נדחו',
          description: 'ניתן להפעיל התראות בהגדרות הדפדפן',
          variant: 'destructive'
        });
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast({
        title: 'שגיאה',
        description: 'שגיאה בבקשת הרשאות התראות',
        variant: 'destructive'
      });
      return false;
    }
  };

  // אתחול Firebase Cloud Messaging
  const initializeFirebase = async () => {
    try {
      // כאן יהיה קוד אתחול Firebase
      // const { getMessaging, getToken, onMessage } = await import('firebase/messaging');
      // const messaging = getMessaging();
      
      // Placeholder implementation
      console.log('Firebase FCM would be initialized here');
      
      // Generate a mock token for development
      const mockToken = `fcm-token-${user?.id}-${Date.now()}`;
      setToken(mockToken);
      
      // Save token to user profile in Supabase
      if (user) {
        // await supabase.from('profiles').update({ fcm_token: mockToken }).eq('id', user.id);
      }
      
    } catch (error) {
      console.error('Error initializing Firebase:', error);
    }
  };

  // שליחת התראת Push
  const sendPushNotification = async (
    title: string,
    body: string,
    options?: {
      icon?: string;
      badge?: string;
      data?: any;
      actions?: Array<{ action: string; title: string; icon?: string }>;
    }
  ) => {
    if (!isEnabled || !token) {
      console.warn('Push notifications not enabled or token not available');
      return false;
    }

    try {
      // כאן יהיה קוד שליחה דרך Firebase Cloud Functions או Supabase Edge Function
      console.log('Would send push notification:', { title, body, options });
      
      // Placeholder: show browser notification for demo
      if ('serviceWorker' in navigator && 'Notification' in window) {
        new Notification(title, {
          body,
          icon: options?.icon || '/favicon.ico',
          badge: options?.badge,
          data: options?.data,
          actions: options?.actions
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error sending push notification:', error);
      return false;
    }
  };

  // ביטול התראות
  const disableNotifications = async () => {
    try {
      setIsEnabled(false);
      setToken(null);
      
      // Remove token from user profile
      if (user) {
        // await supabase.from('profiles').update({ fcm_token: null }).eq('id', user.id);
      }
      
      toast({
        title: 'התראות בוטלו',
        description: 'לא תקבל עוד התראות Push'
      });
    } catch (error) {
      console.error('Error disabling notifications:', error);
    }
  };

  // בדיקת סטטוס התראות
  const checkNotificationStatus = () => {
    if (!isSupported) return 'not-supported';
    if (!('Notification' in window)) return 'not-available';
    
    const permission = Notification.permission;
    if (permission === 'granted' && isEnabled) return 'enabled';
    if (permission === 'denied') return 'denied';
    return 'default';
  };

  return {
    isSupported,
    isEnabled,
    isLoading,
    token,
    requestPermission,
    sendPushNotification,
    disableNotifications,
    status: checkNotificationStatus()
  };
};

// Hook לטיפול בהתראות נכנסות
export const useIncomingNotifications = () => {
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    // רישום לשירות Worker להתראות
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'notification-received') {
          setNotifications(prev => [event.data.notification, ...prev]);
        }
      });
    }
  }, []);

  const clearNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  return {
    notifications,
    clearNotification,
    clearAllNotifications
  };
};