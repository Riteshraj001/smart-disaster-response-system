import React from 'react';
import { PhoneCall, ShieldAlert } from 'lucide-react';

const EmergencyAdvisory = () => {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-blue-50 text-blue-700">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">Standard Operating Protocols</h4>
            <p className="text-xs text-slate-500">Triage and response guidelines for incident operators</p>
          </div>
        </div>
        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
          SOP-2026
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div className="p-3.5 rounded-lg border border-red-200 bg-red-50 space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-red-700">
            <span className="h-2 w-2 rounded-full bg-red-600"></span>
            <span>Active Incidents</span>
          </div>
          <p className="text-slate-700 text-xs leading-relaxed">
            Dispatch first responder units immediately and notify regional disaster authority command.
          </p>
        </div>

        <div className="p-3.5 rounded-lg border border-amber-200 bg-amber-50 space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-amber-800">
            <span className="h-2 w-2 rounded-full bg-amber-600"></span>
            <span>Pending Verification</span>
          </div>
          <p className="text-slate-700 text-xs leading-relaxed">
            Verify caller and sensor coordinates, evaluate hazard severity level, and assign responder priority.
          </p>
        </div>

        <div className="p-3.5 rounded-lg border border-emerald-200 bg-emerald-50 space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-emerald-800">
            <span className="h-2 w-2 rounded-full bg-emerald-600"></span>
            <span>Resolved Incidents</span>
          </div>
          <p className="text-slate-700 text-xs leading-relaxed">
            Log after-action damage assessment reports and obtain regional safety clearance.
          </p>
        </div>
      </div>

      {/* Emergency Helpline Contacts */}
      <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <PhoneCall className="w-4 h-4 text-blue-700" />
          <span>National Emergency Helpline: <strong className="text-slate-900 font-bold">112</strong></span>
          <span className="text-slate-300">|</span>
          <span>NDRF Disaster Control: <strong className="text-slate-900 font-bold">1078</strong></span>
        </div>
        <span className="text-[11px] text-slate-400">
          Smart Disaster Response Protocol
        </span>
      </div>
    </div>
  );
};

export default EmergencyAdvisory;

