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

// Hook לשליפת הקורסים המועדפים של המשתמש (מעדכן)
export const useFavoriteCourses = () => {
  return useQuery<UserCourseProgress[]>({
    queryKey: ['favorite-courses'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('user_course_progress')
        .select(`
          id,
          user_id,
          course_id,
          status,
          progress_percentage,
          semester,
          is_favorite,
          created_at,
          updated_at,
          courses (
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
        .eq('user_id', user.id)
        .eq('is_favorite', true); // שלוף רק מועדפים

      if (error) {
        console.error('Error fetching favorite courses:', error);
        return [];
      }

      return data as UserCourseProgress[] || [];
    }
  });
};

// בדיקת קורס מסוים במועדפים
export const useIsFavorite = (courseId: string) => {
  return useQuery<boolean>({
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
      return Boolean((data as any)?.is_favorite);
    }
  });
};

// הוספה/הסרה של קורס למועדפים
export const useToggleFavorite = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      courseId,
      isFavorite,
      semester,
    }: {
      courseId: string;
      isFavorite: boolean;
      semester?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // האם קיים כבר רשומה עבור הקורס הזה
      const { data: existing, error: fetchError } = await supabase
        .from('user_course_progress')
        .select('id')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

      const updateData: any = { is_favorite: isFavorite };
      if (semester) updateData.semester = semester;

      if (existing) {
        // עדכון
        const { error } = await supabase
          .from('user_course_progress')
          .update(updateData)
          .eq('id', existing.id);
        if (error) throw error;
      } else if (isFavorite) {
        // יצירה
        const insertData = {
          user_id: user.id,
          course_id: courseId,
          status: 'active',
          progress_percentage: 0,
          is_favorite: true,
          semester,
        };
        const { error } = await supabase
          .from('user_course_progress')
          .insert(insertData);
        if (error) throw error;
      }

      return { success: true, isFavorite };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['favorite-courses'] });
      queryClient.invalidateQueries({ queryKey: ['is-favorite', variables.courseId] });
      queryClient.invalidateQueries({ queryKey: ['user-course-progress'] });
      queryClient.invalidateQueries({ queryKey: ['my-courses'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });

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

// סטטיסטיקות מועדפים (תמיד על שדה is_favorite בלבד)
export const useFavoriteStats = () => {
  return useQuery({
    queryKey: ['favorite-stats'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { total: 0, bySemester: {} };

      const { data, error } = await supabase
        .from('user_course_progress')
        .select('semester')
        .eq('user_id', user.id)
        .eq('is_favorite', true);

      if (error) {
        console.error('Error fetching favorite stats:', error);
        return { total: 0, bySemester: {} };
      }

      const favoriteData = data || [];
      const bySemester: Record<string, number> = {};

      favoriteData.forEach((item: any) => {
        const semester = item.semester || 'אחר';
        bySemester[semester] = (bySemester[semester] || 0) + 1;
      });

      return {
        total: favoriteData.length,
        bySemester
      };
    }
  });
};
