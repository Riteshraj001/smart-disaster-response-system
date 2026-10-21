import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import {
  Radio,
  Map,
  CheckSquare,
  Users,
  Cpu,
  LayoutDashboard,
  User,
  MapPin,
} from 'lucide-react';
import Sidebar from '../common/Sidebar';
import Header from '../common/Header';
import incidentService from '../../services/incidentService';

const teamNavItems = [
  { name: 'Dashboard', path: '/team', icon: LayoutDashboard, end: true },
  { name: 'Incidents', path: '/authority/incidents', icon: Radio },
  { name: 'Incident Map', path: '/authority/map', icon: Map },
  { name: 'IoT Monitoring', path: '/authority/sensors', icon: Cpu },
  { name: 'GPS Tracking', path: '/authority/location', icon: MapPin },
  { name: 'Profile', path: '/authority/profile', icon: User },
];

const pageTitles = {
  '/team': { title: 'Response Team Operations', subtitle: 'Assigned incidents, dispatch coordination, and field status' },
  '/authority': { title: 'Response Team Operations', subtitle: 'Assigned incidents, dispatch coordination, and field status' },
  '/authority/incidents': { title: 'Incident Registry', subtitle: 'Incident directory and operational overview' },
  '/authority/map': { title: 'Incident Map', subtitle: 'Mapped citizen and IoT incidents with backend GPS coordinates' },
  '/authority/sensors': { title: 'IoT Sensor Telemetry', subtitle: 'Hardware status from connected ESP32 multi-sensor nodes' },
  '/authority/profile': { title: 'Team Officer Profile', subtitle: 'Officer credentials and emergency communication settings' },
  '/team/location': { title: 'Responder GPS Tracking', subtitle: 'Consent-based phone location for authorized active assignments' },
  '/authority/location': { title: 'Responder GPS Tracking', subtitle: 'Consent-based phone location for authorized active assignments' },
};

const AuthorityLayout = () => {
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
    title: 'Response Team Console',
    subtitle: 'Emergency incident response & operational coordination',
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-[#172033] flex font-sans">
      <Sidebar
        portalTitle="Smart Disaster Response"
        portalSubtitle="Response Team Console"
        navItems={teamNavItems}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        homePath="/team"
      />

      <div className="flex-1 flex flex-col min-w-0 lg:pl-60 transition-all duration-200">
        <Header
          pageTitle={currentMeta.title}
          pageSubtitle={currentMeta.subtitle}
          role="team"
          backendOnline={backendOnline}
          onMenuToggle={() => setIsMobileMenuOpen((prev) => !prev)}
          profilePath="/authority/profile"
        />

        <main className="flex-1 p-5 sm:p-6 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AuthorityLayout;
