import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthProvider';
import { Button } from '@/components/ui/button';
import { User, Globe, BookOpen } from 'lucide-react';

interface MenuItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  menuItems: MenuItem[];
}

const MobileMenu = ({ isOpen, onClose, menuItems }: MobileMenuProps) => {
  const { dir, language, setLanguage } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  const toggleLanguage = () => {
    setLanguage(language === 'he' ? 'en' : 'he');
  };

  if (!isOpen) return null;

  return (
    <div className="MobileMenu lg:hidden border-t shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <nav className="space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              onClick={onClose}
              className="flex items-center space-x-3 space-x-reverse p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-[#2d2344] transition-colors"
            >
              <item.icon className="w-5 h-5 text-gray-500 dark:text-purple-300" />
              <span className="text-gray-800 dark:text-gray-100 font-medium">
                {item.label}
              </span>
            </Link>
          ))}

          {/* Mobile-specific menu items */}
          <div className="border-t border-gray-300 dark:border-white/20 pt-4 space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start space-x-3 space-x-reverse"
              onClick={() => {
                toggleLanguage();
                onClose();
              }}
            >
              <Globe className="w-5 h-5 text-gray-500 dark:text-purple-300" />
              <span className="text-gray-800 dark:text-gray-100">
                {dir === 'rtl' ? 'English' : 'עברית'}
              </span>
            </Button>

            {user && user.email_confirmed_at ? (
              <>
                <Button
                  variant="ghost"
                  className="w-full justify-start space-x-3 space-x-reverse"
                  onClick={() => {
                    navigate('/profile');
                    onClose();
                  }}
                >
                  <User className="w-5 h-5 text-gray-500 dark:text-purple-300" />
                  <span className="text-gray-800 dark:text-gray-100">הפרופיל שלי</span>
                </Button>

                <Button
                  variant="ghost"
                  className="w-full justify-start space-x-3 space-x-reverse"
                  onClick={() => {
                    navigate('/my-courses');
                    onClose();
                  }}
                >
                  <BookOpen className="w-5 h-5 text-gray-500 dark:text-purple-300" />
                  <span className="text-gray-800 dark:text-gray-100">הקורסים שלי</span>
                </Button>
              </>
            ) : (
              <Link
                to="/login"
                onClick={onClose}
                className="flex items-center space-x-3 space-x-reverse p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-[#2d2344] transition-colors"
              >
                <User className="w-5 h-5 text-gray-500 dark:text-purple-300" />
                <span className="text-gray-800 dark:text-gray-100 font-medium">
                  {dir === 'rtl' ? 'התחבר' : 'Login'}
                </span>
              </Link>
            )}
          </div>
        </nav>
      </div>
    </div>
  );
};

export default MobileMenu;
