import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent } from '@/components/ui/card';

// כל שמות ה־class בדיוק כמו ב־CSS
const accessibilityClasses = [
  'accessibility-high-contrast',
  'accessibility-black-white',
  'accessibility-highlight-links',
  'accessibility-readable-font',
  'accessibility-pause-animations',
  'accessibility-stop-flashing',
  'accessibility-dark-mode',
];

const defaultSettings = {
  fontSize: 16,
  'accessibility-high-contrast': false,
  'accessibility-black-white': false,
  'accessibility-highlight-links': false,
  'accessibility-readable-font': false,
  'accessibility-pause-animations': false,
  'accessibility-stop-flashing': false,
  'accessibility-dark-mode': false,
};
type AccessibilitySettings = typeof defaultSettings;

// תוויות ברורות לכל שדה
const labels: Record<string, string> = {
  'accessibility-high-contrast': 'ניגודיות גבוהה',
  'accessibility-black-white': 'שחור־לבן',
  'accessibility-highlight-links': 'הדגשת קישורים',
  'accessibility-readable-font': 'גופן קריא',
  'accessibility-pause-animations': 'השהיית אנימציות',
  'accessibility-stop-flashing': 'הפסקת הבהובים',
  'accessibility-dark-mode': 'מצב כהה',
};

const AccessibilityButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<AccessibilitySettings>(defaultSettings);

  // טען מה־localStorage
  useEffect(() => {
    const saved = localStorage.getItem('accessibility-settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSettings({ ...defaultSettings, ...parsed });
        applySettings({ ...defaultSettings, ...parsed });
      } catch {
        setSettings(defaultSettings);
        applySettings(defaultSettings);
      }
    } else {
      setSettings(defaultSettings);
      applySettings(defaultSettings);
    }
    // eslint-disable-next-line
  }, []);

  // כל שינוי — שמור והחל
  useEffect(() => {
    localStorage.setItem('accessibility-settings', JSON.stringify(settings));
    applySettings(settings);
    // eslint-disable-next-line
  }, [settings]);

  // מוסיף/מסיר classes ל־main (רק ל־main!)
  const applySettings = (s: AccessibilitySettings) => {
    document.documentElement.style.fontSize = `${s.fontSize}px`;
    const mainEl = document.querySelector('main');
    if (!mainEl) return;
    accessibilityClasses.forEach(cls => {
      if (s[cls as keyof AccessibilitySettings]) {
        mainEl.classList.add(cls);
      } else {
        mainEl.classList.remove(cls);
      }
    });
  };

  // עדכן ערך
  const updateSetting = (key: keyof AccessibilitySettings, value: boolean | number) => {
    setSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  // איפוס הכל
  const resetSettings = () => {
    const mainEl = document.querySelector('main');
    if (mainEl) {
      accessibilityClasses.forEach(cls => mainEl.classList.remove(cls));
    }
    document.documentElement.style.fontSize = `${defaultSettings.fontSize}px`;
    setSettings(defaultSettings);
    localStorage.setItem('accessibility-settings', JSON.stringify(defaultSettings));
  };

  // פתיחה ע"י מקש נגישות
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setIsOpen(true);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button
          className="accessibility-button fixed bottom-5 left-5"  // הצבתי את הכפתור בצד שמאל
          aria-label="פתח תפריט נגישות"
          title="נגישות"
          onClick={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          role="button"
          tabIndex={0}
        >
          <span className="text-2xl" role="img" aria-label="נגישות">♿</span>
        </button>
      </DialogTrigger>
      <DialogContent
        id="accessibility-dialog"
        className="DialogContent accessibility-dialog max-w-2xl max-h-[80vh] overflow-y-auto dialog-content-improved"
        dir="rtl"
        style={{
          background: "#f9fafb",  // צבע רקע בהיר יותר
          borderRadius: 18,
          border: "2px solid #e5e7eb",
          boxShadow: "0 24px 48px -12px rgba(0,0,0,0.16)",
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold mb-4 text-gray-900">
            הגדרות נגישות
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-8">
          <Card className="shadow-none border-0 bg-transparent">
            <CardContent className="p-0">
              <div className="flex flex-col gap-6 md:gap-2 md:flex-row justify-between items-start">
                <div className="w-full md:w-1/2">
                  <Label htmlFor="fontSize" className="text-base font-medium block mb-2">
                    גודל טקסט: {settings.fontSize}px
                  </Label>
                  <Slider
                    id="fontSize"
                    min={12}
                    max={24}
                    step={1}
                    value={[settings.fontSize]}
                    onValueChange={([value]) => updateSetting('fontSize', value)}
                    className="mt-2 w-full"
                    aria-label="שינוי גודל טקסט"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                  {accessibilityClasses.map(cls => (
                    <SettingSwitch
                      key={cls}
                      id={cls}
                      label={labels[cls] || cls}
                      value={!!settings[cls as keyof AccessibilitySettings]}
                      onChange={v => updateSetting(cls as keyof AccessibilitySettings, v)}
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
          <div className="flex justify-center">
            <Button
              onClick={resetSettings}
              variant="destructive"
              className="w-full md:w-auto reset-accessibility-btn font-bold"
              aria-label="איפוס כל ההגדרות"
            >
              איפוס כל ההגדרות
            </Button>
          </div>
          <div className="text-sm text-gray-600 text-center">
            <p>
              צריך עזרה נוספת או להודיע על בעיה? אפשר לפנות בכל עת ל־
              <a className="underline" href="mailto:balihofeshe@gmail.com">balihofeshe@gmail.com</a>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// קומפוננטת Switch גנרית – עיצוב ברור ורספונסיבי
function SettingSwitch({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center space-x-2 space-x-reverse switch-wrapper">
      <Switch
        id={id}
        checked={!!value}
        onCheckedChange={onChange}
        aria-label={label}
        className="mr-2"
      />
      <Label htmlFor={id} className="text-base font-semibold text-gray-900">{label}</Label>
    </div>
  );
}

export default AccessibilityButton;
