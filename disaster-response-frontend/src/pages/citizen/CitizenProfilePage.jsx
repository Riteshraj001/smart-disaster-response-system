import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Mail, Shield, Phone, MapPin, Clock, CheckCircle2 } from 'lucide-react';

const CitizenProfilePage = () => {
  const { session } = useAuth();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#172033]">Citizen Profile</h1>
        <p className="text-xs text-[#64748B]">Personal identification and emergency notification preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-xs space-y-6">
          <div className="flex flex-col items-center text-center pb-6 border-b border-[#E2E8F0]">
            <div className="w-20 h-20 rounded-full bg-blue-50 border-2 border-[#2563EB]/20 flex items-center justify-center text-[#2563EB] mb-3">
              <User className="w-10 h-10" />
            </div>
            <h2 className="text-lg font-bold text-[#172033] capitalize">{session?.name || 'Citizen User'}</h2>
            <span className="inline-block px-2.5 py-0.5 mt-1 text-xs font-semibold rounded-full bg-blue-50 text-[#2563EB] border border-blue-200">
              Registered Citizen
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center gap-3 text-[#64748B]">
              <Mail className="w-4 h-4 text-[#2563EB]" />
              <span className="text-[#172033] font-medium">{session?.name || 'citizen'}@emergency.gov</span>
            </div>
            <div className="flex items-center gap-3 text-[#64748B]">
              <Phone className="w-4 h-4 text-[#2563EB]" />
              <span className="text-[#172033] font-medium">+91 98765 43210</span>
            </div>
            <div className="flex items-center gap-3 text-[#64748B]">
              <MapPin className="w-4 h-4 text-[#2563EB]" />
              <span className="text-[#172033] font-medium">Block A, Academic Campus Zone</span>
            </div>
            <div className="flex items-center gap-3 text-[#64748B]">
              <Clock className="w-4 h-4 text-[#2563EB]" />
              <span className="text-[#172033] font-medium">Signed In: {session?.signedInAt ? new Date(session.signedInAt).toLocaleDateString() : 'Active'}</span>
            </div>
          </div>
        </div>

        {/* Details & Preferences */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-[#172033]">Emergency Contact Information</h3>
            <p className="text-xs text-[#64748B]">
              This information is shared with authorized emergency dispatch teams when you submit an incident report.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-3.5 rounded-lg border border-[#E2E8F0] bg-slate-50/50">
                <span className="block text-[11px] font-semibold text-[#64748B]">Primary Emergency Contact</span>
                <span className="block text-xs font-bold text-[#172033] mt-0.5">Parent / Guardian: +91 98765 00001</span>
              </div>
              <div className="p-3.5 rounded-lg border border-[#E2E8F0] bg-slate-50/50">
                <span className="block text-[11px] font-semibold text-[#64748B]">Local Campus Residence</span>
                <span className="block text-xs font-bold text-[#172033] mt-0.5">Hostel Block 3, Room 204</span>
              </div>
              <div className="p-3.5 rounded-lg border border-[#E2E8F0] bg-slate-50/50">
                <span className="block text-[11px] font-semibold text-[#64748B]">Medical Advisory Flags</span>
                <span className="block text-xs font-bold text-[#172033] mt-0.5">No critical medical constraints</span>
              </div>
              <div className="p-3.5 rounded-lg border border-[#E2E8F0] bg-slate-50/50">
                <span className="block text-[11px] font-semibold text-[#64748B]">Broadcast Notifications</span>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-[#059669] mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> SMS &amp; In-App Active
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-[#172033]">Citizen Role Guidelines</h3>
            <ul className="text-xs text-[#64748B] space-y-2 list-disc list-inside">
              <li>Manual incident reports submitted through this account are instantly routed to the Authority Triage Queue.</li>
              <li>Provide clear locations and description details to assist emergency teams during rapid dispatch.</li>
              <li>To switch to an Authority or Admin account, log out completely and sign in through the designated portal gateway.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CitizenProfilePage;
