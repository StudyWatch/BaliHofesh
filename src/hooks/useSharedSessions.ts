import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// ✅ בדיקת UUID תקין
const isValidUUID = (value: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

export interface SharedSession {
  id: string;
  course_id: string;
  user_id: string;
  title: string;
  meeting_link: string;
  description?: string;
  platform: string;
  scheduled_start_time?: string;
  duration_minutes?: number;
  max_participants?: number;
  is_active: boolean;
  notification_sent?: boolean;
  created_at: string;
  updated_at: string;
  profiles?: { name: string } | null;
}

// 📣 שליחת התראות לכל משתתפי הקורס
const notifyParticipants = async (courseId: string, title: string, message: string) => {
  const { data: participants, error } = await supabase
    .from('course_participants')
    .select('user_id')
    .eq('course_id', courseId);

  if (error) {
    console.error('❌ Error fetching participants:', error);
    return;
  }

  if (!participants?.length) {
    console.info('ℹ️ No participants to notify.');
    return;
  }

  const notifications = participants.map((p: any) => ({
    user_id: p.user_id,
    title,
    message,
    created_at: new Date().toISOString(),
  }));

  const { error: notifError } = await supabase
    .from('notifications')
    .insert(notifications);

  if (notifError) {
    console.error('❌ Error sending notifications:', notifError);
  } else {
    console.log(`📣 Notifications sent to ${participants.length} participants`);
  }
};

// 🆕 שליפה חכמה: מציג את כל המפגשים
export const useSharedSessions = (courseId: string) => {
  const queryClient = useQueryClient();

  if (!courseId || !isValidUUID(courseId)) {
    console.warn(`⚠️ Invalid courseId in useSharedSessions: "${courseId}"`);
    return { data: [], isLoading: false, error: `Invalid courseId: ${courseId}` };
  }

  return useQuery({
    queryKey: ['shared-sessions', courseId],
    queryFn: async () => {
      const now = new Date();

      const { data, error } = await supabase
        .from('shared_sessions')
        .select('*')
        .eq('course_id', courseId)
        .eq('is_active', true)
        .order('scheduled_start_time', { ascending: true });

      if (error) {
        console.error('❌ Error fetching shared sessions:', error);
        throw error;
      }

      // 🗑️ עדכון מפגשים שפג תוקפם ל-is_active=false
      const expiredSessions = (data || []).filter(session => {
        if (!session.scheduled_start_time || !session.duration_minutes) return false;
        const endTime = new Date(session.scheduled_start_time);
        endTime.setMinutes(endTime.getMinutes() + session.duration_minutes);
        return now > endTime;
      });

      if (expiredSessions.length) {
        const expiredIds = expiredSessions.map(s => s.id);

        await supabase
          .from('shared_sessions')
          .update({ is_active: false })
          .in('id', expiredIds);

        expiredSessions.forEach(session =>
          notifyParticipants(
            session.course_id,
            '⏹️ מפגש הסתיים',
            `המפגש "${session.title}" הסתיים והוסר מהרשימה.`
          )
        );

        queryClient.invalidateQueries({ queryKey: ['shared-sessions', courseId] });
      }

      return data || [];
    },
    staleTime: 60 * 1000,
    refetchInterval: 120 * 1000,
  });
};

// ✅ יצירת מפגש חדש – מיידי או מתוזמן
export const useCreateSharedSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<SharedSession, 'id' | 'created_at' | 'updated_at' | 'profiles'>) => {
      if (!isValidUUID(data.course_id)) throw new Error(`Invalid course_id: ${data.course_id}`);

      const now = new Date();
      const defaultStartTime = new Date(now.getTime() + 1 * 60 * 1000).toISOString(); // ברירת מחדל: +1 דקה

      const cleanData = {
        ...data,
        scheduled_start_time: data.scheduled_start_time
          ? new Date(data.scheduled_start_time).toISOString()
          : defaultStartTime,
        is_active: true,
      };

      const { data: result, error } = await supabase
        .from('shared_sessions')
        .insert(cleanData)
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating session:', error);
        throw error;
      }

      notifyParticipants(
        data.course_id,
        '📢 מפגש לימוד חדש',
        `נוסף מפגש "${data.title}" בקורס שלך!`
      );

      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['shared-sessions', data.course_id] });
    },
  });
};

// ✅ עדכון מפגש קיים
export const useUpdateSharedSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sessionId,
      updates,
    }: {
      sessionId: string;
      updates: Partial<Omit<SharedSession, 'id' | 'created_at' | 'updated_at' | 'profiles'>>;
    }) => {
      if (!isValidUUID(sessionId)) throw new Error(`Invalid session id: ${sessionId}`);

      const { error } = await supabase
        .from('shared_sessions')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', sessionId);

      if (error) throw error;
    },
    onSuccess: (_, { sessionId }) => {
      queryClient.invalidateQueries({ queryKey: ['shared-sessions'] });
      console.log(`✅ Session ${sessionId} updated`);
    },
  });
};

// ✅ מחיקת מפגש
export const useDeleteSharedSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!isValidUUID(id)) throw new Error(`Invalid session id: ${id}`);

      const { error } = await supabase
        .from('shared_sessions')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shared-sessions'] });
    },
  });
};
