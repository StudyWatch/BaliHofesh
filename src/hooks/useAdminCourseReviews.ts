import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AdminCourseReview {
  id: string;
  course_id: string;
  user_id: string;
  content: string;
  rating: number;
  tips?: string;
  helpful_count: number;
  is_anonymous: boolean;
  created_at: string;
  updated_at: string;
  course?: {
    name_he: string;
    name_en?: string;
  };
  user_profile?: {
    name: string;
    email: string;
    avatar_url?: string;
  };
}

// Mock data for admin review management
const MOCK_ADMIN_REVIEWS: AdminCourseReview[] = [
  {
    id: '1',
    course_id: '66e2cb03-fdd9-4674-b859-b5ecee7d9dd7',
    user_id: 'user1',
    content: 'קורס מצוין! המרצה מסביר בצורה ברורה ונגישה. המטלות מעניינות ומעשירות.',
    rating: 5,
    tips: 'כדאי להתחיל לעבוד על הפרויקט מוקדם. קראו את כל החומר לפני השיעור.',
    helpful_count: 12,
    is_anonymous: false,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    course: { name_he: 'מתמטיקה בדידה', name_en: 'Discrete Mathematics' },
    user_profile: { name: 'שרה כהן', email: 'sarah@example.com' }
  },
  {
    id: '2',
    course_id: '77e2cb03-fdd9-4674-b859-b5ecee7d9dd8',
    user_id: 'user2',
    content: 'קורס טוב אך מאתגר. דורש השקעה רבה אבל שווה את זה.',
    rating: 4,
    tips: 'תכונו להקדיש הרבה זמן לקריאה. היו בקשר עם המרצה אם יש שאלות.',
    helpful_count: 8,
    is_anonymous: true,
    created_at: '2024-01-10T14:30:00Z',
    updated_at: '2024-01-10T14:30:00Z',
    course: { name_he: 'אלגוריטמים', name_en: 'Algorithms' },
    user_profile: { name: 'דוד לוי', email: 'david@example.com' }
  },
  {
    id: '3',
    course_id: '88e2cb03-fdd9-4674-b859-b5ecee7d9dd9',
    user_id: 'user3',
    content: 'הקורס מעניין אבל יש הרבה עבודה. המרצה יודע את החומר אבל לא תמיד מסביר בצורה ברורה.',
    rating: 3,
    tips: 'חשוב לעבוד עם שותפים ולשאול שאלות בכיתה.',
    helpful_count: 5,
    is_anonymous: false,
    created_at: '2024-01-08T09:15:00Z',
    updated_at: '2024-01-08T09:15:00Z',
    course: { name_he: 'מבני נתונים', name_en: 'Data Structures' },
    user_profile: { name: 'רחל ישראלי', email: 'rachel@example.com' }
  }
];

export const useAdminCourseReviews = () => {
  return useQuery({
    queryKey: ['admin-course-reviews'],
    queryFn: async () => {
      // In the future, this will fetch from Supabase with proper joins
      return MOCK_ADMIN_REVIEWS;
    }
  });
};

export const useDeleteCourseReviewAdmin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (reviewId: string) => {
      // Simulate deletion - in the future this will delete from Supabase
      console.log('Admin deleting review:', reviewId);
      return { reviewId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-course-reviews'] });
    }
  });
};

export const useToggleReviewAnonymous = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ reviewId, isAnonymous }: { reviewId: string; isAnonymous: boolean }) => {
      // Simulate toggle - in the future this will update Supabase
      console.log('Admin toggling review anonymity:', reviewId, isAnonymous);
      return { reviewId, isAnonymous };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-course-reviews'] });
    }
  });
};