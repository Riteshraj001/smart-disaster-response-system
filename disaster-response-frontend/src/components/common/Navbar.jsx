import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ShieldAlert,
  PlusCircle,
  Menu,
} from 'lucide-react';

const Navbar = ({ onMobileMenuToggle, backendOnline = true }) => {
  const location = useLocation();

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-[#E5E7EB] bg-white px-4 sm:px-6 shadow-xs">
      {/* Left: Mobile menu toggle + System Title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMobileMenuToggle}
          className="lg:hidden p-1.5 rounded-md border border-[#E5E7EB] bg-white text-[#64748B] hover:text-[#111827] hover:bg-slate-50 focus:outline-none"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#1D4ED8] text-white">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-[#111827] tracking-tight leading-tight">
              Smart Disaster Management
            </h1>
            <p className="hidden sm:block text-[11px] text-[#64748B] font-normal">
              Emergency Response System
            </p>
          </div>
        </Link>
      </div>

      {/* Right side: Connectivity Status, Role Switcher, Report CTA */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Backend Status indicator */}
        <div
          className={`flex items-center gap-1.5 px-2 py-0.5 rounded border text-xs font-medium ${
            backendOnline
              ? 'bg-emerald-50 border-emerald-200 text-[#059669]'
              : 'bg-red-50 border-red-200 text-[#DC2626]'
          }`}
          title={backendOnline ? 'Spring Boot API: Online' : 'Spring Boot API: Offline'}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              backendOnline ? 'bg-[#059669]' : 'bg-[#DC2626]'
            }`}
          />
          <span className="hidden md:inline">
            {backendOnline ? 'API Connected' : 'API Offline'}
          </span>
        </div>

        {/* Quick Report CTA if not already on Create page */}
        {location.pathname !== '/incidents/create' && location.pathname !== '/citizen/report' && (
          <Link
            to="/citizen/report"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#1D4ED8] hover:bg-blue-800 text-xs font-semibold text-white transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Report Incident</span>
            <span className="sm:hidden">Report</span>
          </Link>
        )}
      </div>
    </header>
  );
};

export default Navbar;

