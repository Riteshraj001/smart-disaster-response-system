import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { ShieldAlert, LogOut, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar = ({
  portalTitle = 'Smart Disaster Mgmt',
  portalSubtitle = 'Operations Portal',
  navItems = [],
  isOpen = false,
  onClose,
  homePath = '/',
}) => {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleLogout = () => {
    signOut();
    navigate('/', { replace: true });
  };

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-60 flex-col justify-between border-r border-[#E2E8F0] bg-white transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top: Identity & Navigation */}
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Brand Header */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#E2E8F0]">
            <Link
              to={homePath}
              onClick={() => onClose && onClose()}
              className="flex items-center gap-2.5"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2563EB] text-white shadow-xs shrink-0">
                <ShieldAlert className="w-4.5 h-4.5" />
              </div>
              <div className="overflow-hidden">
                <h2 className="text-xs font-bold text-[#172033] leading-tight truncate">
                  {portalTitle}
                </h2>
                <span className="text-[10px] text-[#64748B] block truncate">
                  {portalSubtitle}
                </span>
              </div>
            </Link>

            {/* Mobile close button */}
            <button
              type="button"
              onClick={onClose}
              className="lg:hidden p-1 rounded-md text-[#64748B] hover:bg-slate-100 hover:text-[#172033]"
              aria-label="Close navigation drawer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Items List */}
          <nav className="p-3 space-y-1">
            <div className="px-2.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[#64748B]">
              Navigation
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.end !== undefined ? item.end : item.path === homePath}
                  onClick={() => onClose && onClose()}
                  className={({ isActive }) =>
                    `group relative flex items-center gap-2.5 rounded-md px-3 py-2 text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-[#2563EB] font-semibold'
                        : 'text-[#64748B] hover:bg-slate-50 hover:text-[#172033]'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {/* Active Indicator bar */}
                      {isActive && (
                        <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r bg-[#2563EB]" />
                      )}
                      {Icon && (
                        <Icon
                          className={`w-4 h-4 shrink-0 transition-colors ${
                            isActive
                              ? 'text-[#2563EB]'
                              : 'text-[#64748B] group-hover:text-[#172033]'
                          }`}
                        />
                      )}
                      <span className="truncate">{item.name}</span>
                      {item.badge && (
                        <span className="ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-100 text-[#2563EB]">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: Visually Separated Logout */}
        <div className="p-3 border-t border-[#E2E8F0] bg-white">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-xs font-medium text-[#64748B] hover:bg-red-50 hover:text-[#DC2626] transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4 shrink-0 text-[#64748B] group-hover:text-[#DC2626]" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
