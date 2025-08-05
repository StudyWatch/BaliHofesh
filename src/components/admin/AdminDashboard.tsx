import React, { useState } from 'react';

// ייבוא כל הרכיבים שאתה צריך
import AdminLogsPanel from '@/components/admin/AdminLogsPanel';
import AdminMobileMenu from '@/components/admin/AdminMobileMenu';
import AdminNotificationsPanel from '@/components/admin/AdminNotificationsPanel';
import AdminRolePermissionsPanel from '@/components/admin/AdminRolePermissionsPanel';
import AdvancedAdminDashboard from '@/components/admin/AdvancedAdminDashboard';
import CollaborationManagement from '@/components/admin/CollaborationManagement';
import CourseGroupsManagement from '@/components/admin/CourseGroupsManagement';
import CourseReviewsManagement from '@/components/admin/CourseReviewsManagement';
import ExamsManagement from '@/components/admin/ExamsManagement';
import InstitutionsManagement from '@/components/admin/InstitutionsManagement';
import MessagesManagement from '@/components/admin/MessagesManagement';
import RatingsAnalyticsDashboard from '@/components/admin/RatingsAnalyticsDashboard';
import SemesterManagement from '@/components/admin/SemesterManagement';
import SponsoredContentManagement from '@/components/admin/SponsoredContentManagement';
import StoreManagement from '@/components/admin/StoreManagement';
import TipsManagement from '@/components/admin/TipsManagement';
import TutorsManagement from '@/components/admin/TutorsManagement';
import UserReportsManagement from '@/components/admin/UserReportsManagement';
import UsersManagement from '@/components/admin/UsersManagement';

// אייקונים לטאבים
import {
  BarChart3, Users, BookOpen, Calendar, UsersRound, MessageSquare, UserCheck,
  Mail, GraduationCap, Lightbulb, Megaphone, ShoppingCart, Shield, FileText, Star
} from "lucide-react";

// טאב־בר הגדרות
const adminTabs = [
  { id: 'main',         label: 'לוח בקרה',                icon: BarChart3,         component: <AdvancedAdminDashboard /> },
  { id: 'analytics',    label: 'סטטיסטיקות ודירוגים',     icon: Star,              component: <RatingsAnalyticsDashboard /> },
  { id: 'reviews',      label: 'ביקורות קורסים',          icon: MessageSquare,     component: <CourseReviewsManagement /> },
  { id: 'courses',      label: 'ניהול קורסים',            icon: BookOpen,          component: <InstitutionsManagement /> },
  { id: 'semesters',    label: 'סמסטרים',                 icon: Calendar,          component: <SemesterManagement /> },
  { id: 'courseGroups', label: 'קבוצות קורסים',           icon: UsersRound,        component: <CourseGroupsManagement /> },
  { id: 'exams',        label: 'בחינות',                  icon: Calendar,          component: <ExamsManagement /> },
  { id: 'collab',       label: 'שיתופי פעולה',            icon: UserCheck,         component: <CollaborationManagement /> },
  { id: 'messages',     label: 'הודעות',                  icon: Mail,              component: <MessagesManagement /> },
  { id: 'users',        label: 'משתמשים',                 icon: Users,             component: <UsersManagement /> },
  { id: 'tutors',       label: 'מורים פרטיים',            icon: GraduationCap,     component: <TutorsManagement /> },
  { id: 'tips',         label: 'טיפים',                   icon: Lightbulb,         component: <TipsManagement /> },
  { id: 'sponsored',    label: 'פרסום',                   icon: Megaphone,         component: <SponsoredContentManagement /> },
  { id: 'store',        label: 'החנות',                   icon: ShoppingCart,      component: <StoreManagement /> },
  { id: 'reports',      label: 'פניות משתמשים',           icon: MessageSquare,     component: <UserReportsManagement /> },
  { id: 'logs',         label: 'לוגים',                   icon: Shield,            component: <AdminLogsPanel /> },
  { id: 'notifications',label: 'התראות',                  icon: FileText,          component: <AdminNotificationsPanel /> },
  { id: 'permissions',  label: 'הרשאות',                  icon: Shield,            component: <AdminRolePermissionsPanel /> },
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState(adminTabs[0].id);

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-100 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-blue-950
      flex flex-col"
      dir="rtl"
    >
      {/* Header */}
      <header className="py-8 px-6 md:px-12 flex flex-col items-center gap-2 bg-transparent">
        <h1 className="text-4xl font-extrabold text-blue-800 dark:text-blue-200 tracking-tight mb-1">
          לוח בקרה - אדמין
        </h1>
        <div className="flex items-center gap-3">
          <span className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            ניהול האוניברסיטה הפתוחה - באלי חופש
          </span>
        </div>
        <span className="text-xs text-gray-400 mt-1">Timor Malul | Super Admin</span>
      </header>

      {/* Tabs Nav */}
      <nav
        className="flex flex-row items-center gap-4 md:gap-8 px-4 md:px-8 py-3 w-full overflow-x-auto bg-white/80 dark:bg-gray-900/80
        shadow-md sticky top-0 z-30 whitespace-nowrap border-b border-gray-200 dark:border-gray-800"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {adminTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex flex-col items-center justify-center px-2 py-1 transition
              rounded-xl font-bold
              ${activeTab === tab.id
                ? "text-blue-700 dark:text-blue-200 bg-blue-100 dark:bg-blue-950 shadow"
                : "text-gray-600 dark:text-gray-300 hover:text-blue-500"}
              focus:outline-none
            `}
            style={{ minWidth: 86 }}
          >
            <tab.icon className={`w-6 h-6 mb-1 ${activeTab === tab.id ? "scale-110" : ""}`} />
            <span className="text-xs">{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* תוכן הדף */}
      <main className="flex-1 w-full max-w-7xl mx-auto py-8 px-2 md:px-6">
        <div className="rounded-2xl shadow-xl bg-white/90 dark:bg-gray-900/80 p-6 min-h-[50vh] transition-all">
          {adminTabs.find(tab => tab.id === activeTab)?.component}
        </div>
      </main>

      {/* רקע גרפי קבוע עם SVG דקורטיבי */}
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none -z-10"
        style={{
          background: `
            radial-gradient(ellipse at 70% 30%, #93c5fd22 0%, transparent 60%),
            radial-gradient(ellipse at 20% 70%, #818cf822 0%, transparent 70%)
          `
        }}
      />
    </div>
  );
}
