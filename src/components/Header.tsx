import React, { useState, useEffect, Suspense } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthProvider';
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
  GraduationCap,
  Lightbulb,
  ShoppingCart,
  ChevronDown,
  Moon,
  Sun,
  Mail,
  HelpCircle,
  ShieldCheck
} from 'lucide-react';
import AuthDialog from '@/components/auth/AuthDialog';
import MobileMenu from './MobileMenu';

const NotificationSystem = React.lazy(() => import('@/components/notifications/NotificationSystem'));

const Header: React.FC = () => {
  const navigate = useNavigate();
  const { dir, language, setLanguage } = useLanguage();
  const { user, loading: authLoading, signOut } = useAuth();
  const { data: profile } = useUserProfile();
  const { data: notifications = [] } = useSystemNotifications();
  const unreadCount = notifications.filter(n => !n.is_read).length;
  // הגנה טיפוסית
  const isTutor = profile?.role === 'tutor' || profile?.role === 'admin' || (profile && 'is_tutor' in profile && (profile as any).is_tutor);
  const isAdmin = profile?.role === 'admin';

  const [searchQuery, setSearchQuery] = useState('');
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Dark Mode
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

  // Responsive: detect mobile
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 640 : false
  );
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // --- תפריטי ניווט ---
  const mainMenu: Array<{ href: string; label: string; icon: any }> = [
    { href: '/', label: dir === 'rtl' ? 'דף הבית' : 'Home', icon: Home },
    { href: '/tutors', label: dir === 'rtl' ? 'מורים פרטיים' : 'Tutors', icon: GraduationCap },
    { href: '/tips', label: dir === 'rtl' ? 'טיפים' : 'Tips', icon: Lightbulb },
    { href: '/store', label: dir === 'rtl' ? 'החנות' : 'Store', icon: ShoppingCart },
  ];

  // תפריט צד – דינאמי לפי מובייל/אדמין
  const mobileMenu = [
    ...mainMenu,
    ...(isMobile ? [{
      href: '/feedback',
      label: dir === 'rtl' ? 'פנייה לצוות האתר' : 'Contact / Feedback',
      icon: Mail
    }] : []),
    ...(isAdmin ? [{
      href: '/admin',
      label: dir === 'rtl' ? 'לוח אדמין' : 'Admin Dashboard',
      icon: ShieldCheck
    }] : []),
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/courses?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // טעינה
  if (authLoading) {
    return (
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40 rounded-none dark:rounded-none">
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
    <header className="Header bg-white dark:bg-[#181f32] shadow-sm border-b border-gray-200 dark:border-[#232949] sticky top-0 z-40 transition-colors rounded-none dark:rounded-none">
      <div className="container mx-auto px-2 sm:px-4">
        <div className="flex items-center justify-between h-16">
          {/* לוגו */}
          <Link to="/" className="flex items-center min-w-0 select-none group" tabIndex={0}>
            <span
              className="bali-logo-dynamic px-4 py-2 rounded-2xl font-bold text-base xs:text-lg md:text-2xl tracking-tight text-white shadow-xl border-2 border-white/40 transition-all duration-400 group-hover:scale-105 group-hover:shadow-2xl cursor-pointer select-none"
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
            {mainMenu.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className="flex items-center space-x-1 space-x-reverse text-gray-700 dark:text-gray-100 hover:text-blue-700 dark:hover:text-indigo-300 transition-colors duration-200 px-3 py-2 rounded-lg relative group focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 hover:bg-blue-50 dark:hover:bg-[#222844] after:content-[''] after:absolute after:left-2 after:right-2 after:bottom-1 after:h-1 after:rounded-full after:opacity-0 group-hover:after:opacity-70 after:transition-all after:duration-300 after:bg-gradient-to-r after:from-blue-300 after:to-purple-400"
                tabIndex={0}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            ))}
            {isAdmin && (
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center space-x-1 space-x-reverse px-3 py-2 rounded-lg text-purple-700 dark:text-pink-300 font-bold hover:bg-purple-100 dark:hover:bg-purple-900 transition"
                onClick={() => navigate('/admin')}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{dir === 'rtl' ? 'לוח אדמין' : 'Admin Dashboard'}</span>
              </Button>
            )}
          </nav>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <form onSubmit={handleSearch} className="w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-300 group-focus-within:text-blue-600 w-5 h-5 transition-colors" />
                <Input
                  type="text"
                  placeholder={dir === 'rtl' ? "חיפוש קורסים..." : "Search courses..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white/60 border-2 border-gray-200 dark:bg-[#222844]/90 dark:border-[#232949] focus:bg-white dark:focus:bg-[#232949] dark:text-gray-100 focus:border-blue-400 focus:ring-2 focus:ring-blue-300 transition-all duration-200 rounded-xl shadow hover:shadow-lg outline-none"
                  style={{
                    boxShadow: '0 1px 5px 0 rgba(90,110,250,0.07)',
                  }}
                />
              </div>
            </form>
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-1 xs:space-x-2 sm:space-x-4 space-x-reverse">
            {/* כפתור פנייה לצוות – דסקטופ בלבד */}
            <div className="hidden lg:flex items-center gap-2 ml-2">
              <Link
                to="/feedback"
                className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-blue-50 dark:hover:bg-[#232949] transition group relative outline-none focus:ring-2 focus:ring-blue-300"
                style={{ minWidth: 36, minHeight: 36 }}
                aria-label="פנייה לצוות האתר"
                tabIndex={0}
              >
                <HelpCircle className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition" />
                <span className="pointer-events-none opacity-0 group-hover:opacity-100 group-focus:opacity-100 absolute left-12 right-auto bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-200 rounded-xl shadow-lg py-1 px-3 text-xs font-semibold transition-all duration-200 z-50 whitespace-nowrap border border-blue-100 dark:border-blue-700" style={{ top: '50%', transform: 'translateY(-50%)' }}>
                  פנייה לצוות האתר
                </span>
              </Link>
            </div>

            {/* מצב לילה/יום */}
            <button
              className={`
                toggle-darkmode-btn mr-1 flex items-center justify-center rounded-full
                transition border-2 border-transparent focus:outline-none
                hover:ring-2 hover:ring-blue-200 dark:hover:ring-indigo-900
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
              className="hidden sm:flex hover:bg-blue-50 dark:hover:bg-[#21294e] hover:text-blue-700 dark:hover:text-indigo-300 rounded-lg px-2 transition"
            >
              {dir === 'rtl' ? 'EN' : 'עב'}
            </Button>

            {/* 🔔 Notification Bell */}
            {user && user.email_confirmed_at && (
              <button
                type="button"
                className="relative rounded-full transition shadow-sm hover:bg-blue-50 dark:hover:bg-[#21294e] focus:outline-none focus:ring-2 focus:ring-blue-400 w-10 h-10 flex items-center justify-center hover:scale-105"
                aria-label={dir === 'rtl' ? 'התראות' : 'Notifications'}
                tabIndex={0}
                onClick={() => setShowNotifications(true)}
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[1.4rem] h-5 px-1 bg-red-500 text-white text-xs font-bold flex items-center justify-center rounded-full shadow border-2 border-white animate-bounce" style={{ zIndex: 2 }} aria-label={`${unreadCount} התראות חדשות`}>
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
                    className="flex items-center gap-2 px-2 rounded-lg hover:bg-blue-50 dark:hover:bg-[#23294e] hover:text-blue-700 dark:hover:text-indigo-300 transition"
                    aria-label="פרופיל משתמש"
                  >
                    <User className="w-5 h-5" />
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 bg-white dark:bg-[#23294e] text-gray-900 dark:text-pink-100 border dark:border-[#282b3b] shadow-xl">
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
                  {isAdmin && (
                    <DropdownMenuItem onClick={() => navigate('/admin')}>
                      <ShieldCheck className="w-4 h-4 mr-2 text-purple-600 dark:text-pink-300" />
                      <span className="font-bold">{dir === 'rtl' ? 'לוח אדמין' : 'Admin Dashboard'}</span>
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
                className="flex items-center gap-2 px-2 rounded-lg hover:bg-blue-50 dark:hover:bg-[#21294e] transition"
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
        menuItems={mobileMenu}
      />

      {/* Auth Dialog */}
      <AuthDialog
        isOpen={showAuthDialog}
        onClose={() => setShowAuthDialog(false)}
      />

      {/* Notifications Dialog */}
      <Suspense fallback={null}>
        {showNotifications && (
          <NotificationSystem
            isOpen={showNotifications}
            onClose={() => setShowNotifications(false)}
          />
        )}
      </Suspense>

      {/* CSS דינמי */}
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
        /* עיצוב משופר ל-Dropdown ול-MobileMenu במצב לילה */
        .dark .shadcn-dropdown-menu__content,
        .dark .DropdownMenuContent,
        .dark .dropdown-menu__content,
        .dark .DropdownMenuItem {
          background: #23294e !important;
          color: #fbeaff !important;
        }
        .DropdownMenuItem, .dropdown-menu__item {
          transition: background 0.16s, color 0.16s;
        }
        .DropdownMenuItem:focus, .DropdownMenuItem:active,
        .dropdown-menu__item:focus, .dropdown-menu__item:active {
          background: #372a4e !important;
          color: #ff90e7 !important;
        }
        .DropdownMenuSeparator, .dropdown-menu__separator {
          background: #d7ccf6 !important;
          height: 1px;
          opacity: 0.4;
        }
        /* נראות טובה בלילה בתפריטים */
        .dark .DropdownMenuItem, .dark .dropdown-menu__item {
          color: #fff !important;
        }
        .dark .DropdownMenuItem:hover, .dark .dropdown-menu__item:hover {
          color: #f772d2 !important;
          background: #30284a !important;
        }
        /* ללא פינות עגולות ל-Header ולתפריטים במצב לילה */
        .Header, .dark .Header {
          border-radius: 0 !important;
        }
        /* תפריט צד במובייל */
        .MobileMenu, .dark .MobileMenu {
          background: #fff !important;
        }
        .dark .MobileMenu {
          background: linear-gradient(180deg,#231F36 0%,#282046 80%,#35215b 100%) !important;
          color: #fff !important;
          border-radius: 0 !important;
          box-shadow: 0 10px 30px #120a22cc;
        }
        .dark .MobileMenu a, .dark .MobileMenu button, .dark .MobileMenu span {
          color: #ffe5fc !important;
          font-weight: 600;
          text-shadow: 0 1px 6px #24134244;
        }
        .dark .MobileMenu svg {
          color: #b58bfd !important;
          filter: drop-shadow(0 1px 3px #44186066);
        }
        .dark .MobileMenu hr {
          border-color: #fff3;
        }
        /* פריט פעיל/נבחר */
        .dark .MobileMenu .active,
        .dark .MobileMenu [aria-current="page"] {
          background: #35215b !important;
          color: #ffcdfb !important;
          border-radius: 12px !important;
          box-shadow: 0 2px 8px #120a2244;
        }
      `}</style>
    </header>
  );
};

export default Header;
