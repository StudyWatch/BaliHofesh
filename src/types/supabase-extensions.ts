// Extended Supabase types for missing tables and enums
export type AssignmentType = 'homework' | 'project' | 'maman' | 'mamach' | 'essay';

export interface Assignment {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  due_date: string;
  due_time: string;
  assignment_type: AssignmentType;
  created_at: string;
  updated_at: string;
  created_by?: string; // Make optional to match existing usage
  creator_profile?: {
    id: string;
    name: string;
    email?: string; // Make optional to match existing usage
    avatar_url?: string;
  };
}

export interface TutorCourse {
  id: string;
  tutor_id: string;
  course_id: string;
  created_at: string;
  updated_at: string;
  tutor?: {
    id: string;
    name: string;
    email: string;
    rating: number;
    expertise: string[];
  };
  course?: {
    id: string;
    name: string;
    code: string;
    institution_id: string;
  };
}

export interface NotificationRecord {
  id: string;
  user_id: string;
  type: 'assignment' | 'exam' | 'session' | 'partner' | 'system' | 'message';
  title: string;
  message: string;
  link?: string;
  is_read: boolean;
  delivery_target: 'site' | 'push' | 'both';
  is_critical?: boolean;
  created_at: string;
  expires_at?: string;
  assignment_id?: string;
  exam_id?: string;
}

export interface StudyPartnerWithProfile {
  id: string;
  course_id: string;
  user_id: string;
  description: string;
  available_hours: string[];
  preferred_times: string[];
  contact_info?: string;
  avatar_url?: string;
  expires_at: string;
  created_at: string;
  profiles?: {
    id: string;
    name: string;
    email: string;
    avatar_url?: string;
  };
}

export interface CourseAssignment {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  due_date: string;
  due_time: string;
  assignment_type: AssignmentType;
  created_at: string;
  updated_at: string;
  created_by: string;
}