import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Settings, Globe, Smartphone, Bell } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthProvider';

interface NotificationPreferencesProps {
  className?: string;
}

/** רק המפתחות שאנחנו מנהלים ב-UI הזה */
interface UserPreferences {
  site_notifications: boolean;
  push_notifications: boolean;
  assignment_reminders: boolean;
  exam_reminders: boolean;
  study_partner_alerts: boolean;
  system_updates: boolean;
  email_digest: boolean;
  // מפגשים
  show_shared_sessions_open: boolean;
  show_shared_sessions_scheduled: boolean;
}

const defaultPreferences: UserPreferences = {
  site_notifications: true,
  push_notifications: false,
  assignment_reminders: true,
  exam_reminders: true,
  study_partner_alerts: true,
  system_updates: true,
  email_digest: false,
  show_shared_sessions_open: false,
  show_shared_sessions_scheduled: false,
};

export const NotificationPreferences: React.FC<NotificationPreferencesProps> = ({ className = '' }) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  // ⚠️ נשמור גם את ה-JSON המקורי מהשרת כדי לא למחוק מפתחות שאיננו מנהלים
  const rawServerPrefsRef = useRef<Record<string, any>>({});

  const [prefs, setPrefs] = useState<UserPreferences>(defaultPreferences);
  const [lastSavedPrefs, setLastSavedPrefs] = useState<UserPreferences>(defaultPreferences);

  const dirty = useMemo(
    () => JSON.stringify(prefs) !== JSON.stringify(lastSavedPrefs),
    [prefs, lastSavedPrefs]
  );

  const {
    isSupported,
    isEnabled,
    requestPermission,
    disableNotifications,
    status
  } = usePushNotifications();

  // טעינת העדפות
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
        }

        const incoming = (data?.notification_preferences || {}) as Record<string, any>;
        rawServerPrefsRef.current = incoming; // נשמור את כל מה שהגיע

        // מיזוג בטוח: נבנה את ה-UI state מהדיפולטים + רק המפתחות שאנחנו מכירים
        const merged: UserPreferences = {
          ...defaultPreferences,
          ...pickUIKeys(incoming),
        };

        setPrefs(merged);
        setLastSavedPrefs(merged);
      } catch (err) {
        console.error('Error loading preferences:', err);
        toast({ title: 'שגיאה', description: 'טעינת ההגדרות נכשלה', variant: 'destructive' });
      } finally {
        setLoaded(true);
      }
    };
    loadPreferences();
  }, [user, toast]);

  // אזהרת עזיבה עם שינויים לא שמורים (בדסקטופ)
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  // שמירה – ממזגים את המפתחות שאנחנו מנהלים לתוך ה-JSON המקורי
  const savePreferences = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const toSave = {
        ...rawServerPrefsRef.current, // שומר על כל המפתחות שלא נוגעים בהם
        ...prefs,                     // מעדכן/מוסיף רק את המפתחות שלנו
      };

      const { error } = await supabase
        .from('profiles')
        .update({ notification_preferences: toSave })
        .eq('id', user.id);

      if (error) throw error;

      rawServerPrefsRef.current = toSave;  // עדכן מקור
      setLastSavedPrefs(prefs);
      toast({ title: 'הגדרות נשמרו', description: 'העדפות ההתראות עודכנו בהצלחה' });
    } catch (err) {
      console.error(err);
      toast({ title: 'שגיאה', description: 'לא ניתן לשמור את ההגדרות', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const resetChanges = () => {
    setPrefs(lastSavedPrefs);
    toast({ title: 'בוטל', description: 'השינויים בוטלו' });
  };

  // עדכון ערך בודד (ללא שמירה — נשמר רק בלחיצה על "שמור")
  const setBool = (key: keyof UserPreferences, value: boolean) => {
    setPrefs(prev => ({ ...prev, [key]: value }));
  };

  // Push: מבקשים הרשאה/מכבים, ועדיין לא שומרים עד שלוחצים "שמור"
  const handlePushToggle = async (enabled: boolean) => {
    if (!isSupported) return;

    if (enabled && !isEnabled) {
      const granted = await requestPermission();
      if (!granted) {
        toast({
          title: 'הרשאה נדחתה',
          description: 'לא ניתן להפעיל התראות Push ללא הרשאה',
          variant: 'destructive'
        });
        setBool('push_notifications', false);
        return;
      }
      setBool('push_notifications', true);
    } else if (!enabled && isEnabled) {
      await disableNotifications();
      setBool('push_notifications', false);
    } else {
      // אם כבר פעיל/כבוי בדפדפן – רק עדכון המתג בהעדפות
      setBool('push_notifications', enabled);
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'enabled': return <Badge className="bg-green-100 text-green-800">פעיל</Badge>;
      case 'denied': return <Badge variant="destructive">נדחה</Badge>;
      case 'not-supported': return <Badge variant="secondary">לא נתמך</Badge>;
      default: return <Badge variant="outline">כבוי</Badge>;
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
    <Card className={`${className}`} dir="rtl">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            הגדרות התראות
          </span>
          {/* פעולות בדסקטופ */}
          <div className="hidden sm:flex items-center gap-2">
            <Button variant="outline" onClick={resetChanges} disabled={!dirty || saving}>ביטול</Button>
            <Button onClick={savePreferences} disabled={!dirty || saving}>
              {saving ? 'שומר…' : 'שמור'}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-8 pb-24">
        {!loaded ? (
          <SkeletonBlock />
        ) : (
          <>
            {/* 🔔 התראות באתר */}
            <section>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Globe className="h-4 w-4" />
                התראות באתר
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ToggleRow
                  id="site-notifications"
                  label="התראות כלליות באתר"
                  checked={prefs.site_notifications}
                  onChange={(v) => setBool('site_notifications', v)}
                />
                <ToggleRow
                  id="assignment-reminders"
                  label="תזכורות למטלות"
                  checked={prefs.assignment_reminders}
                  onChange={(v) => setBool('assignment_reminders', v)}
                />
                <ToggleRow
                  id="exam-reminders"
                  label="תזכורות לבחינות"
                  checked={prefs.exam_reminders}
                  onChange={(v) => setBool('exam_reminders', v)}
                />
                <ToggleRow
                  id="study-partner-alerts"
                  label="התראות שותפים ללמידה"
                  checked={prefs.study_partner_alerts}
                  onChange={(v) => setBool('study_partner_alerts', v)}
                />
                <ToggleRow
                  id="system-updates"
                  label="עדכוני מערכת"
                  checked={prefs.system_updates}
                  onChange={(v) => setBool('system_updates', v)}
                />
              </div>
            </section>

            <Separator />

            {/* 👥 מפגשי לימוד */}
            <section>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Bell className="h-4 w-4" />
                התראות על מפגשי לימוד
              </h3>
              <p className="text-sm text-gray-500 mb-3">
                אלו התראות פחות קריטיות. אפשר להפעיל רק אם זה מעניין אותך.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ToggleRow
                  id="shared-sessions-open"
                  label="מפגשים שנפתחו/נוצרו"
                  checked={prefs.show_shared_sessions_open}
                  onChange={(v) => setBool('show_shared_sessions_open', v)}
                />
                <ToggleRow
                  id="shared-sessions-scheduled"
                  label="מפגשים מתוכננים מראש"
                  checked={prefs.show_shared_sessions_scheduled}
                  onChange={(v) => setBool('show_shared_sessions_scheduled', v)}
                />
              </div>
            </section>

            <Separator />

            {/* 📱 Push */}
            <section>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                התראות Push {getStatusBadge()}
              </h3>

              {!isSupported ? (
                <p className="text-sm text-gray-500">הדפדפן שלך לא תומך בהתראות Push</p>
              ) : (
                <>
                  <ToggleRow
                    id="push-notifications"
                    label="הפעל התראות Push"
                    checked={prefs.push_notifications && (status === 'enabled')}
                    onChange={handlePushToggle}
                  />
                  {status === 'denied' && (
                    <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
                      התראות Push נדחו. ניתן להפעיל אותן דרך הגדרות הדפדפן.
                    </div>
                  )}
                  {status === 'default' && (
                    <p className="text-sm text-gray-600 mt-2">לחיצה על המתג תבקש הרשאה מהדפדפן.</p>
                  )}
                </>
              )}
            </section>

            <Separator />

            {/* ✉️ מייל (בקרוב) */}
            <section>
              <h3 className="text-lg font-semibold mb-4">הגדרות נוספות</h3>
              <ToggleRow
                id="email-digest"
                label="סיכום שבועי במייל (בקרוב)"
                checked={prefs.email_digest}
                onChange={() => {}}
                disabled
              />
            </section>
          </>
        )}
      </CardContent>

      {/* 🧷 פס פעולות דביק למובייל */}
      <div className="sm:hidden sticky bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t p-3 flex items-center justify-between z-10">
        <Button variant="outline" className="w-[48%]" onClick={resetChanges} disabled={!dirty || saving}>
          ביטול
        </Button>
        <Button className="w-[48%]" onClick={savePreferences} disabled={!dirty || saving}>
          {saving ? 'שומר…' : 'שמור'}
        </Button>
      </div>
    </Card>
  );
};

/** שורת טוגל קומפקטית ונוחה למגע */
const ToggleRow = ({
  id, label, checked, onChange, disabled,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) => (
  <div className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/30 transition">
    <Label htmlFor={id} className="text-sm">{label}</Label>
    <Switch id={id} checked={checked} onCheckedChange={onChange} disabled={!!disabled} />
  </div>
);

/** שלד טעינה יפה */
const SkeletonBlock = () => (
  <div className="space-y-4">
    <div className="h-5 w-40 bg-gray-200/70 rounded animate-pulse" />
    <div className="h-12 w-full bg-gray-100/70 rounded animate-pulse" />
    <div className="h-12 w-full bg-gray-100/70 rounded animate-pulse" />
    <div className="h-12 w-full bg-gray-100/70 rounded animate-pulse" />
  </div>
);

/** שולף רק מפתחות שאנחנו מציגים ב-UI, כדי לבנות state נקי */
function pickUIKeys(all: Record<string, any>): Partial<UserPreferences> {
  const keys: (keyof UserPreferences)[] = [
    'site_notifications',
    'push_notifications',
    'assignment_reminders',
    'exam_reminders',
    'study_partner_alerts',
    'system_updates',
    'email_digest',
    'show_shared_sessions_open',
    'show_shared_sessions_scheduled',
  ];
  const out: Partial<UserPreferences> = {};
  for (const k of keys) {
    if (k in all) (out as any)[k] = all[k];
  }
  return out;
}
