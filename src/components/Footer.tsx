import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import {
  Mail, Phone, Facebook, Instagram, Linkedin, MessageCircle, Heart
} from 'lucide-react';
import LogoImage from '@/assets/bali-hofesh-logo.png';

const Footer = () => {
  const { t, dir } = useLanguage();

  return (
    <footer className="relative bg-gradient-to-br from-[#1f2937] via-[#111827] to-[#0f172a] text-white pt-20 pb-12 overflow-hidden shadow-inner mt-32">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10 bg-[url('/assets/footer-pattern.svg')] bg-cover bg-center pointer-events-none" />

      {/* Main Content */}
      <div className="container mx-auto px-6 relative z-10">
        <div className="grid md:grid-cols-5 gap-10">
          {/* Logo & Vision */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-4 mb-4">
              <img src={LogoImage} className="w-14 h-14 rounded-lg shadow-xl" alt="BaliHofesh Logo" />
              <div>
                <h3 className="text-3xl font-extrabold tracking-tight text-white">BaliHofesh</h3>
                <p className="text-sm text-blue-400 font-medium">ללמוד חכם, יחד</p>
              </div>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              נבנה באהבה לסטודנטים באוניברסיטה הפתוחה – כדי להפוך את הלמידה לנוחה, ברורה, וחברתית. אין צורך ללמוד לבד.
            </p>
            <Button
              size="lg"
              className="bg-gradient-to-r from-indigo-500 to-blue-500 hover:opacity-90 text-white px-6 py-3 rounded-full shadow-lg"
              asChild
            >
              <a href="https://chat.whatsapp.com/K9c6SXQd8gUFrWLFZeBRDO" target="_blank" rel="noopener noreferrer">
                📱 הצטרפו לקבוצת הסטודנטים
              </a>
            </Button>
          </div>

          {/* Quick Navigation */}
          <div>
            <h4 className="font-semibold text-lg mb-4 text-white">תוכן שימושי</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="/" className="hover:text-white">🏠 עמוד הבית</a></li>
              <li><a href="/courses" className="hover:text-white">🎓 חיפוש קורסים</a></li>
              <li><a href="/calendar" className="hover:text-white">🗓️ לוח בחינות</a></li>
              <li><a href="/tutors" className="hover:text-white">👨‍🏫 מורים פרטיים</a></li>
              <li><a href="/faq" className="hover:text-white">❓ שאלות נפוצות</a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-semibold text-lg mb-4 text-white">יצירת קשר</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li className="flex items-center gap-2"><Mail className="w-4 h-4 text-blue-300" /> BaliHofeshe@gmail.com</li>
              <li className="flex items-center gap-2"><Phone className="w-4 h-4 text-gray-500" /> מענה טלפוני אינו זמין</li>
              <li className="flex items-center gap-2"><MessageCircle className="w-4 h-4 text-green-400" /> קהילה פעילה בוואטסאפ</li>
            </ul>
          </div>

          {/* Social Media */}
          <div>
            <h4 className="font-semibold text-lg mb-4 text-white">עקבו אחרינו</h4>
            <div className="flex gap-4">
              <Button disabled variant="ghost" className="hover:text-blue-500"><Facebook /></Button>
              <Button disabled variant="ghost" className="hover:text-pink-400"><Instagram /></Button>
              <Button disabled variant="ghost" className="hover:text-blue-300"><Linkedin /></Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">הרשתות החברתיות יושקו בקרוב 🎉</p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 border-t border-gray-700 pt-6 text-center text-sm text-gray-500">
          <div className="flex justify-center items-center gap-2 mb-2 text-pink-400">
            <Heart className="w-4 h-4 fill-current" />
            נבנה באהבה לסטודנטים בישראל
          </div>
          <p>© {new Date().getFullYear()} BaliHofesh. כל הזכויות שמורות.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
