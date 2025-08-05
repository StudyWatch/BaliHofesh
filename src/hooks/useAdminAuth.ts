import { useAuth } from '@/contexts/AuthProvider';
import { useLogAdminAction } from './useAdminActions';
import { useUserProfile } from './useProfile';

/**
 * Hook מתקדם לניהול הרשאות אדמין
 * משתמש במערכת ההגנה החזקה של AuthProvider
 */
export const useAdminAuth = () => {
  const { user, session, isAdmin, loading, initialLoad } = useAuth();
  const { data: profile } = useUserProfile();
  const logAdminAction = useLogAdminAction();

  // פונקציה לתיעוד פעולות אדמין
  const logAction = (
    actionType: string, 
    targetType: string, 
    targetId: string, 
    description: string, 
    metadata?: any
  ) => {
    // רק אדמינים מורשים יכולים לתעד פעולות
    if (isAdmin && user) {
      console.log('📝 Logging admin action:', { actionType, targetType, targetId, description });
      
      logAdminAction.mutate({
        action_type: actionType,
        target_type: targetType,
        target_id: targetId,
        description: description,
        metadata: metadata
      });
    } else {
      console.warn('⚠️ Attempted to log action without admin privileges:', {
        actionType,
        isAdmin,
        user: !!user
      });
    }
  };

  return {
    user,
    profile,
    session,
    loading,
    isAdmin,
    initialLoad,
    isAuthorized: initialLoad && !loading && user && isAdmin,
    logAction
  };
};