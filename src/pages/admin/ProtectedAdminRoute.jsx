import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Loader2 } from 'lucide-react';

const ProtectedAdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // 1. Show loader while checking session state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-4" />
        <p className="text-gray-500 font-medium">Verifying access...</p>
      </div>
    );
  }

  // 2. If NO user is authenticated, force redirect to login
  if (!user) {
    // Save the location they were trying to access to redirect back after login
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  // 3. If user IS authenticated, allow access to the protected route
  return children;
};

export default ProtectedAdminRoute;