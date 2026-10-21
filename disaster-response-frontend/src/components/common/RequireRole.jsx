import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const roleHome = {
  citizen: '/citizen',
  team: '/team',
  authority: '/team',
  admin: '/admin',
};

const RequireRole = ({ role, children }) => {
  const { session, isReady } = useAuth();
  const location = useLocation();

  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F4F6F9] text-xs text-[#64748B]">
        Verifying authorization...
      </div>
    );
  }

  const expectedRole = role === 'authority' ? 'team' : role;
  const currentRole = session?.role === 'authority' ? 'team' : session?.role;

  if (!session) {
    return <Navigate to={`/login/${expectedRole}`} replace state={{ from: location.pathname }} />;
  }

  if (currentRole !== expectedRole) {
    return <Navigate to={roleHome[currentRole] || '/'} replace />;
  }

  return children;
};

export default RequireRole;
