export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      admin_access_logs: {
        Row: {
          attempted_at: string | null
          email: string | null
          id: string
          ip_address: string | null
          success: boolean
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          attempted_at?: string | null
          email?: string | null
          id?: string
          ip_address?: string | null
          success?: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          attempted_at?: string | null
          email?: string | null
          id?: string
          ip_address?: string | null
          success?: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
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
      affiliate_accounts: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          notes: string | null
          password_encrypted: string | null
          platform_name: string
          platform_url: string | null
          subscription_expiry: string | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          password_encrypted?: string | null
          platform_name: string
          platform_url?: string | null
          subscription_expiry?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          password_encrypted?: string | null
          platform_name?: string
          platform_url?: string | null
          subscription_expiry?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: string
          row_id: string | null
          table_name: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          row_id?: string | null
          table_name: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          row_id?: string | null
          table_name?: string
          user_id?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          name_en: string | null
          name_he: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name_en?: string | null
          name_he: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name_en?: string | null
          name_he?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      course_assignments: {
        Row: {
          assignment_number: string | null
          assignment_type: string | null
          course_id: string
          created_at: string | null
          created_by: string
          description: string | null
          due_date: string
          due_time: string | null
          id: string
          title: string
          updated_at: string | null
          updated_by: string | null
          verified: boolean | null
        }
        Insert: {
          assignment_number?: string | null
          assignment_type?: string | null
          course_id: string
          created_at?: string | null
          created_by: string
          description?: string | null
          due_date: string
          due_time?: string | null
          id?: string
          title: string
          updated_at?: string | null
          updated_by?: string | null
          verified?: boolean | null
        }
        Update: {
          assignment_number?: string | null
          assignment_type?: string | null
          course_id?: string
          created_at?: string | null
          created_by?: string
          description?: string | null
          due_date?: string
          due_time?: string | null
          id?: string
          title?: string
          updated_at?: string | null
          updated_by?: string | null
          verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "course_assignments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_assignments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      course_groups: {
        Row: {
          course_id: string
          created_at: string | null
          discord_link: string | null
          id: string
          signal_link: string | null
          telegram_link: string | null
          updated_at: string | null
          whatsapp_link: string | null
        }
        Insert: {
          course_id: string
          created_at?: string | null
          discord_link?: string | null
          id?: string
          signal_link?: string | null
          telegram_link?: string | null
          updated_at?: string | null
          whatsapp_link?: string | null
        }
        Update: {
          course_id?: string
          created_at?: string | null
          discord_link?: string | null
          id?: string
          signal_link?: string | null
          telegram_link?: string | null
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
      course_lecturers: {
        Row: {
          average_rating: number | null
          course_id: string
          created_at: string | null
          id: string
          name: string
          normalized_name: string | null
          reviews_count: number | null
          updated_at: string | null
        }
        Insert: {
          average_rating?: number | null
          course_id: string
          created_at?: string | null
          id?: string
          name: string
          normalized_name?: string | null
          reviews_count?: number | null
          updated_at?: string | null
        }
        Update: {
          average_rating?: number | null
          course_id?: string
          created_at?: string | null
          id?: string
          name?: string
          normalized_name?: string | null
          reviews_count?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      course_review_helpful_votes: {
        Row: {
          created_at: string | null
          id: string
          review_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          review_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          review_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_review_helpful_votes_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "course_reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      course_reviews: {
        Row: {
          content: string
          course_id: string
          created_at: string | null
          helpful_count: number | null
          id: string
          is_anonymous: boolean | null
          is_verified: boolean | null
          rating: number | null
          review_text: string | null
          semester: string | null
          tips: string | null
          updated_at: string | null
          user_id: string
          year: number | null
        }
        Insert: {
          content: string
          course_id: string
          created_at?: string | null
          helpful_count?: number | null
          id?: string
          is_anonymous?: boolean | null
          is_verified?: boolean | null
          rating?: number | null
          review_text?: string | null
          semester?: string | null
          tips?: string | null
          updated_at?: string | null
          user_id: string
          year?: number | null
        }
        Update: {
          content?: string
          course_id?: string
          created_at?: string | null
          helpful_count?: number | null
          id?: string
          is_anonymous?: boolean | null
          is_verified?: boolean | null
          rating?: number | null
          review_text?: string | null
          semester?: string | null
          tips?: string | null
          updated_at?: string | null
          user_id?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "course_reviews_course_id_fkey"
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
          category: string | null
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
          category?: string | null
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
          category?: string | null
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
      deal_analytics: {
        Row: {
          action_type: string
          created_at: string | null
          deal_id: string | null
          id: string
          user_agent: string | null
          user_ip: string | null
        }
        Insert: {
          action_type: string
          created_at?: string | null
          deal_id?: string | null
          id?: string
          user_agent?: string | null
          user_ip?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string | null
          deal_id?: string | null
          id?: string
          user_agent?: string | null
          user_ip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deal_analytics_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_tags: {
        Row: {
          deal_id: string | null
          id: string
          tag_id: string | null
        }
        Insert: {
          deal_id?: string | null
          id?: string
          tag_id?: string | null
        }
        Update: {
          deal_id?: string | null
          id?: string
          tag_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deal_tags_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          affiliate_link: string | null
          category_id: string | null
          click_count: number | null
          coupon_code: string | null
          created_at: string | null
          description_full: string | null
          description_short: string | null
          discounted_price: number | null
          end_date: string | null
          id: string
          image_url: string | null
          internal_notes: string | null
          is_active: boolean | null
          is_exclusive: boolean | null
          is_new: boolean | null
          is_popular: boolean | null
          is_subsidized: boolean | null
          name_en: string | null
          name_he: string
          regular_price: number | null
          start_date: string | null
          updated_at: string | null
        }
        Insert: {
          affiliate_link?: string | null
          category_id?: string | null
          click_count?: number | null
          coupon_code?: string | null
          created_at?: string | null
          description_full?: string | null
          description_short?: string | null
          discounted_price?: number | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          internal_notes?: string | null
          is_active?: boolean | null
          is_exclusive?: boolean | null
          is_new?: boolean | null
          is_popular?: boolean | null
          is_subsidized?: boolean | null
          name_en?: string | null
          name_he: string
          regular_price?: number | null
          start_date?: string | null
          updated_at?: string | null
        }
        Update: {
          affiliate_link?: string | null
          category_id?: string | null
          click_count?: number | null
          coupon_code?: string | null
          created_at?: string | null
          description_full?: string | null
          description_short?: string | null
          discounted_price?: number | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          internal_notes?: string | null
          is_active?: boolean | null
          is_exclusive?: boolean | null
          is_new?: boolean | null
          is_popular?: boolean | null
          is_subsidized?: boolean | null
          name_en?: string | null
          name_he?: string
          regular_price?: number | null
          start_date?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deals_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      discord_servers: {
        Row: {
          course_id: string
          created_at: string | null
          guild_id: string
          id: string
          invite_link: string | null
        }
        Insert: {
          course_id: string
          created_at?: string | null
          guild_id: string
          id?: string
          invite_link?: string | null
        }
        Update: {
          course_id?: string
          created_at?: string | null
          guild_id?: string
          id?: string
          invite_link?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "discord_servers_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
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
      lecturer_reviews: {
        Row: {
          comment: string | null
          course_id: string
          created_at: string | null
          id: string
          is_positive: boolean | null
          lecturer_availability: number | null
          lecturer_id: string
          personal_approach: number | null
          rating: number
          teaching_quality: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          comment?: string | null
          course_id: string
          created_at?: string | null
          id?: string
          is_positive?: boolean | null
          lecturer_availability?: number | null
          lecturer_id: string
          personal_approach?: number | null
          rating: number
          teaching_quality?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          comment?: string | null
          course_id?: string
          created_at?: string | null
          id?: string
          is_positive?: boolean | null
          lecturer_availability?: number | null
          lecturer_id?: string
          personal_approach?: number | null
          rating?: number
          teaching_quality?: number | null
          updated_at?: string | null
          user_id?: string
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
      notifications: {
        Row: {
          assignment_id: string | null
          created_at: string | null
          delivery_target: string | null
          exam_id: string | null
          expires_at: string | null
          id: string
          is_critical: boolean | null
          is_read: boolean | null
          link: string | null
          message: string
          push_to_phone: boolean | null
          reminder_days_before: number | null
          title: string | null
          type: string
          user_id: string
        }
        Insert: {
          assignment_id?: string | null
          created_at?: string | null
          delivery_target?: string | null
          exam_id?: string | null
          expires_at?: string | null
          id?: string
          is_critical?: boolean | null
          is_read?: boolean | null
          link?: string | null
          message: string
          push_to_phone?: boolean | null
          reminder_days_before?: number | null
          title?: string | null
          type: string
          user_id: string
        }
        Update: {
          assignment_id?: string | null
          created_at?: string | null
          delivery_target?: string | null
          exam_id?: string | null
          expires_at?: string | null
          id?: string
          is_critical?: boolean | null
          is_read?: boolean | null
          link?: string | null
          message?: string
          push_to_phone?: boolean | null
          reminder_days_before?: number | null
          title?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "course_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exam_dates"
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
          benefit_value: number | null
          category: string
          created_at: string
          description_en: string | null
          description_he: string | null
          id: string
          image_url: string | null
          is_exclusive: boolean | null
          is_monetizable: boolean | null
          is_new: boolean | null
          is_popular: boolean | null
          is_subsidized: boolean | null
          link: string | null
          name_en: string | null
          name_he: string
          original_price: number | null
          price: number
          priority: boolean | null
          tags: string[] | null
          type: string | null
          updated_at: string
        }
        Insert: {
          benefit_value?: number | null
          category: string
          created_at?: string
          description_en?: string | null
          description_he?: string | null
          id?: string
          image_url?: string | null
          is_exclusive?: boolean | null
          is_monetizable?: boolean | null
          is_new?: boolean | null
          is_popular?: boolean | null
          is_subsidized?: boolean | null
          link?: string | null
          name_en?: string | null
          name_he: string
          original_price?: number | null
          price: number
          priority?: boolean | null
          tags?: string[] | null
          type?: string | null
          updated_at?: string
        }
        Update: {
          benefit_value?: number | null
          category?: string
          created_at?: string
          description_en?: string | null
          description_he?: string | null
          id?: string
          image_url?: string | null
          is_exclusive?: boolean | null
          is_monetizable?: boolean | null
          is_new?: boolean | null
          is_popular?: boolean | null
          is_subsidized?: boolean | null
          link?: string | null
          name_en?: string | null
          name_he?: string
          original_price?: number | null
          price?: number
          priority?: boolean | null
          tags?: string[] | null
          type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          email: string | null
          id: string
          is_tutor: boolean | null
          name: string | null
          notification_preferences: Json | null
          phone: string | null
          role: string | null
          show_contact_info: boolean | null
          show_email: boolean | null
          show_phone: boolean | null
          status: string | null
          study_year: string | null
          university: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          id: string
          is_tutor?: boolean | null
          name?: string | null
          notification_preferences?: Json | null
          phone?: string | null
          role?: string | null
          show_contact_info?: boolean | null
          show_email?: boolean | null
          show_phone?: boolean | null
          status?: string | null
          study_year?: string | null
          university?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_tutor?: boolean | null
          name?: string | null
          notification_preferences?: Json | null
          phone?: string | null
          role?: string | null
          show_contact_info?: boolean | null
          show_email?: boolean | null
          show_phone?: boolean | null
          status?: string | null
          study_year?: string | null
          university?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      semesters: {
        Row: {
          created_at: string | null
          end_date: string | null
          id: string
          is_current: boolean | null
          name: string
          season: string | null
          start_date: string | null
          year: number
        }
        Insert: {
          created_at?: string | null
          end_date?: string | null
          id?: string
          is_current?: boolean | null
          name: string
          season?: string | null
          start_date?: string | null
          year: number
        }
        Update: {
          created_at?: string | null
          end_date?: string | null
          id?: string
          is_current?: boolean | null
          name?: string
          season?: string | null
          start_date?: string | null
          year?: number
        }
        Relationships: []
      }
      shared_sessions: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          discord_channel_id: string | null
          duration_minutes: number | null
          estimated_duration: number | null
          expires_at: string
          id: string
          is_active: boolean | null
          max_participants: number | null
          meeting_link: string
          notification_sent: boolean | null
          platform: string | null
          scheduled_start_time: string | null
          scheduled_time: string | null
          title: string
          user_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          discord_channel_id?: string | null
          duration_minutes?: number | null
          estimated_duration?: number | null
          expires_at?: string
          id?: string
          is_active?: boolean | null
          max_participants?: number | null
          meeting_link: string
          notification_sent?: boolean | null
          platform?: string | null
          scheduled_start_time?: string | null
          scheduled_time?: string | null
          title: string
          user_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          discord_channel_id?: string | null
          duration_minutes?: number | null
          estimated_duration?: number | null
          expires_at?: string
          id?: string
          is_active?: boolean | null
          max_participants?: number | null
          meeting_link?: string
          notification_sent?: boolean | null
          platform?: string | null
          scheduled_start_time?: string | null
          scheduled_time?: string | null
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
          avatar_url: string | null
          contact_info: string | null
          contact_method: string | null
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
          avatar_url?: string | null
          contact_info?: string | null
          contact_method?: string | null
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
          avatar_url?: string | null
          contact_info?: string | null
          contact_method?: string | null
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
      system_messages: {
        Row: {
          audience: string | null
          content: string
          created_at: string | null
          id: string
          link: string | null
          title: string
        }
        Insert: {
          audience?: string | null
          content: string
          created_at?: string | null
          id?: string
          link?: string | null
          title: string
        }
        Update: {
          audience?: string | null
          content?: string
          created_at?: string | null
          id?: string
          link?: string | null
          title?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          color: string | null
          created_at: string | null
          emoji: string | null
          id: string
          name_en: string | null
          name_he: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          emoji?: string | null
          id?: string
          name_en?: string | null
          name_he: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          emoji?: string | null
          id?: string
          name_en?: string | null
          name_he?: string
        }
        Relationships: []
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
          avatar_url: string | null
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
          user_id: string | null
        }
        Insert: {
          availability?: string | null
          avatar_url?: string | null
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
          user_id?: string | null
        }
        Update: {
          availability?: string | null
          avatar_url?: string | null
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
          user_id?: string | null
        }
        Relationships: []
      }
      tutor_courses: {
        Row: {
          course_grade: number | null
          course_id: string
          created_at: string | null
          id: string
          tutor_id: string
        }
        Insert: {
          course_grade?: number | null
          course_id: string
          created_at?: string | null
          id?: string
          tutor_id: string
        }
        Update: {
          course_grade?: number | null
          course_id?: string
          created_at?: string | null
          id?: string
          tutor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tutor_courses_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tutor_courses_tutor_id_fkey"
            columns: ["tutor_id"]
            isOneToOne: false
            referencedRelation: "tutors"
            referencedColumns: ["id"]
          },
        ]
      }
      tutor_reviews: {
        Row: {
          created_at: string | null
          id: string
          is_public: boolean | null
          rating: number
          review_text: string | null
          tutor_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_public?: boolean | null
          rating: number
          review_text?: string | null
          tutor_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_public?: boolean | null
          rating?: number
          review_text?: string | null
          tutor_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_reviews_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tutor_reviews_tutor_id_fkey"
            columns: ["tutor_id"]
            isOneToOne: false
            referencedRelation: "tutors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tutor_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tutors: {
        Row: {
          availability: string | null
          avatar_url: string | null
          courses: string[] | null
          created_at: string
          description: string | null
          email: string | null
          experience: string | null
          hourly_rate: number
          id: string
          is_online: boolean | null
          is_student: boolean | null
          is_verified: boolean | null
          location: string
          name: string
          phone: string | null
          rating: number | null
          reviews_count: number | null
          show_reviews: boolean | null
          show_trial: boolean | null
          trial_lesson: boolean | null
          trial_price: number | null
          tutor_page_promo: string | null
          updated_at: string
        }
        Insert: {
          availability?: string | null
          avatar_url?: string | null
          courses?: string[] | null
          created_at?: string
          description?: string | null
          email?: string | null
          experience?: string | null
          hourly_rate: number
          id?: string
          is_online?: boolean | null
          is_student?: boolean | null
          is_verified?: boolean | null
          location: string
          name: string
          phone?: string | null
          rating?: number | null
          reviews_count?: number | null
          show_reviews?: boolean | null
          show_trial?: boolean | null
          trial_lesson?: boolean | null
          trial_price?: number | null
          tutor_page_promo?: string | null
          updated_at?: string
        }
        Update: {
          availability?: string | null
          avatar_url?: string | null
          courses?: string[] | null
          created_at?: string
          description?: string | null
          email?: string | null
          experience?: string | null
          hourly_rate?: number
          id?: string
          is_online?: boolean | null
          is_student?: boolean | null
          is_verified?: boolean | null
          location?: string
          name?: string
          phone?: string | null
          rating?: number | null
          reviews_count?: number | null
          show_reviews?: boolean | null
          show_trial?: boolean | null
          trial_lesson?: boolean | null
          trial_price?: number | null
          tutor_page_promo?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      union_analytics: {
        Row: {
          created_at: string | null
          entity_id: string
          entity_type: string
          id: string
          metadata: Json | null
          metric_type: string
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
          metadata?: Json | null
          metric_type: string
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          metadata?: Json | null
          metric_type?: string
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      union_audit_log: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      union_banners: {
        Row: {
          action_text_en: string | null
          action_text_he: string | null
          action_url: string | null
          background_color: string | null
          banner_type: string
          clicks_count: number | null
          content_en: string | null
          content_he: string | null
          created_at: string | null
          created_by: string
          end_date: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_dismissible: boolean | null
          position: string | null
          show_to_returning_users: boolean | null
          start_date: string | null
          target_audience: string | null
          text_color: string | null
          title_en: string | null
          title_he: string
          updated_at: string | null
          views_count: number | null
        }
        Insert: {
          action_text_en?: string | null
          action_text_he?: string | null
          action_url?: string | null
          background_color?: string | null
          banner_type?: string
          clicks_count?: number | null
          content_en?: string | null
          content_he?: string | null
          created_at?: string | null
          created_by: string
          end_date?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_dismissible?: boolean | null
          position?: string | null
          show_to_returning_users?: boolean | null
          start_date?: string | null
          target_audience?: string | null
          text_color?: string | null
          title_en?: string | null
          title_he: string
          updated_at?: string | null
          views_count?: number | null
        }
        Update: {
          action_text_en?: string | null
          action_text_he?: string | null
          action_url?: string | null
          background_color?: string | null
          banner_type?: string
          clicks_count?: number | null
          content_en?: string | null
          content_he?: string | null
          created_at?: string | null
          created_by?: string
          end_date?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_dismissible?: boolean | null
          position?: string | null
          show_to_returning_users?: boolean | null
          start_date?: string | null
          target_audience?: string | null
          text_color?: string | null
          title_en?: string | null
          title_he?: string
          updated_at?: string | null
          views_count?: number | null
        }
        Relationships: []
      }
      union_discounts: {
        Row: {
          category: string
          clicks_count: number | null
          coupon_code: string | null
          created_at: string | null
          created_by: string
          description_en: string | null
          description_he: string | null
          discount_type: string | null
          discount_value: number | null
          end_date: string | null
          external_link: string | null
          id: string
          image_url: string | null
          is_exclusive: boolean | null
          is_popular: boolean | null
          is_welfare_only: boolean | null
          name_en: string | null
          name_he: string
          start_date: string | null
          status: string | null
          terms_en: string | null
          terms_he: string | null
          updated_at: string | null
          usage_count: number | null
          usage_limit: number | null
          views_count: number | null
        }
        Insert: {
          category?: string
          clicks_count?: number | null
          coupon_code?: string | null
          created_at?: string | null
          created_by: string
          description_en?: string | null
          description_he?: string | null
          discount_type?: string | null
          discount_value?: number | null
          end_date?: string | null
          external_link?: string | null
          id?: string
          image_url?: string | null
          is_exclusive?: boolean | null
          is_popular?: boolean | null
          is_welfare_only?: boolean | null
          name_en?: string | null
          name_he: string
          start_date?: string | null
          status?: string | null
          terms_en?: string | null
          terms_he?: string | null
          updated_at?: string | null
          usage_count?: number | null
          usage_limit?: number | null
          views_count?: number | null
        }
        Update: {
          category?: string
          clicks_count?: number | null
          coupon_code?: string | null
          created_at?: string | null
          created_by?: string
          description_en?: string | null
          description_he?: string | null
          discount_type?: string | null
          discount_value?: number | null
          end_date?: string | null
          external_link?: string | null
          id?: string
          image_url?: string | null
          is_exclusive?: boolean | null
          is_popular?: boolean | null
          is_welfare_only?: boolean | null
          name_en?: string | null
          name_he?: string
          start_date?: string | null
          status?: string | null
          terms_en?: string | null
          terms_he?: string | null
          updated_at?: string | null
          usage_count?: number | null
          usage_limit?: number | null
          views_count?: number | null
        }
        Relationships: []
      }
      union_events: {
        Row: {
          attendees_count: number | null
          category: string
          color: string | null
          created_at: string | null
          created_by: string
          description_en: string | null
          description_he: string | null
          end_at: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          is_all_day: boolean | null
          is_important: boolean | null
          location: string | null
          max_attendees: number | null
          registration_required: boolean | null
          start_at: string
          title_en: string | null
          title_he: string
          updated_at: string | null
          zoom_link: string | null
        }
        Insert: {
          attendees_count?: number | null
          category?: string
          color?: string | null
          created_at?: string | null
          created_by: string
          description_en?: string | null
          description_he?: string | null
          end_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_all_day?: boolean | null
          is_important?: boolean | null
          location?: string | null
          max_attendees?: number | null
          registration_required?: boolean | null
          start_at: string
          title_en?: string | null
          title_he: string
          updated_at?: string | null
          zoom_link?: string | null
        }
        Update: {
          attendees_count?: number | null
          category?: string
          color?: string | null
          created_at?: string | null
          created_by?: string
          description_en?: string | null
          description_he?: string | null
          end_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_all_day?: boolean | null
          is_important?: boolean | null
          location?: string | null
          max_attendees?: number | null
          registration_required?: boolean | null
          start_at?: string
          title_en?: string | null
          title_he?: string
          updated_at?: string | null
          zoom_link?: string | null
        }
        Relationships: []
      }
      union_team: {
        Row: {
          created_at: string | null
          created_by: string | null
          email: string
          id: string
          is_active: boolean | null
          last_login: string | null
          name: string
          permissions: Json | null
          role: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          email: string
          id?: string
          is_active?: boolean | null
          last_login?: string | null
          name: string
          permissions?: Json | null
          role?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          last_login?: string | null
          name?: string
          permissions?: Json | null
          role?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_course_progress: {
        Row: {
          course_id: string
          created_at: string
          id: string
          is_favorite: boolean | null
          last_activity: string | null
          notes: string | null
          progress_percentage: number | null
          selected_exam_date: string | null
          selected_exam_session: string | null
          selected_exam_time: string | null
          semester: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          is_favorite?: boolean | null
          last_activity?: string | null
          notes?: string | null
          progress_percentage?: number | null
          selected_exam_date?: string | null
          selected_exam_session?: string | null
          selected_exam_time?: string | null
          semester?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          is_favorite?: boolean | null
          last_activity?: string | null
          notes?: string | null
          progress_percentage?: number | null
          selected_exam_date?: string | null
          selected_exam_session?: string | null
          selected_exam_time?: string | null
          semester?: string | null
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
      user_reports: {
        Row: {
          content: string
          course_id: string | null
          created_at: string | null
          email: string | null
          file_url: string | null
          id: string
          page_referrer: string | null
          status: Database["public"]["Enums"]["report_status"] | null
          sub_category: string | null
          subject: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          content: string
          course_id?: string | null
          created_at?: string | null
          email?: string | null
          file_url?: string | null
          id?: string
          page_referrer?: string | null
          status?: Database["public"]["Enums"]["report_status"] | null
          sub_category?: string | null
          subject: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string
          course_id?: string | null
          created_at?: string | null
          email?: string | null
          file_url?: string | null
          id?: string
          page_referrer?: string | null
          status?: Database["public"]["Enums"]["report_status"] | null
          sub_category?: string | null
          subject?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_reports_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      shared_sessions_with_scheduled_time: {
        Row: {
          course_id: string | null
          created_at: string | null
          description: string | null
          discord_channel_id: string | null
          duration_minutes: number | null
          estimated_duration: number | null
          expires_at: string | null
          id: string | null
          is_active: boolean | null
          max_participants: number | null
          meeting_link: string | null
          notification_sent: boolean | null
          platform: string | null
          scheduled_start_time: string | null
          scheduled_time: string | null
          title: string | null
          user_id: string | null
        }
        Insert: {
          course_id?: string | null
          created_at?: string | null
          description?: string | null
          discord_channel_id?: string | null
          duration_minutes?: number | null
          estimated_duration?: number | null
          expires_at?: string | null
          id?: string | null
          is_active?: boolean | null
          max_participants?: number | null
          meeting_link?: string | null
          notification_sent?: boolean | null
          platform?: string | null
          scheduled_start_time?: string | null
          scheduled_time?: never
          title?: string | null
          user_id?: string | null
        }
        Update: {
          course_id?: string | null
          created_at?: string | null
          description?: string | null
          discord_channel_id?: string | null
          duration_minutes?: number | null
          estimated_duration?: number | null
          expires_at?: string | null
          id?: string | null
          is_active?: boolean | null
          max_participants?: number | null
          meeting_link?: string | null
          notification_sent?: boolean | null
          platform?: string | null
          scheduled_start_time?: string | null
          scheduled_time?: never
          title?: string | null
          user_id?: string | null
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
    }
    Functions: {
      clean_expired_assignments_notifications: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      clean_expired_exams_notifications: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      clean_expired_products_notifications: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      clean_expired_sessions_notifications: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      clean_study_partners_notifications: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      clean_system_messages_notifications: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      increment_helpful_count: {
        Args: { review_id: string; user_id: string }
        Returns: undefined
      }
      limit_insert: {
        Args: { table_name: string; uid: string; limit_per_hour: number }
        Returns: boolean
      }
    }
    Enums: {
      report_status: "pending" | "in_progress" | "resolved"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      report_status: ["pending", "in_progress", "resolved"],
    },
  },
} as const
