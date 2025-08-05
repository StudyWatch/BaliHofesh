import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthProvider';
import { Card } from '@/components/ui/card';
import { Shield, Loader2, AlertTriangle } from 'lucide-react';

interface AdminRouteProps {
  children: React.ReactNode;
}

/**
 * רכיב הגנה למסלולי אדמין
 * מאבטח גישה רק למשתמשים מורשים
 */
export const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { user, isAdmin, loading, initialLoad } = useAuth();

  // שלב 1: המתן לטעינה ראשונית
  if (loading || !initialLoad) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="p-8 text-center max-w-md">
          <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-primary" />
          <h1 className="text-xl font-bold mb-2 text-foreground">טוען מערכת הגנה...</h1>
          <p className="text-muted-foreground">בודק הרשאות גישה</p>
        </Card>
      </div>
    );
  }

  // שלב 2: משתמש לא מחובר - הפנה הביתה
  if (!user) {
    console.warn('⛔️ ניסיון גישה לאזור אדמין ללא התחברות');
    return <Navigate to="/" replace />;
  }

  // שלב 3: משתמש מחובר אבל לא אדמין - הצג הודעת שגיאה והפנה
  if (!isAdmin) {
    console.warn('⛔️ ניסיון גישה לא מורשה לאזור אדמין:', {
      userId: user.id,
      email: user.email,
      isAdmin: false
    });
    
    // הצג הודעה למשך שנייה ואז הפנה
    setTimeout(() => {
      window.location.href = '/';
    }, 2000);

    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="p-8 text-center max-w-md border-destructive/50">
          <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-destructive" />
          <h1 className="text-2xl font-bold mb-2 text-destructive">גישה נדחתה</h1>
          <p className="text-muted-foreground mb-4">
            אין לך הרשאות לגשת לאזור הניהול
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>מעביר לדף הבית...</span>
          </div>
        </Card>
      </div>
    );
  }

  // שלב 4: משתמש מחובר ואדמין - אפשר גישה
  console.log('✅ Admin access granted:', {
    userId: user.id,
    email: user.email,
    isAdmin: true
  });

  return <>{children}</>;
};