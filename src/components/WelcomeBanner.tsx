import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useLocation } from 'react-router-dom';
import AuthDialog from '@/components/auth/AuthDialog';

const slides = [
  {
    icon: '📅',
    title: 'לוח שנה חכם',
    desc: 'כל הבחינות, המטלות והמפגשים – בלוח אישי אחד ברור.',
  },
  {
    icon: '🔔',
    title: 'התראות בזמן אמת',
    desc: 'קבלו תזכורות לפני הגשות, מבחנים ומפגשים – בלי לפספס.',
  },
  {
    icon: '👥',
    title: 'שותפי למידה',
    desc: 'מצאו סטודנטים שלומדים איתכם את אותם קורסים.',
  },
  {
    icon: '🧑‍🏫',
    title: 'מורים פרטיים מומלצים',
    desc: 'קבלו המלצות למורים שמתאימים בדיוק לקורסים שלכם.',
  },
  {
    icon: '🗓️',
    title: 'מפגשים שיתופיים',
    desc: 'הצטרפו למפגשי לימוד בזום/Google Meet שנפתחו לקורסים שלכם.',
  }
];

const WelcomeBanner: React.FC = () => {
  const [show, setShow] = useState(false);
  const [current, setCurrent] = useState(0);
  const [isAuthOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'signup'>('signup');
  const location = useLocation();

  useEffect(() => {
    const hasVisited = sessionStorage.getItem('visited');
    if (!hasVisited) {
      setShow(true);
      sessionStorage.setItem('visited', 'true');
    }
  }, []);

  useEffect(() => {
    if (!show) return;
    const timer = setTimeout(() => setCurrent((c) => (c + 1) % slides.length), 6000);
    return () => clearTimeout(timer);
  }, [current, show]);

  if (!show) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4 animate-fade-in">
        <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-xl p-6 overflow-hidden border border-purple-200">

          <div className="absolute inset-0 z-0 animate-gradient bg-gradient-to-tr from-purple-100 via-indigo-100 to-blue-100 opacity-30 blur-2xl" />

          <button
            onClick={() => setShow(false)}
            className="absolute top-3 left-4 text-2xl text-gray-400 hover:text-red-500 z-10"
            aria-label="סגור"
          >×</button>

          <div className="relative z-10 flex flex-col items-center text-center gap-2">
            <h2 className="text-2xl font-bold text-purple-800">ברוכים הבאים ל־BaliHofesh</h2>
            <p className="text-gray-700 text-sm mb-4">למדו חכם יותר – הירשמו עכשיו בחינם!</p>

            <div className="my-3 min-h-[130px] flex flex-col items-center justify-center">
              <div className="text-4xl">{slides[current].icon}</div>
              <div className="text-lg font-semibold text-purple-700">{slides[current].title}</div>
              <p className="text-gray-600 text-sm max-w-xs">{slides[current].desc}</p>
            </div>

            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <button
                onClick={() => setCurrent((current + 1) % slides.length)}
                className="text-3xl text-purple-400 hover:text-purple-700"
                aria-label="הבא"
              >›</button>
            </div>
            <div className="absolute left-4 top-1/2 -translate-y-1/2">
              <button
                onClick={() => setCurrent((current - 1 + slides.length) % slides.length)}
                className="text-3xl text-purple-400 hover:text-purple-700"
                aria-label="הקודם"
              >‹</button>
            </div>

            <div className="flex gap-2 my-2">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrent(idx)}
                  className={`w-2.5 h-2.5 rounded-full transition
                    ${idx === current ? 'bg-purple-600 scale-125' : 'bg-gray-300 hover:bg-purple-400'}
                  `}
                  aria-label={`שקופית ${idx + 1}`}
                />
              ))}
            </div>

            <div className="flex flex-col gap-2 w-full mt-3">
              <Button
                onClick={() => { setAuthTab('signup'); setAuthOpen(true); }}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-2 rounded-xl"
              >
                הירשמו עכשיו – בחינם
              </Button>
              <Button
                onClick={() => { setAuthTab('login'); setAuthOpen(true); }}
                variant="outline"
                className="border-purple-300 text-purple-700 hover:bg-purple-50 font-bold py-2 rounded-xl"
              >
                יש לי כבר חשבון
              </Button>
            </div>

            <div className="text-[13px] text-gray-500 mt-5 leading-snug max-w-xs">
              אין לנו אפשרות להגיע לכל קורס והמטלות שלו, ונשמח שתעזרו לכם ולקהילה –
              הוסיפו את המטלות שאתם יודעים עליהן, וכך זה יוצג בלוח השנה לכולם 🙏
            </div>
          </div>
        </div>

        <style>{`
          .animate-fade-in {
            animation: fadeIn 0.7s ease-out;
          }
          .animate-gradient {
            animation: moveGradient 15s ease infinite;
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
          }
          @keyframes moveGradient {
            0%, 100% {
              background-position: 0% 50%;
            }
            50% {
              background-position: 100% 50%;
            }
          }
        `}</style>
      </div>

      {/* דיאלוג התחברות/הרשמה */}
      <AuthDialog
        isOpen={isAuthOpen}
        onClose={() => setAuthOpen(false)}
        defaultTab={authTab}
      />
    </>
  );
};

export default WelcomeBanner;
