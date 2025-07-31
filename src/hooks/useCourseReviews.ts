import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CourseReview {
  id: string;
  course_id: string;
  user_id: string;
  rating: number;
  review_text?: string;
  tips?: string;
  helpful_count: number;
  is_anonymous: boolean;
  created_at: string;
  user_profile?: {
    name: string;
    avatar_url?: string;
  };
}

export interface CreateCourseReviewData {
  course_id: string;
  rating: number;
  review_text?: string;
  tips?: string;
  is_anonymous?: boolean;
}

// Get reviews for a specific course
export const useCourseReviews = (courseId: string) => {
  return useQuery<CourseReview[]>({
    queryKey: ['course-reviews', courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_reviews')
        .select('*')
        .eq('course_id', courseId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch user profiles for non-anonymous reviews (optional, can be removed if not needed)
      const reviewsWithProfiles = await Promise.all(
        (data || []).map(async (review) => {
          if (review.is_anonymous) {
            return { ...review, user_profile: null };
          }
          const { data: profile } = await supabase
            .from('profiles')
            .select('name, avatar_url')
            .eq('id', review.user_id)
            .single();
          return { ...review, user_profile: profile };
        })
      );

      return reviewsWithProfiles as CourseReview[];
    },
    enabled: !!courseId
  });
};

export const useCourseRating = (courseId: string) => {
  return useQuery<{ average: number; count: number }>({
    queryKey: ['course-rating', courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_reviews')
        .select('rating')
        .eq('course_id', courseId);

      if (error) throw error;

      if (!data || data.length === 0) {
        return { average: 0, count: 0 };
      }

      const totalRating = data.reduce((sum, review) => sum + review.rating, 0);
      const average = totalRating / data.length;

      return {
        average: Math.round(average * 10) / 10,
        count: data.length
      };
    },
    enabled: !!courseId
  });
};

export const useCreateCourseReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reviewData: CreateCourseReviewData) => {
      const { data: userData } = await supabase.auth.getUser();
      const user_id = userData?.user?.id;
      if (!user_id) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from('course_reviews')
        .insert([{
          course_id: reviewData.course_id,
          user_id,
          rating: reviewData.rating,
          review_text: reviewData.review_text || null,
          tips: reviewData.tips || null,
          is_anonymous: reviewData.is_anonymous || false
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['course-rating'] });
    }
  });
};

export const useMarkReviewHelpful = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reviewId: string) => {
      const { data: userData } = await supabase.auth.getUser();
      const user_id = userData?.user?.id;
      if (!user_id) throw new Error("User not authenticated");

      const { error } = await supabase.rpc('increment_helpful_count', {
        review_id: reviewId,
        user_id: user_id
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-reviews'] });
    }
  });
};

export const useDeleteCourseReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reviewId: string) => {
      const { error } = await supabase
        .from('course_reviews')
        .delete()
        .eq('id', reviewId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['course-rating'] });
    }
  });
};
