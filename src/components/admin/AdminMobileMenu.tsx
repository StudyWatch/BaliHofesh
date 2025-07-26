
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { 
  Menu,
  BookOpen, 
  Calendar, 
  GraduationCap, 
  Lightbulb, 
  Megaphone, 
  ShoppingCart, 
  MessageSquare, 
  Users,
  UserCheck
} from 'lucide-react';

interface AdminMobileMenuProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const AdminMobileMenu = ({ activeTab, onTabChange }: AdminMobileMenuProps) => {
  const [open, setOpen] = useState(false);

  const adminSections = [
    { id: 'courses', icon: BookOpen, label: 'ניהול קורסים' },
    { id: 'exams', icon: Calendar, label: 'מועדי בחינות' },
    { id: 'collaboration', icon: UserCheck, label: 'שיתוף פעולה' },
    { id: 'tutors', icon: GraduationCap, label: 'מורים פרטיים' },
    { id: 'tips', icon: Lightbulb, label: 'טיפים' },
    { id: 'sponsored', icon: Megaphone, label: 'פרסום ממומן' },
    { id: 'store', icon: ShoppingCart, label: 'החנות' },
    { id: 'reports', icon: MessageSquare, label: 'פניות משתמשים' },
    { id: 'users', icon: Users, label: 'ניהול משתמשים' },
  ];

  const handleTabChange = (tabId: string) => {
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
