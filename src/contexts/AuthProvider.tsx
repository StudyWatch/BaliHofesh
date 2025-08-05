import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  loading: boolean;
  initialLoad: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isAdmin: false,
  loading: true,
  initialLoad: false,
  signOut: async () => {},
});

// רשימת אדמינים מורשים (אימיילים)
const adminEmails = [
  'admin@example.com', // הוסף כאן את האימיילים של האדמינים
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(false);

  // בדיקת הרשאת אדמין
  const checkAdminStatus = async (currentUser: User): Promise<boolean> => {
    try {
      // בדיקה 1: האם האימייל ברשימת האדמינים
      if (adminEmails.includes(currentUser.email || '')) {
        console.log('🔐 Admin detected via email list:', currentUser.email);
        return true;
      }

      // בדיקה 2: האם יש role=admin בפרופיל
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', currentUser.id)
        .single();

      if (error) {
        console.warn('⚠️ Error fetching profile for admin check:', error);
        // אם אין פרופיל - לא אדמין
        return false;
      }

      const isAdminByRole = profile?.role === 'admin';
      console.log('🔐 Admin check via profile role:', isAdminByRole, profile?.role);
      
      return isAdminByRole;
    } catch (error) {
      console.error('❌ Error checking admin status:', error);
      return false;
    }
  };

  // פונקציית התנתקות מאובטחת
  const signOut = async () => {
    try {
      console.log('🚪 Signing out user...');
      
      // נקה מצב מקומי
      setUser(null);
      setSession(null);
      setIsAdmin(false);
      setLoading(false);
      
      // התנתק מ-Supabase
      await supabase.auth.signOut();
      
      // הפנה לדף הבית
      window.location.href = '/';
    } catch (error) {
      console.error('❌ Error during signout:', error);
      // גם אם יש שגיאה - הפנה הביתה
      window.location.href = '/';
    }
  };

  useEffect(() => {
    console.log('🔧 AuthProvider: Initializing secure authentication...');

    let mounted = true;

    const initializeAuth = async () => {
      try {
        setLoading(true);
        
        // קבל את המפגש הנוכחי
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Error getting initial session:', error);
          if (mounted) {
            setLoading(false);
            setInitialLoad(true);
          }
          return;
        }

        if (session?.user?.email_confirmed_at) {
          console.log('✅ Valid session found:', session.user.email);
          
          if (mounted) {
            setSession(session);
            setUser(session.user);
            
            // בדיקת הרשאות אדמין
            const adminStatus = await checkAdminStatus(session.user);
            setIsAdmin(adminStatus);
            
            console.log('🔐 User authenticated - Admin status:', adminStatus);
          }
        } else {
          console.log('ℹ️ No valid session or unconfirmed email');
          if (mounted) {
            setSession(null);
            setUser(null);
            setIsAdmin(false);
          }
        }
      } catch (error) {
        console.error('❌ Auth initialization error:', error);
      } finally {
        if (mounted) {
          setLoading(false);
          setInitialLoad(true);
        }
      }
    };

    // הפעל אתחול
    initializeAuth();

    // האזן לשינויי אימות
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('🔧 Auth state changed:', event, !!newSession);
        
        if (!mounted) return;

        if (event === 'SIGNED_IN' && newSession?.user?.email_confirmed_at) {
          console.log('✅ User signed in:', newSession.user.email);
          
          setSession(newSession);
          setUser(newSession.user);
          
          // דחה בדיקת אדמין כדי למנוע חסימות
          setTimeout(async () => {
            if (mounted) {
              try {
                const adminStatus = await checkAdminStatus(newSession.user);
                setIsAdmin(adminStatus);
                console.log('🔐 Admin status updated:', adminStatus);
              } catch (error) {
                console.error('❌ Error checking admin after sign in:', error);
                setIsAdmin(false);
              }
            }
          }, 100);
          
        } else if (event === 'SIGNED_OUT') {
          console.log('🚪 User signed out');
          setSession(null);
          setUser(null);
          setIsAdmin(false);
          
        } else if (event === 'TOKEN_REFRESHED' && newSession) {
          console.log('🔄 Token refreshed');
          setSession(newSession);
          setUser(newSession.user);
          // אל תשנה את isAdmin בזמן רענון טוקן
        }
        
        if (mounted) {
          setLoading(false);
        }
      }
    );

    // ניקוי
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const contextValue: AuthContextType = {
    user,
    session,
    isAdmin,
    loading,
    initialLoad,
    signOut,
  };

  console.log('🔧 AuthProvider render:', { 
    user: !!user, 
    isAdmin, 
    loading, 
    initialLoad,
    email: user?.email 
  });

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook ייעודי לגישה לאימות - זה הדרך היחידה לגשת לנתוני אימות!
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};