import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3, BookOpen, Calendar, UsersRound, UserCheck, Mail,
  Users, GraduationCap, Lightbulb, Megaphone, ShoppingCart,
  MessageSquare, Shield, Menu, Sun, Moon, Palette, Focus
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider
} from '@/components/ui/tooltip';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

import AdminDashboard from '@/components/admin/AdminDashboard';
import InstitutionsManagement from '@/components/admin/InstitutionsManagement';
import SemesterManagement from '@/components/admin/SemesterManagement';
import CourseGroupsManagement from '@/components/admin/CourseGroupsManagement';
import ExamsManagement from '@/components/admin/ExamsManagement';
import CollaborationManagement from '@/components/admin/CollaborationManagement';
import MessagesManagement from '@/components/admin/MessagesManagement';
import UsersManagement from '@/components/admin/UsersManagement';
import TutorsManagement from '@/components/admin/TutorsManagement';
import TipsManagement from '@/components/admin/TipsManagement';
import SponsoredContentManagement from '@/components/admin/SponsoredContentManagement';
import StoreManagement from '@/components/admin/StoreManagement';
import UserReportsManagement from '@/components/admin/UserReportsManagement';

const adminSections = [
  { id: 'dashboard', icon: BarChart3, label: 'לוח בקרה' },
  { id: 'courses', icon: BookOpen, label: 'ניהול קורסים' },
  { id: 'semesters', icon: Calendar, label: 'סמסטרים' },
  { id: 'course-groups', icon: UsersRound, label: 'קבוצות קורסים' },
  { id: 'exams', icon: Calendar, label: 'בחינות' },
  { id: 'collaboration', icon: UserCheck, label: 'שיתופי פעולה' },
  { id: 'messages', icon: Mail, label: 'הודעות' },
  { id: 'users', icon: Users, label: 'משתמשים' },
  { id: 'tutors', icon: GraduationCap, label: 'מורים' },
  { id: 'tips', icon: Lightbulb, label: 'טיפים' },
  { id: 'sponsored', icon: Megaphone, label: 'פרסום' },
  { id: 'store', icon: ShoppingCart, label: 'החנות' },
  { id: 'reports', icon: MessageSquare, label: 'פניות' },
] as const;

const colorThemes = [
  { name: "Blue",    value: "#2563eb" },
  { name: "Purple",  value: "#7c3aed" },
  { name: "Teal",    value: "#0d9488" },
  { name: "Indigo",  value: "#6366f1" },
  { name: "Rose",    value: "#e11d48" },
];

type AdminTabs = typeof adminSections[number]['id'];

const Admin: React.FC = () => {
  const dir = "rtl";
  const [activeTab, setActiveTab] = useState<AdminTabs>(() =>
    (localStorage.getItem('admin-tab') as AdminTabs) || adminSections[0].id
  );
  useEffect(() => { localStorage.setItem('admin-tab', activeTab); }, [activeTab]);

  const [filter, setFilter] = useState('');
  const visibleSections = useMemo(
    () => adminSections.filter(sec => sec.label.includes(filter)),
    [filter]
  );

  const [theme, setTheme] = useState<'light' | 'dark'>(() =>
    (localStorage.getItem('theme') as 'light' | 'dark') || 'light'
  );
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const [color, setColor] = useState<string>(() =>
    localStorage.getItem('admin-color') || colorThemes[0].value
  );
  useEffect(() => {
    document.documentElement.style.setProperty('--primary-admin', color);
    localStorage.setItem('admin-color', color);
  }, [color]);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [focusMode, setFocusMode] = useState(false);

  // דמי: תמיד אדמין
  const isAdmin = true;

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 transition-colors">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-xl text-center">
          <Shield className="mx-auto mb-4 w-16 h-16 text-red-500" />
          <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">גישה נדחתה</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-4">אין לך הרשאות גישה לדף הניהול</p>
          <Button onClick={() => window.location.href = '/'}>חזרה לדף הבית</Button>
        </motion.div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div
        dir={dir}
        className="relative min-h-screen flex bg-gradient-to-br from-gray-50 via-slate-100 to-blue-50 dark:from-gray-900 dark:via-slate-900 dark:to-blue-950 transition-colors"
        style={{
          backgroundImage:
            `linear-gradient(135deg,rgba(0,0,0,0.01) 0,transparent 100%),
            url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='40' height='40' fill='none'/%3E%3Cpath d='M0 0L40 40' stroke='%236678a2' stroke-opacity='0.1'/%3E%3C/svg%3E")`
        }}
      >
        {/* Sidebar רספונסיבי */}
        <AnimatePresence>
          {!focusMode && (
            <motion.aside
              initial={{ x: dir === 'rtl' ? 80 : -80, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: dir === 'rtl' ? 80 : -80, opacity: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 26 }}
              className={`
                z-20 fixed lg:static top-0 ${dir === 'rtl' ? 'right-0' : 'left-0'}
                w-72 h-full bg-white/95 dark:bg-gray-900/95 border-l border-gray-200 dark:border-gray-800 shadow-lg
                flex flex-col
                ${sidebarOpen ? '' : 'hidden lg:flex'}
              `}
            >
              <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-800">
                <span className="text-lg font-bold text-gray-800 dark:text-gray-100">ניהול אדמין</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarOpen(false)}
                  className="lg:hidden"
                  aria-label="סגור תפריט"
                >
                  <Menu />
                </Button>
              </div>
              <div className="px-5 pt-2">
                <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-2 mb-3">
                  <Input
                    value={filter}
                    onChange={e => setFilter(e.target.value)}
                    placeholder="חפש..."
                    className="bg-transparent border-0 focus:ring-0 flex-1"
                  />
                </div>
                <div className="flex gap-2 items-center mb-4">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Switch checked={theme === 'dark'} onCheckedChange={v => setTheme(v ? 'dark' : 'light')}>
                        {theme === 'dark' ? <Moon /> : <Sun />}
                      </Switch>
                    </TooltipTrigger>
                    <TooltipContent side="left">מצב יום/לילה</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Palette className="cursor-pointer w-5 h-5"
                        style={{ color: color }}
                        onClick={() => {
                          const idx = colorThemes.findIndex(t => t.value === color);
                          setColor(colorThemes[(idx + 1) % colorThemes.length].value);
                        }}
                      />
                    </TooltipTrigger>
                    <TooltipContent side="left">בחירת צבע ראשי</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        variant={focusMode ? "outline" : "ghost"}
                        onClick={() => setFocusMode(f => !f)}
                        className={focusMode ? "bg-blue-100 dark:bg-blue-900" : ""}
                      >
                        <Focus />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left">{focusMode ? "חזור למצב רגיל" : "הפעל מצב פוקוס"}</TooltipContent>
                  </Tooltip>
                </div>
              </div>
              <nav className="flex-1 overflow-y-auto px-3 py-2">
                {visibleSections.map(({ id, icon: Icon, label }) => (
                  <Tooltip key={id}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => {
                          setActiveTab(id);
                          setSidebarOpen(false);
                        }}
                        className={`
                          group w-full flex items-center gap-3 px-4 py-2 rounded-lg my-1 transition-colors relative overflow-hidden
                          ${activeTab === id
                            ? 'bg-[var(--primary-admin)] bg-opacity-20 text-blue-900 dark:text-blue-100 shadow'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-800'}
                          focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400
                        `}
                        style={{ borderRight: activeTab === id ? `4px solid var(--primary-admin)` : '0' }}
                      >
                        <span className="transition-transform group-hover:scale-110">
                          <Icon className="w-5 h-5" />
                        </span>
                        <span className="flex-1 text-right font-medium">{label}</span>
                        <span className="absolute inset-0 pointer-events-none"></span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="left">{label}</TooltipContent>
                  </Tooltip>
                ))}
                {visibleSections.length === 0 && (
                  <p className="px-4 py-2 text-gray-500 dark:text-gray-400">לא נמצאו תוצאות</p>
                )}
              </nav>
              {/* פרופיל אדמין בתחתית */}
              <div className="p-5 border-t border-gray-200 dark:border-gray-800">
                <div className="flex gap-3 items-center">
                  <Avatar>
                    <AvatarImage src="/avatar.png" alt="Admin" />
                    <AvatarFallback>אדמין</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-bold text-gray-800 dark:text-gray-100">Timor</div>
                    <div className="text-xs text-gray-500 dark:text-gray-300">Super Admin</div>
                    <button className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1">התנתקות</button>
                  </div>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* HEADER BAR */}
        <header
          className={`flex items-center justify-between w-full py-4 px-8 fixed z-10 bg-transparent transition-all duration-300`}
          style={{ right: focusMode ? 0 : '18rem', left: 0 }}
        >
          <div className="flex items-center gap-3">
            <Button className="lg:hidden" variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
              <Menu />
            </Button>
            <motion.span layout className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
              {adminSections.find(sec => sec.id === activeTab)?.label}
            </motion.span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-700 dark:text-gray-300 px-3 py-1 rounded bg-white/60 dark:bg-gray-800/60 shadow">
              {new Date().toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: '2-digit' })} | {new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </header>

        {/* MAIN CONTENT */}
        <main
          className={`
            flex-1 min-h-screen flex flex-col pt-24 px-4 md:px-8
            transition-all duration-300
            ${focusMode ? '' : 'lg:ml-72'}
          `}
        >
          <AnimatePresence>
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.32, type: "spring", damping: 18 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 transition-colors min-h-[50vh]"
            >
              {activeTab === 'dashboard'     && <AdminDashboard />}
              {activeTab === 'courses'       && <InstitutionsManagement />}
              {activeTab === 'semesters'     && <SemesterManagement />}
              {activeTab === 'course-groups' && <CourseGroupsManagement />}
              {activeTab === 'exams'         && <ExamsManagement />}
              {activeTab === 'collaboration' && <CollaborationManagement />}
              {activeTab === 'messages'      && <MessagesManagement />}
              {activeTab === 'users'         && <UsersManagement />}
              {activeTab === 'tutors'        && <TutorsManagement />}
              {activeTab === 'tips'          && <TipsManagement />}
              {activeTab === 'sponsored'     && <SponsoredContentManagement />}
              {activeTab === 'store'         && <StoreManagement />}
              {activeTab === 'reports'       && <UserReportsManagement />}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Drawer רקע לסיידבר במובייל */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              key="drawer-bg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-10 bg-black/40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}
        </AnimatePresence>
      </div>
    </TooltipProvider>
  );
};

export default Admin;
