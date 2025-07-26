export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      notifications: {
  Row: {
    id: string;
    user_id: string;
    type: 'assignment' | 'exam' | 'study_session' | 'study_partner' | 'system' | 'message' | 'tip';
    title: string;
    message: string;
    link?: string | null;
    is_read: boolean;
    delivery_target: 'site' | 'push' | 'both';
    is_critical: boolean;
    push_to_phone: boolean;
    created_at: string;
    expires_at?: string | null;
    assignment_id?: string | null;
    exam_id?: string | null;
  };
  Insert: {
    id?: string;
    user_id: string;
    type: 'assignment' | 'exam' | 'study_session' | 'study_partner' | 'system' | 'message' | 'tip';
    title: string;
    message: string;
    link?: string | null;
    is_read?: boolean;
    delivery_target: 'site' | 'push' | 'both';
    is_critical?: boolean;
    push_to_phone?: boolean;
    created_at?: string;
    expires_at?: string | null;
    assignment_id?: string | null;
    exam_id?: string | null;
  };
  Update: {
    id?: string;
    user_id?: string;
    type?: 'assignment' | 'exam' | 'study_session' | 'study_partner' | 'system' | 'message' | 'tip';
    title?: string;
    message?: string;
    link?: string | null;
    is_read?: boolean;
    delivery_target?: 'site' | 'push' | 'both';
    is_critical?: boolean;
    push_to_phone?: boolean;
    created_at?: string;
    expires_at?: string | null;
    assignment_id?: string | null;
    exam_id?: string | null;
  };
  Relationships: [
    {
      foreignKeyName: "notifications_user_id_fkey";
      columns: ["user_id"];
      isOneToOne: false;
      referencedRelation: "profiles";
      referencedColumns: ["id"];
    }
  ];
},

      admin_actions: {
        Row: {
          action_type: string
          admin_id: string
          created_at: string
          description: string
          id: string
          metadata: Json | null
          target_id: string
          target_type: string
        }
        Insert: {
          action_type: string
          admin_id: string
          created_at?: string
          description: string
          id?: string
          metadata?: Json | null
          target_id: string
          target_type: string
        }
        Update: {
          action_type?: string
          admin_id?: string
          created_at?: string
          description?: string
          id?: string
          metadata?: Json | null
          target_id?: string
          target_type?: string
        }
        Relationships: []
      }
      course_groups: {
        Row: {
          course_id: string
          created_at: string | null
          discord_link: string | null
          id: string
          updated_at: string | null
          whatsapp_link: string | null
        }
        Insert: {
          course_id: string
          created_at?: string | null
          discord_link?: string | null
          id?: string
          updated_at?: string | null
          whatsapp_link?: string | null
        }
        Update: {
          course_id?: string
          created_at?: string | null
          discord_link?: string | null
          id?: string
          updated_at?: string | null
          whatsapp_link?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_groups_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_summaries: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          file_type: string | null
          file_url: string | null
          id: string
          is_active: boolean | null
          title: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_active?: boolean | null
          title: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_active?: boolean | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_summaries_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          code: string | null
          created_at: string
          enable_collaboration: boolean | null
          exam_date: string | null
          id: string
          institution_id: string | null
          name_en: string | null
          name_he: string
          semester: string | null
          updated_at: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          enable_collaboration?: boolean | null
          exam_date?: string | null
          id?: string
          institution_id?: string | null
          name_en?: string | null
          name_he: string
          semester?: string | null
          updated_at?: string
        }
        Update: {
          code?: string | null
          created_at?: string
          enable_collaboration?: boolean | null
          exam_date?: string | null
          id?: string
          institution_id?: string | null
          name_en?: string | null
          name_he?: string
          semester?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_dates: {
        Row: {
          course_id: string
          created_at: string
          exam_date: string
          exam_session: string | null
          exam_time: string
          exam_type: string
          format: string | null
          id: string
          location: string | null
          notes: string | null
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          exam_date: string
          exam_session?: string | null
          exam_time?: string
          exam_type: string
          format?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          exam_date?: string
          exam_session?: string | null
          exam_time?: string
          exam_type?: string
          format?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_dates_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      institutions: {
        Row: {
          color: string | null
          created_at: string
          id: string
          logo_url: string | null
          name_en: string | null
          name_he: string
          type: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name_en?: string | null
          name_he: string
          type: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name_en?: string | null
          name_he?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      marathon_registrations: {
        Row: {
          course_id: string
          created_at: string
          id: string
          registration_date: string
          status: string | null
          user_email: string
          user_id: string | null
          user_name: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          registration_date?: string
          status?: string | null
          user_email: string
          user_id?: string | null
          user_name: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          registration_date?: string
          status?: string | null
          user_email?: string
          user_id?: string | null
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "marathon_registrations_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marathon_registrations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          course_id: string | null
          created_at: string
          id: string
          is_read: boolean
          receiver_id: string
          sender_id: string
          subject: string | null
          updated_at: string
        }
        Insert: {
          content: string
          course_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          receiver_id: string
          sender_id: string
          subject?: string | null
          updated_at?: string
        }
        Update: {
          content?: string
          course_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          receiver_id?: string
          sender_id?: string
          subject?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      Open_universitySummer2025: {
        Row: {
          code: number | null
          created_at: string | null
          exam_date: string | null
          id: string | null
          institution_id: string | null
          name_en: string | null
          name_he: string | null
          semester: string | null
          updated_at: string | null
        }
        Insert: {
          code?: number | null
          created_at?: string | null
          exam_date?: string | null
          id?: string | null
          institution_id?: string | null
          name_en?: string | null
          name_he?: string | null
          semester?: string | null
          updated_at?: string | null
        }
        Update: {
          code?: number | null
          created_at?: string | null
          exam_date?: string | null
          id?: string | null
          institution_id?: string | null
          name_en?: string | null
          name_he?: string | null
          semester?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string
          created_at: string
          description_en: string | null
          description_he: string | null
          id: string
          image_url: string | null
          is_exclusive: boolean | null
          is_new: boolean | null
          is_popular: boolean | null
          is_subsidized: boolean | null
          link: string | null
          name_en: string | null
          name_he: string
          original_price: number | null
          price: number
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description_en?: string | null
          description_he?: string | null
          id?: string
          image_url?: string | null
          is_exclusive?: boolean | null
          is_new?: boolean | null
          is_popular?: boolean | null
          is_subsidized?: boolean | null
          link?: string | null
          name_en?: string | null
          name_he: string
          original_price?: number | null
          price: number
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description_en?: string | null
          description_he?: string | null
          id?: string
          image_url?: string | null
          is_exclusive?: boolean | null
          is_new?: boolean | null
          is_popular?: boolean | null
          is_subsidized?: boolean | null
          link?: string | null
          name_en?: string | null
          name_he?: string
          original_price?: number | null
          price?: number
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
  Row: {
    created_at: string;
    email: string | null;
    id: string;
    name: string | null;
    role: string | null;
    updated_at: string;
    notification_preferences: Json | null; // ✅ הוסף כאן
  };
  Insert: {
    created_at?: string;
    email?: string | null;
    id: string;
    name?: string | null;
    role?: string | null;
    updated_at?: string;
    notification_preferences?: Json | null; // ✅ הוסף כאן
  };
  Update: {
    created_at?: string;
    email?: string | null;
    id?: string;
    name?: string | null;
    role?: string | null;
    updated_at?: string;
    notification_preferences?: Json | null; // ✅ הוסף כאן
  };
  Relationships: [];
}

      shared_sessions: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          estimated_duration: number | null
          expires_at: string
          id: string
          is_active: boolean | null
          meeting_link: string
          platform: string | null
          scheduled_start_time: string | null
          title: string
          user_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          estimated_duration?: number | null
          expires_at?: string
          id?: string
          is_active?: boolean | null
          meeting_link: string
          platform?: string | null
          scheduled_start_time?: string | null
          title: string
          user_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          estimated_duration?: number | null
          expires_at?: string
          id?: string
          is_active?: boolean | null
          meeting_link?: string
          platform?: string | null
          scheduled_start_time?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_sessions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      study_partners: {
        Row: {
          available_hours: string[] | null
          course_id: string
          created_at: string | null
          description: string
          expires_at: string | null
          id: string
          preferred_times: string[] | null
          user_id: string
        }
        Insert: {
          available_hours?: string[] | null
          course_id: string
          created_at?: string | null
          description: string
          expires_at?: string | null
          id?: string
          preferred_times?: string[] | null
          user_id: string
        }
        Update: {
          available_hours?: string[] | null
          course_id?: string
          created_at?: string | null
          description?: string
          expires_at?: string | null
          id?: string
          preferred_times?: string[] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_partners_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_partners_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      study_rooms: {
        Row: {
          course_id: string
          created_at: string | null
          created_by: string
          description: string | null
          expires_at: string
          id: string
          link: string
          status: string | null
          title: string
        }
        Insert: {
          course_id: string
          created_at?: string | null
          created_by: string
          description?: string | null
          expires_at: string
          id?: string
          link: string
          status?: string | null
          title: string
        }
        Update: {
          course_id?: string
          created_at?: string | null
          created_by?: string
          description?: string | null
          expires_at?: string
          id?: string
          link?: string
          status?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_rooms_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_rooms_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tip_submissions: {
        Row: {
          author_email: string | null
          author_name: string | null
          category: string
          content: string
          created_at: string
          id: string
          status: string | null
          title: string
          updated_at: string
        }
        Insert: {
          author_email?: string | null
          author_name?: string | null
          category: string
          content: string
          created_at?: string
          id?: string
          status?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          author_email?: string | null
          author_name?: string | null
          category?: string
          content?: string
          created_at?: string
          id?: string
          status?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      tips: {
        Row: {
          category: string
          content_en: string | null
          content_he: string
          created_at: string
          id: string
          is_sponsored: boolean | null
          rating: number | null
          title_en: string | null
          title_he: string
          updated_at: string
        }
        Insert: {
          category: string
          content_en?: string | null
          content_he: string
          created_at?: string
          id?: string
          is_sponsored?: boolean | null
          rating?: number | null
          title_en?: string | null
          title_he: string
          updated_at?: string
        }
        Update: {
          category?: string
          content_en?: string | null
          content_he?: string
          created_at?: string
          id?: string
          is_sponsored?: boolean | null
          rating?: number | null
          title_en?: string | null
          title_he?: string
          updated_at?: string
        }
        Relationships: []
      }
      tutor_applications: {
        Row: {
          availability: string | null
          created_at: string
          description: string | null
          email: string
          experience: string | null
          hourly_rate: number | null
          id: string
          location: string | null
          name: string
          phone: string | null
          status: string | null
          subjects: string[]
          updated_at: string
        }
        Insert: {
          availability?: string | null
          created_at?: string
          description?: string | null
          email: string
          experience?: string | null
          hourly_rate?: number | null
          id?: string
          location?: string | null
          name: string
          phone?: string | null
          status?: string | null
          subjects: string[]
          updated_at?: string
        }
        Update: {
          availability?: string | null
          created_at?: string
          description?: string | null
          email?: string
          experience?: string | null
          hourly_rate?: number | null
          id?: string
          location?: string | null
          name?: string
          phone?: string | null
          status?: string | null
          subjects?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      tutors: {
        Row: {
          availability: string | null
          created_at: string
          description: string | null
          email: string | null
          experience: string | null
          hourly_rate: number
          id: string
          is_online: boolean | null
          is_verified: boolean | null
          location: string
          name: string
          phone: string | null
          rating: number | null
          reviews_count: number | null
          subjects: string[]
          updated_at: string
        }
        Insert: {
          availability?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          experience?: string | null
          hourly_rate: number
          id?: string
          is_online?: boolean | null
          is_verified?: boolean | null
          location: string
          name: string
          phone?: string | null
          rating?: number | null
          reviews_count?: number | null
          subjects: string[]
          updated_at?: string
        }
        Update: {
          availability?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          experience?: string | null
          hourly_rate?: number
          id?: string
          is_online?: boolean | null
          is_verified?: boolean | null
          location?: string
          name?: string
          phone?: string | null
          rating?: number | null
          reviews_count?: number | null
          subjects?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      user_course_progress: {
        Row: {
          course_id: string
          created_at: string
          id: string
          last_activity: string | null
          notes: string | null
          progress_percentage: number | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          last_activity?: string | null
          notes?: string | null
          progress_percentage?: number | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          last_activity?: string | null
          notes?: string | null
          progress_percentage?: number | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_course_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
