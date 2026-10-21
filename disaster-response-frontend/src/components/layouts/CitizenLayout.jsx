import React, { useCallback, useEffect, useState } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  PlusCircle,
  FileText,
  Bell,
  BookOpen,
  User,
} from 'lucide-react';
import Sidebar from '../common/Sidebar';
import Header from '../common/Header';
import incidentService from '../../services/incidentService';

const citizenNavItems = [
  { name: 'Dashboard', path: '/citizen', icon: LayoutDashboard, end: true },
  { name: 'Report Incident', path: '/citizen/report', icon: PlusCircle },
  { name: 'My Reports', path: '/citizen/reports', icon: FileText },
  { name: 'Notifications', path: '/citizen/notifications', icon: Bell },
  { name: 'Safety Guide', path: '/citizen/guide', icon: BookOpen },
  { name: 'Profile', path: '/citizen/profile', icon: User },
];

const pageTitles = {
  '/citizen': { title: 'Citizen Dashboard', subtitle: 'Overview of local alerts and personal incident reports' },
  '/citizen/report': { title: 'Report Emergency Incident', subtitle: 'Submit details and photos of a critical situation in real time' },
  '/citizen/reports': { title: 'My Incident Reports', subtitle: 'Track verification and emergency team dispatch progress' },
  '/citizen/track': { title: 'Live Response Tracking', subtitle: 'Follow the verified status of your emergency report' },
  '/citizen/notifications': { title: 'Notifications & Alerts', subtitle: 'Broadcasts from campus safety and emergency operations' },
  '/citizen/guide': { title: 'Disaster Safety Guide', subtitle: 'Emergency response protocols and standard operating procedures' },
  '/citizen/profile': { title: 'Citizen Profile', subtitle: 'Manage personal contact information and emergency details' },
};

const CitizenLayout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [backendOnline, setBackendOnline] = useState(true);
  const location = useLocation();

  const checkHealth = useCallback(async () => {
    const isOnline = await incidentService.checkBackendHealth();
    setBackendOnline(isOnline);
  }, []);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, [checkHealth]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const currentMeta = pageTitles[location.pathname] || (location.pathname.startsWith('/citizen/track/') ? pageTitles['/citizen/track'] : null) || {
    title: 'Citizen Portal',
    subtitle: 'Public incident reporting & emergency response',
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#172033] font-sans flex">
      <Sidebar
        portalTitle="Smart Disaster Mgmt"
        portalSubtitle="Citizen Portal"
        navItems={citizenNavItems}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        homePath="/citizen"
      />

      <div className="flex min-h-screen flex-1 flex-col lg:pl-60 transition-all duration-200">
        <Header
          pageTitle={currentMeta.title}
          pageSubtitle={currentMeta.subtitle}
          role="citizen"
          backendOnline={backendOnline}
          onMenuToggle={() => setIsMobileMenuOpen((open) => !open)}
          profilePath="/citizen/profile"
          action={
            location.pathname !== '/citizen/report' ? (
              <Link
                to="/citizen/report"
                className="hidden sm:inline-flex items-center gap-1.5 rounded-md bg-[#2563EB] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#1D4ED8] shadow-xs"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                <span>Report Incident</span>
              </Link>
            ) : null
          }
        />

        <main className="mx-auto w-full max-w-7xl flex-1 p-6 sm:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default CitizenLayout;
