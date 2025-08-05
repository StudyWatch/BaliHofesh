import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Settings, Bell, Smartphone, Globe } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthProvider';

interface NotificationPreferencesProps {
  className?: string;
}

interface UserPreferences {
  site_notifications: boolean;
  push_notifications: boolean;
  assignment_reminders: boolean;
  exam_reminders: boolean;
  study_partner_alerts: boolean;
  system_updates: boolean;
  email_digest: boolean;
}

const defaultPreferences: UserPreferences = {
  site_notifications: true,
  push_notifications: false,
  assignment_reminders: true,
  exam_reminders: true,
  study_partner_alerts: true,
  system_updates: true,
  email_digest: false
};

export const NotificationPreferences: React.FC<NotificationPreferencesProps> = ({ className = '' }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const {
    isSupported,
    isEnabled,
    requestPermission,
    disableNotifications,
    status
  } = usePushNotifications();

  // טעינת העדפות המשתמש
  useEffect(() => {
    const loadPreferences = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('notification_preferences')
          .eq('id', user.id)
          .single();

        if (error) {
          console.warn('Could not load notification preferences:', error);
        } else if (data?.notification_preferences) {
          setPreferences({ ...defaultPreferences, ...data.notification_preferences });
        }
      } catch (error) {
        console.error('Error loading preferences:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, [user]);

  // שמירת העדפות
  const savePreferences = async (newPreferences: UserPreferences) => {
    if (!user) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ notification_preferences: newPreferences })
        .eq('id', user.id);

      if (error) throw error;

      setPreferences(newPreferences);
      toast({
        title: 'הגדרות נשמרו',
        description: 'העדפות ההתראות עודכנו בהצלחה'
      });
    } catch (error) {
      toast({
        title: 'שגיאה',
        description: 'לא ניתן לשמור את ההגדרות',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  // עדכון העדפה בודדת
  const updatePreference = async (key: keyof UserPreferences, value: boolean) => {
    const newPreferences = { ...preferences, [key]: value };
    await savePreferences(newPreferences);
  };

  // הפעלת/ביטול התראות Push
  const handlePushToggle = async (enabled: boolean) => {
    if (enabled && !isEnabled) {
      const granted = await requestPermission();
      if (granted) {
        await updatePreference('push_notifications', true);
      }
    } else if (!enabled && isEnabled) {
      await disableNotifications();
      await updatePreference('push_notifications', false);
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'enabled':
        return <Badge className="bg-green-100 text-green-800">פעיל</Badge>;
      case 'denied':
        return <Badge variant="destructive">נדחה</Badge>;
      case 'not-supported':
        return <Badge variant="secondary">לא נתמך</Badge>;
      default:
        return <Badge variant="outline">כבוי</Badge>;
    }
  };

  if (!user) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <p className="text-gray-500">יש להתחבר כדי לנהל הגדרות התראות</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className} dir="rtl">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Settings className="h-5 w-5" />
          <span>הגדרות התראות</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* סוגי התראות */}
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
            <Globe className="h-4 w-4" />
            <span>התראות באתר</span>
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="site-notifications" className="text-sm">
                התראות כלליות באתר
              </Label>
              <Switch
                id="site-notifications"
                checked={preferences.site_notifications}
                onCheckedChange={(checked) => updatePreference('site_notifications', checked)}
                disabled={saving}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="assignment-reminders" className="text-sm">
                תזכורות למטלות
              </Label>
              <Switch
                id="assignment-reminders"
                checked={preferences.assignment_reminders}
                onCheckedChange={(checked) => updatePreference('assignment_reminders', checked)}
                disabled={saving}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="exam-reminders" className="text-sm">
                תזכורות לבחינות
              </Label>
              <Switch
                id="exam-reminders"
                checked={preferences.exam_reminders}
                onCheckedChange={(checked) => updatePreference('exam_reminders', checked)}
                disabled={saving}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="study-partner-alerts" className="text-sm">
                התראות שותפים ללמידה
              </Label>
              <Switch
                id="study-partner-alerts"
                checked={preferences.study_partner_alerts}
                onCheckedChange={(checked) => updatePreference('study_partner_alerts', checked)}
                disabled={saving}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="system-updates" className="text-sm">
                עדכוני מערכת
              </Label>
              <Switch
                id="system-updates"
                checked={preferences.system_updates}
                onCheckedChange={(checked) => updatePreference('system_updates', checked)}
                disabled={saving}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* התראות Push */}
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
            <Smartphone className="h-4 w-4" />
            <span>התראות Push</span>
            {getStatusBadge()}
          </h3>
          
          {!isSupported ? (
            <p className="text-sm text-gray-500 mb-4">
              הדפדפן שלך לא תומך בהתראות Push
            </p>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <Label htmlFor="push-notifications" className="text-sm">
                  הפעל התראות Push
                </Label>
                <Switch
                  id="push-notifications"
                  checked={preferences.push_notifications && isEnabled}
                  onCheckedChange={handlePushToggle}
                  disabled={saving || !isSupported}
                />
              </div>
              
              {status === 'denied' && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-700">
                    התראות Push נדחו. ניתן להפעיל אותן בהגדרות הדפדפן.
                  </p>
                </div>
              )}
              
              {status === 'default' && (
                <p className="text-sm text-gray-600">
                  לחץ על המתג כדי לבקש הרשאה לשליחת התראות
                </p>
              )}
            </>
          )}
        </div>

        <Separator />

        {/* הגדרות נוספות */}
        <div>
          <h3 className="text-lg font-semibold mb-4">הגדרות נוספות</h3>
          <div className="flex items-center justify-between">
            <Label htmlFor="email-digest" className="text-sm">
              סיכום שבועי במייל (בקרוב)
            </Label>
            <Switch
              id="email-digest"
              checked={preferences.email_digest}
              onCheckedChange={(checked) => updatePreference('email_digest', checked)}
              disabled={true} // נכבה עד להטמעה מלאה
            />
          </div>
        </div>

        {saving && (
          <div className="text-center py-2">
            <div className="inline-flex items-center space-x-2 text-sm text-gray-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span>שומר הגדרות...</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};