import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Bell,
  Mail,
  MessageSquare,
  Calendar,
  Users,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/App';

interface NotificationSettingsProps {
  onClose: () => void;
}

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

const defaultPreferences: NotificationPreferences = {
  exams: {
    push: true,
    site: true,
    reminder_days_before: 3,
  },
  assignments: {
    push: true,
    site: true,
    reminder_days_before: 2,
  },
  system: {
    push: false,
    site: true,
  },
};

// Type Guard to check object type
function isNotificationPreferences(obj: any): obj is NotificationPreferences {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'exams' in obj &&
    'assignments' in obj &&
    'system' in obj
  );
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({ onClose }) => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadPreferences = async () => {
      if (!user) return;
      setLoading(true);
      const { data } = await supabase
        .from('profiles')
        .select('notification_preferences')
        .eq('id', user.id)
        .single();

      let loaded: any = data?.notification_preferences ?? {};
      if (isNotificationPreferences(loaded)) {
        // merge with defaults for missing fields
        setPreferences({
          exams: { ...defaultPreferences.exams, ...loaded.exams },
          assignments: { ...defaultPreferences.assignments, ...loaded.assignments },
          system: { ...defaultPreferences.system, ...loaded.system },
        });
      } else {
        setPreferences(defaultPreferences);
      }
      setLoading(false);
    };
    loadPreferences();
  }, [user]);

  const updatePref = <T extends keyof NotificationPreferences, K extends keyof NotificationPreferences[T]>(
    section: T,
    key: K,
    value: NotificationPreferences[T][K]
  ) => {
    setPreferences(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }));
  };

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase
      .from('profiles')
      .update({ notification_preferences: preferences })
      .eq('id', user.id);

    if (error) {
      toast.error('שגיאה בשמירת ההגדרות');
    } else {
      toast.success('ההגדרות נשמרו בהצלחה');
      onClose();
    }
    setLoading(false);
  };

  return (
    <div className="relative w-full max-w-lg mx-auto">
      <Card className="bg-white dark:bg-zinc-900 shadow-xl rounded-2xl max-h-[95vh] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-800">
        <CardHeader className="sticky top-0 bg-white/90 dark:bg-zinc-900/80 z-20 rounded-t-2xl">
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            הגדרות התראות
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-8 pb-4">
          {/* בחינות */}
          <SectionTitle icon={<Calendar className="w-5 h-5 text-blue-500" />} title="התראות בחינות" />
          <div className="space-y-4">
            <ToggleRow
              label="התראה לאתר"
              checked={preferences.exams.site}
              onChange={val => updatePref('exams', 'site', val)}
            />
            <ToggleRow
              label="התראה לפוש"
              checked={preferences.exams.push}
              onChange={val => updatePref('exams', 'push', val)}
            />
            <div>
              <Label>ימים לפני בחינה לתזכורת</Label>
              <Select
                value={String(preferences.exams.reminder_days_before)}
                onValueChange={value => updatePref('exams', 'reminder_days_before', Number(value))}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
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
              label="התראה לאתר"
              checked={preferences.assignments.site}
              onChange={val => updatePref('assignments', 'site', val)}
            />
            <ToggleRow
              label="התראה לפוש"
              checked={preferences.assignments.push}
              onChange={val => updatePref('assignments', 'push', val)}
            />
            <div>
              <Label>ימים לפני מטלה לתזכורת</Label>
              <Select
                value={String(preferences.assignments.reminder_days_before)}
                onValueChange={value => updatePref('assignments', 'reminder_days_before', Number(value))}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
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

          {/* התראות מערכת */}
          <SectionTitle icon={<Mail className="w-5 h-5 text-orange-500" />} title="התראות מערכת" />
          <div className="space-y-4">
            <ToggleRow
              label="התראה לאתר"
              checked={preferences.system.site}
              onChange={val => updatePref('system', 'site', val)}
            />
            <ToggleRow
              label="התראה לפוש"
              checked={preferences.system.push}
              onChange={val => updatePref('system', 'push', val)}
            />
          </div>
        </CardContent>

        {/* כפתורים צמודים לתחתית ותמיד נגללים! */}
        <div className="sticky bottom-0 bg-white dark:bg-zinc-900 rounded-b-2xl z-30 p-4 flex gap-3 border-t mt-3">
          <Button onClick={handleSave} className="flex-1" disabled={loading}>
            שמור הגדרות
          </Button>
          <Button variant="outline" onClick={onClose} className="flex-1" disabled={loading}>
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

const ToggleRow = ({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) => (
  <div className="flex items-center justify-between">
    <Label className="font-medium">{label}</Label>
    <Switch checked={checked} onCheckedChange={onChange} />
  </div>
);

export default NotificationSettings;
