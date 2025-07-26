import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  subject?: string;
  content: string;
  is_read: boolean;
  course_id?: string;
  created_at: string;
  updated_at: string;
  sender_profile?: {
    name: string;
    email: string;
  };
  receiver_profile?: {
    name: string;
    email: string;
  };
  course?: {
    name_he: string;
    code?: string;
  };
}

export const useMessages = (type: 'sent' | 'received' = 'received') => {
  return useQuery({
    queryKey: ['messages', type],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const query = supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (type === 'sent') {
        query.eq('sender_id', user.id);
      } else {
        query.eq('receiver_id', user.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Message[];
    }
  });
};

export const useAdminMessages = () => {
  return useQuery({
    queryKey: ['admin-messages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Message[];
    }
  });
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: {
      receiver_id: string;
      subject?: string;
      content: string;
      course_id?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: result, error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          ...data
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['admin-messages'] });
    }
  });
};

export const useMarkMessageAsRead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (messageId: string) => {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('id', messageId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['admin-messages'] });
    }
  });
};

export const useDeleteMessage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (messageId: string) => {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['admin-messages'] });
    }
  });
};