import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Mail, Lock, Eye, EyeOff, Info, UploadCloud } from 'lucide-react';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { toast } from 'sonner';
import PasswordResetDialog from './PasswordResetDialog';
import { createWelcomeNotification } from '@/components/notifications/createWelcomeNotification';
import { supabase } from '@/integrations/supabase/client';
import { Checkbox } from '@/components/ui/checkbox';

// --- אייקונים SVG מקוריים ---
const GOOGLE_ICON = (
  <svg width="22" height="22" viewBox="0 0 48 48"><g><path fill="#4285F4" d="M44.5 20H24v8.5h11.8C34.6 32.2 30.1 35 24 35c-6.1 0-11.3-5-11.3-11S17.9 13 24 13c2.5 0 4.9.8 6.8 2.3l6.4-6.4C33.2 5.5 28.8 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c9.8 0 18.5-7 19.6-16.2.1-.8.2-1.5.2-2.3 0-1.3-.1-2.5-.3-3.5z"/><path fill="#34A853" d="M6.3 14.7l7 5.1C15.3 16.5 19.2 13 24 13c2.5 0 4.9.8 6.8 2.3l6.4-6.4C33.2 5.5 28.8 4 24 4c-7.2 0-13.5 4.2-16.7 10.7z"/><path fill="#FBBC05" d="M24 44c5.9 0 10.9-1.9 14.6-5.2l-7-5.7C29.7 34.4 27 35 24 35c-6.1 0-11.3-5-11.3-11H6.3C8.7 37.2 15.6 44 24 44z"/><path fill="#EA4335" d="M44.5 20H24v8.5h11.8C35.4 32.2 30.1 35 24 35c-6.1 0-11.3-5-11.3-11S17.9 13 24 13c2.5 0 4.9.8 6.8 2.3l6.4-6.4C33.2 5.5 28.8 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c9.8 0 18.5-7 19.6-16.2.1-.8.2-1.5.2-2.3 0-1.3-.1-2.5-.3-3.5z"/></g></svg>
);

const FACEBOOK_ICON = (
  <svg width="22" height="22" viewBox="0 0 48 48"><g><circle fill="#3b5998" cx="24" cy="24" r="20"/><path fill="#fff" d="M26.5 37V25.6h3.8l.5-4.1h-4.3v-2.6c0-1.2.3-1.9 2-1.9h2.1V13c-.3 0-1.5-.1-2.9-.1-2.9 0-4.8 1.8-4.8 5.1v2.8h-3.2v4.1h3.2V37h4.6z"/></g></svg>
);

// ---- מערך אווטארים מוכנים (DiceBear וכדומה) ----
const AVATAR_CHOICES = [
  { label: 'ברירת מחדל', value: '', img: 'https://cdn-icons-png.flaticon.com/512/149/149071.png' },
  { label: 'סטודנט 1', value: 'https://api.dicebear.com/7.x/micah/svg?seed=student1', img: 'https://api.dicebear.com/7.x/micah/svg?seed=student1' },
  { label: 'סטודנטית 2', value: 'https://api.dicebear.com/7.x/lorelei/svg?seed=smiley', img: 'https://api.dicebear.com/7.x/lorelei/svg?seed=smiley' },
  { label: 'רובוט מגניב', value: 'https://api.dicebear.com/7.x/bottts/svg?seed=tech', img: 'https://api.dicebear.com/7.x/bottts/svg?seed=tech' },
  { label: 'ספר חכם', value: 'https://api.dicebear.com/7.x/adventurer/svg?seed=book', img: 'https://api.dicebear.com/7.x/adventurer/svg?seed=book' },
  { label: 'סטודנט צהוב', value: 'https://api.dicebear.com/7.x/micah/svg?seed=yellowguy', img: 'https://api.dicebear.com/7.x/micah/svg?seed=yellowguy' },
  { label: 'פנים שמחות', value: 'https://api.dicebear.com/7.x/lorelei/svg?seed=happyface', img: 'https://api.dicebear.com/7.x/lorelei/svg?seed=happyface' },
  { label: 'פנים חמודות', value: 'https://api.dicebear.com/7.x/micah/svg?seed=cute', img: 'https://api.dicebear.com/7.x/micah/svg?seed=cute' },
  { label: 'חנון חמוד', value: 'https://api.dicebear.com/7.x/adventurer/svg?seed=nerd', img: 'https://api.dicebear.com/7.x/adventurer/svg?seed=nerd' },
  { label: 'רובוט חייכן', value: 'https://api.dicebear.com/7.x/bottts/svg?seed=smilerobot', img: 'https://api.dicebear.com/7.x/bottts/svg?seed=smilerobot' },
];

interface AuthDialogProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'login' | 'signup';
}

const AuthDialog: React.FC<AuthDialogProps> = ({ isOpen, onClose }) => {
  const { dir } = useLanguage();
  const navigate = useNavigate();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [showPasswordReset, setShowPasswordReset] = useState(false);

  const [selectedAvatar, setSelectedAvatar] = useState<string>(AVATAR_CHOICES[0].value);
  const [customAvatarFile, setCustomAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>(AVATAR_CHOICES[0].img);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [signupData, setSignupData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    confirmPassword: ''
  });
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (event === 'SIGNED_IN' && session?.user) {
          if (!session.user.email_confirmed_at) {
            localStorage.setItem('unverified_user', JSON.stringify({
              email: session.user.email,
              id: session.user.id
            }));
            supabase.auth.signOut();
            navigate('/email-verification');
            onClose();
            return;
          }
          localStorage.removeItem('unverified_user');
          onClose();
          checkUserRoleAndRedirect(session.user.id);
        }
      }
    );
    return () => subscription.unsubscribe();
  }, [onClose, navigate]);

  useEffect(() => {
    if (customAvatarFile) {
      const reader = new FileReader();
      reader.onload = e => setAvatarPreview(e.target?.result as string);
      reader.readAsDataURL(customAvatarFile);
    } else if (selectedAvatar) {
      setAvatarPreview(selectedAvatar);
    } else {
      setAvatarPreview(AVATAR_CHOICES[0].img);
    }
  }, [customAvatarFile, selectedAvatar]);

  const checkUserRoleAndRedirect = async (userId: string) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
      if (profile?.role === 'admin') {
        navigate('/admin');
        toast.success('ברוך הבא, אדמין!');
      } else {
        navigate('/');
        toast.success('התחברת בהצלחה!');
      }
    } catch {
      navigate('/');
    }
  };

  const uploadAvatar = async (userId: string): Promise<string | null> => {
    if (!customAvatarFile) return selectedAvatar || null;
    const fileExt = customAvatarFile.name.split('.').pop();
    const filePath = `avatars/${userId}.${fileExt}`;
    let { error } = await supabase.storage
      .from('avatars')
      .upload(filePath, customAvatarFile, { upsert: true });
    if (error) {
      toast.error("שגיאה בהעלאת תמונה: " + error.message);
      return null;
    }
    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
    return data?.publicUrl || null;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password
      });
      if (error) {
        if (error.message?.toLowerCase().includes('invalid')) {
          toast.error('אימייל או סיסמה שגויים');
        } else if (error.message?.toLowerCase().includes('not confirmed')) {
          localStorage.setItem('unverified_user', JSON.stringify({
            email: loginData.email
          }));
          navigate('/email-verification');
          onClose();
          return;
        } else {
          toast.error('שגיאה בהתחברות: ' + error.message);
        }
        return;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (signupData.password !== signupData.confirmPassword) {
        toast.error('הסיסמאות לא תואמות');
        setIsLoading(false);
        return;
      }
      if (signupData.password.length < 6) {
        toast.error('הסיסמה חייבת להיות לפחות 6 תווים');
        setIsLoading(false);
        return;
      }
      if (!agreedToTerms) {
        toast.error("יש לאשר את תנאי השימוש כדי להירשם");
        setIsLoading(false);
        return;
      }

      const redirectUrl = `${window.location.origin}/`;
      const { data, error } = await supabase.auth.signUp({
        email: signupData.email,
        password: signupData.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name: signupData.name,
            phone: signupData.phone,
          }
        }
      });

      if (error || !data?.user) {
        if (error) console.error("Supabase signup error:", error);
        if (
          error?.message?.toLowerCase().includes('already registered') ||
          error?.message?.toLowerCase().includes('exists') ||
          error?.status === 400
        ) {
          toast.error('האימייל הזה כבר רשום במערכת');
        } else if (error?.message) {
          toast.error('שגיאה בהרשמה: ' + error.message);
        } else {
          toast.error('שגיאה לא צפויה, נסה שוב או צור קשר.');
        }
        setIsLoading(false);
        return;
      }

      let avatarUrl: string | null = null;
      if (customAvatarFile || selectedAvatar) {
        avatarUrl = await uploadAvatar(data.user.id);
        if (avatarUrl) {
          await supabase.from('profiles').update({ avatar_url: avatarUrl }).eq('id', data.user.id);
        }
      }

      await createWelcomeNotification(data.user.id, dir === 'rtl' ? 'he' : 'en');
      localStorage.setItem('unverified_user', JSON.stringify({
        email: signupData.email,
        id: data.user.id
      }));

      toast.success('נשלח אימייל אימות. אנא בדוק את תיבת הדואר שלך.');
      navigate('/email-verification');
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      localStorage.removeItem('unverified_user');
      toast.success('התנתקת בהצלחה');
      navigate('/');
      onClose();
    } catch (error: any) {
      toast.error('שגיאה ביציאה: ' + error.message);
    }
  };

  // התחברות עם גוגל/פייסבוק (כולל REDIRECT נכון לסביבה)
  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    setIsLoading(true);
    const redirectTo =
      process.env.NODE_ENV === 'development'
        ? 'http://localhost:3000/auth/callback'
        : 'https://balihofesh.vercel.app/auth/callback';

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo,
      }
    });
    if (error) {
      toast.error(`שגיאה בהתחברות עם ${provider === 'google' ? 'Google' : 'Facebook'}: ` + error.message);
      setIsLoading(false);
    }
  };

  const AvatarPicker = () => (
    <div className="space-y-1 mb-2">
      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
        תמונת פרופיל (לא חובה)
        <span className="ml-1 text-gray-400 cursor-pointer" title="תמונה זו תוצג בפרופיל ובחיפוש שותפי למידה. אפשר להעלות/לבחור/להשאיר ריק, ותמיד אפשר לשנות בהמשך.">
          <Info className="inline w-3 h-3" />
        </span>
      </label>
      <div className="flex gap-2 items-center flex-wrap mb-1">
        {AVATAR_CHOICES.map(choice => (
          <button
            key={choice.label}
            type="button"
            className={`w-12 h-12 rounded-full border-2 bg-white p-0.5 shadow transition
              ${selectedAvatar === choice.value ? 'ring-2 ring-purple-500 border-purple-400 scale-110' : 'border-gray-300'}
              hover:scale-105 hover:border-purple-300`}
            onClick={() => {
              setSelectedAvatar(choice.value);
              setCustomAvatarFile(null);
            }}
            title={choice.label}
          >
            <img src={choice.img} alt={choice.label} className="w-full h-full rounded-full object-cover" />
          </button>
        ))}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-12 h-12 rounded-full border-2 border-gray-300 p-2 bg-gray-50 hover:bg-blue-50 flex items-center justify-center"
          title="העלה תמונה מהמחשב"
        >
          <UploadCloud className="w-6 h-6 text-blue-400" />
        </button>
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          className="hidden"
          onChange={e => {
            const file = e.target.files?.[0] || null;
            if (file) {
              setCustomAvatarFile(file);
              setSelectedAvatar('');
            }
          }}
        />
      </div>
      <div className="flex items-center gap-3">
        <img
          src={avatarPreview}
          alt="תצוגת אווטאר"
          className="w-14 h-14 rounded-full border border-gray-300 shadow"
        />
        <span className="text-xs text-gray-500">
          אפשר להעלות תמונה, לבחור אחת מהמוכנות או להשאיר ברירת מחדל. אפשר לשנות אחרי ההרשמה.
        </span>
      </div>
    </div>
  );

  if (user && user.email_confirmed_at) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="w-full max-w-sm sm:max-w-md mx-auto bg-white border-2 shadow-xl" dir={dir}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <User className="w-5 h-5" />
              הפרופיל שלי
            </DialogTitle>
            <DialogDescription className="sr-only">
              פרופיל המשתמש המחובר
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <User className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 text-lg">{user.user_metadata?.name || 'משתמש'}</h3>
              <p className="text-sm text-gray-600 break-words">{user.email}</p>
            </div>
            <div className="pt-4 border-t">
              <Button onClick={handleLogout} variant="outline" className="w-full hover:bg-red-50 hover:text-red-600 hover:border-red-200">
                התנתק
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-sm sm:max-w-md mx-auto bg-white border-2 shadow-xl p-4 sm:p-6 max-h-[90vh] overflow-y-auto" dir={dir}>
        <DialogHeader className="space-y-3">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto">
            <span className="text-white font-bold text-xl">B</span>
          </div>
          <DialogTitle className="text-center text-gray-900 font-bold text-xl">כניסה למערכת</DialogTitle>
          <DialogDescription className="text-center text-gray-600 text-sm">
            התחבר או הירשם כדי לגשת למערכת
          </DialogDescription>
        </DialogHeader>

        {/* --- SOCIAL BUTTONS --- */}
        <div className="w-full flex flex-col gap-2 mb-2">
          <Button
            type="button"
            onClick={() => handleSocialLogin('google')}
            className="w-full flex items-center gap-3 justify-center bg-white border border-gray-200 shadow hover:bg-gray-50 text-gray-800 font-semibold"
            disabled={isLoading}
          >
            {GOOGLE_ICON}
            התחבר עם Google
          </Button>
          <Button
            type="button"
            onClick={() => handleSocialLogin('facebook')}
            className="w-full flex items-center gap-3 justify-center bg-white border border-gray-200 shadow hover:bg-gray-50 text-gray-800 font-semibold"
            disabled={isLoading}
          >
            {FACEBOOK_ICON}
            התחבר עם Facebook
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={v => setActiveTab(v as 'login' | 'signup')} className="w-full mt-4">
          <TabsList className="grid w-full grid-cols-2 bg-gray-100 h-10">
            <TabsTrigger value="login" className="text-gray-700 text-sm">התחברות</TabsTrigger>
            <TabsTrigger value="signup" className="text-gray-700 text-sm">הרשמה</TabsTrigger>
          </TabsList>
          <TabsContent value="login" className="space-y-4 mt-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Mail className="w-4 h-4" />
                  אימייל
                </label>
                <Input
                  type="email"
                  required
                  value={loginData.email}
                  onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="your@email.com"
                  className="w-full border-gray-300 focus:border-blue-500 text-sm h-10"
                />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Lock className="w-4 h-4" />
                  סיסמה
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    required
                    value={loginData.password}
                    onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="••••••••"
                    className="w-full border-gray-300 focus:border-blue-500 pr-10 text-sm h-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white h-10">
                {isLoading ? 'מתחבר...' : 'התחבר'}
              </Button>
              <div className="text-center">
                <Button
                  type="button"
                  variant="link"
                  onClick={() => setShowPasswordReset(true)}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  שכחת סיסמה?
                </Button>
              </div>
            </form>
          </TabsContent>
          {/* --- טופס הרשמה --- */}
          <TabsContent value="signup" className="space-y-4 mt-6">
            <form onSubmit={handleSignup} className="space-y-4">
              <AvatarPicker />
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <User className="w-4 h-4" />
                  שם מלא
                </label>
                <Input
                  required
                  value={signupData.name}
                  onChange={(e) => setSignupData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="הכנס את שמך המלא"
                  className="w-full border-gray-300 focus:border-purple-500 text-sm h-10"
                />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Mail className="w-4 h-4" />
                  אימייל
                </label>
                <Input
                  type="email"
                  required
                  value={signupData.email}
                  onChange={(e) => setSignupData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="your@email.com"
                  className="w-full border-gray-300 focus:border-purple-500 text-sm h-10"
                />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Lock className="w-4 h-4" />
                  סיסמה
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    required
                    value={signupData.password}
                    onChange={(e) => setSignupData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="••••••••"
                    className="w-full border-gray-300 focus:border-purple-500 pr-10 text-sm h-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Lock className="w-4 h-4" />
                  אימות סיסמה
                </label>
                <Input
                  type={showPassword ? "text" : "password"}
                  required
                  value={signupData.confirmPassword}
                  onChange={(e) => setSignupData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="הזן שוב את הסיסמה"
                  className="w-full border-gray-300 focus:border-purple-500 text-sm h-10"
                />
              </div>
              {/* --- טלפון אופציונלי --- */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  טלפון (אופציונלי)
                  <span className="ml-1 text-gray-400 cursor-pointer" title="הטלפון לא יועבר לאף אחד, אלא רק אם תצטרף לשותפי למידה ותרצה לשתף.">
                    <Info className="inline w-3 h-3" />
                  </span>
                </label>
                <Input
                  type="tel"
                  value={signupData.phone}
                  onChange={(e) => setSignupData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="05x-xxxxxxx"
                  className="w-full border-gray-300 focus:border-purple-500 text-sm h-10"
                />
                <div className="text-xs text-gray-400 mt-1">
                  הטלפון שלך לעולם לא יופיע בפרופיל – אפשר לשתף אותו רק אם תבחר, במפגשי לימוד.
                </div>
              </div>
              {/* ----- תנאי שימוש ----- */}
              <div className="space-y-2 mt-2">
                <label className="flex items-start gap-2 text-sm text-gray-700">
                  <Checkbox
                    id="agree"
                    checked={agreedToTerms}
                    onCheckedChange={val => setAgreedToTerms(Boolean(val))}
                    required
                  />
                  <span>
                    אני מאשר/ת שקראתי את <a href="/terms" target="_blank" className="underline text-blue-600">תנאי השימוש</a>
                    <span className="block text-xs text-gray-500">
                      השירות ניתן בגרסת ניסוי (פיילוט), ייתכנו תקלות או שגיאות. השימוש באחריותך בלבד ואין להעלות כל דרישה, טענה או תביעה כלפי בעלי הפלטפורמה בגין נזקים, טעויות או הפסקות שירות.
                    </span>
                  </span>
                </label>
              </div>
              <Button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white h-10">
                {isLoading ? 'נרשם...' : 'הירשם'}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
      <PasswordResetDialog isOpen={showPasswordReset} onClose={() => setShowPasswordReset(false)} />
    </Dialog>
  );
};

export default AuthDialog;
