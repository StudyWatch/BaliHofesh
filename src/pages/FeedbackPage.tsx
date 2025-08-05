import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useFavoriteCourses } from "@/hooks/useFavorites";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { AlertCircle, Loader2, Sparkles, CheckCircle2, XCircle, Paperclip, X, Search } from "lucide-react";

const CATEGORIES = [
  {
    value: "academic",
    label: "🧾 מידע אקדמי / מטלות",
    subCategories: [
      { value: "wrong_exam_date", label: "📅 מועד בחינה שגוי" },
      { value: "missing_assignment", label: "📝 מטלה/ממ\"ן חסר" },
      { value: "course_not_found", label: "📚 קורס לא קיים במערכת" }
    ]
  },
  {
    value: "study_partner",
    label: "👥 שותפי למידה ומפגשים",
    subCategories: [
      { value: "partner_issue", label: "בעיה או שאלה על שותף לימוד" },
      { value: "meeting_suggestion", label: "שאלה/בעיה במפגש לימוד" }
    ]
  },
  {
    value: "tutor",
    label: "🎓 מורים פרטיים",
    subCategories: [
      { value: "tutor_profile", label: "בעיה בפרופיל מורה" },
      { value: "tutor_contact", label: "בעיית תקשורת עם מורה" }
    ]
  },
  {
    value: "store",
    label: "🛒 חנות סטודנטיאלית",
    subCategories: [
      { value: "coupon_issue", label: "בעיה בקופון/מוצר" },
      { value: "store_feature", label: "הצעה/שיפור לחנות" }
    ]
  },
  {
    value: "notifications",
    label: "🔔 מערכת התראות",
    subCategories: [
      { value: "not_getting", label: "לא מקבל/ת התראות" },
      { value: "notification_suggestion", label: "הצעת שיפור" }
    ]
  },
  {
    value: "technical",
    label: "💻 בעיה טכנית",
    subCategories: [
      { value: "bug", label: "תקלה/באג" },
      { value: "ui_issue", label: "בעיה בעיצוב/נראות" }
    ]
  },
  {
    value: "accessibility",
    label: "♿ נגישות",
    subCategories: [
      { value: "font", label: "גופן/ניגודיות" },
      { value: "mobile", label: "בעיה בנייד" }
    ]
  },
  {
    value: "feature",
    label: "✨ הצעת פיצ'ר / שיפור",
    subCategories: []
  },
  {
    value: "inappropriate",
    label: "⚠️ דיווח על תוכן/משתמש",
    subCategories: [
      { value: "user_report", label: "משתמש/תגובה לא ראויה" },
      { value: "file_report", label: "סיכום/קובץ לא מתאים" }
    ]
  },
  {
    value: "other",
    label: "💬 אחר",
    subCategories: []
  }
];

const SUBCATEGORY_TIPS: Record<string, string> = {
  wrong_exam_date: "אנא ציין את התאריך/שעה כפי שמופיע ומהו המועד הנכון לדעתך.",
  missing_assignment: "נא לפרט איזו מטלה חסרה (סוג, מספר, תאריך משוער).",
  course_not_found: "ציין שם/קוד הקורס, מוסד הלימודים (אם ידוע).",
  partner_issue: "ציין קורס רלוונטי/פרטי שותף/הערה.",
  meeting_suggestion: "ציין קישור, תיאור הבעיה ומועד המפגש.",
  tutor_profile: "ציין שם המורה/קורס והפרט את הבעיה.",
  tutor_contact: "ציין שם מורה ופרטי קשר, אם יש בעיה בתקשורת.",
  coupon_issue: "ציין מוצר/קופון/בעיה בהטבה.",
  store_feature: "נשמח להצעות לשיפור/מוצר חסר.",
  not_getting: "האם הפעלת התראות? באיזה דפדפן?",
  notification_suggestion: "ספר/י לנו מה ישפר את המערכת.",
  bug: "תאר/י את הבעיה, מה ניסית לעשות ומה קרה בפועל.",
  ui_issue: "מה לא נראה תקין? תאר/י וצרף/י צילום מסך אם אפשר.",
  font: "תאר/י מה לא קריא, באיזה דף/אלמנט.",
  mobile: "באיזה מכשיר/מערכת הפעלה? תאר/י את התקלה.",
  user_report: "מה ההתנהגות/תוכן שדורש טיפול?",
  file_report: "פרט/י למה הקובץ/סיכום בעייתי.",
};

export default function FeedbackPage() {
  const { dir } = useLanguage();
  const { toast } = useToast();
  const { data: favoriteCourses = [] } = useFavoriteCourses();
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const defaultCategory = searchParams.get("category") || "";
  const defaultCourseId = searchParams.get("courseId") || "";

  // טופס פידבק
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    category: defaultCategory as string,
    subCategory: "",
    message: "",
    courseId: defaultCourseId,
    courseName: "",
    email: "",
    consent: true,
    file: null as File | null
  });
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [courseSearch, setCourseSearch] = useState("");

  // חיפוש קורסים
  const filteredCourses = favoriteCourses.filter(course =>
    (course.courses?.name_he ?? "")
      .toLowerCase()
      .includes(courseSearch.toLowerCase()) ||
    (course.courses?.code ?? "")
      .toString()
      .includes(courseSearch)
  );

  // מיפוי שם קורס
  useEffect(() => {
    if (form.courseId && favoriteCourses.length) {
      const c = favoriteCourses.find(c => c.course_id === form.courseId);
      setForm(f => ({
        ...f,
        courseName: c ? `${c.courses?.code} - ${c.courses?.name_he}` : ""
      }));
    } else {
      setForm(f => ({ ...f, courseName: "" }));
    }
    // eslint-disable-next-line
  }, [form.courseId, favoriteCourses]);

  // שליחת פידבק
  const handleSubmit = async () => {
    setError("");
    if (!form.category || (categoryHasSubs && !form.subCategory) || !form.message.trim()) {
      setError("נא למלא את כל השדות הדרושים.");
      return;
    }
    setLoading(true);

    // העלאת קובץ
    let fileUrl = "";
    if (form.file) {
      const fileExt = form.file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.floor(Math.random()*10000)}.${fileExt}`;
      const { data, error: uploadError } = await supabase.storage
        .from('reports_files')
        .upload(fileName, form.file, { upsert: false });
      if (uploadError) {
        setLoading(false);
        setError("שגיאה בהעלאת הקובץ. נסה שוב או בחר קובץ אחר.");
        return;
      }
      fileUrl = data?.path ? supabase.storage.from('reports_files').getPublicUrl(data.path).data.publicUrl : "";
    }

    const user = await supabase.auth.getUser();
    const userId = user?.data?.user?.id ?? null;

    // טכני – דפדפן, מערכת, הפניה
    const userAgent = typeof navigator !== "undefined" ? navigator.userAgent : "";
    const pageReferrer = document.referrer || window.location.href;

    const insertObj: any = {
      user_id: userId,
      email: form.email || user?.data?.user?.email || "",
      subject: form.category,
      sub_category: form.subCategory || null,
      content: form.message,
      course_id: form.courseId || null,
      file_url: fileUrl || null,
      user_agent: userAgent,
      page_referrer: pageReferrer,
status: "pending"
    };

    setLoading(true);
    const { error: insertError } = await supabase.from("user_reports").insert(insertObj);
    setLoading(false);

    if (insertError) {
      setError("שגיאה בשליחה: " + insertError.message);
      return;
    }
    setSent(true);
    toast({ title: "הפנייה נשלחה", description: "תודה! נטפל בזה בקרוב." });
    setTimeout(() => navigate(-1), 2200);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file && file.size > 3 * 1024 * 1024) {
      setError("הקובץ גדול מדי (מעל 3MB)");
      return;
    }
    setForm(f => ({ ...f, file }));
    setError("");
  };

  const closeCourseModal = () => {
    setShowCourseModal(false);
    setCourseSearch("");
  };

  // האם יש לתת קטגוריות לקטגוריה הנבחרת
  const selectedCategoryObj = CATEGORIES.find(cat => cat.value === form.category);
  const categoryHasSubs = selectedCategoryObj && selectedCategoryObj.subCategories.length > 0;

  return (
    <div
      dir={dir}
      className="min-h-screen bg-gradient-to-br from-indigo-100 via-white to-pink-100 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 py-10 px-2 flex items-center justify-center"
      style={{ minHeight: "100dvh" }}
    >
      <Card className="w-full max-w-xl mx-auto shadow-2xl border border-gray-200 dark:border-gray-700 animate-fade-in backdrop-blur-sm relative">
        {/* כפתור סגירה */}
        <button
          aria-label="סגור"
          className="absolute top-3 left-3 text-gray-400 hover:text-red-500 z-20 bg-white/50 rounded-full p-1 transition"
          onClick={() => navigate(-1)}
        >
          <X className="w-7 h-7" />
        </button>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl md:text-3xl font-bold flex items-center gap-2 text-indigo-700 dark:text-indigo-300 justify-center">
            <AlertCircle className="w-6 h-6" />
            פנייה לצוות האתר
          </CardTitle>
          <div className="mt-1 text-gray-500 dark:text-gray-400 text-sm">
            נשמח לשפר עבורך את חוויית השימוש!  
            <span className="ml-1 animate-pulse"><Sparkles className="inline w-4 h-4 text-pink-400" /></span>
          </div>
        </CardHeader>
        <CardContent className="space-y-7">
          {sent ? (
            <div className="flex flex-col items-center justify-center min-h-[180px] animate-fade-in-fast">
              <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
              <div className="text-xl font-semibold text-green-700 mb-2">הפנייה התקבלה!</div>
              <div className="text-gray-600 dark:text-gray-300 mb-2">נטפל בפנייה שלך בקרוב. תודה על שיפור האתר 🙏</div>
            </div>
          ) : (
            <form
              className="space-y-4"
              onSubmit={e => { e.preventDefault(); handleSubmit(); }}
              autoComplete="off"
            >
              {/* בחירת קטגוריה ראשית */}
              <div>
                <label className="block font-semibold mb-1 text-sm">נושא הפנייה</label>
                <select
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value, subCategory: "" }))}
                  className="h-12 w-full px-3 py-2 rounded-xl border-2 bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-700 text-base focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 outline-none transition"
                  required
                >
                  <option value="" disabled>בחר נושא ראשי...</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
              {/* תת קטגוריה */}
              {categoryHasSubs && (
                <div>
                  <label className="block font-semibold mb-1 text-sm">סיווג מדויק יותר</label>
                  <select
                    value={form.subCategory}
                    onChange={e => setForm(f => ({ ...f, subCategory: e.target.value }))}
                    className="h-11 w-full px-3 py-2 rounded-xl border-2 bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-700 text-base focus:border-indigo-400 outline-none transition"
                    required
                  >
                    <option value="" disabled>בחר תת־נושא...</option>
                    {selectedCategoryObj?.subCategories.map(sub => (
                      <option key={sub.value} value={sub.value}>{sub.label}</option>
                    ))}
                  </select>
                  {form.subCategory && SUBCATEGORY_TIPS[form.subCategory] && (
                    <div className="text-xs text-indigo-700 dark:text-indigo-200 mt-2 px-1">
                      {SUBCATEGORY_TIPS[form.subCategory]}
                    </div>
                  )}
                </div>
              )}

              {/* קורס רלוונטי – מוצג רק כשצריך */}
              {(
                (form.category === "academic" && ["wrong_exam_date", "missing_assignment", "course_not_found"].includes(form.subCategory))
                || (form.category === "study_partner" && form.subCategory === "partner_issue")
                || (form.category === "tutor")
              ) && (
                <div>
                  <label className="block font-semibold mb-1 text-sm">קורס רלוונטי (אם יש)</label>
                  <button
                    type="button"
                    onClick={() => setShowCourseModal(true)}
                    className="w-full h-11 rounded-xl border-2 px-3 bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 flex items-center justify-between cursor-pointer transition"
                  >
                    <span className={form.courseName ? "font-bold text-indigo-800" : "text-gray-500"}>
                      {form.courseName || "בחר קורס מהמועדפים שלך (לא חובה)"}
                    </span>
                    <Search className="w-5 h-5 text-gray-400 ml-1" />
                  </button>
                  {/* מודל בחירת קורס */}
                  {showCourseModal && (
                    <div className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center">
                      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-5 relative flex flex-col max-h-[80vh]">
                        <button
                          className="absolute top-3 left-3 text-gray-400 hover:text-red-500 z-20 bg-white/70 rounded-full p-1"
                          aria-label="סגור"
                          onClick={closeCourseModal}
                        >
                          <X className="w-6 h-6" />
                        </button>
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-indigo-600 dark:text-indigo-300">
                          <Search className="w-5 h-5" /> חיפוש ובחירת קורס
                        </h3>
                        <Input
                          autoFocus
                          type="text"
                          placeholder="הקלד שם קורס או מספר..."
                          value={courseSearch}
                          onChange={e => setCourseSearch(e.target.value)}
                          className="mb-3"
                        />
                        <div className="overflow-y-auto flex-1 max-h-60 custom-scroll">
                          {filteredCourses.length === 0 && (
                            <div className="text-center text-gray-400 py-8">לא נמצאו קורסים...</div>
                          )}
                          <ul>
                            {filteredCourses.map(course => (
                              <li
                                key={course.course_id}
                                className={`
                                  px-3 py-2 cursor-pointer rounded-xl mb-1 transition
                                  hover:bg-indigo-50 dark:hover:bg-indigo-950
                                  ${form.courseId === course.course_id ? "bg-indigo-100 dark:bg-indigo-900 font-bold text-indigo-700" : ""}
                                `}
                                onClick={() => {
                                  setForm(f => ({
                                    ...f,
                                    courseId: course.course_id,
                                    courseName: `${course.courses?.code} - ${course.courses?.name_he}`
                                  }));
                                  closeCourseModal();
                                }}
                              >
                                {course.courses?.code} - {course.courses?.name_he}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full mt-4"
                          onClick={closeCourseModal}
                        >
                          סגור
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* תיאור הפנייה */}
              <div>
                <label className="block font-semibold mb-1 text-sm">תיאור מלא של הבעיה/בקשה</label>
                <Textarea
                  rows={5}
                  required
                  className="resize-none border-2 focus:border-indigo-400 bg-white dark:bg-slate-900 dark:border-slate-800"
                  placeholder="פרט/י לנו הכל: מה מצאת, מה לשפר, קישור לדוגמה וכו׳..."
                  value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  aria-label="תיאור מלא של הפנייה"
                />
              </div>

              {/* העלאת קובץ */}
              <div className="flex flex-col gap-1">
                <label className="block font-semibold mb-1 text-sm">העלאת קובץ (אופציונלי, עד 3MB)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    id="file"
                    className="block text-xs rounded border border-gray-300 file:mr-2 file:bg-indigo-100 file:text-indigo-700 file:rounded file:border-none file:py-1 file:px-2 file:hover:bg-indigo-200"
                    onChange={handleFileChange}
                  />
                  {form.file && (
                    <span className="text-xs text-green-600 flex items-center gap-1 animate-fade-in-fast">
                      <Paperclip className="w-4 h-4" /> {form.file.name}
                    </span>
                  )}
                </div>
              </div>

              {/* אימייל אם אין פרופיל */}
              {!form.consent && (
                <div>
                  <label className="block font-semibold mb-1 text-sm">כתובת מייל ליצירת קשר</label>
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className="h-11 bg-white dark:bg-slate-800"
                  />
                </div>
              )}

              {/* שליחה עם פרטי משתמש */}
              <div className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.consent}
                  onChange={e => setForm(f => ({ ...f, consent: e.target.checked }))}
                  className="accent-indigo-600"
                  id="consent"
                />
                <label htmlFor="consent" className="cursor-pointer">שלח את הפנייה עם פרטי המשתמש שלי (מומלץ)</label>
              </div>

              {/* שגיאה */}
              {error && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 rounded p-2 text-sm animate-fade-in-fast">
                  <XCircle className="w-5 h-5" /> {error}
                </div>
              )}

              {/* שליחה */}
              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-xl text-white px-8 h-12 text-lg font-bold"
                  aria-disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" /> שולח...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5" /> שלח פנייה
                    </span>
                  )}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
      {/* אפקטים */}
      <style>{`
        .animate-fade-in { animation: fadeIn 0.7s ease-out; }
        .animate-fade-in-fast { animation: fadeIn 0.3s ease-in; }
        @keyframes fadeIn { from {opacity:0; transform:translateY(20px);} to {opacity:1; transform:translateY(0);} }
        .custom-scroll { scrollbar-width: thin; scrollbar-color: #a7b8ff #f3f4fa; }
        .custom-scroll::-webkit-scrollbar { width: 8px; background: #f3f4fa;}
        .custom-scroll::-webkit-scrollbar-thumb { background: #a7b8ff; border-radius: 8px; }
      `}</style>
    </div>
  );
}
