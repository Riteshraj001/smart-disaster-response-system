import React from 'react';
import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const roleLabels = {
  citizen: 'Citizen',
  authority: 'Authority',
  admin: 'Administrator',
};

const PortalHeaderControls = ({ backendOnline }) => {
  const navigate = useNavigate();
  const { session, signOut } = useAuth();
  const roleLabel = roleLabels[session?.role] || 'User';

  const handleLogout = () => {
    signOut();
    navigate('/', { replace: true });
  };

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <div className={`hidden sm:inline-flex items-center gap-1.5 text-xs font-medium ${backendOnline ? 'text-[#059669]' : 'text-[#DC2626]'}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${backendOnline ? 'bg-[#059669]' : 'bg-[#DC2626]'}`} />
        <span>System {backendOnline ? 'Online' : 'Offline'}</span>
      </div>
      <span className="hidden md:inline text-xs font-medium text-[#64748B]">
        {roleLabel}{session?.name ? `: ${session.name}` : ''}
      </span>
      <button
        type="button"
        onClick={handleLogout}
        className="inline-flex items-center gap-1.5 rounded-md border border-[#DDE3EA] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#172033] transition-colors hover:bg-slate-50"
      >
        <LogOut className="h-3.5 w-3.5" />
        <span>Logout</span>
      </button>
    </div>
  );
};

export default PortalHeaderControls;
