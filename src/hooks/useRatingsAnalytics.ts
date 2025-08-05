import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// -------------------- טיפוסים --------------------
export type LecturerReview = {
  id: string;
  lecturer_id: string;
  course_id: string;
  user_id: string;
  rating: number;
  teaching_quality: number;
  lecturer_availability: number;
  personal_approach: number;
  comment: string;
  is_positive?: boolean;
  created_at: string;
};

export type CourseReview = {
  id: string;
  course_id: string;
  user_id: string;
  rating: number;
  content: string;
  helpful_count: number;
  is_verified?: boolean;
  created_at: string;
};

export type Course = {
  id: string;
  name_he: string;
  name_en?: string;
  code?: string;
  semester?: string;
  created_at?: string;
};

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

// -------------------- שליפת כל המרצים לכל הקורסים --------------------
export function useCourseLecturers() {
  return useQuery<CourseLecturer[], Error>({
    queryKey: ["course_lecturers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("course_lecturers")
        .select("*")
        .order("average_rating", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    staleTime: 60 * 1000,
  });
}

// -------------------- הוק ראשי: אנליטיקות --------------------
export function useRatingsAnalytics() {
  // ביקורות מרצים
  const lecturerReviews = useQuery<LecturerReview[], Error>({
    queryKey: ["lecturer_reviews"],
    queryFn: async () => {
      const { data, error } = await supabase.from("lecturer_reviews").select("*");
      if (error) throw error;
      return data || [];
    }
  });

  // ביקורות קורסים (לכל הקורסים!)
  const courseReviews = useQuery<CourseReview[], Error>({
    queryKey: ["course_reviews"],
    queryFn: async () => {
      const { data, error } = await supabase.from("course_reviews").select("*");
      if (error) throw error;
      return data || [];
    }
  });

  // כל הקורסים
  const courses = useQuery<Course[], Error>({
    queryKey: ["courses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("id, name_he, name_en, code, semester, created_at");
      if (error) throw error;
      return data || [];
    }
  });

  // כל המרצים בכל קורס
  const courseLecturers = useCourseLecturers();

  // ממוצע וסטטיסטיקות מרצים
  const lecturerStats = useMemo(() => {
    if (!lecturerReviews.data) return {};
    const map: Record<string, { count: number; avg: number }> = {};
    for (const r of lecturerReviews.data) {
      if (!map[r.lecturer_id]) map[r.lecturer_id] = { count: 0, avg: 0 };
      map[r.lecturer_id].count += 1;
      map[r.lecturer_id].avg += r.rating;
    }
    Object.keys(map).forEach(lid => {
      map[lid].avg = +(map[lid].avg / map[lid].count).toFixed(2);
    });
    return map;
  }, [lecturerReviews.data]);

  // ממוצע וסטטיסטיקות קורסים
  const courseStats = useMemo(() => {
    if (!courseReviews.data) return {};
    const map: Record<string, { count: number; avg: number }> = {};
    for (const r of courseReviews.data) {
      if (!map[r.course_id]) map[r.course_id] = { count: 0, avg: 0 };
      map[r.course_id].count += 1;
      map[r.course_id].avg += r.rating;
    }
    Object.keys(map).forEach(cid => {
      map[cid].avg = +(map[cid].avg / map[cid].count).toFixed(2);
    });
    return map;
  }, [courseReviews.data]);

  // מרצים מובילים (top 5)
  const topLecturers = useMemo(() => {
    if (!lecturerStats) return [];
    const entries = Object.entries(lecturerStats) as [string, { avg: number; count: number }][];
    return entries
      .sort((a, b) => b[1].avg - a[1].avg)
      .slice(0, 5)
      .map(([lecturer_id, stats]) => ({
        lecturer_id,
        avg: stats.avg,
        count: stats.count,
      }));
  }, [lecturerStats]);

  // קורסים מובילים (top 5)
  const topCourses = useMemo(() => {
    if (!courseStats) return [];
    const entries = Object.entries(courseStats) as [string, { avg: number; count: number }][];
    return entries
      .sort((a, b) => b[1].avg - a[1].avg)
      .slice(0, 5)
      .map(([course_id, stats]) => ({
        course_id,
        avg: stats.avg,
        count: stats.count,
      }));
  }, [courseStats]);

  return {
    lecturerReviews: lecturerReviews.data || [],
    courseReviews: courseReviews.data || [],
    courses: courses.data || [],
    courseLecturers: courseLecturers.data || [],
    lecturerStats,
    courseStats,
    topLecturers,
    topCourses,
    isLoading:
      lecturerReviews.isLoading ||
      courseReviews.isLoading ||
      courses.isLoading ||
      courseLecturers.isLoading,
    isError:
      lecturerReviews.isError ||
      courseReviews.isError ||
      courses.isError ||
      courseLecturers.isError,
  };
}
