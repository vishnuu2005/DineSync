import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const ProtectedRoute = ({
  children,
  adminOnly = false,
  chefOnly = false,
  waiterOnly = false,
  staffOnly = false,
}) => {
  const { user, loading, isAdmin, isChef } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2]">
        <LoadingSpinner text="Verifying session authorization..." />
      </div>
    );
  }

  const isWaiter = user?.role === 'waiter';
  const isStaff = ['admin', 'chef', 'waiter'].includes(user?.role);

  if (!user) {
    if (chefOnly) return <Navigate to="/chef/login" state={{ from: location }} replace />;
    if (waiterOnly) return <Navigate to="/waiter/login" state={{ from: location }} replace />;
    if (adminOnly) return <Navigate to="/admin/login" state={{ from: location }} replace />;
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  if (chefOnly && !isChef && !isAdmin) {
    return <Navigate to="/chef/login" replace />;
  }

  if (waiterOnly && !isWaiter && !isAdmin) {
    return <Navigate to="/waiter/login" replace />;
  }

  if (staffOnly && !isStaff) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
