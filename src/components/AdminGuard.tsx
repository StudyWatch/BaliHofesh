import React from 'react';
import { useAuth } from '@/contexts/AuthProvider';
import { Card } from '@/components/ui/card';
import { Shield, Loader2 } from 'lucide-react';

interface AdminGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * רכיב עוטף לבדיקת הרשאות אדמין - לשימוש ברכיבים קטנים
 * למען הבטחה נוספת מעבר ל-AdminRoute
 */
export const AdminGuard: React.FC<AdminGuardProps> = ({ 
  children, 
  fallback = null 
}) => {
  const { user, isAdmin, loading, initialLoad } = useAuth();

  // עדיין טוען - הצג טעינה
  if (loading || !initialLoad) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">בודק הרשאות...</span>
        </div>
      </div>
    );
  }

  // אם לא מחובר או לא אדמין - הצג fallback או הסתר
  if (!user || !isAdmin) {
    console.warn('🔒 AdminGuard: Access denied - rendering fallback');
    return <>{fallback}</>;
  }

  // אדמין מורשה - הצג את התוכן
  return <>{children}</>;
};