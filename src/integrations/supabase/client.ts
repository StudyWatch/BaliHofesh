// src/integrations/supabase/client.ts

import { createClient } from '@supabase/supabase-js';
import type { Database } from './supabase.types'; // ✅ זה הנתיב הנכון אם הפקודה יצרה קובץ types כאן

const SUPABASE_URL = "https://jbsxzxavlbiypayaikjp.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impic3h6eGF2bGJpeXBheWFpa2pwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3NjYzNTMsImV4cCI6MjA2NjM0MjM1M30.OHHI8XXXCtuOYZcKDZzdfDsyPUqvwvDTBo71yP1jRv4";

// יצירת לקוח רגיל עם טיפוסים אוטומטיים
export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

// לקוח אנונימי – ללא שמירת סשן (לצפייה בלבד)
export const anonSupabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  }
);
