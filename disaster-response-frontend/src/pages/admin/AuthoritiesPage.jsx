import React from 'react';
import { Building, Phone, MapPin, Users } from 'lucide-react';

const AuthoritiesPage = () => {
  const stations = [
    {
      id: 'STA-DEL-01',
      name: 'Delhi Central Disaster Operations HQ',
      zone: 'Northern Capital Region',
      lead: 'Director General K. Nair',
      dispatchUnits: 14,
      phone: '011-23456789',
      status: 'Operational',
    },
    {
      id: 'STA-MUM-02',
      name: 'Mumbai Coastal & Maritime Rescue Post',
      zone: 'Western Coastal Region',
      lead: 'Commodore V. Rao',
      dispatchUnits: 10,
      phone: '022-87654321',
      status: 'Operational',
    },
    {
      id: 'STA-KOL-03',
      name: 'Kolkata Delta & Cyclone Response Base',
      zone: 'Eastern Region',
      lead: 'Inspector General P. Ghosh',
      dispatchUnits: 12,
      phone: '033-98761234',
      status: 'Operational',
    },
    {
      id: 'STA-BLR-04',
      name: 'Bangalore Disaster Response & Safety Center',
      zone: 'Southern Region',
      lead: 'Chief Engineer M. Sundaram',
      dispatchUnits: 8,
      phone: '080-65432109',
      status: 'Operational',
    },
  ];

  return (
    <div className="space-y-6 font-sans">
      <div className="pb-2 border-b border-[#E5E7EB]">
        <h1 className="text-xl sm:text-2xl font-bold text-[#111827]">
          Authority Stations &amp; Regional Hubs
        </h1>
        <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
          Directory of registered regional disaster management centers and response stations.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {stations.map((sta) => (
          <div
            key={sta.id}
            className="bg-white border border-[#E5E7EB] rounded-lg p-5 shadow-xs space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#64748B]">{sta.id}</span>
                <span className="text-xs px-2 py-0.5 rounded font-semibold bg-emerald-50 text-[#059669] border border-emerald-200">
                  {sta.status}
                </span>
              </div>

              <div>
                <h3 className="text-sm font-bold text-[#111827]">{sta.name}</h3>
                <p className="text-xs text-[#1D4ED8] font-medium mt-0.5">{sta.zone}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div className="p-2.5 rounded-md border border-[#E5E7EB] bg-[#F5F7FA]">
                  <span className="text-[#64748B] block text-[11px]">Officer in Charge</span>
                  <span className="font-semibold text-[#111827]">{sta.lead}</span>
                </div>
                <div className="p-2.5 rounded-md border border-[#E5E7EB] bg-[#F5F7FA]">
                  <span className="text-[#64748B] block text-[11px]">Units Dispatched</span>
                  <span className="font-semibold text-[#111827]">{sta.dispatchUnits} Units</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-between text-xs text-[#64748B]">
              <span>Direct Control Line</span>
              <span className="text-[#1D4ED8] font-semibold flex items-center gap-1">
                <Phone className="w-3 h-3" />
                {sta.phone}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AuthoritiesPage;

