import React, { useState, useEffect, Suspense } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/App';
import { useUserProfile } from '@/hooks/useProfile';
import { useSystemNotifications } from '@/hooks/useSystemNotifications';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  User,
  LogOut,
  Bell,
  Menu,
  X,
  Home,
  BookOpen,
  GraduationCap,
  Lightbulb,
  ShoppingCart,
  ChevronDown,
  Moon,
  Sun,
} from 'lucide-react';
import AuthDialog from '@/components/auth/AuthDialog';
import MobileMenu from './MobileMenu';

const NotificationSystem = React.lazy(() => import('@/components/notifications/NotificationSystem'));

const Header: React.FC = () => {
  const navigate = useNavigate();
  const { dir, language, setLanguage } = useLanguage();
  const { user, loading, signOut } = useAuth();
  const { data: notifications = [] } = useSystemNotifications();
  const unreadCount = notifications.filter(n => !n.is_read).length;
  const { data: profile } = useUserProfile();

  // זיהוי אם המשתמש הוא גם מורה
  const isTutor = profile?.role === 'tutor' || profile?.role === 'admin' || profile?.is_tutor;

  const [searchQuery, setSearchQuery] = useState('');
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // detect mobile
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // מצב לילה עם שמירה ל-localStorage
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      if (localStorage.getItem('darkMode')) {
        return localStorage.getItem('darkMode') === 'true';
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
  }, [isDarkMode]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/courses?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const menuItems = [
    { href: '/', label: dir === 'rtl' ? 'דף הבית' : 'Home', icon: Home },
    { href: '/courses', label: dir === 'rtl' ? 'קורסים' : 'Courses', icon: BookOpen },
    { href: '/tutors', label: dir === 'rtl' ? 'מורים פרטיים' : 'Tutors', icon: GraduationCap },
    { href: '/tips', label: dir === 'rtl' ? 'טיפים' : 'Tips', icon: Lightbulb },
    { href: '/store', label: dir === 'rtl' ? 'החנות' : 'Store', icon: ShoppingCart },
  ];

  // Loading State
  if (loading) {
    return (
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center min-w-0 select-none group">
              <span className="bali-logo-dynamic skeleton-loader" style={{ minWidth: 140, minHeight: 40 }} />
              <div className="hidden sm:flex flex-col mr-4 min-w-0">
                <span className="text-xs text-gray-500 truncate">האוניברסיטה הפתוחה</span>
                <Badge variant="secondary" className="text-xs mt-1">בטא</Badge>
              </div>
            </div>
            <div className="animate-pulse bg-gray-200 h-8 w-24 rounded"></div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-white dark:bg-[#181f32] shadow-sm border-b border-gray-200 dark:border-[#232949] sticky top-0 z-40 transition-colors">
      <div className="container mx-auto px-2 sm:px-4">
        <div className="flex items-center justify-between h-16">
          {/* לוגו-טקסט דינמי */}
          <Link to="/" className="flex items-center min-w-0 select-none group" tabIndex={0}>
            <span
              className="
                bali-logo-dynamic
                px-4 py-2 rounded-2xl font-bold
                text-base xs:text-lg md:text-2xl
                tracking-tight text-white
                shadow-xl border-2 border-white/40
                transition-all duration-400
                group-hover:scale-105 group-hover:shadow-2xl
                cursor-pointer select-none
              "
              aria-label="באלי חופש - דף הבית"
            >
              באלי חופש
            </span>
            <div className="hidden sm:flex flex-col mr-4 min-w-0">
              <span className="text-xs text-gray-500 truncate">האוניברסיטה הפתוחה</span>
              <Badge variant="secondary" className="text-xs mt-1">בטא</Badge>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-6 space-x-reverse">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className="flex items-center space-x-1 space-x-reverse text-gray-700 dark:text-gray-100 hover:text-primary dark:hover:text-indigo-300 transition-colors duration-200 px-3 py-2 rounded-md hover:bg-gray-50 dark:hover:bg-[#232949]"
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <form onSubmit={handleSearch} className="w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder={dir === 'rtl' ? "חיפוש קורסים..." : "Search courses..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-gray-50 border-gray-200 focus:bg-white dark:bg-[#222844] dark:focus:bg-[#232949] dark:text-gray-100"
                />
              </div>
            </form>
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-1 xs:space-x-2 sm:space-x-4 space-x-reverse">
            {/* --- כפתור מצב לילה/יום --- */}
            <button
              className={`
                toggle-darkmode-btn mr-1 flex items-center justify-center rounded-full
                transition border-2 border-transparent focus:outline-none
                ${isDarkMode
                  ? "bg-gradient-to-tr from-indigo-900 to-blue-800 shadow-indigo-800/20"
                  : "bg-gradient-to-tr from-blue-100 to-white shadow-blue-200/30"}
              `}
              aria-label={isDarkMode ? "מצב יום" : "מצב לילה"}
              title={isDarkMode ? "כבה מצב לילה" : "הפעל מצב לילה"}
              type="button"
              style={{
                width: 42, height: 42, minWidth: 42, minHeight: 42, marginInlineEnd: 8,
                fontSize: 23,
                boxShadow: isDarkMode ? "0 4px 16px #17213b88" : "0 2px 8px #b4c1fd77",
              }}
              onClick={() => setIsDarkMode((v) => !v)}
            >
              {isDarkMode ? (
                <Sun className="w-6 h-6 text-yellow-200" />
              ) : (
                <Moon className="w-6 h-6 text-blue-800" />
              )}
            </button>

            {/* כפתור שפה */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLanguage(language === 'he' ? 'en' : 'he')}
              className="hidden sm:flex"
            >
              {dir === 'rtl' ? 'EN' : 'עב'}
            </Button>

            {/* 🔔 Notification Bell */}
            {user && user.email_confirmed_at && (
              <button
                type="button"
                className={`
                  relative rounded-full transition shadow-sm
                  hover:bg-blue-50 dark:hover:bg-[#21294e]
                  focus:outline-none focus:ring-2 focus:ring-blue-500/60
                  w-10 h-10 flex items-center justify-center
                `}
                aria-label={dir === 'rtl' ? 'התראות' : 'Notifications'}
                tabIndex={0}
                onClick={() => setShowNotifications(true)}
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span
                    className={`
                      absolute -top-1.5 -right-1.5 min-w-[1.4rem] h-5 px-1
                      bg-red-500 text-white text-xs font-bold flex items-center justify-center rounded-full shadow
                      border-2 border-white animate-bounce
                    `}
                    style={{ zIndex: 2 }}
                    aria-label={`${unreadCount} התראות חדשות`}
                  >
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>
            )}

            {/* 👤 User Menu (Dropdown/או התחברות) */}
            {user && user.email_confirmed_at ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-2 px-2"
                    aria-label="פרופיל משתמש"
                  >
                    <User className="w-5 h-5" />
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User className="w-4 h-4 mr-2" />
                    <span>פרופיל</span>
                  </DropdownMenuItem>
                  {isTutor && (
                    <DropdownMenuItem onClick={() => navigate('/tutor/dashboard')}>
                      <GraduationCap className="w-4 h-4 mr-2" />
                      <span>אזור מורה</span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => setShowNotifications(true)}>
                    <Bell className="w-4 h-4 mr-2" />
                    <span>התראות</span>
                    {unreadCount > 0 && (
                      <Badge variant="destructive" className="mr-2 text-xs">
                        {unreadCount}
                      </Badge>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => signOut()}
                    className="text-red-600 focus:text-red-600"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    <span>התנתק</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAuthDialog(true)}
                className="flex items-center gap-2 px-2"
                aria-label="התחבר"
              >
                <User className="w-5 h-5" />
              </Button>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden"
              aria-label={mobileMenuOpen ? "סגור תפריט" : "פתח תפריט"}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        menuItems={menuItems}
      />

      {/* Auth Dialog */}
      <AuthDialog isOpen={showAuthDialog} onClose={() => setShowAuthDialog(false)} />

      {/* Notifications Dialog */}
      <Suspense fallback={null}>
        {showNotifications && (
          <NotificationSystem isOpen={showNotifications} onClose={() => setShowNotifications(false)} />
        )}
      </Suspense>

      {/* CSS ללוגו דינמי ואנימציה */}
      <style>{`
        @keyframes gradient-move {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .bali-logo-dynamic {
          background: linear-gradient(90deg, #7c3aed 0%, #4f46e5 30%, #2563eb 60%, #d946ef 100%);
          background-size: 250% 250%;
          background-position: 0% 50%;
          animation: gradient-move 8s ease-in-out infinite;
          box-shadow: 0 4px 24px 0 rgba(76,34,221,0.11), 0 1.5px 8px 0 rgba(36,0,103,0.10);
          letter-spacing: 1.5px;
          min-width: 120px;
          min-height: 40px;
          user-select: none;
        }
        .skeleton-loader {
          background: linear-gradient(90deg, #f3f3f3 25%, #ecebeb 50%, #f3f3f3 75%);
          background-size: 400% 100%;
          animation: skeleton 2s infinite linear;
        }
        @keyframes skeleton {
          0% { background-position: 100% 0; }
          100% { background-position: 0 0; }
        }
        @media (max-width: 640px) {
          .bali-logo-dynamic {
            padding: 6px 12px;
            font-size: 1.07rem !important;
            min-width: 100px;
            min-height: 36px;
          }
        }
      `}</style>
    </header>
  );
};

export default Header;
