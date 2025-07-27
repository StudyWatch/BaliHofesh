import React, { createContext, useContext, useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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

// דפים קיימים
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

export const CartContext = createContext({});
export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cart, setCart] = useState<any[]>([]);
  return (
    <CartContext.Provider value={{ cart, setCart }}>
      {children}
    </CartContext.Provider>
  );
};

import { WishlistProvider } from "@/contexts/WishlistContext";

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
          console.error("Session error:", error);
          setLoading(false);
          return;
        }
        if (session?.user?.email_confirmed_at) {
          setSession(session);
          setUser(session.user);
          const adminEmails = ['admin@study.com', 'manager@study.com'];
          setIsAdmin(adminEmails.includes(session.user.email || ""));
        } else {
          setSession(null);
          setUser(null);
          setIsAdmin(false);
        }
        setLoading(false);
      } catch (error) {
        if (!mounted) return;
        console.error("Auth initialization error:", error);
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
          const adminEmails = ['admin@study.com', 'manager@study.com'];
          setIsAdmin(adminEmails.includes(session.user.email || ""));
        } else if (event === "SIGNED_OUT") {
          setSession(null);
          setUser(null);
          setIsAdmin(false);
        } else if (event === "TOKEN_REFRESHED" && session) {
          setSession(session);
          setUser(session.user);
          const adminEmails = ['admin@study.com', 'manager@study.com'];
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

  if (loading || isTutor === null)
    return (
      <div className="flex justify-center items-center h-screen bg-white/80">
        <div className="animate-spin w-12 h-12 border-4 border-purple-400 border-t-transparent rounded-full" />
      </div>
    );

  return isTutor ? <>{children}</> : <Navigate to="/" />;
};

const StoreProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <CartProvider>
    <WishlistProvider>
      {children}
    </WishlistProvider>
  </CartProvider>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <NotificationOrchestrator />
          <BrowserRouter>
            <div className="min-h-screen flex flex-col">
              <main id="main-root" className="flex-1 min-h-[70vh]">
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/admin" element={<Admin />} />
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
                  <Route path="/tutor-dashboard" element={
                    <TutorRoute>
                      <TutorDashboard />
                    </TutorRoute>
                  } />
                  {/* דפים חנות והודעות בקרוב */}
                  <Route path="/store" element={<ComingSoon />} />
                  <Route path="/wishlist" element={<ComingSoon title="רשימת המשאלות תיפתח בקרוב!" />} />
                  <Route path="/shopping-cart" element={<ComingSoon title="העגלה תיפתח בקרוב!" />} />
                  {/* דף תנאי שימוש */}
                  <Route path="/terms" element={<TermsOfUse />} />
                  <Route path="/tutors-terms" element={<TutorTermsPage />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
              <ScrollToTopButton />
              <footer className="text-center text-xs text-gray-500 py-2 bg-gray-50 flex flex-col sm:flex-row justify-center gap-2">
                <a
                  href="/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-blue-600 hover:text-blue-800"
                >
                  תנאי שימוש
                </a>
                <span className="mx-2 hidden sm:inline">|</span>
                <a
                  href="/tutors-terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-green-600 hover:text-green-800"
                >
                  תנאי שימוש למורים פרטיים
                </a>
              </footer>
              <AccessibilityButton />
            </div>
          </BrowserRouter>
        </TooltipProvider>
      </LanguageProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
