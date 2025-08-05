// /hooks/useCalendarEvents.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthProvider';

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end?: string;
  allDay?: boolean;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  extendedProps: {
    type: 'exam' | 'assignment';
    courseCode?: string;
    courseName?: string;
    location?: string;
    description?: string;
  };
}

export interface ExamSelection {
  course_id: string;
  exam_session: string;
  exam_date: string;
  exam_time?: string;
}

// ✅ פונקציה שמייצרת זמן תקני ומונעת גלישות
const normalizeStartTime = (date: string, time?: string): string => {
  const cleanDate = date.split('T')[0]; // מסיר בטעות שעה מהתאריך אם קיימת
  return time ? `${cleanDate}T${time}` : `${cleanDate}T23:59:00`;
};

export const useCalendarEvents = () => {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery<CalendarEvent[]>({
    queryKey: ['calendar-events', userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return [];

      // שלב 1: טעינת קורסים למשתמש
      const { data: userCourses, error: userCoursesError } = await supabase
        .from('user_course_progress')
        .select('course_id, courses ( name_he, code )')
        .eq('user_id', userId);

      if (userCoursesError) throw userCoursesError;

      const courseMap = new Map<string, { name_he?: string; code?: string }>();
      const courseIds = userCourses.map((uc) => {
        courseMap.set(uc.course_id, {
          name_he: uc.courses?.name_he,
          code: uc.courses?.code
        });
        return uc.course_id;
      });

      if (courseIds.length === 0) return [];

      // שלב 2: מטלות
      const { data: assignments, error: assignmentError } = await supabase
        .from('course_assignments')
        .select('*')
        .in('course_id', courseIds);

      if (assignmentError) throw assignmentError;

      const assignmentEvents: CalendarEvent[] = (assignments || []).map((assignment) => {
        const course = courseMap.get(assignment.course_id);
        const courseName = course?.name_he || 'קורס';
        const courseCode = course?.code || '';
        const short = `${courseName.split(' ')[0]} · ${assignment.title}`;
        const title = short.length > 25 ? short.slice(0, 25) + '…' : short;

        const startTime = normalizeStartTime(assignment.due_date, assignment.due_time);

        return {
          id: `assignment-${assignment.id}`,
          title,
          start: startTime,
          allDay: false, // קריטי!
          backgroundColor: '#3b82f6',
          borderColor: '#2563eb',
          textColor: '#ffffff',
          extendedProps: {
            type: 'assignment',
            courseCode,
            courseName,
            description: assignment.description || ''
          }
        };
      });

      // שלב 3: מבחנים
      const { data: exams, error: examError } = await supabase
        .from('exam_dates')
        .select('*, courses ( name_he, code, institution_id )')
        .in('course_id', courseIds);

      if (examError) throw examError;

      const examEvents: CalendarEvent[] = (exams || []).map((exam) => {
        const courseName = exam.courses?.name_he || 'קורס';
        const courseCode = exam.courses?.code || '';
        const location = exam.location || '';
        const startTime = normalizeStartTime(exam.exam_date, exam.exam_time || '09:00:00');

        return {
          id: `exam-${exam.id}`,
          title: `בחינה: ${courseName}`,
          start: startTime,
          allDay: false,
          backgroundColor: '#ef4444',
          borderColor: '#dc2626',
          textColor: '#ffffff',
          extendedProps: {
            type: 'exam',
            courseCode,
            courseName,
            location,
            description: `בחינה ${exam.exam_type}`
          }
        };
      });

      return [...assignmentEvents, ...examEvents];
    }
  });
};

export const useSelectExamSession = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (selection: ExamSelection) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('user_course_progress')
        .update({
          notes: `Selected exam: ${selection.exam_session} on ${selection.exam_date}`
        })
        .eq('user_id', user.id)
        .eq('course_id', selection.course_id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      queryClient.invalidateQueries({ queryKey: ['user-selected-exams'] });
    }
  });
};

export const useRemoveExamFromCalendar = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (courseId: string) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('user_course_progress')
        .update({ notes: null })
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      queryClient.invalidateQueries({ queryKey: ['user-selected-exams'] });
    }
  });
};

export const useUserSelectedExams = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-selected-exams', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_course_progress')
        .select(`
          course_id,
          notes,
          courses (
            name_he,
            code
          )
        `)
        .eq('user_id', user.id)
        .not('notes', 'is', null);

      if (error) throw error;
      return data;
    }
  });
};
