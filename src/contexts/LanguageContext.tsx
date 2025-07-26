
import React, { createContext, useContext, useState, useEffect } from 'react';

interface LanguageContextType {
  language: 'he' | 'en';
  setLanguage: (lang: 'he' | 'en') => void;
  t: (key: string) => string;
  dir: 'ltr' | 'rtl';
}

const translations = {
  he: {
    'home.title': 'באלי חופש',
    'home.subtitle': 'מאגר מועדי בחינות מקיף לכל הסטודנטים',
    'home.search_placeholder': 'חפש קורס, אוניברסיטה או מוסד לימודים...',
    'home.stats.students': 'סטודנטים',
    'home.stats.exams': 'בחינות',
    'home.stats.institutions': 'מוסדות',
    'home.popularInstitutions': 'מוסדות פופולריים',
    'nav.tutors': 'מורים פרטיים',
    'nav.tips': 'טיפים',
    'nav.login': 'התחברות',
    'nav.menu': 'תפריט',
    'exam.type.moedA': 'מועד א',
    'exam.type.moedB': 'מועד ב',
    'common.search': 'חיפוש',
    'common.loading': 'טוען...'
  },
  en: {
    'home.title': 'Baali Hofesh',
    'home.subtitle': 'Comprehensive exam schedule database for all students',
    'home.search_placeholder': 'Search for courses, universities or institutions...',
    'home.stats.students': 'Students',
    'home.stats.exams': 'Exams',
    'home.stats.institutions': 'Institutions',
    'home.popularInstitutions': 'Popular Institutions',
    'nav.tutors': 'Private Tutors',
    'nav.tips': 'Tips',
    'nav.login': 'Login',
    'nav.menu': 'Menu',
    'exam.type.moedA': 'First Exam',
    'exam.type.moedB': 'Second Exam',
    'common.search': 'Search',
    'common.loading': 'Loading...'
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<'he' | 'en'>('he');

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as 'he' | 'en';
    if (savedLanguage) {
      setLanguage(savedLanguage);
    }
  }, []);

  const handleSetLanguage = (lang: 'he' | 'en') => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations[typeof language]] || key;
  };

  const dir = language === 'he' ? 'rtl' : 'ltr';

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t, dir }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
