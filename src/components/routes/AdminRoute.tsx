import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/App';
import { Loader2 } from 'lucide-react';

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAdmin, loading } = useAuth();

  console.log('[AdminRoute] mount. user:', user, 'loading:', loading, 'isAdmin:', isAdmin);

  if (loading) {
    console.log('[AdminRoute] loading...');
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin w-10 h-10 text-blue-500" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    console.log('[AdminRoute] redirecting, not admin');
    return <Navigate to="/" />;
  }

  console.log('[AdminRoute] User is admin, rendering children.');
  return <>{children}</>;
};

export default AdminRoute;
