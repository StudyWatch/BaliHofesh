// src/pages/maintenance.tsx
import React from 'react';

const MaintenancePage = () => {
  return (
    <div
      className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900 text-center px-4"
      dir="rtl"
    >
      <div className="max-w-md space-y-6">
        <h1 className="text-4xl font-bold text-gray-800 dark:text-white">🚧 האתר בהפסקת תחזוקה</h1>
        <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
          אנחנו מבצעים שדרוגים ושיפורים 💡<br />
          נחזור לפעולה מלאה ממש בקרוב. תודה על הסבלנות 🙏
        </p>
        <div className="text-sm text-gray-500 dark:text-gray-400 space-y-2">
          <p>📩 לפניות ושאלות:</p>
          <p>
            מוזמנים לפנות אלינו בוואטסאפ:
            <br />
            <a
              href="https://chat.whatsapp.com/K9c6SXQd8gUFrWLFZeBRDO"
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-green-600 dark:text-green-400 font-medium"
            >
              קבוצת הוואטסאפ של באלי חופש
            </a>
          </p>
          <p>
            או במייל:
            <br />
            <a
              href="mailto:balihofeshe@gmail.com"
              className="underline text-blue-600 dark:text-blue-400 font-medium"
            >
              balihofeshe@gmail.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default MaintenancePage;
