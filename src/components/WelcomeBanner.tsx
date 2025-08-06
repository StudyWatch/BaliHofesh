import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import AuthDialog from '@/components/auth/AuthDialog';

// מילון לשפות
const translations = {
  he: {
    langBtn: 'English',
    title: 'ברוכים הבאים ל־BaliHofesh',
    subtitle: 'למדו חכם יותר – הירשמו עכשיו בחינם!',
    slides: [
      { icon: '📅', title: 'לוח שנה חכם', desc: 'כל הבחינות, המטלות והמפגשים – בלוח אישי אחד ברור.' },
      { icon: '🔔', title: 'התראות בזמן אמת', desc: 'קבלו תזכורות לפני הגשות, מבחנים ומפגשים – בלי לפספס.' },
      { icon: '👥', title: 'שותפי למידה', desc: 'מצאו סטודנטים שלומדים איתכם את אותם קורסים.' },
      { icon: '🧑‍🏫', title: 'מורים פרטיים מומלצים', desc: 'קבלו המלצות למורים שמתאימים בדיוק לקורסים שלכם.' },
      { icon: '🗓️', title: 'מפגשים שיתופיים', desc: 'הצטרפו למפגשי לימוד בזום/Google Meet שנפתחו לקורסים שלכם.' },
    ],
    signup: 'הירשמו עכשיו – בחינם',
    login: 'יש לי כבר חשבון',
    note: 'אין לנו אפשרות להגיע לכל קורס והמטלות שלו, ונשמח שתעזרו לכם ולקהילה – הוסיפו את המטלות שאתם יודעים עליהן, וכך זה יוצג בלוח השנה לכולם 🙏',
    ariaNext: "הבא",
    ariaPrev: "הקודם",
    ariaClose: "סגור",
    ariaDot: (i: number) => `שקופית ${i}`
  },
  en: {
    langBtn: 'עברית',
    title: 'Welcome to BaliHofesh',
    subtitle: 'Learn smarter – join now for free!',
    slides: [
      { icon: '📅', title: 'Smart Calendar', desc: 'All your exams, assignments, and meetings in one clear calendar.' },
      { icon: '🔔', title: 'Real-Time Notifications', desc: 'Get reminders for exams, assignments, and meetings – never miss a thing.' },
      { icon: '👥', title: 'Study Partners', desc: 'Find students taking the same courses as you.' },
      { icon: '🧑‍🏫', title: 'Recommended Private Tutors', desc: 'Get recommendations for tutors that fit your courses.' },
      { icon: '🗓️', title: 'Collaborative Study Sessions', desc: 'Join Zoom/Google Meet study sessions for your courses.' },
    ],
    signup: 'Sign up now – it’s free',
    login: 'I already have an account',
    note: 'We can’t reach every course or assignment. Please help the community by adding assignments you know about, so everyone benefits 🙏',
    ariaNext: "Next",
    ariaPrev: "Previous",
    ariaClose: "Close",
    ariaDot: (i: number) => `Slide ${i}`
  },
};

const WelcomeBanner: React.FC = () => {
  const [show, setShow] = useState(false);
  const [current, setCurrent] = useState(0);
  const [isAuthOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'signup'>('signup');

  // השפה תמיד נפתחת כעברית, אלא אם המשתמש בחר אחרת (ונשמר ב-localStorage)
  const [lang, setLang] = useState<'he' | 'en'>(() => {
    const stored = localStorage.getItem('bannerLang');
    if (stored === 'en' || stored === 'he') return stored;
    return 'he'; // תמיד עברית כברירת מחדל!
  });
  const t = translations[lang];

  useEffect(() => {
    const hasVisited = sessionStorage.getItem('visited');
    if (!hasVisited) {
      setShow(true);
      sessionStorage.setItem('visited', 'true');
    }
  }, []);

  useEffect(() => {
    if (!show) return;
    const timer = setTimeout(() => setCurrent((c) => (c + 1) % t.slides.length), 6000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line
  }, [current, show, lang]);

  // מעביר שפה ושומר ב-localStorage
  const switchLang = () => {
    setLang((prev) => {
      const next = prev === 'he' ? 'en' : 'he';
      localStorage.setItem('bannerLang', next);
      return next;
    });
  };

  if (!show) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-2 animate-fade-in">
        <div className={`
          relative rounded-3xl shadow-2xl w-full max-w-xl p-6 overflow-hidden border
          bg-white border-purple-200
          dark:bg-[#19182b] dark:border-[#4c3c81]
        `}>
          {/* רקע מונפש */}
          <div className="absolute inset-0 z-0 animate-gradient
            bg-gradient-to-tr from-purple-100 via-indigo-100 to-blue-100 opacity-30 blur-2xl
            dark:from-[#37235e] dark:via-[#1a1d3a] dark:to-[#0b0615] dark:opacity-50" />

          {/* כפתור שפה – בלי טולטיפ, בלי תגית – פשוט כפתור קבוע */}
          <button
            className={`
              absolute right-4 top-3 z-20 text-xs
              rounded-full bg-purple-100 dark:bg-[#261d3b] border border-purple-200 dark:border-[#3d2f61]
              px-3 py-1 text-purple-700 dark:text-purple-200 font-bold shadow-md hover:bg-purple-200
              transition
            `}
            style={{ minWidth: 48 }}
            onClick={switchLang}
            aria-label="Switch language"
          >
            {t.langBtn}
          </button>

          {/* כפתור סגירה */}
          <button
            onClick={() => setShow(false)}
            className={`
              absolute left-4 top-3 text-2xl
              text-gray-400 hover:text-red-500 z-10
            `}
            aria-label={t.ariaClose}
          >×</button>

          {/* תמיד RTL, גם באנגלית */}
          <div className="relative z-10 flex flex-col items-center text-center gap-2" dir="rtl">
            <h2 className="text-2xl font-bold text-purple-800 dark:text-purple-300">
              {t.title}
            </h2>
            <p className="text-gray-700 dark:text-gray-300 text-sm mb-4">
              {t.subtitle}
            </p>

            <div className="my-3 min-h-[130px] flex flex-col items-center justify-center">
              <div className="text-4xl">{t.slides[current].icon}</div>
              <div className="text-lg font-semibold text-purple-700 dark:text-purple-300">
                {t.slides[current].title}
              </div>
              <p className="text-gray-600 dark:text-gray-300 text-sm max-w-xs">{t.slides[current].desc}</p>
            </div>

            {/* חיצים קבועים */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <button
                onClick={() => setCurrent((current + 1) % t.slides.length)}
                className="text-3xl text-purple-400 dark:text-purple-300 hover:text-purple-700 dark:hover:text-purple-200 transition"
                aria-label={t.ariaNext}
              >⟸</button>
            </div>
            <div className="absolute left-4 top-1/2 -translate-y-1/2">
              <button
                onClick={() => setCurrent((current - 1 + t.slides.length) % t.slides.length)}
                className="text-3xl text-purple-400 dark:text-purple-300 hover:text-purple-700 dark:hover:text-purple-200 transition"
                aria-label={t.ariaPrev}
              >⟹</button>
            </div>

            <div className="flex gap-2 my-2">
              {t.slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrent(idx)}
                  className={`w-2.5 h-2.5 rounded-full transition
                    ${idx === current
                      ? 'bg-purple-600 dark:bg-purple-400 scale-125'
                      : 'bg-gray-300 dark:bg-gray-600 hover:bg-purple-400 dark:hover:bg-purple-500'}
                  `}
                  aria-label={t.ariaDot(idx + 1)}
                />
              ))}
            </div>

            <div className="flex flex-col gap-2 w-full mt-3">
              <Button
                onClick={() => { setAuthTab('signup'); setAuthOpen(true); }}
                className="
                  bg-gradient-to-r from-purple-600 to-indigo-600
                  hover:from-purple-700 hover:to-indigo-700
                  text-white font-bold py-2 rounded-xl
                  dark:from-purple-500 dark:to-indigo-500 dark:hover:from-purple-700 dark:hover:to-indigo-700
                "
              >
                {t.signup}
              </Button>
              <Button
                onClick={() => { setAuthTab('login'); setAuthOpen(true); }}
                variant="outline"
                className="
                  border-purple-300 text-purple-700 hover:bg-purple-50 font-bold py-2 rounded-xl
                  dark:border-purple-400 dark:text-purple-300 dark:hover:bg-[#231b3b]
                "
              >
                {t.login}
              </Button>
            </div>

            <div className="text-[13px] text-gray-500 dark:text-gray-400 mt-5 leading-snug max-w-xs">
              {t.note}
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
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
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
