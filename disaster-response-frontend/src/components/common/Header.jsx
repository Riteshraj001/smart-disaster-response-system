import React from 'react';
import { Menu, User, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const Header = ({
  pageTitle,
  pageSubtitle,
  role = 'CITIZEN',
  backendOnline = true,
  onMenuToggle,
  profilePath = '/citizen/profile',
  action,
}) => {
  const navigate = useNavigate();
  const { session, signOut } = useAuth();

  const handleLogout = () => {
    signOut();
    navigate('/', { replace: true });
  };

  const roleNames = {
    citizen: 'Citizen',
    team: 'Response Team',
    authority: 'Response Team',
    admin: 'Administrator',
  };

  const normalizedRole = (session?.role || role).toLowerCase();

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-[#E2E8F0] bg-white px-4 sm:px-6 shadow-xs">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuToggle}
          className="p-1.5 rounded border border-[#E2E8F0] bg-white text-[#64748B] hover:text-[#172033] hover:bg-slate-50 lg:hidden cursor-pointer"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-4 h-4" />
        </button>

        <div>
          <h1 className="text-sm sm:text-base font-bold text-[#172033] tracking-tight leading-tight">
            {pageTitle || 'Dashboard'}
          </h1>
          {pageSubtitle && (
            <p className="text-[11px] text-[#64748B] hidden sm:block">
              {pageSubtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right: Actions, System Status, User Role & Profile */}
      <div className="flex items-center gap-3 sm:gap-4">
        {action && <div className="shrink-0">{action}</div>}

        {/* Backend Online/Offline Indicator */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded border border-[#E2E8F0] bg-[#F8FAFC] text-[11px] font-medium">
          <span
            className={`h-1.5 w-1.5 rounded-full shrink-0 ${
              backendOnline ? 'bg-[#059669]' : 'bg-[#DC2626]'
            }`}
          />
          <span className={backendOnline ? 'text-[#059669]' : 'text-[#DC2626]'}>
            Backend {backendOnline ? 'Connected' : 'Offline'}
          </span>
        </div>

        {/* User Identity & Logout */}
        <div className="flex items-center gap-2 pl-2 border-l border-[#E2E8F0]">
          <Link
            to={profilePath}
            className="flex items-center gap-2 text-xs text-[#172033] hover:text-[#2563EB] transition-colors p-1 rounded"
            title="View Profile"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded bg-slate-100 text-slate-700">
              <User className="h-3.5 w-3.5" />
            </div>
            <div className="hidden md:block text-left">
              <span className="block font-semibold text-[#172033] leading-none">
                {session?.name || 'User'}
              </span>
              <span className="block text-[10px] text-[#64748B] font-medium mt-0.5">
                {roleNames[normalizedRole] || normalizedRole}
              </span>
            </div>
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="p-1.5 rounded text-[#64748B] hover:text-[#DC2626] hover:bg-red-50 transition-colors cursor-pointer"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
