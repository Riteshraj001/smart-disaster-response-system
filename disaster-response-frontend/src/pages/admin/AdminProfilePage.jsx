import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Settings, Mail, ShieldCheck, Key, Server, Cpu, Clock, CheckCircle2 } from 'lucide-react';

const AdminProfilePage = () => {
  const { session } = useAuth();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#172033]">System Administrator Profile</h1>
        <p className="text-xs text-[#64748B]">Root administrator credentials, system governance, and sensor calibration privileges</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-xs space-y-6">
          <div className="flex flex-col items-center text-center pb-6 border-b border-[#E2E8F0]">
            <div className="w-20 h-20 rounded-full bg-purple-50 border-2 border-purple-200 flex items-center justify-center text-purple-700 mb-3">
              <Settings className="w-10 h-10" />
            </div>
            <h2 className="text-lg font-bold text-[#172033] capitalize">{session?.name || 'Root Administrator'}</h2>
            <span className="inline-block px-2.5 py-0.5 mt-1 text-xs font-semibold rounded-full bg-purple-50 text-purple-700 border border-purple-200">
              Root System Admin
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center gap-3 text-[#64748B]">
              <Mail className="w-4 h-4 text-[#2563EB]" />
              <span className="text-[#172033] font-medium">{session?.name || 'admin'}@disaster-ops.gov</span>
            </div>
            <div className="flex items-center gap-3 text-[#64748B]">
              <Key className="w-4 h-4 text-[#2563EB]" />
              <span className="text-[#172033] font-medium">Key ID: SYS-ADMIN-SEC-2025</span>
            </div>
            <div className="flex items-center gap-3 text-[#64748B]">
              <Server className="w-4 h-4 text-[#2563EB]" />
              <span className="text-[#172033] font-medium">Server: Spring Boot 4.1 / MySQL 8.0</span>
            </div>
            <div className="flex items-center gap-3 text-[#64748B]">
              <Clock className="w-4 h-4 text-[#2563EB]" />
              <span className="text-[#172033] font-medium">Active Since: {session?.signedInAt ? new Date(session.signedInAt).toLocaleTimeString() : 'Online'}</span>
            </div>
          </div>
        </div>

        {/* System Administration Governance */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-[#172033]">Root Administrative Capabilities</h3>
            <p className="text-xs text-[#64748B]">
              Full administrative governance over user security, IoT device registrations, and sensor threshold calibration.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-3.5 rounded-lg border border-[#E2E8F0] bg-slate-50/50">
                <span className="block text-[11px] font-semibold text-[#64748B]">User &amp; Authority Management</span>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-[#059669] mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Full CRUD Access
                </span>
              </div>
              <div className="p-3.5 rounded-lg border border-[#E2E8F0] bg-slate-50/50">
                <span className="block text-[11px] font-semibold text-[#64748B]">IoT Threshold Calibration</span>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-[#059669] mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> MQ-2, DHT11, MPU6050
                </span>
              </div>
              <div className="p-3.5 rounded-lg border border-[#E2E8F0] bg-slate-50/50">
                <span className="block text-[11px] font-semibold text-[#64748B]">Alarm Cooldown Policy</span>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-[#059669] mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 60s Deduplication Engine
                </span>
              </div>
              <div className="p-3.5 rounded-lg border border-[#E2E8F0] bg-slate-50/50">
                <span className="block text-[11px] font-semibold text-[#64748B]">System Audit Logs</span>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-[#059669] mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Comprehensive Auditing
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-[#172033]">Governance Principles</h3>
            <ul className="text-xs text-[#64748B] space-y-2 list-disc list-inside">
              <li>Threshold changes take effect immediately on next ESP32 payload ingestion.</li>
              <li>Sensor device heartbeats are monitored every 15 seconds; devices exceeding 45s without telemetry transition to <code>OFFLINE</code>.</li>
              <li>Incident records maintain tamper-evident lifecycle history across citizen and IoT detection pathways.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProfilePage;
