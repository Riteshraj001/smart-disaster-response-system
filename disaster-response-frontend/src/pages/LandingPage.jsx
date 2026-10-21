import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, User, Users, ShieldAlert, ArrowRight } from 'lucide-react';

const LandingPage = () => {
  const loginOptions = [
    {
      role: 'Citizen',
      description: 'Report an emergency and track your report.',
      buttonText: 'Citizen Login',
      to: '/login/citizen',
      icon: User,
    },
    {
      role: 'Response Team',
      description: 'View assigned incidents and update response progress.',
      buttonText: 'Team Login',
      to: '/login/team',
      icon: Users,
    },
    {
      role: 'Administrator',
      description: 'Manage incidents, users, and response operations.',
      buttonText: 'Admin Login',
      to: '/login/admin',
      icon: ShieldAlert,
    },
  ];

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-[#172033] flex flex-col justify-between font-sans">
      {/* Top Header */}
      <header className="border-b border-[#E2E8F0] bg-white h-16 shrink-0">
        <div className="mx-auto flex h-full max-w-[1100px] items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5 text-[#172033] hover:opacity-90">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-[#2563EB] text-white">
              <Shield className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold tracking-tight text-[#172033]">
              Smart Disaster Response
            </span>
          </Link>
          <div className="text-xs text-[#64748B]">
            Emergency Helpline: <strong className="text-[#DC2626] font-semibold">112</strong>
          </div>
        </div>
      </header>

      {/* Main Content Area - Centered Horizontally & Vertically */}
      <main className="flex-1 flex items-center justify-center py-8 sm:py-12 px-4 sm:px-6">
        <div className="w-full max-w-[1100px] mx-auto space-y-8 sm:space-y-10 flex flex-col items-center">
          {/* Centered Heading and Subtitle */}
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <h1 className="text-3xl sm:text-4xl md:text-[36px] font-bold tracking-tight text-[#172033] leading-tight">
              Smart Disaster Response
            </h1>
            <p className="text-sm sm:text-base md:text-[16px] text-[#64748B] font-normal leading-normal">
              Report emergencies. Monitor incidents. Coordinate response.
            </p>
          </div>

          {/* Three Login Cards in one evenly spaced row on desktop, centered container */}
          <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {loginOptions.map((opt) => {
              const Icon = opt.icon;
              return (
                <div
                  key={opt.role}
                  className="rounded border border-[#E2E8F0] bg-white p-6 flex flex-col justify-between space-y-5 text-left shadow-xs hover:border-[#2563EB]/40 transition-colors"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded bg-slate-100 text-slate-700 shrink-0">
                        <Icon className="h-4 w-4" />
                      </div>
                      <h2 className="text-base font-semibold text-[#172033]">{opt.role}</h2>
                    </div>
                    <p className="text-xs text-[#64748B] leading-relaxed">
                      {opt.description}
                    </p>
                  </div>

                  <Link
                    to={opt.to}
                    className="inline-flex items-center justify-center gap-1.5 rounded bg-[#2563EB] px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 transition"
                  >
                    <span>{opt.buttonText}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Small footer with disclaimer */}
      <footer className="border-t border-[#E2E8F0] bg-white py-4 px-4 text-xs text-[#64748B] shrink-0">
        <div className="mx-auto max-w-[1100px] flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <span>Smart Disaster Response</span>
          <span className="text-slate-500">
            For immediate life-threatening situations, contact official emergency services (112) immediately.
          </span>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
