import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TutorReview {
  id: string;
  tutor_id: string;
  user_id: string;
  rating: number;
  review_text?: string;
  helpful_count: number;
  created_at: string;
  user_profile?: {
    name: string;
    avatar_url?: string;
  };
}

export interface CreateReviewData {
  tutor_id: string;
  rating: number;
  review_text?: string;
}

// Get reviews for a specific tutor (temporarily disabled until migration is applied)
export const useTutorReviews = (tutorId: string) => {
  return useQuery({
    queryKey: ['tutor-reviews', tutorId],
    queryFn: async () => {
      return [];
    },
    enabled: !!tutorId
  });
};

export const useTutorRating = (tutorId: string) => {
  return useQuery({
    queryKey: ['tutor-rating', tutorId],
    queryFn: async () => {
      return { average: 0, count: 0 };
    },
    enabled: !!tutorId
  });
};

export const useCreateTutorReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reviewData: CreateReviewData) => {
      throw new Error('Tutor reviews temporarily disabled - migration pending');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tutor-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['tutor-rating'] });
    }
  });
};

export const useUpdateReviewHelpful = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reviewId: string) => {
      throw new Error('Tutor reviews temporarily disabled - migration pending');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tutor-reviews'] });
    }
  });
};

export const useDeleteTutorReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reviewId: string) => {
      throw new Error('Tutor reviews temporarily disabled - migration pending');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tutor-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['tutor-rating'] });
    }
  });
};