import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useUserProfile, useUpdateProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Mail, Phone, MapPin, GraduationCap, Calendar } from 'lucide-react';

interface ProfileEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ProfileEditDialog = ({ open, onOpenChange }: ProfileEditDialogProps) => {
  const { data: profile } = useUserProfile();
  const { mutate: updateProfile, isPending } = useUpdateProfile();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: profile?.name || '',
    bio: profile?.bio || '',
    phone: profile?.phone || '',
    location: profile?.location || '',
    university: profile?.university || '',
    study_year: profile?.study_year || '',
    telegram_username: profile?.telegram_username || '',
    instagram_username: profile?.instagram_username || '',
    show_contact_info: profile?.show_contact_info ?? true,
    show_email: profile?.show_email ?? false,
    show_phone: profile?.show_phone ?? false
  });

  React.useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        bio: profile.bio || '',
        phone: profile.phone || '',
        location: profile.location || '',
        university: profile.university || '',
        study_year: profile.study_year || '',
        telegram_username: profile.telegram_username || '',
        instagram_username: profile.instagram_username || '',
        show_contact_info: profile.show_contact_info ?? true,
        show_email: profile.show_email ?? false,
        show_phone: profile.show_phone ?? false
      });
    }
  }, [profile]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    updateProfile(formData, {
      onSuccess: () => {
        toast({
          title: '✅ הפרופיל עודכן',
          description: 'הפרופיל שלך עודכן בהצלחה!'
        });
        onOpenChange(false);
      },
      onError: (error) => {
        toast({
          title: 'שגיאה',
          description: 'אירעה שגיאה בעדכון הפרופיל',
          variant: 'destructive'
        });
        console.error('Error updating profile:', error);
      }
    });
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            עריכת פרופיל
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* תמונת פרופיל */}
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={profile?.avatar_url} />
              <AvatarFallback>{profile?.name?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            <div>
              <Button type="button" variant="outline" size="sm">
                <Camera className="w-4 h-4 mr-2" />
                שנה תמונה
              </Button>
              <p className="text-sm text-muted-foreground mt-1">
                JPG, PNG עד 2MB
              </p>
            </div>
          </div>

          {/* פרטים בסיסיים */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">שם מלא *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="השם המלא שלך"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="phone">טלפון</Label>
              <div className="relative">
                <Phone className="absolute right-3 top-2.5 w-4 h-4 text-muted-foreground" />
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="050-1234567"
                  className="pr-10"
                />
              </div>
            </div>
          </div>

          {/* ביוגרפיה */}
          <div>
            <Label htmlFor="bio">אודותיי</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              placeholder="ספר על עצמך, התחומים שאתה לומד, התחביבים שלך..."
              rows={3}
            />
          </div>

          {/* פרטי לימודים */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="university">אוניברסיטה/מכללה</Label>
              <div className="relative">
                <GraduationCap className="absolute right-3 top-2.5 w-4 h-4 text-muted-foreground" />
                <Input
                  id="university"
                  value={formData.university}
                  onChange={(e) => handleInputChange('university', e.target.value)}
                  placeholder="אוניברסיטת תל אביב"
                  className="pr-10"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="study_year">שנת לימודים</Label>
              <div className="relative">
                <Calendar className="absolute right-3 top-2.5 w-4 h-4 text-muted-foreground" />
                <Input
                  id="study_year"
                  value={formData.study_year}
                  onChange={(e) => handleInputChange('study_year', e.target.value)}
                  placeholder="שנה א׳, שנה ב׳, תואר שני..."
                  className="pr-10"
                />
              </div>
            </div>
          </div>

          {/* מיקום */}
          <div>
            <Label htmlFor="location">מיקום</Label>
            <div className="relative">
              <MapPin className="absolute right-3 top-2.5 w-4 h-4 text-muted-foreground" />
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="תל אביב, ירושלים, חיפה..."
                className="pr-10"
              />
            </div>
          </div>

          {/* רשתות חברתיות */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="telegram_username">טלגרם</Label>
              <Input
                id="telegram_username"
                value={formData.telegram_username}
                onChange={(e) => handleInputChange('telegram_username', e.target.value)}
                placeholder="@username"
              />
            </div>
            
            <div>
              <Label htmlFor="instagram_username">אינסטגרם</Label>
              <Input
                id="instagram_username"
                value={formData.instagram_username}
                onChange={(e) => handleInputChange('instagram_username', e.target.value)}
                placeholder="@username"
              />
            </div>
          </div>

          {/* הגדרות פרטיות */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Mail className="w-4 h-4" />
              הגדרות פרטיות
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="show_contact_info">הצג פרטי קשר</Label>
                <Switch
                  id="show_contact_info"
                  checked={formData.show_contact_info}
                  onCheckedChange={(checked) => handleInputChange('show_contact_info', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="show_email">הצג אימייל</Label>
                <Switch
                  id="show_email"
                  checked={formData.show_email}
                  onCheckedChange={(checked) => handleInputChange('show_email', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="show_phone">הצג טלפון</Label>
                <Switch
                  id="show_phone"
                  checked={formData.show_phone}
                  onCheckedChange={(checked) => handleInputChange('show_phone', checked)}
                />
              </div>
            </div>
          </div>

          {/* כפתורי פעולה */}
          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              disabled={isPending}
              className="flex-1"
            >
              {isPending ? 'שומר...' : 'שמור שינויים'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              ביטול
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileEditDialog;