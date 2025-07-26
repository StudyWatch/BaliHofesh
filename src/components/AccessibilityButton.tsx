
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent } from '@/components/ui/card';

interface AccessibilitySettings {
  fontSize: number;
  highContrast: boolean;
  blackWhite: boolean;
  highlightLinks: boolean;
  readableFont: boolean;
  pauseAnimations: boolean;
  stopFlashing: boolean;
  darkMode: boolean;
}

const AccessibilityButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<AccessibilitySettings>({
    fontSize: 16,
    highContrast: false,
    blackWhite: false,
    highlightLinks: false,
    readableFont: false,
    pauseAnimations: false,
    stopFlashing: false,
    darkMode: false
  });

  // Load settings from localStorage on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('accessibility-settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(parsed);
        applySettings(parsed);
      } catch (error) {
        console.error('Error parsing accessibility settings:', error);
      }
    }
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('accessibility-settings', JSON.stringify(settings));
    applySettings(settings);
  }, [settings]);

  const applySettings = (newSettings: AccessibilitySettings) => {
    const root = document.documentElement;
    const body = document.body;

    // Font size
    root.style.fontSize = `${newSettings.fontSize}px`;

    // High contrast
    if (newSettings.highContrast) {
      body.classList.add('accessibility-high-contrast');
    } else {
      body.classList.remove('accessibility-high-contrast');
    }

    // Black and white
    if (newSettings.blackWhite) {
      body.classList.add('accessibility-black-white');
    } else {
      body.classList.remove('accessibility-black-white');
    }

    // Highlight links
    if (newSettings.highlightLinks) {
      body.classList.add('accessibility-highlight-links');
    } else {
      body.classList.remove('accessibility-highlight-links');
    }

    // Readable font
    if (newSettings.readableFont) {
      body.classList.add('accessibility-readable-font');
    } else {
      body.classList.remove('accessibility-readable-font');
    }

    // Pause animations
    if (newSettings.pauseAnimations) {
      body.classList.add('accessibility-pause-animations');
    } else {
      body.classList.remove('accessibility-pause-animations');
    }

    // Stop flashing
    if (newSettings.stopFlashing) {
      body.classList.add('accessibility-stop-flashing');
    } else {
      body.classList.remove('accessibility-stop-flashing');
    }

    // Dark mode
    if (newSettings.darkMode) {
      body.classList.add('accessibility-dark-mode');
    } else {
      body.classList.remove('accessibility-dark-mode');
    }
  };

  const updateSetting = (key: keyof AccessibilitySettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const resetSettings = () => {
    const defaultSettings: AccessibilitySettings = {
      fontSize: 16,
      highContrast: false,
      blackWhite: false,
      highlightLinks: false,
      readableFont: false,
      pauseAnimations: false,
      stopFlashing: false,
      darkMode: false
    };
    setSettings(defaultSettings);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setIsOpen(!isOpen);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button
          className="accessibility-button"
          aria-label="פתח תפריט נגישות"
          title="נגישות"
          onKeyDown={handleKeyDown}
          role="button"
          tabIndex={0}
        >
          ♿
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto dialog-content-improved" dir="rtl">
        <div className="dialog-overlay-light" />
        <DialogHeader>
          <DialogTitle className="text-xl font-bold mb-4">
            הגדרות נגישות
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <Card>
            <CardContent className="p-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="fontSize" className="text-base font-medium">
                    גודל טקסט: {settings.fontSize}px
                  </Label>
                  <Slider
                    id="fontSize"
                    min={12}
                    max={24}
                    step={1}
                    value={[settings.fontSize]}
                    onValueChange={(value) => updateSetting('fontSize', value[0])}
                    className="mt-2"
                    aria-label="שינוי גודל טקסט"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Switch
                      id="highContrast"
                      checked={settings.highContrast}
                      onCheckedChange={(checked) => updateSetting('highContrast', checked)}
                      aria-label="ניגודיות גבוהה"
                    />
                    <Label htmlFor="highContrast">ניגודיות גבוהה</Label>
                  </div>

                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Switch
                      id="blackWhite"
                      checked={settings.blackWhite}
                      onCheckedChange={(checked) => updateSetting('blackWhite', checked)}
                      aria-label="שחור לבן"
                    />
                    <Label htmlFor="blackWhite">שחור־לבן</Label>
                  </div>

                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Switch
                      id="highlightLinks"
                      checked={settings.highlightLinks}
                      onCheckedChange={(checked) => updateSetting('highlightLinks', checked)}
                      aria-label="הדגשת קישורים"
                    />
                    <Label htmlFor="highlightLinks">הדגשת קישורים</Label>
                  </div>

                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Switch
                      id="readableFont"
                      checked={settings.readableFont}
                      onCheckedChange={(checked) => updateSetting('readableFont', checked)}
                      aria-label="גופן קריא"
                    />
                    <Label htmlFor="readableFont">גופן קריא</Label>
                  </div>

                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Switch
                      id="pauseAnimations"
                      checked={settings.pauseAnimations}
                      onCheckedChange={(checked) => updateSetting('pauseAnimations', checked)}
                      aria-label="השהיית אנימציות"
                    />
                    <Label htmlFor="pauseAnimations">השהיית אנימציות</Label>
                  </div>

                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Switch
                      id="stopFlashing"
                      checked={settings.stopFlashing}
                      onCheckedChange={(checked) => updateSetting('stopFlashing', checked)}
                      aria-label="הפסקת הבהובים"
                    />
                    <Label htmlFor="stopFlashing">הפסקת הבהובים</Label>
                  </div>

                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Switch
                      id="darkMode"
                      checked={settings.darkMode}
                      onCheckedChange={(checked) => updateSetting('darkMode', checked)}
                      aria-label="מצב כהה"
                    />
                    <Label htmlFor="darkMode">מצב כהה</Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-center">
            <Button 
              onClick={resetSettings}
              variant="outline"
              className="w-full md:w-auto"
              aria-label="איפוס כל ההגדרות"
            >
              איפוס כל ההגדרות
            </Button>
          </div>

          <div className="text-sm text-gray-600 text-center">
            <p>כפתור הנגישות פותח בהתאם לחוק שוויון זכויות לאנשים עם מוגבלות</p>
            <p>לתמיכה נוספת: accessibility@example.com</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AccessibilityButton;
