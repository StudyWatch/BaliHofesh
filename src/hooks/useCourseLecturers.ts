import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// טיפוס מפורט יותר (כולל אפשרות לשדות נוספים)
export type CourseLecturer = {
  id: string;
  course_id: string;
  name: string;
  average_rating?: number;
  reviews_count?: number;
  created_at?: string;
  updated_at?: string;
  normalized_name?: string;
};

// האופציונלי: קבל קורס מסוים בלבד (אם צריך)
export function useCourseLecturers(courseId?: string): UseQueryResult<CourseLecturer[], Error> {
  return useQuery<CourseLecturer[], Error>({
    queryKey: courseId ? ["course_lecturers", courseId] : ["course_lecturers"],
    queryFn: async () => {
      let query = supabase
        .from("course_lecturers")
        .select("*")
        .order("average_rating", { ascending: false });

      if (courseId) query = query.eq("course_id", courseId);

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    staleTime: 60 * 1000,
  });
}
