import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Radio,
  Map,
  Cpu,
  Users,
  Building,
  Settings,
  Shield,
  Activity,
  User,
} from 'lucide-react';
import Sidebar from '../common/Sidebar';
import Header from '../common/Header';
import incidentService from '../../services/incidentService';

const adminNavItems = [
  { name: 'Dashboard', path: '/admin', icon: LayoutDashboard, end: true },
  { name: 'All Incidents', path: '/admin/incidents', icon: Radio },
  { name: 'Incident Map', path: '/admin/map', icon: Map },
  { name: 'IoT Monitoring', path: '/admin/sensors', icon: Cpu },
  { name: 'Response Teams', path: '/admin/teams', icon: Users },
  { name: 'Profile', path: '/admin/profile', icon: User },
];

const pageTitles = {
  '/admin': { title: 'Incident Management', subtitle: 'Central governance, incident oversight, and emergency response operations' },
  '/admin/incidents': { title: 'Incident Registry', subtitle: 'Search, assign, and inspect emergency situations' },
  '/admin/map': { title: 'Incident Map', subtitle: 'Mapped citizen and IoT incidents with backend GPS coordinates' },
  '/admin/sensors': { title: 'IoT Sensor Monitoring', subtitle: 'Live telemetry, device health, and alert monitoring' },
  '/authority/sensors': { title: 'IoT Sensor Monitoring', subtitle: 'Hardware status from connected ESP32 multi-sensor nodes' },
  '/admin/teams': { title: 'Response Units', subtitle: 'Registered rescue battalions and emergency field units' },
  '/admin/profile': { title: 'Administrator Profile', subtitle: 'System administration credentials and access logs' },
};

const AdminLayout = () => {
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

  const currentMeta = pageTitles[location.pathname] || {
    title: 'Administrator Console',
    subtitle: 'System administration & emergency governance',
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-[#172033] flex font-sans">
      <Sidebar
        portalTitle="Smart Disaster Response"
        portalSubtitle="Administrator Console"
        navItems={adminNavItems}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        homePath="/admin"
      />

      <div className="flex-1 flex flex-col min-w-0 lg:pl-60 transition-all duration-200">
        <Header
          pageTitle={currentMeta.title}
          pageSubtitle={currentMeta.subtitle}
          role="admin"
          backendOnline={backendOnline}
          onMenuToggle={() => setIsMobileMenuOpen((prev) => !prev)}
          profilePath="/admin/profile"
        />

        <main className="flex-1 p-5 sm:p-6 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
