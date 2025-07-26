import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Mail, ArrowRight, RefreshCw, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const EmailVerificationPage = () => {
  const navigate = useNavigate();
  const [isResending, setIsResending] = useState(false);
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('unverified_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const handleResendVerification = async () => {
    if (!user?.email) {
      toast.error('לא נמצא מייל לשליחה מחדש');
      return;
    }

    setIsResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (error) {
        toast.error('שגיאה בשליחת מייל אימות: ' + error.message);
      } else {
        toast.success('מייל אימות נשלח מחדש! בדוק את תיבת הדואר שלך.');
      }
    } catch (error: any) {
      toast.error('שגיאה בשליחת מייל אימות');
    } finally {
      setIsResending(false);
    }
  };

  const handleBackToLogin = () => {
    localStorage.removeItem('unverified_user');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={handleBackToLogin}
            className="flex items-center gap-2 text-gray-700 hover:text-purple-700"
          >
            <ArrowRight className="w-4 h-4" />
            חזור להתחברות
          </Button>
        </div>

        <Card className="bg-white/80 backdrop-blur-md border border-purple-200 shadow-2xl rounded-2xl">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Mail className="text-white w-8 h-8" />
            </div>
            <CardTitle className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-700">
              אמת את כתובת המייל שלך
            </CardTitle>
            <p className="text-gray-700 mt-3 text-sm">
              שלחנו אליך מייל עם קישור לאימות החשבון שלך
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <h3 className="font-semibold text-purple-800 mb-2">מה עליך לעשות:</h3>
              <ol className="text-sm text-purple-700 space-y-1 list-decimal list-inside">
                <li>בדוק את תיבת הדואר שלך (כולל תיקיית הספאם)</li>
                <li>לחץ על הקישור שקיבלת לאימות החשבון</li>
                <li>חזור לפלטפורמה והתחבר מחדש</li>
              </ol>
            </div>

            {user?.email && (
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  מייל נשלח אל: <span className="font-medium text-purple-700">{user.email}</span>
                </p>
              </div>
            )}

            <Button
              onClick={handleResendVerification}
              disabled={isResending}
              className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700"
            >
              {isResending ? (
                <>
                  <RefreshCw className="w-4 h-4 ml-2 animate-spin" />
                  שולח מחדש...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 ml-2" />
                  שלח מייל אימות מחדש
                </>
              )}
            </Button>

            <div className="text-center">
              <Button
                variant="link"
                onClick={handleBackToLogin}
                className="text-sm text-gray-600 hover:text-purple-700"
              >
                יש לך חשבון מאומת? התחבר כאן
              </Button>
            </div>

            <div className="text-center text-xs text-gray-400 pt-2">
              <Sparkles className="inline w-4 h-4 text-purple-400 mr-1" />
              הפלטפורמה שלנו שואפת להפוך את הלמידה לחוויה חכמה, נעימה ומעוצבת 💜
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmailVerificationPage;
