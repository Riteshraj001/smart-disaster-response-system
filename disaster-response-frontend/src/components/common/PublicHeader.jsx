import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Shield, Menu, X } from 'lucide-react';
import incidentService from '../../services/incidentService';

export const PublicHeader = () => {
  const location = useLocation();
  const [backendOnline, setBackendOnline] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const checkHealth = async () => {
      try {
        const isOnline = await incidentService.checkBackendHealth();
        if (isMounted) setBackendOnline(isOnline);
      } catch {
        if (isMounted) setBackendOnline(false);
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 20000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Report Incident', path: '/citizen/report' },
    { name: 'Incidents', path: '/authority/incidents' },
    { name: 'IoT Monitoring', path: '/authority/sensors' },
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-40 h-16 border-b border-[#E2E8F0] bg-white">
      <div className="mx-auto flex h-full max-w-[1100px] items-center justify-between px-4 sm:px-6">
        {/* Brand identity */}
        <Link to="/" className="flex items-center gap-2.5 text-[#172033] hover:opacity-90">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-[#2563EB] text-white">
            <Shield className="h-4 w-4" />
          </div>
          <span className="text-sm font-semibold tracking-tight text-[#172033]">
            Smart Disaster Response
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`text-xs font-medium transition-colors ${
                isActive(link.path)
                  ? 'text-[#2563EB] font-semibold'
                  : 'text-[#64748B] hover:text-[#172033]'
              }`}
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Backend Indicator & Mobile Toggle */}
        <div className="flex items-center gap-3">
          {backendOnline !== null && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-[#E2E8F0] bg-[#F8FAFC] text-[11px] font-medium">
              <span
                className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                  backendOnline ? 'bg-[#059669]' : 'bg-[#DC2626]'
                }`}
              />
              <span className={backendOnline ? 'text-[#059669]' : 'text-[#DC2626]'}>
                Backend {backendOnline ? 'Connected' : 'Offline'}
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 rounded text-[#64748B] hover:bg-slate-100 hover:text-[#172033]"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-[#E2E8F0] bg-white px-4 py-3 space-y-1 shadow-xs">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded text-xs font-medium transition-colors ${
                isActive(link.path)
                  ? 'bg-blue-50 text-[#2563EB] font-semibold'
                  : 'text-[#64748B] hover:bg-slate-50 hover:text-[#172033]'
              }`}
            >
              {link.name}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
};

export default PublicHeader;
