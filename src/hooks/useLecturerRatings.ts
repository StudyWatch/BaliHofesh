import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/App';

/**
 * טיפוסים ראשיים
 */
export interface LecturerRating {
  id: string;
  course_id: string;
  name: string;
  average_rating: number;
  reviews_count: number;
  created_at: string;
  updated_at: string;
  normalized_name?: string; // אופציונלי לשאילתות דומות
}

export interface LecturerReview {
  id: string;
  lecturer_id: string;
  course_id: string;
  user_id: string;
  rating: number;
  teaching_quality?: number;
  lecturer_availability?: number;
  personal_approach?: number;
  comment: string;
  is_positive: boolean;
  created_at: string;
  updated_at: string;
  user_profile?: {
    name: string;
    avatar_url?: string;
  };
}

export interface SubmitReviewData {
  lecturer_id: string;
  course_id: string;
  teaching_quality: number;
  lecturer_availability: number;
  personal_approach: number;
  comment?: string;
}

export interface AddLecturerData {
  name: string;
  course_id: string;
}

/**
 * שליפת דירוגים לכלל המרצים בקורס
 */
export const useLecturerRatings = (courseId: string) => {
  return useQuery({
    queryKey: ['lecturer-ratings', courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_lecturers')
        .select('*')
        .eq('course_id', courseId)
        .order('average_rating', { ascending: false });
      if (error) {
        console.error('Error fetching lecturer ratings:', error);
        throw error;
      }
      return data || [];
    },
    enabled: !!courseId
  });
};

/**
 * שליפת חוות דעת עבור מרצה מסוים (כולל פרופיל כותב אם קיים)
 */
export const useLecturerReviews = (lecturerId: string) => {
  return useQuery({
    queryKey: ['lecturer-reviews', lecturerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lecturer_reviews')
        .select('*')
        .eq('lecturer_id', lecturerId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching lecturer reviews:', error);
        throw error;
      }

      // שליפת פרופיל עבור כל ביקורת
      const reviewsWithProfile = await Promise.all(
        (data || []).map(async (review) => {
          // אפשר להוסיף here בדיקה לאנונימיות אם תרצה
          const { data: profile } = await supabase
            .from('profiles')
            .select('name,avatar_url')
            .eq('id', review.user_id)
            .single();
          return {
            ...review,
            user_profile: profile ? profile : { name: 'סטודנט אנונימי' }
          };
        })
      );
      return reviewsWithProfile;
    },
    enabled: !!lecturerId
  });
};

/**
 * שליפת חוות הדעת של משתמש עבור מרצה מסוים (לעריכה או בדיקת קיימות)
 */
export const useUserLecturerReview = (lecturerId: string, courseId: string) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['user-lecturer-review', lecturerId, courseId, user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('lecturer_reviews')
        .select('*')
        .eq('lecturer_id', lecturerId)
        .eq('course_id', courseId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user review:', error);
        throw error;
      }
      return data;
    },
    enabled: !!lecturerId && !!courseId && !!user?.id
  });
};

/**
 * יצירת/עדכון דירוג למרצה (אם כבר קיים – מתבצע upsert)
 */
export const useSubmitLecturerReview = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (reviewData: SubmitReviewData) => {
      if (!user?.id) {
        throw new Error('User must be authenticated to submit reviews');
      }

      const avg =
        Math.round(
          (reviewData.teaching_quality +
            reviewData.lecturer_availability +
            reviewData.personal_approach) / 3
        );

      const reviewPayload = {
        lecturer_id: reviewData.lecturer_id,
        course_id: reviewData.course_id,
        user_id: user.id,
        teaching_quality: reviewData.teaching_quality,
        lecturer_availability: reviewData.lecturer_availability,
        personal_approach: reviewData.personal_approach,
        rating: avg,
        comment: reviewData.comment || '',
        is_positive: avg >= 4
      };

      const { data, error } = await supabase
        .from('lecturer_reviews')
        .upsert(reviewPayload, {
          onConflict: 'lecturer_id,course_id,user_id'
        })
        .select()
        .single();

      if (error) {
        console.error('Error submitting review:', error);
        throw error;
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['lecturer-ratings', data.course_id] });
      queryClient.invalidateQueries({ queryKey: ['lecturer-reviews', data.lecturer_id] });
      queryClient.invalidateQueries({ queryKey: ['user-lecturer-review', data.lecturer_id, data.course_id] });
    }
  });
};

/**
 * מחיקת חוות דעת של משתמש עבור מרצה מסוים
 */
export const useDeleteLecturerReview = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      reviewId,
      lecturerId,
      courseId
    }: {
      reviewId: string;
      lecturerId: string;
      courseId: string;
    }) => {
      if (!user?.id) {
        throw new Error('User must be authenticated to delete reviews');
      }

      const { error } = await supabase
        .from('lecturer_reviews')
        .delete()
        .eq('id', reviewId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting review:', error);
        throw error;
      }

      return reviewId;
    },
    onSuccess: (_, { lecturerId, courseId }) => {
      queryClient.invalidateQueries({ queryKey: ['lecturer-reviews', lecturerId] });
      queryClient.invalidateQueries({ queryKey: ['user-lecturer-review', lecturerId, courseId] });
      queryClient.invalidateQueries({ queryKey: ['lecturer-ratings', courseId] });
    }
  });
};

/**
 * הוספת מרצה חדש (כולל נורמליזציה ובדיקת דומים)
 */
export const useAddLecturer = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (lecturerData: AddLecturerData) => {
      if (!user?.id) {
        throw new Error('User must be authenticated to add lecturers');
      }

      // Normalized name for matching (ניקוי תארים/כינויים)
      const normalizedName = lecturerData.name
        .toLowerCase()
        .trim()
        .replace(/^(ד"ר|פרופ\.|מר |גב\.|גבר' |Ms\.|Mr\.|Dr\.|Prof\.)\s*/gi, '');

      // חיפוש דומים
      const { data: existingLecturers, error: searchError } = await supabase
        .from('course_lecturers')
        .select('*')
        .eq('course_id', lecturerData.course_id)
        .ilike('normalized_name', `%${normalizedName}%`);

      if (searchError) {
        console.error('Error searching for existing lecturers:', searchError);
      }

      // אם יש דומים – החזר לבחירה
      if (existingLecturers && existingLecturers.length > 0) {
        return { existing: existingLecturers };
      }

      // יצירה
      const { data, error } = await supabase
        .from('course_lecturers')
        .insert({
          name: lecturerData.name,
          course_id: lecturerData.course_id,
          average_rating: 0,
          reviews_count: 0,
          normalized_name: normalizedName
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding lecturer:', error);
        throw error;
      }

      return { new: data };
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['course-lecturers', variables.course_id] });
      queryClient.invalidateQueries({ queryKey: ['lecturer-ratings', variables.course_id] });
    }
  });
};

/**
 * שליפת כל המרצים בקורס (לרשימה/ניהול)
 */
export const useCourseLecturers = (courseId: string) => {
  return useQuery({
    queryKey: ['course-lecturers', courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_lecturers')
        .select('*')
        .eq('course_id', courseId)
        .order('name');

      if (error) {
        console.error('Error fetching course lecturers:', error);
        throw error;
      }
      return data || [];
    },
    enabled: !!courseId
  });
};
