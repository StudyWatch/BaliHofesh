import React from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const TermsOfUse = ({ showAccept = false }: { showAccept?: boolean }) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  const handleAccept = () => {
    localStorage.setItem("acceptedTerms", "true");
    navigate("/register");
  };

  return (
    <div className="container mx-auto max-w-2xl py-10 px-4 text-right" dir="rtl">
      <div className="mb-6 flex justify-end">
        <Button onClick={handleBack} variant="outline">
          ← חזרה
        </Button>
      </div>

      <h1 className="text-3xl font-bold mb-6 text-center">תנאי שימוש – באלי חופש</h1>

      <div className="space-y-5 bg-white rounded-xl p-6 shadow-md border text-gray-900 text-base leading-8">
        <p>
          פלטפורמת באלי חופש זמינה בשלב <b>פיילוט ראשוני</b> בלבד, למטרות בדיקה, התנסות ופיתוח. השירותים, הכלים והנתונים המוצגים בה ניתנים "כמות שהם" (AS IS), ללא אחריות או התחייבות מכל סוג.
        </p>

        <h2 className="text-lg font-semibold mt-6 mb-2">1. שלב ניסיוני – פיילוט</h2>
        <ul className="list-disc pr-5 space-y-1">
          <li>כלי הפלטפורמה (לוח שנה, התראות, שותפים, חנות, קבוצות, מורים פרטיים ועוד) נמצאים בגרסת ניסיון בלבד.</li>
          <li>ייתכנו תקלות, שגיאות, השמטות מידע, זמינות מוגבלת או הפסקת שירות בכל עת.</li>
          <li>ייתכן שמידע מסוים לא יישמר, לא יוצג, או יתעדכן באיחור.</li>
        </ul>

        <h2 className="text-lg font-semibold mt-6 mb-2">2. העדר אחריות</h2>
        <ul className="list-disc pr-5 space-y-1">
          <li>השימוש בפלטפורמת באלי חופש הוא באחריות המשתמש בלבד.</li>
          <li>אין לראות במידע, כלים, תאריכים, התראות, המלצות, שותפויות, קבוצות או שירותים משום ייעוץ מקצועי, אקדמי, משפטי או המלצה מוסמכת.</li>
          <li>אין אחריות לכל נזק, תקלת מערכת, מחיקת נתונים, פגיעה בזמינות או תוצאה עקב הסתמכות על האתר.</li>
          <li>שירות ההתראות, המיילים וההודעות עשוי שלא לפעול, להיחסם, או להישמט.</li>
        </ul>

        <h2 className="text-lg font-semibold mt-6 mb-2">3. הפסקת שירותים ושינויים</h2>
        <ul className="list-disc pr-5 space-y-1">
          <li>מפעילי האתר שומרים לעצמם את הזכות לשנות, להפסיק, או למחוק כל שירות או מידע – בכל עת וללא הודעה.</li>
          <li>ייתכן שהפלטפורמה תיסגר או תתעדכן מבלי לשמר נתונים.</li>
        </ul>

        <h2 className="text-lg font-semibold mt-6 mb-2">4. שיתוף מידע ומדיניות צד ג'</h2>
        <ul className="list-disc pr-5 space-y-1">
          <li>האתר כולל קישורים לשירותים חיצוניים (Zoom, WhatsApp, Stripe וכו'), והשימוש בהם כפוף לתנאים של אותם גורמים.</li>
          <li>אין אחריות על חשיפת מידע שיבוצע על ידי המשתמש עצמו.</li>
        </ul>

        <h2 className="text-lg font-semibold mt-6 mb-2">5. תוכן שמועלה על ידי משתמשים</h2>
        <ul className="list-disc pr-5 space-y-1">
          <li>משתמשים יכולים להוסיף תוכן (מטלות, שותפים, תגובות ועוד).</li>
          <li>המערכת אינה מתחייבת לבדוק, לאמת או לערוך את התוכן המועלה.</li>
          <li>אין אחריות על תוקף, דיוק או נזק שעלול להיגרם מתוכן גולשים.</li>
          <li>ניתן לדווח על תוכן פוגעני, אך אין התחייבות להסרה מיידית.</li>
        </ul>

        <h2 className="text-lg font-semibold mt-6 mb-2">6. הגבלת תביעות ופיצוי</h2>
        <ul className="list-disc pr-5 space-y-1">
          <li>המשתמש מוותר מראש על כל תביעה או דרישה כלפי בעלי הפלטפורמה מכל סוג שהוא.</li>
          <li>כל פנייה תיענה לפי שיקול דעת וללא התחייבות למענה.</li>
        </ul>

        <h2 className="text-lg font-semibold mt-6 mb-2">7. תנאים נוספים</h2>
        <ul className="list-disc pr-5 space-y-1">
          <li>התנאים עשויים להשתנות בכל עת. האחריות להתעדכן חלה על המשתמש.</li>
          <li>השימוש באתר מהווה הסכמה מלאה ומודעת לכל התנאים.</li>
          <li>אם אינך מסכים – הימנע מהשימוש באתר.</li>
        </ul>

        <h2 className="text-lg font-semibold mt-6 mb-2">8. נגישות</h2>
        <ul className="list-disc pr-5 space-y-1">
          <li>באתר כלולים רכיבי נגישות כמו שינוי גודל טקסט, ניגודיות, מצב כהה ועוד – כאמצעי עזר בלבד.</li>
          <li>אין לראות ברכיבים אלו פתרון נגישות מלא לפי תקנות שוויון זכויות לאנשים עם מוגבלות או תקן WCAG.</li>
          <li>ייתכנו תקלות או חוסר התאמה בין הדפדפנים, והמפתחים אינם מתחייבים שהפונקציונליות תפעל תמיד.</li>
          <li>המשתמש מצהיר כי הוא מודע לכך והאחריות חלה עליו בלבד.</li>
          <li>ניתן לפנות לתמיכה במידה ונדרשת עזרה טכנית, בכפוף למשאבים.</li>
        </ul>

        {showAccept && (
          <div className="flex justify-center mt-10">
            <Button onClick={handleAccept} className="bg-indigo-600 text-white">
              קראתי ואני מאשר
            </Button>
          </div>
        )}

        <div className="mt-6 text-xs text-gray-500 text-center">
          עדכון אחרון: 27 ביולי 2025
        </div>
      </div>
    </div>
  );
};

export default TermsOfUse;
