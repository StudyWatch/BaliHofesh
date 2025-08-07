import React, { useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
import FeedbackPage from "./pages/FeedbackPage";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/contexts/LanguageContext";
import AccessibilityButton from "@/components/AccessibilityButton";
import NotificationOrchestrator from "@/components/notifications/NotificationOrchestrator";
import ScrollToTopButton from "@/components/ui/ScrollToTopButton";
import { AuthProvider } from "@/contexts/AuthProvider"; // ← ייבוא נכון!
import { AdminRoute } from "@/components/AdminRoute";   // ← הגנה על אדמין

// -- ספקים נוספים --
export const CartContext = React.createContext({});
export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cart, setCart] = React.useState<any[]>([]);
  return (
    <CartContext.Provider value={{ cart, setCart }}>
      {children}
    </CartContext.Provider>
  );
};

const queryClient = new QueryClient();

// -- הגנה על דשבורד למורים פרטיים בלבד --
const TutorRoute = ({ children }: { children: React.ReactNode }) => {
  // אפשר לייעל – אבל השארנו כבקשתך
  const { user } = React.useContext<any>(CartContext); // אם יש לך useAuth אמיתי - ייבא אותו!
  const [isTutor, setIsTutor] = React.useState<boolean | null>(null);

  React.useEffect(() => {
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
    checkTutor();
  }, [user]);

  if (isTutor === null) return null;
  if (!isTutor) return <Navigate to="/" />;
  return <>{children}</>;
};

// -- ספקים לכל החנות --
const StoreProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <CartProvider>
    <WishlistProvider>{children}</WishlistProvider>
  </CartProvider>
);

/* =========================
   תחזוקה + סיסמה (מופעל ע"י ENV)
   ========================= */
const MaintenanceAndPassword = ({ children }: { children: React.ReactNode }) => {
  // שליטה דרך משתני סביבה (Vercel → Project → Settings → Environment Variables)
  const underMaintenance =
    (import.meta.env.VITE_MAINTENANCE_ENABLED ?? "false").toString() === "true";
  const secretPassword = (import.meta.env.VITE_PREVIEW_PASSWORD as string) || "A1m2i3r4";

  // אם תחזוקה כבויה – אל תחסום כלום (חשוב לאימות FlexOffers/בוטים)
  if (!underMaintenance) {
    return <>{children}</>;
  }

  const [authorized, setAuthorized] = React.useState<boolean | null>(null);
  const [password, setPassword] = React.useState("");

  React.useEffect(() => {
    const saved = localStorage.getItem("preview_password");
    if (saved === secretPassword) setAuthorized(true);
    else setAuthorized(false);
  }, [secretPassword]);

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

  if (authorized === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-xl text-gray-500 dark:text-gray-300">טוען...</div>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div
        dir="rtl"
        className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900 text-center px-4"
      >
        <form
          onSubmit={handleSubmit}
          className="max-w-md space-y-6 w-full bg-white dark:bg-gray-800 shadow-xl rounded-xl p-8"
          autoComplete="off"
        >
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
            🚧 האתר בשיפוצים
          </h1>
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
          <div className="text-xs text-gray-400 mt-2">
            לבעיות, פנה למנהל האתר
          </div>
        </form>
      </div>
    );
  }
  return <>{children}</>;
};

// -- אין מעבר אוטומטי – Index רגיל --
const IndexWithAdminRedirect = () => <Index />;

// -- האפליקציה הראשית --
const App = () => {
  useEffect(() => {
    console.log("🚦 [App] rendered");
  }, []);
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LanguageProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <NotificationOrchestrator />
            <BrowserRouter>
              <MaintenanceAndPassword>
                <StoreProviders>
                  <main id="main-root" className="flex-1 min-h-[70vh]">
                    <Routes>
                      <Route path="/" element={<IndexWithAdminRedirect />} />
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
                      <Route path="/feedback" element={<FeedbackPage />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </main>
                  <ScrollToTopButton />
                  <footer className="text-center text-xs text-gray-500 py-2 bg-gray-50 flex flex-col sm:flex-row justify-center gap-2">
                    <a
                      href="/terms"
                      className="underline text-blue-600 hover:text-blue-800"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      תנאי שימוש
                    </a>
                    <span className="mx-2 hidden sm:inline">|</span>
                    <a
                      href="/tutors-terms"
                      className="underline text-green-600 hover:text-green-800"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      תנאי שימוש למורים פרטיים
                    </a>
                  </footer>
                  <AccessibilityButton />
                </StoreProviders>
              </MaintenanceAndPassword>
            </BrowserRouter>
          </TooltipProvider>
        </LanguageProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
