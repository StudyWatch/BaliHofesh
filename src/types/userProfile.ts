export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  role?: 'user' | 'admin';
  created_at: string;
  updated_at: string;
  avatar_url?: string;
  bio?: string;
  phone?: string;
  university?: string;
  study_year?: string;
  show_email?: boolean;
  show_phone?: boolean;
  show_contact_info?: boolean;
  status?: string;
  is_tutor?: boolean;
  notification_preferences?: Record<string, any>; // או טיפוס מותאם אם יש לך
}
