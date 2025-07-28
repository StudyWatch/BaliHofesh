// src/utils/logAdminAccess.ts
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/supabase.types";

type AdminAccessInsert = Database["public"]["Tables"]["admin_access_logs"]["Insert"];

export async function logAdminAccess({
  user_id,
  email,
  success,
  ip_address,
  user_agent,
}: {
  user_id?: string | null;
  email?: string | null;
  success: boolean;
  ip_address: string | null;
  user_agent: string;
}) {
  const accessLog: AdminAccessInsert = {
    user_id: user_id ?? null,
    email: email ?? null,
    success,
    ip_address: ip_address ?? "לא ידוע",
    user_agent,
  };

  const { error } = await supabase
    .from("admin_access_logs")
    .insert([accessLog]);

  if (error) {
    console.error("🔴 שגיאה ברישום גישה לאדמין:", error.message);
  }
}
