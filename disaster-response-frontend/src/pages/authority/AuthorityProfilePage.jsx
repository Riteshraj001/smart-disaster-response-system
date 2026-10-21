import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, Mail, Building, Phone, Radio, Award, Clock, CheckCircle2 } from 'lucide-react';

const AuthorityProfilePage = () => {
  const { session } = useAuth();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#172033]">Authority Officer Profile</h1>
        <p className="text-xs text-[#64748B]">Operational credentials, command post assignments, and triage jurisdiction</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-xs space-y-6">
          <div className="flex flex-col items-center text-center pb-6 border-b border-[#E2E8F0]">
            <div className="w-20 h-20 rounded-full bg-blue-50 border-2 border-[#2563EB]/20 flex items-center justify-center text-[#2563EB] mb-3">
              <ShieldCheck className="w-10 h-10" />
            </div>
            <h2 className="text-lg font-bold text-[#172033] capitalize">{session?.name || 'Commander Officer'}</h2>
            <span className="inline-block px-2.5 py-0.5 mt-1 text-xs font-semibold rounded-full bg-emerald-50 text-[#059669] border border-emerald-200">
              Authorized Commander
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center gap-3 text-[#64748B]">
              <Mail className="w-4 h-4 text-[#2563EB]" />
              <span className="text-[#172033] font-medium">{session?.name || 'commander'}@disaster-ops.gov</span>
            </div>
            <div className="flex items-center gap-3 text-[#64748B]">
              <Building className="w-4 h-4 text-[#2563EB]" />
              <span className="text-[#172033] font-medium">Station: HQ-NORTH-ZONE</span>
            </div>
            <div className="flex items-center gap-3 text-[#64748B]">
              <Phone className="w-4 h-4 text-[#2563EB]" />
              <span className="text-[#172033] font-medium">Duty Hotline: +91 112-4091</span>
            </div>
            <div className="flex items-center gap-3 text-[#64748B]">
              <Clock className="w-4 h-4 text-[#2563EB]" />
              <span className="text-[#172033] font-medium">Session Active: {session?.signedInAt ? new Date(session.signedInAt).toLocaleTimeString() : 'Online'}</span>
            </div>
          </div>
        </div>

        {/* Operational Scope */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-[#172033]">Operational Jurisdiction &amp; Privileges</h3>
            <p className="text-xs text-[#64748B]">
              Authorized command capabilities active under National Emergency Response standard operating procedures.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-3.5 rounded-lg border border-[#E2E8F0] bg-slate-50/50">
                <span className="block text-[11px] font-semibold text-[#64748B]">Triage &amp; Verification</span>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-[#059669] mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Full Authority
                </span>
              </div>
              <div className="p-3.5 rounded-lg border border-[#E2E8F0] bg-slate-50/50">
                <span className="block text-[11px] font-semibold text-[#64748B]">Unit Dispatch Control</span>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-[#059669] mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Active (Fire, Hazmat, EMS)
                </span>
              </div>
              <div className="p-3.5 rounded-lg border border-[#E2E8F0] bg-slate-50/50">
                <span className="block text-[11px] font-semibold text-[#64748B]">IoT Telemetry Alarm Triage</span>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-[#059669] mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Real-Time Ingestion
                </span>
              </div>
              <div className="p-3.5 rounded-lg border border-[#E2E8F0] bg-slate-50/50">
                <span className="block text-[11px] font-semibold text-[#64748B]">Resolution Authority</span>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-[#059669] mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Level 2 Clearance
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-[#172033]">Incident Command Instructions</h3>
            <ul className="text-xs text-[#64748B] space-y-2 list-disc list-inside">
              <li>Verify citizen submissions promptly to change status from <code>PENDING_VERIFICATION</code> to <code>VERIFIED</code>.</li>
              <li>IoT alerts from ESP32 nodes are automatically ingested and flagged for immediate dispatch if threshold is breached.</li>
              <li>Assign designated rapid response battalions and update incident milestones through <code>RESPONSE_DISPATCHED</code> to <code>RESOLVED</code>.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthorityProfilePage;
