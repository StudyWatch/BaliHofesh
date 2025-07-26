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

type JsonCompatiblePreferences = Record<string, string | number | boolean | null>;

const defaultSettings: JsonCompatiblePreferences = {
  exam_reminders: true,
  assignment_reminders: true,
  reminder_days_before: 2,
  message_notifications: true,
  study_partner_notifications: true,
  study_session_notifications: true,
  course_updates: false,
  email_notifications: true,
};

const NotificationSettings: React.FC<NotificationSettingsProps> = ({ onClose }) => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<JsonCompatiblePreferences>(defaultSettings);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      if (!user) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('notification_preferences')
        .eq('id', user.id)
        .single();

      if (data?.notification_preferences) {
        setSettings(data.notification_preferences);
      }
      setLoading(false);
    };
    loadSettings();
  }, [user]);

  const updateSetting = (key: string, value: boolean | string | number) => {
    setSettings((prev: JsonCompatiblePreferences) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase
      .from('profiles')
      .update({ notification_preferences: settings })
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
    <Card className="bg-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          הגדרות התראות
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900 border-b pb-2">התראות באפליקציה</h3>

          <SettingRow
            icon={<Calendar className="w-4 h-4 text-blue-500" />}
            title="תזכורות לבחינות"
            subtitle="התראות לפני מועדי בחינות"
            value={!!settings.exam_reminders}
            onChange={(v) => updateSetting('exam_reminders', v)}
          />

          <SettingRow
            icon={<Calendar className="w-4 h-4 text-purple-500" />}
            title="תזכורות למטלות"
            subtitle="התראות לפני מועדי הגשות"
            value={!!settings.assignment_reminders}
            onChange={(v) => updateSetting('assignment_reminders', v)}
          />

          <SettingRow
            icon={<MessageSquare className="w-4 h-4 text-green-500" />}
            title="הודעות חדשות"
            subtitle="התראות על הודעות פרטיות"
            value={!!settings.message_notifications}
            onChange={(v) => updateSetting('message_notifications', v)}
          />

          <SettingRow
            icon={<Users className="w-4 h-4 text-purple-500" />}
            title="הזמנות למפגשי לימוד"
            subtitle="התראות על מפגשים שיתופיים"
            value={!!settings.study_session_notifications}
            onChange={(v) => updateSetting('study_session_notifications', v)}
          />

          <SettingRow
            icon={<Users className="w-4 h-4 text-orange-500" />}
            title="בקשות שותפי לימוד"
            subtitle="הצעות לשותפי לימוד פוטנציאליים"
            value={!!settings.study_partner_notifications}
            onChange={(v) => updateSetting('study_partner_notifications', v)}
          />
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900 border-b pb-2">התראות אימייל</h3>

          <SettingRow
            icon={<Mail className="w-4 h-4 text-red-500" />}
            title="קבלת התראות באימייל"
            subtitle="עדכונים חשובים ישלחו לדוא״ל"
            value={!!settings.email_notifications}
            onChange={(v) => updateSetting('email_notifications', v)}
          />
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900 border-b pb-2">הגדרות זמן</h3>

          <div className="space-y-2">
            <Label htmlFor="reminder_days_before">כמה ימים לפני לשלוח תזכורת</Label>
            <Select
              value={String(settings.reminder_days_before)}
              onValueChange={(value) => updateSetting('reminder_days_before', parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="בחר מספר ימים" />
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

        <div className="flex gap-3 pt-4">
          <Button onClick={handleSave} className="flex-1" disabled={loading}>
            שמור הגדרות
          </Button>
          <Button variant="outline" onClick={onClose} className="flex-1" disabled={loading}>
            ביטול
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const SettingRow = ({
  icon,
  title,
  subtitle,
  value,
  onChange,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      {icon}
      <div>
        <Label className="font-medium">{title}</Label>
        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
      </div>
    </div>
    <Switch checked={value} onCheckedChange={onChange} />
  </div>
);

export default NotificationSettings;
