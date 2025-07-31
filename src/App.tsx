// App.tsx

import React, { createContext, useContext, useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/contexts/LanguageContext";
import AccessibilityButton from "@/components/AccessibilityButton";
import NotificationOrchestrator from "@/components/notifications/NotificationOrchestrator";
import ScrollToTopButton from "@/components/ui/ScrollToTopButton";

import Index from "./pages/Index";
import Admin from "./pages/Admin";
import Institution from "./pages/Institution";
import Course from "./pages/Course";
import Universities from "./pages/Universities";
import Tutors from "./pages/Tutors";
import TutorProfile from "./pages/TutorProfile";
import Tips from "./pages/Tips";
import Login from "./pages/Login";
import MyCourses from "./pages/MyCourses";
import Profile from "./pages/Profile";
import ResetPassword from "./pages/ResetPassword";
import EmailVerificationPage from "./components/auth/EmailVerificationPage";
import NotFound from "./pages/NotFound";
import TutorDashboard from "@/components/tutors/TutorDashboard";
import TermsOfUse from "./pages/TermsOfUse";
import TutorTermsPage from "./pages/TutorTermsPage";
import AuthCallbackHandler from "@/components/auth/AuthCallbackHandler";
import ComingSoon from "@/components/ComingSoon";
import { WishlistProvider } from "@/contexts/WishlistContext";

// --- סל קניות ---
export const CartContext = createContext({});
export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cart, setCart] = useState<any[]>([]);
  return (
    <CartContext.Provider value={{ cart, setCart }}>
      {children}
    </CartContext.Provider>
  );
};

// --- Auth context ---
interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
}
const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  isAdmin: false,
  signOut: async () => {},
});
export const useAuth = () => useContext(AuthContext);

const queryClient = new QueryClient();

// --- ספק הרשאות ואימות ---
const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
      window.location.pathname = "/";
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  useEffect(() => {
    let mounted = true;
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (!mounted) return;
        if (error) {
          setLoading(false);
          return;
        }
        if (session?.user?.email_confirmed_at) {
          setSession(session);
          setUser(session.user);
          const adminEmails = ['timor34@gmail.com', 'manager@study.com'];
          setIsAdmin(adminEmails.includes(session.user.email || ""));
        } else {
          setSession(null);
          setUser(null);
          setIsAdmin(false);
        }
        setLoading(false);
      } catch (error) {
        if (!mounted) return;
        setLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        if (event === "SIGNED_IN" && session?.user?.email_confirmed_at) {
          setSession(session);
          setUser(session.user);
          const adminEmails = ['timor34@gmail.com', 'manager@study.com'];
          setIsAdmin(adminEmails.includes(session.user.email || ""));
        } else if (event === "SIGNED_OUT") {
          setSession(null);
          setUser(null);
          setIsAdmin(false);
        } else if (event === "TOKEN_REFRESHED" && session) {
          setSession(session);
          setUser(session.user);
          const adminEmails = ['timor34@gmail.com', 'manager@study.com'];
          setIsAdmin(adminEmails.includes(session.user.email || ""));
        }
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, loading, isAdmin, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

// -- הגנה על דשבורד למורים פרטיים בלבד --
const TutorRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const [isTutor, setIsTutor] = useState<boolean | null>(null);

  useEffect(() => {
    const checkTutor = async () => {
      if (!user) {
        setIsTutor(false);
        return;
      }
      const { data, error } = await supabase
        .from("tutors")
        .select("id")
        .eq("id", user.id)
        .single();
      setIsTutor(!!data && !error);
    };

    if (!loading) {
      checkTutor();
    }
  }, [user, loading]);

  if (loading || isTutor === null) {
    return (
      <div className="flex justify-center items-center h-screen bg-white/80">
        <div className="animate-spin w-12 h-12 border-4 border-purple-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isTutor) {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
};

// -- הגנה לאדמין לפי אימייל בלבד --
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-white/80">
        <div className="animate-spin w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
};

// -- ספקים לכל החנות --
const StoreProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <CartProvider>
    <WishlistProvider>
      {children}
    </WishlistProvider>
  </CartProvider>
);

// -- קומפוננטת תחזוקה וסיסמה -- //
const MaintenanceAndPassword = ({ children }: { children: React.ReactNode }) => {
  // כל ההוקים למעלה לפי הכללים!
  const underMaintenance = true; // לשנות ל-false אם רוצים להוריד הגנה
  const secretPassword = "A1m2i3r4"; // לשנות לסיסמה שלך
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("preview_password");
    if (saved === secretPassword) setAuthorized(true);
    else setAuthorized(false);
  }, []);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (password === secretPassword) {
      localStorage.setItem("preview_password", password);
      setAuthorized(true);
    } else {
      alert("סיסמה שגויה");
      setPassword("");
    }
  };

  // כל התנאים רק אחרי כל ה-hooks!
  if (authorized === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-xl text-gray-500 dark:text-gray-300">טוען...</div>
      </div>
    );
  }

  if (underMaintenance && !authorized) {
    return (
      <div dir="rtl" className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900 text-center px-4">
        <form
          onSubmit={handleSubmit}
          className="max-w-md space-y-6 w-full bg-white dark:bg-gray-800 shadow-xl rounded-xl p-8"
          autoComplete="off"
        >
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">🚧 האתר בשיפוצים</h1>
          <p className="text-gray-600 dark:text-gray-300 text-lg mb-4">
            לצפייה יש להזין סיסמה מורכבת.<br />
            האתר פתוח כעת רק לבדיקה.
          </p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 rounded border border-gray-300 dark:border-gray-600 text-lg"
            placeholder="הכנס סיסמה"
            autoFocus
          />
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold text-lg hover:bg-blue-700 transition"
          >
            אישור
          </button>
          <div className="text-xs text-gray-400 mt-2">לבעיות, פנה למנהל האתר</div>
        </form>
      </div>
    );
  }

  // הכל רגיל (כל האתר וכל ה-providers)
  return <>{children}</>;
};

// -- ה-Wrapper של האפליקציה עם הפניה לאדמין --
const AppWrapper = () => {
  const navigate = useNavigate();
  const { isAdmin, loading } = useAuth();

  useEffect(() => {
    const currentPath = window.location.pathname;
    if (!loading && isAdmin && currentPath === "/") {
      setTimeout(() => {
        navigate("/admin");
      }, 100);
    }
  }, [isAdmin, loading, navigate]);

  return (
    <div className="min-h-screen flex flex-col">
      <main id="main-root" className="flex-1 min-h-[70vh]">
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
          <Route path="/courses" element={<Universities />} />
          <Route path="/universities" element={<Universities />} />
          <Route path="/institution/:id" element={<Institution />} />
          <Route path="/course/:id" element={<Course />} />
          <Route path="/tutors" element={<Tutors />} />
          <Route path="/tutor/:id" element={<TutorProfile />} />
          <Route path="/tips" element={<Tips />} />
          <Route path="/login" element={<Login />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/email-verification" element={<EmailVerificationPage />} />
          <Route path="/my-courses" element={<MyCourses />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/auth/callback" element={<AuthCallbackHandler />} />
          <Route path="/tutor-dashboard" element={<TutorRoute><TutorDashboard /></TutorRoute>} />
          <Route path="/store" element={<ComingSoon />} />
          <Route path="/wishlist" element={<ComingSoon title="רשימת המשאלות תיפתח בקרוב!" />} />
          <Route path="/shopping-cart" element={<ComingSoon title="העגלה תיפתח בקרוב!" />} />
          <Route path="/terms" element={<TermsOfUse />} />
          <Route path="/tutors-terms" element={<TutorTermsPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <ScrollToTopButton />

      <footer className="text-center text-xs text-gray-500 py-2 bg-gray-50 flex flex-col sm:flex-row justify-center gap-2">
        <a href="/terms" className="underline text-blue-600 hover:text-blue-800" target="_blank" rel="noopener noreferrer">
          תנאי שימוש
        </a>
        <span className="mx-2 hidden sm:inline">|</span>
        <a href="/tutors-terms" className="underline text-green-600 hover:text-green-800" target="_blank" rel="noopener noreferrer">
          תנאי שימוש למורים פרטיים
        </a>
      </footer>

      <AccessibilityButton />
    </div>
  );
};

// -- האפליקציה הראשית --
const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <NotificationOrchestrator />
          <BrowserRouter>
            <MaintenanceAndPassword>
              <AppWrapper />
            </MaintenanceAndPassword>
          </BrowserRouter>
        </TooltipProvider>
      </LanguageProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
