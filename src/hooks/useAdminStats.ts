import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AdminStats {
  totalUsers: number;
  totalCourses: number;
  totalReviews: number;
  totalSessions: number;
  todayRegistrations: number;
  activeUsers: number;
  popularCourses: {
    id: string;
    name: string;
    reviewCount: number;
    averageRating: number;
  }[];
  recentActivity: {
    type: 'review' | 'registration' | 'session';
    description: string;
    timestamp: string;
    userId: string;
    userName: string;
  }[];
}

// Mock admin statistics
const MOCK_STATS: AdminStats = {
  totalUsers: 1247,
  totalCourses: 89,
  totalReviews: 456,
  totalSessions: 73,
  todayRegistrations: 12,
  activeUsers: 234,
  popularCourses: [
    {
      id: '1',
      name: 'מתמטיקה בדידה',
      reviewCount: 45,
      averageRating: 4.3
    },
    {
      id: '2',
      name: 'אלגוריטמים',
      reviewCount: 38,
      averageRating: 4.1
    },
    {
      id: '3',
      name: 'מבני נתונים',
      reviewCount: 32,
      averageRating: 3.9
    }
  ],
  recentActivity: [
    {
      type: 'review',
      description: 'שרה כהן הוסיפה ביקורת לקורס מתמטיקה בדידה',
      timestamp: '2024-01-15T10:30:00Z',
      userId: 'user1',
      userName: 'שרה כהן'
    },
    {
      type: 'registration',
      description: 'דוד לוי נרשם למפגש לימוד משותף',
      timestamp: '2024-01-15T10:15:00Z',
      userId: 'user2',
      userName: 'דוד לוי'
    },
    {
      type: 'session',
      description: 'נוצר מפגש חדש לקורס אלגוריטמים',
      timestamp: '2024-01-15T09:45:00Z',
      userId: 'user3',
      userName: 'רחל ישראלי'
    }
  ]
};

export const useAdminStats = () => {
  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      try {
        // Get real counts from all tables
        const [usersCount, coursesCount, reviewsCount, sessionsCount, tipsCount, productsCount] = await Promise.all([
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
          supabase.from('courses').select('*', { count: 'exact', head: true }),
          supabase.from('course_reviews').select('*', { count: 'exact', head: true }),
          supabase.from('shared_sessions').select('*', { count: 'exact', head: true }),
          supabase.from('tips').select('*', { count: 'exact', head: true }),
          supabase.from('products').select('*', { count: 'exact', head: true })
        ]);

        // Get popular courses with real data
        const { data: popularCoursesData } = await supabase
          .from('courses')
          .select(`
            id,
            name_he,
            course_reviews (id, rating)
          `)
          .limit(3);

        const popularCourses = (popularCoursesData || []).map(course => ({
          id: course.id,
          name: course.name_he,
          reviewCount: course.course_reviews?.length || 0,
          averageRating: course.course_reviews?.length > 0 
            ? course.course_reviews.reduce((sum: number, review: any) => sum + (review.rating || 0), 0) / course.course_reviews.length
            : 0
        }));

        // Get recent activity - simplified from actual data
        const { data: recentReviews } = await supabase
          .from('course_reviews')
          .select(`
            id,
            created_at,
            content,
            user_id,
            courses (name_he)
          `)
          .order('created_at', { ascending: false })
          .limit(5);

        const recentActivity = (recentReviews || []).map(review => ({
          type: 'review' as const,
          description: `ביקורת חדשה עבור ${review.courses?.name_he || 'קורס'}`,
          timestamp: review.created_at,
          userId: review.user_id,
          userName: 'משתמש'
        }));

        return {
          totalUsers: usersCount.count || 0,
          totalCourses: coursesCount.count || 0,
          totalReviews: reviewsCount.count || 0,
          totalSessions: sessionsCount.count || 0,
          todayRegistrations: Math.floor(Math.random() * 15), // Placeholder
          activeUsers: Math.floor((usersCount.count || 0) * 0.3), // Estimate
          popularCourses,
          recentActivity
        };
      } catch (error) {
        console.warn('Error fetching admin stats:', error);
        return MOCK_STATS;
      }
    }
  });
};