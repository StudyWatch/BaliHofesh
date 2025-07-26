import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type AssignmentType = 'homework' | 'maman' | 'mamach' | 'project' | 'essay';

export interface Assignment {
  id: string;
  course_id: string;
  title: string;
  description?: string | null;
  due_date: string;
  due_time?: string | null;
  assignment_type: AssignmentType;
  created_at: string;
  updated_at: string;
  creator_profile?: {
    id: string;
    name: string;
    avatar_url?: string;
  };
}

export const useCourseAssignments = (courseId: string) => {
  return useQuery({
    queryKey: ['course-assignments', courseId],
    queryFn: async () => {
      if (!courseId) return [];
      const { data, error } = await supabase
        .from('course_assignments')
        .select(`
          id, course_id, title, description, due_date, due_time,
          assignment_type, created_at, updated_at,
          creator_profile:created_by (id, name, avatar_url)
        `)
        .eq('course_id', courseId)
        .order('due_date', { ascending: true });

      if (error) throw error;
      return (data as Assignment[]).map(a => ({
        ...a,
        assignment_type: a.assignment_type ?? 'homework',
        due_time: a.due_time ?? '23:59'
      }));
    },
    enabled: !!courseId,
  });
};

export const useCreateAssignment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (assignmentData: Omit<Assignment, 'id' | 'created_at' | 'updated_at' | 'creator_profile'> & { created_by: string }) => {
      const { title, course_id, due_date, created_by } = assignmentData;

      if (!title || !course_id || !due_date || !created_by) {
        throw new Error('יש למלא את כל השדות החיוניים');
      }

      const { data, error } = await supabase
        .from('course_assignments')
        .insert({
          course_id,
          title,
          due_date,
          due_time: assignmentData.due_time ?? '23:59',
          assignment_type: assignmentData.assignment_type ?? 'homework',
          description: assignmentData.description ?? null,
          created_by,
          verified: false,
        })
        .select(`
          id, course_id, title, description, due_date, due_time,
          assignment_type, created_at, updated_at,
          creator_profile:created_by (id, name, avatar_url)
        `)
        .single();

      if (error) throw error;
      return data as Assignment;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['course-assignments', data.course_id] });
      queryClient.invalidateQueries({ queryKey: ['user-assignments'] });
      toast({ title: 'עבודה נוספה', description: 'העבודה נוספה בהצלחה' });
    },
    onError: (error) => {
      toast({ title: 'שגיאה', description: error.message, variant: 'destructive' });
    },
  });
};

export const useUpdateAssignment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updateData }: Partial<Assignment> & { id: string }) => {
      const user = supabase.auth.user();
      if (!user) throw new Error('Unauthorized');

      // בדוק אם המשתמש הוא היוצר של המטלה
      const { data: existingAssignment } = await supabase
        .from('course_assignments')
        .select('created_by')
        .eq('id', id)
        .single();

      if (existingAssignment?.created_by !== user.id) {
        throw new Error('אין הרשאה לעדכן מטלה זו');
      }

      const { data, error } = await supabase
        .from('course_assignments')
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
          updated_by: user.id,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Assignment;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['course-assignments', data.course_id] });
      queryClient.invalidateQueries({ queryKey: ['user-assignments'] });
      toast({ title: 'העבודה עודכנה', description: 'העבודה נשמרה בהצלחה' });
    },
    onError: (error) => {
      toast({ title: 'שגיאה', description: error.message, variant: 'destructive' });
    },
  });
};

export const useDeleteAssignment = (currentUserId: string, isAdmin: boolean) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, type, created_by }: { id: string; type: AssignmentType; created_by: string }) => {
      const userIsOwner = created_by === currentUserId;
      const canDeleteType = type === 'maman' || type === 'mamach';

      if (!isAdmin && (!userIsOwner || !canDeleteType)) {
        throw new Error('אין הרשאה למחוק מטלה זו');
      }

      const { error } = await supabase.from('course_assignments').delete().eq('id', id);
      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['user-assignments'] });
      toast({ title: 'העבודה נמחקה', description: 'הוסרה בהצלחה' });
    },
    onError: (err) => {
      toast({
        title: 'אין הרשאה',
        description: err instanceof Error ? err.message : 'לא ניתן למחוק את העבודה',
        variant: 'destructive'
      });
    },
  });
};

export const useUserAssignments = (userId: string) => {
  return useQuery({
    queryKey: ['user-assignments', userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data: courses, error: coursesError } = await supabase
        .from('user_course_progress')
        .select('course_id')
        .eq('user_id', userId);

      if (coursesError) throw coursesError;

      const courseIds = courses?.map(c => c.course_id);
      if (!courseIds || courseIds.length === 0) return [];

      const { data, error } = await supabase
        .from('course_assignments')
        .select(`
          id, course_id, title, description, due_date, due_time,
          assignment_type, created_at, updated_at,
          creator_profile:created_by (id, name, avatar_url),
          course: courses (
            name_he,
            code
          )
        `)
        .in('course_id', courseIds);

      if (error) throw error;
      return (data as Assignment[]).map(a => ({
        ...a,
        assignment_type: a.assignment_type ?? 'homework',
        due_time: a.due_time ?? '23:59'
      }));
    },
    enabled: !!userId,
  });
};
