import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { 
  Menu,
  BarChart3,
  BookOpen, 
  Calendar, 
  GraduationCap, 
  Lightbulb, 
  Megaphone, 
  ShoppingCart, 
  MessageSquare, 
  Users,
  UserCheck,
  UsersRound,
  Mail
} from 'lucide-react';

// הגדירו את הטיפוס הזהה בדיוק למה שמופיע ב־Admin.tsx
type AdminTab =
  | 'dashboard'
  | 'courses'
  | 'semesters'
  | 'course-groups'
  | 'exams'
  | 'collaboration'
  | 'messages'
  | 'users'
  | 'tutors'
  | 'tips'
  | 'sponsored'
  | 'store'
  | 'reports';

interface AdminMobileMenuProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
}

const adminSections: { id: AdminTab; icon: React.ElementType; label: string }[] = [
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
];

const AdminMobileMenu = ({ activeTab, onTabChange }: AdminMobileMenuProps) => {
  const [open, setOpen] = useState(false);

  const handleTabChange = (tabId: AdminTab) => {
    onTabChange(tabId);
    setOpen(false);
  };

  return (
    <div className="lg:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm">
            <Menu className="w-4 h-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[300px]">
          <SheetHeader>
            <SheetTitle className="text-right">תפריט ניהול</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-2">
            {adminSections.map((section) => (
              <button
                key={section.id}
                onClick={() => handleTabChange(section.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg text-right transition-colors ${
                  activeTab === section.id
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                <section.icon className="w-5 h-5" />
                <span className="font-medium">{section.label}</span>
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default AdminMobileMenu;
