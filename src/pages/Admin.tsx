
import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
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
import AdminDashboard from '@/components/admin/AdminDashboard';
import AdminMobileMenu from '@/components/admin/AdminMobileMenu';
import SemesterManagement from '@/components/admin/SemesterManagement';
import CourseGroupsManagement from '@/components/admin/CourseGroupsManagement';
import { 
  BookOpen, 
  Calendar, 
  GraduationCap, 
  Lightbulb, 
  Megaphone, 
  ShoppingCart, 
  MessageSquare, 
  Users,
  Shield,
  UserCheck,
  BarChart3,
  Mail,
  UsersRound
} from 'lucide-react';

const Admin = () => {
  const { t, dir } = useLanguage();
  const [activeTab, setActiveTab] = useState('dashboard');

  // TODO: Replace with actual auth check
  const isAdmin = true; // This should check user.role === 'admin' from Supabase

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="p-8 text-center">
          <Shield className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h1 className="text-2xl font-bold mb-2">גישה נדחתה</h1>
          <p className="text-gray-600">אין לך הרשאות גישה לדף הניהול</p>
          <Button 
            className="mt-4" 
            onClick={() => window.location.href = '/'}
          >
            חזור לדף הבית
          </Button>
        </Card>
      </div>
    );
  }

  const adminSections = [
    { id: 'dashboard', icon: BarChart3, label: 'לוח בקרה' },
    { id: 'courses', icon: BookOpen, label: 'ניהול קורסים' },
    { id: 'semesters', icon: Calendar, label: 'ניהול סמסטרים' },
    { id: 'course-groups', icon: UsersRound, label: 'קבוצות קורסים' },
    { id: 'exams', icon: Calendar, label: 'מועדי בחינות' },
    { id: 'collaboration', icon: UserCheck, label: 'שיתוף פעולה' },
    { id: 'messages', icon: Mail, label: 'הודעות פנימיות' },
    { id: 'users', icon: Users, label: 'ניהול משתמשים' },
    { id: 'tutors', icon: GraduationCap, label: 'מורים פרטיים' },
    { id: 'tips', icon: Lightbulb, label: 'טיפים' },
    { id: 'sponsored', icon: Megaphone, label: 'פרסום ממומן' },
    { id: 'store', icon: ShoppingCart, label: 'החנות' },
    { id: 'reports', icon: MessageSquare, label: 'פניות משתמשים' },
  ];

  return (
    <div className="min-h-screen bg-gray-50" dir={dir}>
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 lg:py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 space-x-reverse">
              <Shield className="w-6 h-6 lg:w-8 lg:h-8 text-blue-600" />
              <div>
                <h1 className="text-lg lg:text-2xl font-bold text-gray-900">לוח בקרה - אדמין</h1>
                <p className="text-sm lg:text-base text-gray-600 hidden sm:block">ניהול האוניברסיטה הפתוחה - באלי חופש</p>
              </div>
            </div>
            
            {/* Mobile admin menu */}
            <AdminMobileMenu activeTab={activeTab} onTabChange={setActiveTab} />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4 lg:py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Desktop tabs */}
          <TabsList className="hidden lg:grid grid-cols-12 mb-6">
            {adminSections.map((section) => (
              <TabsTrigger 
                key={section.id} 
                value={section.id}
                className="flex flex-col items-center gap-1 p-3 text-xs"
              >
                <section.icon className="w-4 h-4" />
                <span>{section.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Mobile active tab indicator */}
          <div className="lg:hidden mb-4 p-3 bg-white rounded-lg border">
            <div className="flex items-center gap-2">
              {adminSections.find(s => s.id === activeTab)?.icon && (
                React.createElement(adminSections.find(s => s.id === activeTab)!.icon, { className: "w-5 h-5 text-blue-600" })
              )}
              <span className="font-medium text-gray-900">
                {adminSections.find(s => s.id === activeTab)?.label}
              </span>
            </div>
          </div>

          <TabsContent value="dashboard">
            <AdminDashboard />
          </TabsContent>

          <TabsContent value="courses">
            <InstitutionsManagement />
          </TabsContent>

          <TabsContent value="semesters">
            <SemesterManagement />
          </TabsContent>

          <TabsContent value="course-groups">
            <CourseGroupsManagement />
          </TabsContent>

          <TabsContent value="exams">
            <ExamsManagement />
          </TabsContent>

          <TabsContent value="collaboration">
            <CollaborationManagement />
          </TabsContent>

          <TabsContent value="messages">
            <MessagesManagement />
          </TabsContent>

          <TabsContent value="users">
            <UsersManagement />
          </TabsContent>

          <TabsContent value="tutors">
            <TutorsManagement />
          </TabsContent>

          <TabsContent value="tips">
            <TipsManagement />
          </TabsContent>

          <TabsContent value="sponsored">
            <SponsoredContentManagement />
          </TabsContent>

          <TabsContent value="store">
            <StoreManagement />
          </TabsContent>

          <TabsContent value="reports">
            <UserReportsManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
