// src/pages/Admin.tsx
import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/App';
import { useUserProfile } from '@/hooks/useProfile';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import AdminMobileMenu from '@/components/admin/AdminMobileMenu';
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
import {
  Shield, BarChart3, BookOpen, Calendar, UsersRound, UserCheck, Mail,
  Users, GraduationCap, Lightbulb, Megaphone, ShoppingCart, MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Admin = () => {
  const { dir } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useUserProfile();

  // לאחד את טעינות האותנטיקציה והפרופיל
  const loading = authLoading || profileLoading;

  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'courses' | 'semesters' | 'course-groups' | 'exams' |
    'collaboration' | 'messages' | 'users' | 'tutors' | 'tips' |
    'sponsored' | 'store' | 'reports'
  >('dashboard');

  useEffect(() => {
    // לוג עזר לפיתוח בלבד
    if (!loading) {
      console.log('🧠 [Admin] user:', user);
      console.log('🧠 [Admin] profile:', profile);
    }
  }, [loading, user, profile]);

  // מניעת גישה והפסקת כל רינדור עד סיום טעינה
  if (loading || !user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center text-blue-600 font-bold text-lg">
        טוען נתוני גישה...
      </div>
    );
  }

  // בדיקת הרשאת אדמין – ולא לרנדר שום דבר אם אין גישה
  if (profile.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 transition-colors">
        <Card className="p-8 text-center">
          <Shield className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h1 className="text-2xl font-bold mb-2">גישה נדחתה</h1>
          <p className="text-gray-600 dark:text-gray-300">אין לך הרשאות גישה לדף הניהול</p>
          <Button className="mt-4" onClick={() => window.location.href = '/'}>חזור לדף הבית</Button>
        </Card>
      </div>
    );
  }

  const adminSections = [
    { id: 'dashboard', icon: BarChart3, label: 'לוח בקרה' },
    { id: 'courses', icon: BookOpen, label: 'ניהול קורסים' },
    { id: 'semesters', icon: Calendar, label: 'סמסטרים' },
    { id: 'course-groups', icon: UsersRound, label: 'קבוצות קורסים' },
    { id: 'exams', icon: Calendar, label: 'בחינות' },
    { id: 'collaboration', icon: UserCheck, label: 'שיתוף פעולה' },
    { id: 'messages', icon: Mail, label: 'הודעות' },
    { id: 'users', icon: Users, label: 'משתמשים' },
    { id: 'tutors', icon: GraduationCap, label: 'מורים' },
    { id: 'tips', icon: Lightbulb, label: 'טיפים' },
    { id: 'sponsored', icon: Megaphone, label: 'פרסום' },
    { id: 'store', icon: ShoppingCart, label: 'החנות' },
    { id: 'reports', icon: MessageSquare, label: 'פניות' },
  ] as const;

  return (
    <div dir={dir} className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700"
      >
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3 space-x-reverse">
            <Shield className="w-6 h-6 text-blue-600" />
            <div>
              <h1 className="text-lg lg:text-2xl font-bold text-gray-900 dark:text-gray-100">לוח בקרה - אדמין</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 hidden sm:block">ניהול הפלטפורמה</p>
            </div>
          </div>
          <AdminMobileMenu activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
      </motion.header>

      {/* תוכן טאבים */}
      <div className="container mx-auto px-6 py-8">
        <div className="hidden lg:grid grid-cols-12 gap-3 mb-6">
          {adminSections.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex flex-col items-center gap-1 p-3 rounded-lg transition-all
                ${activeTab === id 
                  ? 'bg-blue-100 dark:bg-blue-900 shadow-lg' 
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
            >
              <Icon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              <span className="text-xs text-gray-800 dark:text-gray-200">{label}</span>
            </button>
          ))}
        </div>

        <AnimatePresence>
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors"
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
      </div>
    </div>
  );
};

export default Admin;
