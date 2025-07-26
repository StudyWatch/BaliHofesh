// src/components/auth/AuthCallbackHandler.tsx

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const AuthCallbackHandler: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuth = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error('שגיאת התחברות:', error.message);
        toast.error('אירעה שגיאה בעת ההתחברות. נסה שוב.');
        return;
      }

      // אתה יכול לבדוק אם יש סשן או להפנות פשוט:
      if (data?.session) {
        toast.success('התחברת בהצלחה!');
        navigate('/'); // או דף אחר
      } else {
        toast('המתן לאימות...');
      }
    };

    handleAuth();
  }, []);

  return (
    <div className="p-4 text-center">
      <h2>מתחברים...</h2>
      <p>אנא המתן</p>
    </div>
  );
};

export default AuthCallbackHandler;
