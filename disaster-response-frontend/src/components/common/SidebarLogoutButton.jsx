import React from 'react';
import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const SidebarLogoutButton = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    signOut();
    navigate('/', { replace: true });
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-xs font-semibold text-[#DC2626] transition-colors hover:bg-red-50"
    >
      <LogOut className="h-4 w-4" />
      Logout
    </button>
  );
};

export default SidebarLogoutButton;
