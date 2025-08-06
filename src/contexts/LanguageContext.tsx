// src/contexts/LanguageContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';

type Lang = 'he' | 'en';

interface LocalizedName {
  name_he: string;
  name_en?: string | null;
}

interface LocalizedDescription {
  description_he?: string | null;
  description_en?: string | null;
}

export interface LanguageContextType {
  language: Lang;
  setLanguage: (lang: Lang) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  dir: 'ltr' | 'rtl';
  isRTL: boolean;
  getLocalizedText: (item: LocalizedName) => string;
  getLocalizedDescription: (item: LocalizedDescription) => string;
  formatLocalizedDate: (date: string | Date) => string;
  formatLocalizedTime: (time: string) => string;
}

const translations: Record<Lang, Record<string, string>> = {
  he: {
    // Common
    'common.loading': 'טוען...',
    'common.save': 'שמור',
    'common.cancel': 'בטל',
    'common.delete': 'מחק',
    'common.edit': 'ערוך',
    'common.add': 'הוסף',
    'common.close': 'סגור',
    'common.submit': 'שלח',
    'common.success': 'הצלחה',
    'common.error': 'שגיאה',
    'common.confirm': 'אישור',
    'common.yes': 'כן',
    'common.no': 'לא',
    'common.back': 'חזור',
    'common.next': 'הבא',
    'common.previous': 'הקודם',
    'common.show_more': 'הצג עוד',
    'common.show_less': 'הצג פחות',
    'common.search': 'חיפוש',

    // Navigation
    'nav.home': 'דף הבית',
    'nav.tutors': 'מורים פרטיים',
    'nav.tips': 'טיפים',
    'nav.login': 'התחברות',
    'nav.logout': 'התנתקות',
    'nav.menu': 'תפריט',
    'nav.store': 'חנות',
    'nav.profile': 'פרופיל',
    'nav.universities': 'אוניברסיטאות',
    'nav.my_courses': 'הקורסים שלי',
    'nav.admin': 'ניהול',
    'nav.feedback': 'פנייה לצוות',

    // Home page specific translations
    'home.title': 'באלי חופש',
    'home.subtitle': 'מאגר מועדי בחינות מקיף לכל הסטודנטים',
    'home.search_placeholder': 'חפש קורס, אוניברסיטה או מוסד לימודים...',
    'home.stats.students': 'סטודנטים',
    'home.stats.exams': 'בחינות',
    'home.stats.institutions': 'מוסדות',
    'home.popularInstitutions': 'מוסדות פופולריים',
    'home.hero.title': 'קורסי האוניברסיטה הפתוחה',
    'home.hero.description': 'מצא קורסים, מועדי בחינות, קבוצות לימוד ושותפי למידה באוניברסיטה הפתוחה',
    'home.hero.subtitle': 'כל מה שסטודנט צריך – בלחיצה אחת. מערכת מתקדמת, הטבות לסטודנטים, חנות קמפוס, שותפים ועוד.',

    // Original home.courses.* set (preserved)
    'home.courses.all_courses': 'כל הקורסים',
    'home.courses.choose_course': 'בחר קורס כדי לראות מועדי בחינות, קבוצות לימוד ושותפי למידה',
    'home.courses.loading': 'טוען קורסים...',
    'home.courses.no_results': 'לא נמצאו קורסים המתאימים לחיפוש',
    'home.courses.no_courses': 'אין קורסים זמינים כרגע',
    'home.courses.clear_search': 'נקה חיפוש',
    'home.courses.view_details': 'צפה בפרטי הקורס',
    'home.courses.semester': 'סמסטר',
    'home.courses.exam_date': 'מועד בחינה',
    'home.courses.collaboration_available': 'קבוצות ושיתוף פעולה זמינים',
    'home.courses.all_courses_button': 'לכל הקורסים',
    'home.courses.no_courses_available': 'לא נמצאו קורסים מתאימים',
    'home.courses.total_courses': 'כל הקורסים ({{count}})',

    // Benefits section
    'home.benefits.discounts': 'הטבות שוות',
    'home.benefits.store': 'חנות סטודנט',
    'home.benefits.smart_board': 'לוח מבחנים חכם',
    'home.benefits.study_groups': 'קבוצות לימוד',
    'home.benefits.community': 'קהילה תומכת',
    'home.benefits.free_access': 'גישה חופשית',
    'home.benefits.no_payment': 'ללא תשלום',
    'home.benefits.by_students': 'ע"י סטודנטים',

    // Search UI
    'home.search.course_placeholder': 'חפש קורס לפי שם או מספר קורס...',
    'home.search.clear_search': 'נקה חיפוש',
    'home.search.swipe_instruction': 'החלק ימינה ושמאלה כדי לגלול בין קורסים',

    // Course labels (for carousel & cards)
    'home.course.popular': 'פופולרי',
    'home.course.semester_label': 'סמסטר:',
    'home.course.exam_date_label': 'מועד בחינה:',
    'home.course.collaboration_available': 'שיתוף פעולה זמין',
    'home.course.view_details': 'צפה בפרטי הקורס',

    // New home.carousel swipe hint
    'home.carousel.swipe_hint': 'החלק ימינה ושמאלה כדי לגלול בין קורסים',

    // Search/no-results fallbacks
    'home.search.no_results': 'לא נמצאו קורסים המתאימים לחיפוש',
    'home.course.no_courses': 'אין קורסים זמינים כרגע',
    'home.course.loading': 'טוען קורסים...',

    // “All courses” section (footer and sticky button)
    'home.course.all_courses_label': 'כל הקורסים ({{count}})',
    'home.course.all_courses_sub': 'בחר קורס כדי לראות מועדי בחינות, קבוצות לימוד ושותפי למידה',
    'home.course.to_all_courses': 'לכל הקורסים',

  // Course page
'course.title': 'קורס',
'course.header_title': 'פרטי הקורס',
'course.exam_dates': 'מועדי בחינות',
'course.assignments': 'מטלות והגשות',
'course.shared_sessions': 'מפגשי לימוד משותפים',
'course.study_partners': 'שותפי לימוד',
'course.tutors': 'מורים פרטיים',
'course.reviews': 'ביקורות וטיפים',
'course.lecturer_ratings': 'דירוג מרצים מתקדם',
'course.marathon': 'מרתון לבחינה',
'course.code': 'קוד קורס',
'course.save_to_account': 'שמור בחשבון',
'course.whatsapp_group': 'קבוצת WhatsApp של הקורס',
'course.discord_server': 'שרת Discord של הקורס',
'course.loading': 'טוען פרטי הקורס...',
'course.not_found': 'קורס לא נמצא',
'course.not_found_description': 'הקורס שביקשת לא קיים במערכת או הוסר.',
'course.coming_soon': 'בקרוב יתווספו תכנים נוספים',
'course.marathon_notice': '💪 מרתון הכנה יעלה כאן בקרוב ממש. עקבו לעדכונים!',

// Institution types
'institution.types.university': 'אוניברסיטה',
'institution.types.college': 'מכללה',
'institution.types.open_university': 'האוניברסיטה הפתוחה',
'institution.types.private_college': 'מכללה פרטית',
'institution.types.academic_center': 'מרכז אקדמי',
'institution.types.seminar': 'סמינר',
'institution.types.unknown': 'מוסד לא מזוהה',

    // Study partners
    'study_partners.title': 'שותפי לימוד',
    'study_partners.waiting_for_study': 'מחכים ללימוד משותף',
    'study_partners.no_reviews_yet': 'טרם נאספו חוות דעת',
    'study_partners.no_reviews_description': 'טרם נאספו מספיק חוות דעת על מרצים בקורס זה',
    'study_partners.be_first_to_rate': 'היה הראשון לדרג מרצה!',
    'study_partners.rate_lecturer': 'דרג מרצה',
    'study_partners.send_message': 'שלח הודעה',
    'study_partners.edit': 'ערוך',
    'study_partners.delete': 'מחק',

    // Lecturer ratings
    'lecturer_ratings.title': 'דירוג מרצים מתקדם',
    'lecturer_ratings.description': 'מבוסס על דירוגים תלת-פרמטריים',
    'lecturer_ratings.parameters.teaching_quality': 'איכות הוראה',
    'lecturer_ratings.parameters.clarity': 'בהירות הסבר',
    'lecturer_ratings.parameters.availability': 'זמינות לסטודנטים',
    'lecturer_ratings.average_rating': 'דירוג ממוצע',
    'lecturer_ratings.total_reviews': 'סה״כ ביקורות',
    'lecturer_ratings.rate_lecturer_button': 'דרג מרצה',

    // Exams
    'exam.type.moedA': 'מועד א',
    'exam.type.moedB': 'מועד ב',
    'exam.no_dates': 'לא נקבעו מועדי בחינה',
    'exam.add_to_calendar': 'הוסף ליומן',

    // Assignments
    'assignments.title': 'מטלות והגשות',
    'assignments.no_assignments': 'אין מטלות כרגע',
    'assignments.add_assignment': 'הוסף מטלה',
    'assignments.due_date': 'תאריך הגשה',
    'assignments.description': 'תיאור',
    'assignments.submit': 'הגש',

    // Notifications
    'notifications.title': 'התראות',
    'notifications.no_notifications': 'אין התראות חדשות',
    'notifications.mark_all_read': 'סמן הכל כנקרא',
    'notifications.mark_read': 'סמן כנקרא',
    'notifications.delete': 'מחק התראה',
    'notifications.exam_reminder': 'תזכורת בחינה',
    'notifications.assignment_due': 'מטלה להגשה',
    'notifications.new_message': 'הודעה חדשה',

    // Profile
    'profile.title': 'פרופיל משתמש',
    'profile.edit': 'ערוך פרופיל',
    'profile.settings': 'הגדרות',
    'profile.my_courses': 'הקורסים שלי',
    'profile.my_study_partners': 'שותפי הלימוד שלי',
    'profile.my_sessions': 'המפגשים שלי',
    'profile.statistics': 'סטטיסטיקות',

    // Admin
    'admin.title': 'ניהול המערכת',
    'admin.dashboard': 'לוח בקרה',
    'admin.users': 'משתמשים',
    'admin.courses': 'קורסים',
    'admin.institutions': 'מוסדות',
    'admin.reports': 'דוחות',
    'admin.settings': 'הגדרות מערכת',

    // Forms
    'form.required': 'שדה חובה',
    'form.invalid_email': 'כתובת אימייל לא תקינה',
    'form.password_too_short': 'סיסמה קצרה מדי',
    'form.passwords_dont_match': 'הסיסמאות אינן זהות',
    'form.save_success': 'השינויים נשמרו בהצלחה',
    'form.save_error': 'שגיאה בשמירת השינויים',

    // Tips
    'tips.title': 'טיפים ללימודים',
    'tips.add_tip': 'הוסף טיפ',
    'tips.category': 'קטגוריה',
    'tips.helpful': 'מועיל',
    'tips.not_helpful': 'לא מועיל',
    'tips.no_tips': 'אין טיפים זמינים',

    // Errors
    'error.network': 'שגיאת רשת - נסה שוב מאוחר יותר',
    'error.unauthorized': 'אין הרשאה לפעולה זו',
    'error.not_found': 'הפריט המבוקש לא נמצא',
    'error.server': 'שגיאת שרת - נסה שוב מאוחר יותר',
    'error.unknown': 'אירעה שגיאה לא צפויה',

    // Time and Date
    'time.now': 'עכשיו',
    'time.minutes_ago': 'לפני {{count}} דקות',
    'time.hours_ago': 'לפני {{count}} שעות',
    'time.days_ago': 'לפני {{count}} ימים',
    'time.weeks_ago': 'לפני {{count}} שבועות',
    'time.months_ago': 'לפני {{count}} חודשים',
    'time.years_ago': 'לפני {{count}} שנים',
  },

  en: {
    // Common
    'common.loading': 'Loading...',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.add': 'Add',
    'common.close': 'Close',
    'common.submit': 'Submit',
    'common.success': 'Success',
    'common.error': 'Error',
    'common.confirm': 'Confirm',
    'common.yes': 'Yes',
    'common.no': 'No',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.previous': 'Previous',
    'common.show_more': 'Show More',
    'common.show_less': 'Show Less',
    'common.search': 'Search',

    // Navigation
    'nav.home': 'Home',
    'nav.tutors': 'Private Tutors',
    'nav.tips': 'Tips',
    'nav.login': 'Login',
    'nav.logout': 'Logout',
    'nav.menu': 'Menu',
    'nav.store': 'Store',
    'nav.profile': 'Profile',
    'nav.universities': 'Universities',
    'nav.my_courses': 'My Courses',
    'nav.admin': 'Admin',
    'nav.feedback': 'Contact Team',

    // Home page specific translations
    'home.title': 'Baali Hofesh',
    'home.subtitle': 'Comprehensive exam schedule database for all students',
    'home.search_placeholder': 'Search for courses, universities or institutions...',
    'home.stats.students': 'Students',
    'home.stats.exams': 'Exams',
    'home.stats.institutions': 'Institutions',
    'home.popularInstitutions': 'Popular Institutions',
    'home.hero.title': 'Open University Courses',
    'home.hero.description': 'Find courses, exam dates, study groups and study partners at the Open University',
    'home.hero.subtitle': 'Everything a student needs - in one click. Advanced system, student benefits, campus store, partners and more.',

    // Original home.courses.* set (preserved)
    'home.courses.all_courses': 'All Courses',
    'home.courses.choose_course': 'Choose a course to see exam dates, study groups and study partners',
    'home.courses.loading': 'Loading courses...',
    'home.courses.no_results': 'No courses found matching your search',
    'home.courses.no_courses': 'No courses available at the moment',
    'home.courses.clear_search': 'Clear search',
    'home.courses.view_details': 'View course details',
    'home.courses.semester': 'Semester',
    'home.courses.exam_date': 'Exam Date',
    'home.courses.collaboration_available': 'Groups and collaboration available',
    'home.courses.all_courses_button': 'View All Courses',
    'home.courses.no_courses_available': 'No courses found matching criteria',
    'home.courses.total_courses': 'All Courses ({{count}})',

    // Benefits section
    'home.benefits.discounts': 'Great Benefits',
    'home.benefits.store': 'Student Store',
    'home.benefits.smart_board': 'Smart Exam Board',
    'home.benefits.study_groups': 'Study Groups',
    'home.benefits.community': 'Supportive Community',
    'home.benefits.free_access': 'Free Access',
    'home.benefits.no_payment': 'No Payment Required',
    'home.benefits.by_students': 'By Students',

    // Search UI
    'home.search.course_placeholder': 'Search course by name or course number...',
    'home.search.clear_search': 'Clear search',
    'home.search.swipe_instruction': 'Swipe left and right to browse through courses',

    // Course labels (for carousel & cards)
    'home.course.popular': 'Popular',
    'home.course.semester_label': 'Semester:',
    'home.course.exam_date_label': 'Exam Date:',
    'home.course.collaboration_available': 'Collaboration Available',
    'home.course.view_details': 'View course details',    

    // New home.carousel swipe hint
    'home.carousel.swipe_hint': 'Swipe left and right to browse through courses',

    // Search/no-results fallbacks
    'home.search.no_results': 'No courses found matching your search',
    'home.course.no_courses': 'No courses available at the moment',
    'home.course.loading': 'Loading courses...',

    // “All courses” section (footer and sticky button)
    'home.course.all_courses_label': 'All Courses ({{count}})',
    'home.course.all_courses_sub': 'Choose a course to see exam dates, study groups and study partners',
    'home.course.to_all_courses': 'View All Courses',

   // Course page
'course.title': 'Course',
'course.header_title': 'Course Details',
'course.exam_dates': 'Exam Dates',
'course.assignments': 'Assignments & Submissions',
'course.shared_sessions': 'Shared Study Sessions',
'course.study_partners': 'Study Partners',
'course.tutors': 'Private Tutors',
'course.reviews': 'Reviews & Tips',
'course.lecturer_ratings': 'Lecturer Ratings',
'course.marathon': 'Exam Marathon',
'course.code': 'Course Code',
'course.save_to_account': 'Save to My Account',
'course.whatsapp_group': 'Course WhatsApp Group',
'course.discord_server': 'Course Discord Server',
'course.loading': 'Loading course details...',
'course.not_found': 'Course not found',
'course.not_found_description': 'The course you requested does not exist or was removed.',
'course.coming_soon': 'More content coming soon',
'course.marathon_notice': '💪 A preparation marathon will be published here very soon. Stay tuned!',

// Institution types
'institution.types.university': 'University',
'institution.types.college': 'College',
'institution.types.open_university': 'Open University',
'institution.types.private_college': 'Private College',
'institution.types.academic_center': 'Academic Center',
'institution.types.seminar': 'Seminar',
'institution.types.unknown': 'Unknown Institution',

    // Study partners
    'study_partners.title': 'Study Partners',
    'study_partners.waiting_for_study': 'waiting for shared study',
    'study_partners.no_reviews_yet': 'No Reviews Yet',
    'study_partners.no_reviews_description': 'Not enough reviews have been collected yet for lecturers in this course',
    'study_partners.be_first_to_rate': 'Be the first to rate a lecturer!',
    'study_partners.rate_lecturer': 'Rate Lecturer',
    'study_partners.send_message': 'Send Message',
    'study_partners.edit': 'Edit',
    'study_partners.delete': 'Delete',

    // Lecturer ratings
    'lecturer_ratings.title': 'Advanced Lecturer Ratings',
    'lecturer_ratings.description': 'Based on three-parameter student ratings',
    'lecturer_ratings.parameters.teaching_quality': 'Teaching Quality',
    'lecturer_ratings.parameters.clarity': 'Explanation Clarity',
    'lecturer_ratings.parameters.availability': 'Availability to Students',
    'lecturer_ratings.average_rating': 'Average Rating',
    'lecturer_ratings.total_reviews': 'Total Reviews',
    'lecturer_ratings.rate_lecturer_button': 'Rate Lecturer',

    // Exams
    'exam.type.moedA': 'First Exam',
    'exam.type.moedB': 'Second Exam',
    'exam.no_dates': 'No exam dates set',
    'exam.add_to_calendar': 'Add to Calendar',

    // Assignments
    'assignments.title': 'Assignments & Submissions',
    'assignments.no_assignments': 'No assignments at the moment',
    'assignments.add_assignment': 'Add Assignment',
    'assignments.due_date': 'Due Date',
    'assignments.description': 'Description',
    'assignments.submit': 'Submit',

    // Notifications
    'notifications.title': 'Notifications',
    'notifications.no_notifications': 'No new notifications',
    'notifications.mark_all_read': 'Mark all as read',
    'notifications.mark_read': 'Mark as read',
    'notifications.delete': 'Delete notification',
    'notifications.exam_reminder': 'Exam reminder',
    'notifications.assignment_due': 'Assignment due',
    'notifications.new_message': 'New message',

    // Profile
    'profile.title': 'User Profile',
    'profile.edit': 'Edit Profile',
    'profile.settings': 'Settings',
    'profile.my_courses': 'My Courses',
    'profile.my_study_partners': 'My Study Partners',
    'profile.my_sessions': 'My Sessions',
    'profile.statistics': 'Statistics',

    // Admin
    'admin.title': 'System Administration',
    'admin.dashboard': 'Dashboard',
    'admin.users': 'Users',
    'admin.courses': 'Courses',
    'admin.institutions': 'Institutions',
    'admin.reports': 'Reports',
    'admin.settings': 'System Settings',

    // Forms
    'form.required': 'Required field',
    'form.invalid_email': 'Invalid email address',
    'form.password_too_short': 'Password too short',
    'form.passwords_dont_match': 'Passwords do not match',
    'form.save_success': 'Changes saved successfully',
    'form.save_error': 'Error saving changes',

    // Tips
    'tips.title': 'Study Tips',
    'tips.add_tip': 'Add Tip',
    'tips.category': 'Category',
    'tips.helpful': 'Helpful',
    'tips.not_helpful': 'Not helpful',
    'tips.no_tips': 'No tips available',

    // Errors
    'error.network': 'Network error - please try again later',
    'error.unauthorized': 'Unauthorized access',
    'error.not_found': 'Requested item not found',
    'error.server': 'Server error - please try again later',  
    'error.unknown': 'An unexpected error occurred',

    // Time and Date
    'time.now': 'now',
    'time.minutes_ago': '{{count}} minutes ago',
    'time.hours_ago': '{{count}} hours ago',
    'time.days_ago': '{{count}} days ago',
    'time.weeks_ago': '{{count}} weeks ago',
    'time.months_ago': '{{count}} months ago',
    'time.years_ago': '{{count}} years ago',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [language, setLanguage] = useState<Lang>(() => {
    const saved = localStorage.getItem('language') as Lang | null;
    if (saved === 'he' || saved === 'en') return saved;
    const browser = navigator.language.toLowerCase();
    return browser.startsWith('he') || browser.includes('israel')
      ? 'he'
      : 'en';
  });

  useEffect(() => {
    document.documentElement.dir = language === 'he' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    localStorage.setItem('language', language);
    const title = document.querySelector('title');
    if (title) {
      title.textContent =
        language === 'he'
          ? 'באלי חופש - מאגר מועדי בחינות'
          : 'Baali Hofesh - Exam Schedule Database';
    }
  }, [language]);

  const t = (key: string, params?: Record<string, string | number>) => {
    let str = translations[language][key] || key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        str = str.replace(new RegExp(`{{${k}}}`, 'g'), String(v));
      });
    }
    return str;
  };

  const getLocalizedText = (item: LocalizedName) =>
    language === 'en' && item.name_en ? item.name_en : item.name_he;

  const getLocalizedDescription = (item: LocalizedDescription) =>
    language === 'en' && item.description_en
      ? item.description_en
      : item.description_he || '';

  const formatLocalizedDate = (date: string | Date) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString(
      language === 'he' ? 'he-IL' : 'en-US',
      {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }
    );
  };

  const formatLocalizedTime = (time: string) => {
    const d = new Date(`2000-01-01T${time}`);
    return d.toLocaleTimeString(
      language === 'he' ? 'he-IL' : 'en-US',
      {
        hour: '2-digit',
        minute: '2-digit',
        hour12: language === 'en',
      }
    );
  };

  const dir = language === 'he' ? 'rtl' : 'ltr';
  const isRTL = language === 'he';

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        dir,
        isRTL,
        getLocalizedText,
        getLocalizedDescription,
        formatLocalizedDate,
        formatLocalizedTime,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error(
      'useLanguage must be used within a LanguageProvider'
    );
  }
  return ctx;
};
