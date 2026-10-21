import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const roleHome = {
  citizen: '/citizen',
  team: '/team',
  authority: '/team',
  admin: '/admin',
};

const PublicOnly = ({ children }) => {
  const { session, isReady } = useAuth();

  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F4F6F9] text-xs text-[#64748B]">
        Loading...
      </div>
    );
  }

  // If user is already authenticated, redirect to their role home
  if (session && session.role) {
    return <Navigate to={roleHome[session.role] || '/'} replace />;
  }

  return children;
};

export default PublicOnly;
