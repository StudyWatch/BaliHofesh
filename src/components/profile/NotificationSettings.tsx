import React, { useEffect, useMemo, useState } from 'react';
import {
  Card, CardContent, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Bell, Calendar, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthProvider';

interface NotificationSettingsProps {
  onClose: () => void;
}

type Section = 'exams' | 'assignments' | 'system';

type NotificationPreferences = {
  exams: {
    push: boolean;
    site: boolean;
    reminder_days_before: number;
  };
  assignments: {
    push: boolean;
    site: boolean;
    reminder_days_before: number;
  };
  system: {
    push: boolean;
    site: boolean;
  };
};

const defaults: NotificationPreferences = {
  exams:   { push: true,  site: true,  reminder_days_before: 3 },
  assignments: { push: true,  site: true,  reminder_days_before: 2 },
  system:  { push: false, site: true },
};

// type-guard עדין
function isPrefs(x: any): x is NotificationPreferences {
  return x && typeof x === 'object'
    && 'exams' in x && 'assignments' in x && 'system' in x;
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({ onClose }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [prefs, setPrefs] = useState<NotificationPreferences>(defaults);
  const [baseline, setBaseline] = useState<NotificationPreferences>(defaults);

  // מידע על Push בדפדפן
  const pushSupported = typeof Notification !== 'undefined';
  const permission: NotificationPermission = pushSupported ? Notification.permission : 'denied';

  const dirty = useMemo(
    () => JSON.stringify(prefs) !== JSON.stringify(baseline),
    [prefs, baseline]
  );

  // טען העדפות
  useEffect(() => {
    (async () => {
      if (!user) return;
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('notification_preferences')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        const incoming = data?.notification_preferences;
        const merged: NotificationPreferences = isPrefs(incoming)
          ? {
              exams: { ...defaults.exams, ...incoming.exams },
              assignments: { ...defaults.assignments, ...incoming.assignments },
              system: { ...defaults.system, ...incoming.system },
            }
          : defaults;

        setPrefs(merged);
        setBaseline(merged);
      } catch (e) {
        toast.error('שגיאה בטעינת ההגדרות');
        setPrefs(defaults);
        setBaseline(defaults);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const setBool = (section: Section, key: 'site' | 'push', val: boolean) => {
    setPrefs(p => ({ ...p, [section]: { ...p[section], [key]: val } }));
  };
  const setReminder = (section: 'exams' | 'assignments', days: number) => {
    setPrefs(p => ({ ...p, [section]: { ...p[section], reminder_days_before: days } }));
  };

  const askPushPermission = async () => {
    if (!pushSupported) return toast.error('הדפדפן לא תומך בהתראות Push');
    try {
      const res = await Notification.requestPermission();
      if (res === 'granted') toast.success('הרשאות פוש הופעלו בדפדפן');
      else if (res === 'denied') toast.error('ההרשאה נדחתה. ניתן לשנות בהגדרות הדפדפן.');
    } catch {
      /* no-op */
    }
  };

  const handleSave = async () => {
    if (!user || saving) return;
    try {
      setSaving(true);
      const { error } = await supabase
        .from('profiles')
        .update({ notification_preferences: prefs })
        .eq('id', user.id);
      if (error) throw error;

      setBaseline(prefs);
      toast.success('ההגדרות נשמרו');
      onClose(); // סוגר אחרי שמירה
    } catch {
      toast.error('שגיאה בשמירת ההגדרות');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (dirty && !confirm('לבטל שינויים שלא נשמרו?')) return;
    // שחזור לערך האחרון שנשמר כדי שלא יישארו שינויים בזיכרון
    setPrefs(baseline);
    onClose();
  };

  return (
    <div className="relative w-full max-w-lg mx-auto">
      <Card className="bg-white dark:bg-zinc-900 shadow-xl rounded-2xl max-h-[95vh] overflow-y-auto">
        <CardHeader className="sticky top-0 bg-white/90 dark:bg-zinc-900/80 backdrop-blur z-20 rounded-t-2xl border-b">
          <CardTitle className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              הגדרות התראות
            </span>
            {dirty && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200">
                יש שינויים שלא נשמרו
              </span>
            )}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-8 pb-4">
          {loading ? (
            <div className="space-y-3 py-6">
              <div className="h-5 w-40 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 w-full bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              {/* בחינות */}
              <SectionTitle icon={<Calendar className="w-5 h-5 text-blue-500" />} title="התראות בחינות" />
              <div className="space-y-4">
                <ToggleRow
                  id="exams-site"
                  label="התראה לאתר"
                  checked={prefs.exams.site}
                  onChange={v => setBool('exams', 'site', v)}
                />
                <ToggleRow
                  id="exams-push"
                  label="התראה לפוש"
                  checked={prefs.exams.push && permission === 'granted'}
                  onChange={v => {
                    if (permission !== 'granted') return askPushPermission();
                    setBool('exams', 'push', v);
                  }}
                  hint={permission !== 'granted' ? 'נדרש לאשר התראות בדפדפן' : undefined}
                />
                <div>
                  <Label className="text-sm">ימים לפני בחינה לתזכורת</Label>
                  <Select
                    value={String(prefs.exams.reminder_days_before)}
                    onValueChange={v => setReminder('exams', Number(v))}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="בחר/י ימים מראש" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">יום לפני</SelectItem>
                      <SelectItem value="2">יומיים לפני</SelectItem>
                      <SelectItem value="3">3 ימים לפני</SelectItem>
                      <SelectItem value="5">5 ימים לפני</SelectItem>
                      <SelectItem value="7">שבוע לפני</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* מטלות */}
              <SectionTitle icon={<Calendar className="w-5 h-5 text-purple-500" />} title="התראות מטלות" />
              <div className="space-y-4">
                <ToggleRow
                  id="assign-site"
                  label="התראה לאתר"
                  checked={prefs.assignments.site}
                  onChange={v => setBool('assignments', 'site', v)}
                />
                <ToggleRow
                  id="assign-push"
                  label="התראה לפוש"
                  checked={prefs.assignments.push && permission === 'granted'}
                  onChange={v => {
                    if (permission !== 'granted') return askPushPermission();
                    setBool('assignments', 'push', v);
                  }}
                  hint={permission !== 'granted' ? 'נדרש לאשר התראות בדפדפן' : undefined}
                />
                <div>
                  <Label className="text-sm">ימים לפני מטלה לתזכורת</Label>
                  <Select
                    value={String(prefs.assignments.reminder_days_before)}
                    onValueChange={v => setReminder('assignments', Number(v))}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="בחר/י ימים מראש" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">יום לפני</SelectItem>
                      <SelectItem value="2">יומיים לפני</SelectItem>
                      <SelectItem value="3">3 ימים לפני</SelectItem>
                      <SelectItem value="5">5 ימים לפני</SelectItem>
                      <SelectItem value="7">שבוע לפני</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* מערכת */}
              <SectionTitle icon={<Mail className="w-5 h-5 text-orange-500" />} title="התראות מערכת" />
              <div className="space-y-4">
                <ToggleRow
                  id="system-site"
                  label="התראה לאתר"
                  checked={prefs.system.site}
                  onChange={v => setBool('system', 'site', v)}
                />
                <ToggleRow
                  id="system-push"
                  label="התראה לפוש"
                  checked={prefs.system.push && permission === 'granted'}
                  onChange={v => {
                    if (permission !== 'granted') return askPushPermission();
                    setBool('system', 'push', v);
                  }}
                  hint={permission !== 'granted' ? 'נדרש לאשר התראות בדפדפן' : undefined}
                />
              </div>
            </>
          )}
        </CardContent>

        {/* פוטר */}
        <div className="sticky bottom-0 bg-white dark:bg-zinc-900 rounded-b-2xl z-30 p-4 flex gap-3 border-t">
          <Button className="flex-1" onClick={handleSave} disabled={saving || loading}>
            {saving ? 'שומר…' : 'שמור הגדרות'}
          </Button>
          <Button variant="outline" className="flex-1" onClick={handleCancel} disabled={saving}>
            ביטול
          </Button>
        </div>
      </Card>
    </div>
  );
};

const SectionTitle = ({ icon, title }: { icon: React.ReactNode; title: string }) => (
  <div className="flex items-center gap-2 mb-2 mt-2">
    {icon}
    <span className="font-bold text-lg">{title}</span>
  </div>
);

/** שורת טוגל עם אינדיקציה "מופעל/כבוי" ברורה גם בדארק-מוד */
const ToggleRow = ({
  id,
  label,
  checked,
  onChange,
  hint,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  hint?: string;
}) => (
  <div className="flex items-center justify-between gap-3">
    <div className="flex flex-col">
      <Label htmlFor={id} className="font-medium">{label}</Label>
      {hint && <span className="text-xs text-muted-foreground mt-0.5">{hint}</span>}
    </div>
    <div className="flex items-center gap-2">
      <span
        className={
          'text-[11px] px-2 py-0.5 rounded-full select-none ' +
          (checked
            ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200'
            : 'bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300')
        }
      >
        {checked ? 'מופעל' : 'כבוי'}
      </span>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onChange}
        aria-checked={checked}
      />
    </div>
  </div>
);

export default NotificationSettings;
