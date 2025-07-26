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

// דפים קיימים
import Index from "./pages/Index";
import Admin from "./pages/Admin";
import Institution from "./pages/Institution";
import Course from "./pages/Course";
import Universities from "./pages/Universities";
import Tutors from "./pages/Tutors";
import TutorProfile from "./pages/TutorProfile";
import Tips from "./pages/Tips";
import Store from "./pages/Store";
import WishlistPage from "./pages/Wishlist";        // ✅ חדש
import ShoppingCartPage from "./pages/ShoppingCart"; // ✅ חדש
import Login from "./pages/Login";
import MyCourses from "./pages/MyCourses";
import Profile from "./pages/Profile";
import ResetPassword from "./pages/ResetPassword";
import EmailVerificationPage from "./components/auth/EmailVerificationPage";
import NotFound from "./pages/NotFound";
import TutorDashboard from "@/components/tutors/TutorDashboard";

// Providers ל־Store בלבד
import { WishlistProvider } from "@/contexts/WishlistContext";
import { CartProvider } from "@/contexts/CartContext"; // אם יש לך כזה

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
      window.location.href = "/";
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
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
        console.error("Auth initialization error:", error);
        setLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
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

    return () => subscription.unsubscribe();
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

// ✅ כאן רק עמודי STORE (כולל Wishlist/Cart) נעטפים בפרוביידר!
//    בכל שאר האתר — לא יהיה context ללב/עגלה בכלל.
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
            <Routes>
              {/* דפים רגילים */}
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
              <Route path="/tutor-dashboard" element={
                <TutorRoute>
                  <TutorDashboard />
                </TutorRoute>
              } />

              {/* דפי חנות – עטופים בפרוביידר */}
              <Route path="/store" element={
                <StoreProviders>
                  <Store />
                </StoreProviders>
              } />
              <Route path="/wishlist" element={
                <StoreProviders>
                  <WishlistPage />
                </StoreProviders>
              } />
              <Route path="/shopping-cart" element={
                <StoreProviders>
                  <ShoppingCartPage />
                </StoreProviders>
              } />

              {/* דף 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <AccessibilityButton />
          </BrowserRouter>
        </TooltipProvider>
      </LanguageProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
