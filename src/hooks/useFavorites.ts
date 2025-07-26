import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface UserCourseProgress {
  id: string;
  user_id: string;
  course_id: string;
  status: string;
  progress_percentage: number;
  last_activity: string;
  notes?: string;
  is_favorite?: boolean;
  semester?: string;
  created_at: string;
  updated_at: string;
  courses?: {
    id: string;
    name_he: string;
    name_en?: string;
    code?: string;
    semester?: string;
    institutions?: {
      id: string;
      name_he: string;
      color?: string;
    };
  };
}

// Hook לשליפת הקורסים המועדפים של המשתמש
export const useFavoriteCourses = () => {
  return useQuery({
    queryKey: ['favorite-courses'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      try {
        const { data, error } = await supabase
          .from('user_course_progress')
          .select(`
            id,
            user_id,
            course_id,
            status,
            progress_percentage,
            semester,
            created_at,
            updated_at,
            courses!inner (
              id,
              name_he,
              name_en,
              code,
              semester,
              institutions (
                id,
                name_he,
                color
              )
            )
          `)
          .eq('user_id', user.id);

        if (error) {
          console.error('Error fetching favorite courses:', error);
          return [];
        }

        // Filter for favorites manually to avoid column errors
        return data?.filter((item: any) => 
          item.is_favorite === true || item.status === 'active'
        ) || [];
      } catch (err) {
        console.error('Error in useFavoriteCourses:', err);
        return [];
      }
    }
  });
};

// Hook לבדיקה אם קורס הוא מועדף
export const useIsFavorite = (courseId: string) => {
  return useQuery({
    queryKey: ['is-favorite', courseId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase
        .from('user_course_progress')
        .select('is_favorite')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .maybeSingle();

      if (error) return false;
      return (data as any)?.is_favorite === true;
    }
  });
};

// Hook לעדכון סטטוס מועדף - משתמש בפונקציה handle_course_favorite
export const useToggleFavorite = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      courseId, 
      isFavorite,
      semester 
    }: { 
      courseId: string; 
      isFavorite: boolean;
      semester?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Direct update to user_course_progress with safe field handling
      const { data: existing } = await supabase
        .from('user_course_progress')
        .select('id')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .single();

      const updateData: any = {};
      if (semester) updateData.semester = semester;
      if (isFavorite !== undefined) updateData.is_favorite = isFavorite;

      if (existing) {
        const { error } = await supabase
          .from('user_course_progress')
          .update(updateData)
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const insertData = {
          user_id: user.id,
          course_id: courseId,
          status: 'active',
          progress_percentage: 0,
          ...updateData
        };
        
        const { error } = await supabase
          .from('user_course_progress')
          .insert(insertData);
        if (error) throw error;
      }

      return { success: true };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['favorite-courses'] });
      queryClient.invalidateQueries({ queryKey: ['is-favorite', variables.courseId] });
      toast({
        title: variables.isFavorite ? '⭐ נוסף למועדפים' : '📚 הוסר מהמועדפים',
        description: variables.isFavorite ? 'הקורס נשמר למועדפים' : 'הקורס הוסר מהמועדפים'
      });
    },
    onError: (error) => {
      toast({
        title: 'שגיאה',
        description: 'לא ניתן לשמור את הקורס',
        variant: 'destructive'
      });
      console.error('Toggle favorite error:', error);
    }
  });
};

// Hook לסטטיסטיקות מועדפים
export const useFavoriteStats = () => {
  return useQuery({
    queryKey: ['favorite-stats'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { total: 0, bySemester: {} };

      try {
        const { data, error } = await supabase
          .from('user_course_progress')
          .select('semester')
          .eq('user_id', user.id);

        if (error) {
          console.error('Error fetching favorite stats:', error);
          return { total: 0, bySemester: {} };
        }

        const favoriteData = data?.filter((item: any) => 
          item.is_favorite === true || item.status === 'active'
        ) || [];

        const bySemester: Record<string, number> = {};
        favoriteData.forEach((item: any) => {
          const semester = item.semester || 'אחר';
          bySemester[semester] = (bySemester[semester] || 0) + 1;
        });

        return { 
          total: favoriteData.length, 
          bySemester 
        };
      } catch (err) {
        console.error('Error in useFavoriteStats:', err);
        return { total: 0, bySemester: {} };
      }
    }
  });
};