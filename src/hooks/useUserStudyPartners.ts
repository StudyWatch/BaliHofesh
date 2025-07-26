// useUserStudyPartners.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// אפשר להגדיר טיפוס StudyPartner אם יש לך
interface StudyPartner {
  id: string;
  user_id: string;
  course_id: string;
  description: string;
  available_hours: string[];
  preferred_times: string[];
  contact_info?: string;
  avatar_url?: string;
  expires_at?: string;
  created_at: string;
  profiles?: {
    id: string;
    name: string;
    email?: string;
    avatar_url?: string;
  } | null;
  courses?: {
    name_he?: string;
  } | null;
}

export const useUserStudyPartners = (courseIds: string[]) => {
  // טיפול במקרה של null/undefined/ריקים וכפולים
  const cleanCourseIds = Array.isArray(courseIds)
    ? Array.from(new Set(courseIds.filter(Boolean)))
    : [];

  // דיבאג – ראה מה עובר לשאילתה
  if (process.env.NODE_ENV === "development") {
    // אפשר גם עם console.log("useUserStudyPartners courseIds", cleanCourseIds);
  }

  return useQuery<StudyPartner[]>({
    queryKey: ['user-study-partners', cleanCourseIds],
    queryFn: async () => {
      if (!cleanCourseIds || cleanCourseIds.length === 0) return [];

      const { data, error } = await supabase
        .from('study_partners')
        .select('*, profiles(id, name, email, avatar_url), courses(name_he)')
        .in('course_id', cleanCourseIds)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        // דיבאג שגיאות
        if (process.env.NODE_ENV === "development") {
          console.error("Error fetching study partners:", error);
        }
        throw error;
      }
      // דיבאג – מה הוחזר
      if (process.env.NODE_ENV === "development") {
        // console.log("Fetched study partners:", data);
      }
      return data || [];
    },
    enabled: !!cleanCourseIds.length
  });
};
