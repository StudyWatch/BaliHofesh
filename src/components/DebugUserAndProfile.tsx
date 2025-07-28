// src/components/DebugUserAndProfile.tsx
import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const DebugUserAndProfile = () => {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserAndProfile = async () => {
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !sessionData.session) {
          setError("No session or session error");
          return;
        }

        const user = sessionData.session.user;
        setUserEmail(user.email);

        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) {
          setError("Profile fetch error: " + error.message);
        } else {
          setProfile(data);
        }
      } catch (err: any) {
        setError("Unexpected error: " + err.message);
      }
    };

    fetchUserAndProfile();
  }, []);

  if (!userEmail && !error) return null;

  return (
    <div className="bg-yellow-100 text-yellow-900 text-sm px-4 py-2 border-b border-yellow-400" dir="rtl">
      <b>Debug:</b>{" "}
      {error ? (
        <span className="text-red-600">⚠️ שגיאה: {error}</span>
      ) : (
        <>
          🟢 התחברת בתור: <b>{userEmail}</b>
          {profile && profile.role && (
            <span className="ml-4">
              (פרופיל: <b>{profile.role}</b>)
            </span>
          )}
        </>
      )}
    </div>
  );
};

export default DebugUserAndProfile;
