import { useAuth } from '@/App';
import { useLogAdminAction } from './useAdminActions';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const useAdminAuth = () => {
  const { user, profile, loading, isAdmin } = useAuth();
  const logAdminAction = useLogAdminAction();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect non-admins once loading is complete
    if (!loading && (!user || !isAdmin)) {
      navigate('/', { replace: true });
    }
  }, [loading, user, isAdmin, navigate]);

  const logAction = (actionType: string, targetType: string, targetId: string, description: string, metadata?: any) => {
    if (isAdmin) {
      logAdminAction.mutate({
        action_type: actionType,
        target_type: targetType,
        target_id: targetId,
        description: description,
        metadata: metadata
      });
    }
  };

  return {
    user,
    profile,
    loading,
    isAdmin,
    isAuthorized: !loading && user && isAdmin,
    logAction
  };
};