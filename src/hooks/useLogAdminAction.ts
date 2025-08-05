import { supabase } from "@/integrations/supabase/client";

export const logAdminAction = async ({
  admin_id,
  action_type,
  target_type,
  target_id,
  description,
  metadata
}: {
  admin_id: string;
  action_type: string;
  target_type: string;
  target_id?: string;
  description: string;
  metadata?: any;
}) => {
  await supabase.from("admin_logs").insert([
    { admin_id, action_type, target_type, target_id, description, metadata }
  ]);
};
