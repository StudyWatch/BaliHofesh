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

// ---- אייקוני מותג מדויקים (Google / Facebook) ----
const GOOGLE_ICON = (
  <svg viewBox="0 0 48 48" width="20" height="20" aria-hidden>
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.9 31.9 29.4 35 24 35c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 3l5.7-5.7C33.7 5 29.1 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c10.5 0 19.4-7.6 21-18v-6.5z"/>
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.9 16.1 19.1 13 24 13c3 0 5.7 1.1 7.8 3l5.7-5.7C33.7 5 29.1 3 24 3 15.7 3 8.6 7.7 6.3 14.7z"/>
    <path fill="#4CAF50" d="M24 45c5.3 0 10.1-1.8 13.9-4.9l-6.4-5c-2.1 1.4-4.9 2.3-7.5 2.3-5.4 0-9.9-3.6-11.5-8.6l-6.6 5.1C8.1 40.1 15.4 45 24 45z"/>
    <path fill="#1976D2" d="M45 24c0-1.5-.1-2.6-.4-3.8H24v8h11.9c-.6 3-2.1 5.3-4.4 7l6.4 5C41.7 36.7 45 30.9 45 24z"/>
  </svg>
);

const FACEBOOK_ICON = (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
    <path fill="#1877F2" d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.093 10.125 24v-8.437H7.078V12.07h3.047V9.413c0-3.007 1.792-4.668 4.534-4.668 1.313 0 2.687.235 2.687.235v2.953h-1.515c-1.493 0-1.956.93-1.956 1.887v2.25h3.328l-.532 3.493h-2.796V24C19.612 23.093 24 18.1 24 12.073z"/>
    <path fill="#fff" d="M16.953 15.563l.532-3.493h-3.328V9.82c0-.957.463-1.887 1.956-1.887h1.515V4.98s-1.374-.235-2.687-.235c-2.742 0-4.534 1.661-4.534 4.668v2.657H7.078v3.055h3.047V24h3.594v-8.437h2.796z"/>
  </svg>
);

// ---- אווטארים מוכנים ----
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

const AuthDialog: React.FC<AuthDialogProps> = ({ isOpen, onClose, defaultTab = 'login' }) => {
  const { dir } = useLanguage();
  const navigate = useNavigate();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>(defaultTab);
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

  // --- אתחול session + מאזין לאירועי auth ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session ?? null);
      setUser(session?.user ?? null);

      // אם נכנסנו (OAuth / לאחר אימות) – ניתוב לפי תפקיד
      if (event === 'SIGNED_IN' && session?.user) {
        const verified = !!session.user.email_confirmed_at || session.user.email?.endsWith('anonymous.user'); // אופציונלי
        if (!verified) {
          // ביטחון כפול: ננתק ונעביר למסך אימות
          await supabase.auth.signOut();
          localStorage.setItem('unverified_user', JSON.stringify({ email: session.user.email, id: session.user.id }));
          navigate('/email-verification');
          onClose();
          return;
        }
        localStorage.removeItem('unverified_user');
        onClose();
        checkUserRoleAndRedirect(session.user.id);
      }

      // אירוע הרשמה – לא להשאיר סשן תלוי
      if (event === 'SIGNED_UP') {
        navigate('/email-verification');
        onClose();
      }

      if (event === 'SIGNED_OUT') {
        setUser(null);
        setSession(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [onClose, navigate]);

  // תצוגה מקדימה לאווטאר
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

    const { error } = await supabase.storage.from('avatars').upload(filePath, customAvatarFile, { upsert: true });
    if (error) {
      toast.error("שגיאה בהעלאת תמונה: " + error.message);
      return null;
    }
    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
    return data?.publicUrl || null;
    // מומלץ לשמור גם ב-profiles.avatar_url כבר אחרי signUp (מבוצע בהמשך)
  };

  // --- התחברות בסיסמה ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password
      });

      if (error) {
        if (error.message?.toLowerCase().includes('invalid')) {
          toast.error('אימייל או סיסמה שגויים');
        } else if (error.message?.toLowerCase().includes('not confirmed')) {
          localStorage.setItem('unverified_user', JSON.stringify({ email: loginData.email }));
          toast.message('כמעט שם', { description: 'אנא אשר/י את כתובת האימייל שנשלחה אליך' });
          navigate('/email-verification');
          onClose();
        } else {
          toast.error('שגיאה בהתחברות: ' + error.message);
        }
      }
      // אם אין שגיאה – onAuthStateChange יעשה את הניווט
    } finally {
      setIsLoading(false);
    }
  };

  // --- הרשמה + הפניה מאובטחת למסך אימות ---
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (signupData.password !== signupData.confirmPassword) {
        toast.error('הסיסמאות לא תואמות');
        return;
      }
      if (signupData.password.length < 6) {
        toast.error('הסיסמה חייבת להיות לפחות 6 תווים');
        return;
      }
      if (!agreedToTerms) {
        toast.error("יש לאשר את תנאי השימוש כדי להירשם");
        return;
      }

      const redirectUrl = `${window.location.origin}/auth/callback`;
      const { data, error } = await supabase.auth.signUp({
        email: signupData.email,
        password: signupData.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: { name: signupData.name, phone: signupData.phone }
        }
      });

      if (error || !data?.user) {
        if (error?.message?.toLowerCase().includes('already registered') || error?.message?.toLowerCase().includes('exists') || error?.status === 400) {
          toast.error('האימייל הזה כבר רשום במערכת');
        } else if (error?.message) {
          toast.error('שגיאה בהרשמה: ' + error.message);
        } else {
          toast.error('שגיאה לא צפויה, נסה שוב או צור קשר.');
        }
        return;
      }

      // אווטאר (אופציונלי)
      if (customAvatarFile || selectedAvatar) {
        const avatarUrl = await uploadAvatar(data.user.id);
        if (avatarUrl) await supabase.from('profiles').update({ avatar_url: avatarUrl }).eq('id', data.user.id);
      }

      // ברוכים הבאים (התראה מקומית)
      await createWelcomeNotification(data.user.id, dir === 'rtl' ? 'he' : 'en');

      // כפול-בטוח: ננתק סשן, נשמור unverified וננתב למסך אימות
      await supabase.auth.signOut();
      localStorage.setItem('unverified_user', JSON.stringify({ email: signupData.email, id: data.user.id }));

      toast.success('נשלח אימייל אימות. בדקו את תיבת הדואר (כולל ספאם).');
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

  // --- התחברות חברתית (Google/Facebook) עם redirect תקין ---
  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    setIsLoading(true);
    const redirectTo =
      process.env.NODE_ENV === 'development'
        ? 'http://localhost:3000/auth/callback'
        : 'https://balihofesh.vercel.app/auth/callback';

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo }
    });

    if (error) {
      toast.error(`שגיאה בהתחברות עם ${provider === 'google' ? 'Google' : 'Facebook'}: ` + error.message);
      setIsLoading(false);
    }
    // החזרה תגיע ל-/auth/callback ושם נבצע exchangeCodeForSession
  };

  const AvatarPicker = () => (
    <div className="space-y-1 mb-2">
      <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-200">
        תמונת פרופיל (לא חובה)
        <span className="ml-1 text-zinc-400 dark:text-zinc-500 cursor-pointer" title="התמונה תופיע בפרופיל ובחיפוש שותפי לימוד. ניתן לבחור/להעלות/להשאיר ריק.">
          <Info className="inline w-3 h-3" />
        </span>
      </label>
      <div className="flex gap-2 items-center flex-wrap mb-1">
        {AVATAR_CHOICES.map(choice => (
          <button
            key={choice.label}
            type="button"
            className={`w-12 h-12 rounded-full border-2 bg-white dark:bg-zinc-900 p-0.5 shadow transition
              ${selectedAvatar === choice.value ? 'ring-2 ring-purple-500 border-purple-400 scale-110' : 'border-zinc-300 dark:border-zinc-700'}
              hover:scale-105 hover:border-purple-300`}
            onClick={() => { setSelectedAvatar(choice.value); setCustomAvatarFile(null); }}
            title={choice.label}
          >
            <img src={choice.img} alt={choice.label} className="w-full h-full rounded-full object-cover" />
          </button>
        ))}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-12 h-12 rounded-full border-2 border-zinc-300 dark:border-zinc-700 p-2 bg-zinc-50 dark:bg-zinc-800 hover:bg-blue-50 dark:hover:bg-zinc-700 flex items-center justify-center"
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
            if (file) { setCustomAvatarFile(file); setSelectedAvatar(''); }
          }}
        />
      </div>
      <div className="flex items-center gap-3">
        <img src={avatarPreview} alt="תצוגת אווטאר" className="w-14 h-14 rounded-full border border-zinc-300 dark:border-zinc-700 shadow" />
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          אפשר להעלות תמונה, לבחור מוכנה או להשאיר ברירת מחדל. תמיד ניתן לשנות בהמשך.
        </span>
      </div>
    </div>
  );

  // --- כשהמשתמש כבר מחובר ומאומת ---
  if (user && user.email_confirmed_at) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="w-full max-w-sm sm:max-w-md mx-auto bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 shadow-xl" dir={dir}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg text-zinc-900 dark:text-zinc-100">
              <User className="w-5 h-5" />
              הפרופיל שלי
            </DialogTitle>
            <DialogDescription className="sr-only">פרופיל המשתמש המחובר</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <User className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-lg">{user.user_metadata?.name || 'משתמש'}</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-300 break-words">{user.email}</p>
            </div>
            <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <Button onClick={handleLogout} variant="outline" className="w-full hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-700">
                התנתק
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // --- דיאלוג התחברות/הרשמה ---
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="w-full max-w-sm sm:max-w-md mx-auto bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 shadow-xl p-4 sm:p-6 max-h-[90vh] overflow-y-auto"
        dir={dir}
      >
        <DialogHeader className="space-y-3">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto">
            <span className="text-white font-bold text-xl">B</span>
          </div>
          <DialogTitle className="text-center text-zinc-900 dark:text-zinc-100 font-bold text-xl">כניסה למערכת</DialogTitle>
          <DialogDescription className="text-center text-zinc-600 dark:text-zinc-300 text-sm">
            התחבר או הירשם כדי לגשת למערכת
          </DialogDescription>
        </DialogHeader>

        {/* --- SOCIAL BUTTONS --- */}
        <div className="w-full flex flex-col gap-2 mb-2">
          <Button
            type="button"
            onClick={() => handleSocialLogin('google')}
            className="w-full flex items-center gap-3 justify-center bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-100 font-semibold"
            disabled={isLoading}
          >
            {GOOGLE_ICON}
            התחבר עם Google
          </Button>
          <Button
            type="button"
            onClick={() => handleSocialLogin('facebook')}
            className="w-full flex items-center gap-3 justify-center bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-100 font-semibold"
            disabled={isLoading}
          >
            {FACEBOOK_ICON}
            התחבר עם Facebook
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={v => setActiveTab(v as 'login' | 'signup')} className="w-full mt-4">
          <TabsList className="grid w-full grid-cols-2 bg-zinc-100 dark:bg-zinc-800 h-10 rounded-md">
            <TabsTrigger value="login" className="text-zinc-700 dark:text-zinc-200 text-sm">התחברות</TabsTrigger>
            <TabsTrigger value="signup" className="text-zinc-700 dark:text-zinc-200 text-sm">הרשמה</TabsTrigger>
          </TabsList>

          {/* --- LOGIN --- */}
          <TabsContent value="login" className="space-y-4 mt-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-200">
                  <Mail className="w-4 h-4" />
                  אימייל
                </label>
                <Input
                  type="email"
                  required
                  value={loginData.email}
                  onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="your@email.com"
                  className="w-full border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus:border-blue-500 text-sm h-10 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500"
                />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-200">
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
                    className="w-full border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus:border-blue-500 pr-10 text-sm h-10 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
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
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                >
                  שכחת סיסמה?
                </Button>
              </div>
            </form>
          </TabsContent>

          {/* --- SIGNUP --- */}
          <TabsContent value="signup" className="space-y-4 mt-6">
            <form onSubmit={handleSignup} className="space-y-4">
              <AvatarPicker />

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-200">
                  <User className="w-4 h-4" />
                  שם מלא
                </label>
                <Input
                  required
                  value={signupData.name}
                  onChange={(e) => setSignupData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="הכנס את שמך המלא"
                  className="w-full border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus:border-purple-500 text-sm h-10 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-200">
                  <Mail className="w-4 h-4" />
                  אימייל
                </label>
                <Input
                  type="email"
                  required
                  value={signupData.email}
                  onChange={(e) => setSignupData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="your@email.com"
                  className="w-full border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus:border-purple-500 text-sm h-10 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-200">
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
                    className="w-full border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus:border-purple-500 pr-10 text-sm h-10 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-200">
                  <Lock className="w-4 h-4" />
                  אימות סיסמה
                </label>
                <Input
                  type={showPassword ? "text" : "password"}
                  required
                  value={signupData.confirmPassword}
                  onChange={(e) => setSignupData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="הזן שוב את הסיסמה"
                  className="w-full border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus:border-purple-500 text-sm h-10 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500"
                />
              </div>

              {/* --- טלפון (אופציונלי) --- */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-200">
                  טלפון (אופציונלי)
                  <span className="ml-1 text-zinc-400 dark:text-zinc-500 cursor-pointer" title="הטלפון לא יופיע בפרופיל; ניתן לשיתוף רק לפי בחירה.">
                    <Info className="inline w-3 h-3" />
                  </span>
                </label>
                <Input
                  type="tel"
                  value={signupData.phone}
                  onChange={(e) => setSignupData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="05x-xxxxxxx"
                  className="w-full border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus:border-purple-500 text-sm h-10 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500"
                />
                <div className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                  הטלפון שלך לעולם לא יופיע בפרופיל – אפשר לשתף אותו רק אם תבחר/י, במפגשי לימוד.
                </div>
              </div>

              {/* --- תנאי שימוש --- */}
              <div className="space-y-2 mt-2">
                <label className="flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-200">
                  <Checkbox
                    id="agree"
                    checked={agreedToTerms}
                    onCheckedChange={val => setAgreedToTerms(Boolean(val))}
                    required
                  />
                  <span>
                    אני מאשר/ת שקראתי את <a href="/terms" target="_blank" className="underline text-blue-600 dark:text-blue-400">תנאי השימוש</a>
                    <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                      השירות ניתן בגרסת פיילוט; ייתכנו תקלות. השימוש באחריותך בלבד.
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
