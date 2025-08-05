import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const AuthCallbackHandler: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const hasTokens =
      params.has('access_token') ||
      params.has('refresh_token') ||
      params.has('type') ||
      params.has('token_type');

    if (!hasTokens) {
      // לא הגיע מתוך OAuth – אל תעשה כלום
      return;
    }

    const handleAuth = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        toast.error('אירעה שגיאה בעת ההתחברות. נסה שוב.');
        return;
      }

      if (data?.session) {
        toast.success('התחברת בהצלחה!');

        // חפש כתובת יעד לשחזור
        const previousPath = localStorage.getItem('redirectAfterLogin');
        if (previousPath) {
          navigate(previousPath);
          localStorage.removeItem('redirectAfterLogin');
        } else {
          navigate('/dashboard'); // או כל דף אחר (לא דף הבית אם לא נדרש)
        }
      } else {
        toast('המתן לאימות...');
      }
    };

    handleAuth();
  }, [navigate, location.search]);

  return (
    <div className="p-4 text-center">
      <h2>מתחברים...</h2>
      <p>אנא המתן</p>
    </div>
  );
};

export default AuthCallbackHandler;
