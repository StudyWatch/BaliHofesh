import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useUserProfile, useUpdateProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Mail, Phone, MapPin, GraduationCap, Calendar, Loader2 } from 'lucide-react';

interface ProfileEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AVATAR_BUCKET = 'avatars';
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

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
    show_phone: profile?.show_phone ?? false,
    avatar_url: profile?.avatar_url || ''
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(profile?.avatar_url || undefined);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

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
        show_phone: profile.show_phone ?? false,
        avatar_url: profile.avatar_url || ''
      });
      setAvatarPreview(profile.avatar_url || undefined);
    }
  }, [profile]);

  // טען תמונת פרופיל חדשה
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast({ title: 'קובץ אינו תמונה', description: 'בחר תמונת jpg/png בלבד', variant: 'destructive' });
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast({ title: 'תמונה גדולה מדי', description: 'גודל מקסימלי: 2MB', variant: 'destructive' });
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  // העלאת תמונה ל־Supabase Storage
  const uploadAvatar = async () => {
    if (!avatarFile || !profile?.id) return null;
    setUploading(true);
    const fileExt = avatarFile.name.split('.').pop();
    const filePath = `${profile.id}/${Date.now()}.${fileExt}`;
    // העלאה לבאקט avatars
    const { error: uploadError } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(filePath, avatarFile, { upsert: true, cacheControl: '3600' });
    if (uploadError) {
      toast({ title: 'שגיאה בהעלאה', description: uploadError.message, variant: 'destructive' });
      setUploading(false);
      return null;
    }
    // שלוף את ה־URL
    const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(filePath);
    setUploading(false);
    return data?.publicUrl || null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let avatarUrl = formData.avatar_url;
    // אם העלינו קובץ – נעלה אותו ל־Storage
    if (avatarFile) {
      avatarUrl = await uploadAvatar();
      if (!avatarUrl) return;
    }
    updateProfile({ ...formData, avatar_url: avatarUrl }, {
      onSuccess: () => {
        toast({
          title: '✅ הפרופיל עודכן',
          description: 'הפרופיל שלך עודכן בהצלחה!'
        });
        setAvatarFile(null);
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

  // לחיצה על ה־Avatar תפתח את בורר הקבצים
  const triggerFilePicker = () => {
    inputRef.current?.click();
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
            <div
              className="relative group w-16 h-16"
              onClick={triggerFilePicker}
              style={{ cursor: 'pointer' }}
              title="החלף תמונה"
            >
              <Avatar className="w-16 h-16 ring-2 ring-indigo-400 shadow-md group-hover:ring-4 group-hover:shadow-xl transition-all">
                <AvatarImage src={avatarPreview || undefined} />
                <AvatarFallback>
                  {profile?.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              {/* Overlay כפתור העלאה */}
              <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {uploading ? (
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                ) : (
                  <Camera className="w-7 h-7 text-white" />
                )}
              </div>
            </div>
            <input
              type="file"
              ref={inputRef}
              className="hidden"
              accept="image/*"
              onChange={handleAvatarChange}
              disabled={uploading}
            />
            <div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={triggerFilePicker}
                disabled={uploading}
              >
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
             <Label htmlFor="university">מוסד לימוד</Label>
<div className="relative">
  <GraduationCap className="absolute right-3 top-2.5 w-4 h-4 text-muted-foreground" />
  <Input
    id="university"
    value={formData.university}
    onChange={(e) => handleInputChange('university', e.target.value)}
    placeholder="האוניברסיטה הפתוחה"
    className="pr-10"
    disabled // מוסד קבוע, לא ניתן לשנות
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
              disabled={isPending || uploading}
              className="flex-1"
            >
              {isPending || uploading ? 'שומר...' : 'שמור שינויים'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending || uploading}
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
