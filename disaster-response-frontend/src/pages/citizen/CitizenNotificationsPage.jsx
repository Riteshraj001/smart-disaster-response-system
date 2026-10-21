import React from 'react';
import { Bell, Info, CheckCircle2, AlertTriangle, Shield } from 'lucide-react';

const CitizenNotificationsPage = () => {
  const sampleNotifications = [
    {
      id: 'NOTIF-01',
      title: 'High Heatwave & Forest Fire Advisory',
      desc: 'Regional temperatures expected to exceed 42°C in Northern Forest belts. Avoid outdoor burning and stay hydrated.',
      time: '15 mins ago',
      type: 'warning',
    },
    {
      id: 'NOTIF-02',
      title: 'Monsoon Flood Advisory — River Basin Gate 3',
      desc: 'Water level sensors recording safe margin but moderate inflow. Low-lying areas advised to maintain vigilance.',
      time: '1 hour ago',
      type: 'info',
    },
    {
      id: 'NOTIF-03',
      title: 'Industrial Sector 14 Emergency Contained',
      desc: 'Chemical gas leak at Sector 14 has been fully secured by specialized hazardous response teams. Normal traffic resumed.',
      time: '3 hours ago',
      type: 'success',
    },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6 font-sans">
      <div className="pb-2 border-b border-[#E5E7EB]">
        <h1 className="text-xl sm:text-2xl font-bold text-[#111827]">
          Public Safety Alerts &amp; Advisories
        </h1>
        <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
          Official notifications and safety advisories issued by disaster management authorities.
        </p>
      </div>

      {/* Notifications Stream */}
      <div className="space-y-3">
        {sampleNotifications.map((n) => {
          const isWarning = n.type === 'warning';
          const isSuccess = n.type === 'success';

          return (
            <div
              key={n.id}
              className="bg-white border border-[#E5E7EB] rounded-lg p-5 shadow-xs transition-colors hover:bg-slate-50/60"
            >
              <div className="flex items-start gap-3.5">
                <div
                  className={`p-2 rounded-md shrink-0 ${
                    isWarning
                      ? 'bg-amber-50 text-[#D97706]'
                      : isSuccess
                      ? 'bg-emerald-50 text-[#059669]'
                      : 'bg-blue-50 text-[#1D4ED8]'
                  }`}
                >
                  {isWarning ? (
                    <AlertTriangle className="w-4 h-4" />
                  ) : isSuccess ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <Info className="w-4 h-4" />
                  )}
                </div>

                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-[#111827]">{n.title}</h3>
                    <span className="text-xs text-[#64748B] shrink-0">{n.time}</span>
                  </div>
                  <p className="text-xs text-[#64748B] leading-relaxed">{n.desc}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CitizenNotificationsPage;

