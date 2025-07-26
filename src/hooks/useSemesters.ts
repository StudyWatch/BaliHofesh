// src/hooks/useSemesters.ts

import { useQuery } from '@tanstack/react-query';

export interface Semester {
  id?: string;
  name: string;
  year: number;
  season: 'winter' | 'summer' | 'spring';
  is_current: boolean;
  start_date?: string;
  end_date?: string;
  created_at?: string;
  updated_at?: string;
}

const seasonHe: Record<Semester['season'], string> = {
  winter: 'חורף',
  spring: 'אביב',
  summer: 'קיץ',
};

// קביעת הסמסטר הנוכחי עם שנה מלאה (למשל 2025)
export const getCurrentSemester = (): Semester => {
  const now = new Date();
  const month = now.getMonth() + 1;
  let year = now.getFullYear();
  let season: Semester['season'];

  if (month >= 10 || month <= 2) {
    season = 'winter';
    if (month >= 10) year++;
  } else if (month >= 3 && month <= 6) {
    season = 'spring';
  } else {
    season = 'summer';
  }

  const name = `סמסטר ${seasonHe[season]} ${year}`;
  return { name, year, season, is_current: true };
};

// הפקת שלושת הסמסטרים הרלוונטיים: נוכחי + 2 קודמים (בפורמט שנה מלאה)
export const getRelevantSemesters = (): Semester[] => {
  const current = getCurrentSemester();
  const semesters: Semester[] = [current];

  // עונות בסדר כרונולוגי הגיוני (קודם אביב, קיץ, חורף)
  const seasonOrder: Semester['season'][] = ['spring', 'summer', 'winter'];
  let prevSeason = current.season;
  let prevYear = current.year;

  for (let i = 0; i < 2; i++) {
    let idx = seasonOrder.indexOf(prevSeason) - 1;
    if (idx < 0) {
      idx = seasonOrder.length - 1;
      prevYear--;
    }
    prevSeason = seasonOrder[idx];

    const name = `סמסטר ${seasonHe[prevSeason]} ${prevYear}`;
    semesters.push({
      name,
      year: prevYear,
      season: prevSeason,
      is_current: false,
    });
  }

  return semesters;
};

// Hook
export const useRelevantSemesters = () => {
  return useQuery({
    queryKey: ['relevant-semesters'],
    queryFn: () => getRelevantSemesters(),
    staleTime: 1000 * 60 * 60 * 24,
  });
};
