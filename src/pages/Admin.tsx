import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAdminAuth } from '@/hooks/useAdminAuth';

import InstitutionsManagement from '@/components/admin/InstitutionsManagement';
import ExamsManagement from '@/components/admin/ExamsManagement';
import TutorsManagement from '@/components/admin/TutorsManagement';
import TipsManagement from '@/components/admin/TipsManagement';
import SponsoredContentManagement from '@/components/admin/SponsoredContentManagement';
import StoreManagement from '@/components/admin/StoreManagement';
import UserReportsManagement from '@/components/admin/UserReportsManagement';
import UsersManagement from '@/components/admin/UsersManagement';
import CollaborationManagement from '@/components/admin/CollaborationManagement';
import MessagesManagement from '@/components/admin/MessagesManagement';
import SemesterManagement from '@/components/admin/SemesterManagement';
import CourseGroupsManagement from '@/components/admin/CourseGroupsManagement';
import AdvancedAdminDashboard from '@/components/admin/AdvancedAdminDashboard';
import CourseReviewsManagement from '@/components/admin/CourseReviewsManagement';
import AdminNotificationsPanel from '@/components/admin/AdminNotificationsPanel'; // <<< ⭐ NEW
import AdminMobileMenu from '@/components/admin/AdminMobileMenu';

import {
  BookOpen, Calendar, GraduationCap, Lightbulb, Megaphone, ShoppingCart,
  MessageSquare, Users, Shield, UserCheck, BarChart3, Mail, UsersRound, Bell
} from 'lucide-react';

import { AdminTab } from '@/types/admin';

// כל הסקשנים — כולל נוטיפיקציות!
const adminSections: { id: AdminTab; icon: React.ElementType; label: string; component: React.ReactNode }[] = [
  { id: 'dashboard', icon: BarChart3, label: 'דשבורד', component: <AdvancedAdminDashboard /> },
  { id: 'notifications', icon: Bell, label: 'התראות', component: <AdminNotificationsPanel /> }, // ⭐ התראות — חדש!
  { id: 'reviews', icon: MessageSquare, label: 'ביקורות', component: <CourseReviewsManagement /> },
  { id: 'courses', icon: BookOpen, label: 'קורסים', component: <InstitutionsManagement /> },
  { id: 'semesters', icon: Calendar, label: 'סמסטרים', component: <SemesterManagement /> },
  { id: 'course-groups', icon: UsersRound, label: 'קבוצות קורסים', component: <CourseGroupsManagement /> },
  { id: 'exams', icon: Calendar, label: 'בחינות', component: <ExamsManagement /> },
  { id: 'collaboration', icon: UserCheck, label: 'שיתופי פעולה', component: <CollaborationManagement /> },
  { id: 'messages', icon: Mail, label: 'הודעות', component: <MessagesManagement /> },
  { id: 'users', icon: Users, label: 'משתמשים', component: <UsersManagement /> },
  { id: 'tutors', icon: GraduationCap, label: 'מורים', component: <TutorsManagement /> },
  { id: 'tips', icon: Lightbulb, label: 'טיפים', component: <TipsManagement /> },
  { id: 'sponsored', icon: Megaphone, label: 'פרסום', component: <SponsoredContentManagement /> },
  { id: 'store', icon: ShoppingCart, label: 'חנות', component: <StoreManagement /> },
  { id: 'reports', icon: MessageSquare, label: 'פניות', component: <UserReportsManagement /> },
];

const bgGradient =
  'bg-gradient-to-br from-[#F0F4FF] via-[#e5ecff] to-[#f8f9fc] dark:from-[#141e30] dark:via-[#283e51] dark:to-[#1a1a2e]';

const splitTabs = (tabs: typeof adminSections, maxPerRow: number = 8) => {
  if (tabs.length <= maxPerRow) return [tabs];
  return [
    tabs.slice(0, maxPerRow),
    tabs.slice(maxPerRow)
  ];
};

const Admin = () => {
  const { dir } = useLanguage();
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const { profile } = useAdminAuth();

  // עיצוב: פיצול הטאבים לשתי שורות אם יש הרבה טאבים
  const tabRows = splitTabs(adminSections, 8);

  return (
    <ProtectedRoute requireAdmin={true}>
      <div className={`min-h-screen flex flex-col ${bgGradient}`} dir={dir}>
        {/* רקע SVG דקורטיבי */}
        <div aria-hidden className="fixed inset-0 -z-10 pointer-events-none">
          <svg className="absolute top-[-130px] right-[-100px] opacity-25 w-[600px] h-[300px] rotate-[18deg] blur-[1px] hidden lg:block"
            viewBox="0 0 800 400" fill="none">
            <ellipse cx="400" cy="200" rx="320" ry="80" fill="#3b82f6" />
          </svg>
          <svg className="absolute bottom-[-120px] left-[-70px] opacity-20 w-[400px] h-[300px] blur-[1px] hidden md:block"
            viewBox="0 0 500 300" fill="none">
            <ellipse cx="250" cy="150" rx="180" ry="50" fill="#818cf8" />
          </svg>
        </div>

        {/* Header */}
        <header className="w-full max-w-7xl mx-auto flex flex-col items-center justify-center py-8 px-3 md:px-10">
          <div className="flex items-center gap-3 md:gap-5">
            <Shield className="w-8 h-8 text-blue-600 drop-shadow" />
            <h1 className="text-3xl md:text-4xl font-black text-blue-800 dark:text-blue-200 tracking-tight">
              דשבורד אדמין
            </h1>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-lg font-semibold text-gray-700 dark:text-gray-300">
              ניהול האוניברסיטה הפתוחה - באלי חופש
            </span>
            <span className="text-xs px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-100 font-bold shadow">
              {profile?.name ? `שלום ${profile.name}` : 'מנהל מערכת'}
            </span>
          </div>
        </header>

        {/* Tabs Nav - שתי שורות אוטומטית */}
        <nav
          className="flex flex-col gap-1 px-2 md:px-8 py-2 mb-1 w-full bg-white/70 dark:bg-gray-900/80 shadow-lg sticky top-0 z-30 border-b border-gray-200 dark:border-gray-800 backdrop-blur"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {tabRows.map((row, i) => (
            <div key={i} className="flex flex-row items-center gap-2 md:gap-5 w-full overflow-x-auto whitespace-nowrap mb-1 justify-center">
              {row.map(section => (
                <button
                  key={section.id}
                  onClick={() => setActiveTab(section.id)}
                  className={`
                    flex flex-col items-center justify-center px-3 py-2 transition
                    rounded-2xl font-bold select-none
                    duration-150
                    ${activeTab === section.id
                      ? "bg-gradient-to-t from-blue-100 via-blue-50 to-white dark:from-blue-900 dark:via-blue-950 dark:to-gray-900 shadow-lg scale-105 text-blue-700 dark:text-blue-100"
                      : "text-gray-600 dark:text-gray-300 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950"}
                    focus:outline-none
                  `}
                  style={{ minWidth: 82 }}
                  aria-current={activeTab === section.id}
                  tabIndex={0}
                >
                  <section.icon className={`w-6 h-6 mb-1 transition-transform duration-150 ${activeTab === section.id ? "scale-110" : ""}`} />
                  <span className="text-xs font-medium">{section.label}</span>
                </button>
              ))}
            </div>
          ))}
        </nav>

        {/* מובייל תפריט */}
        <div className="block md:hidden mb-3">
          <AdminMobileMenu
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </div>

        {/* תוכן הטאב */}
        <main className="flex-1 w-full max-w-7xl mx-auto py-8 px-2 md:px-6">
          <div className="rounded-3xl shadow-2xl bg-white/95 dark:bg-gray-900/90 p-4 md:p-8 min-h-[55vh] transition-all overflow-x-auto border border-blue-100 dark:border-blue-900/60">
            {adminSections.find(section => section.id === activeTab)?.component}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default Admin;
