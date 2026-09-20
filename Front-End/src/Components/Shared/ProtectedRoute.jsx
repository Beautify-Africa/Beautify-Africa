// src/Components/Shared/ProtectedRoute.jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

function AuthCheckingLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#faf9f6]">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-stone-300 border-t-stone-900 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Verifying session...</p>
      </div>
    </div>
  );
}

/**
 * Route protection wrapper for sensitive or admin routes.
 * Prevents unauthorized users from downloading or rendering sensitive panels.
 */
export default function ProtectedRoute({ children, adminOnly = false, requiredRole = null }) {
  const { user, isAuthenticated, isRestoringSession } = useAuth();
  const location = useLocation();

  if (isRestoringSession) {
    return <AuthCheckingLoader />;
  }

  if (!isAuthenticated) {
    if (adminOnly) {
      return <Navigate to="/admin/login" state={{ from: location }} replace />;
    }
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  const isAdmin = Boolean(user?.isAdmin || user?.role === 'admin');

  if (adminOnly && !isAdmin) {
    return <Navigate to="/admin/login" state={{ from: location, unauthorized: true }} replace />;
  }

  if (requiredRole && user?.role !== requiredRole && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}
