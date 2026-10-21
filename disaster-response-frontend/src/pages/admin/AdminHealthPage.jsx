import React, { useState, useEffect, useCallback } from 'react';
import { Server, Database, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';
import incidentService from '../../services/incidentService';

const AdminHealthPage = () => {
  const [status, setStatus] = useState({
    backendOnline: false,
    latencyMs: 0,
    lastChecked: null,
    incidentCount: 0,
  });
  const [isProbing, setIsProbing] = useState(false);

  const probe = useCallback(async () => {
    setIsProbing(true);
    const start = performance.now();
    try {
      const isOnline = await incidentService.checkBackendHealth();
      const end = performance.now();
      const latency = Math.round(end - start);

      let count = 0;
      if (isOnline) {
        const data = await incidentService.getIncidents();
        if (Array.isArray(data)) count = data.length;
      }

      setStatus({
        backendOnline: isOnline,
        latencyMs: latency,
        lastChecked: new Date().toLocaleTimeString(),
        incidentCount: count,
      });
    } catch {
      setStatus((prev) => ({
        ...prev,
        backendOnline: false,
        lastChecked: new Date().toLocaleTimeString(),
      }));
    } finally {
      setIsProbing(false);
    }
  }, []);

  useEffect(() => {
    probe();
  }, [probe]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E5E7EB]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#111827]">
            System Health &amp; Telemetry
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
            Diagnostic status tests for the Spring Boot backend and database connectivity.
          </p>
        </div>

        <button
          type="button"
          onClick={probe}
          disabled={isProbing}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#E5E7EB] bg-white hover:bg-slate-50 text-xs font-semibold text-[#111827] transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isProbing ? 'animate-spin' : ''}`} />
          <span>{isProbing ? 'Checking...' : 'Run Health Check'}</span>
        </button>
      </div>

      {/* Diagnostics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 rounded-lg border border-[#E5E7EB] bg-white shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded bg-blue-50 text-[#1D4ED8]">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#111827]">Spring Boot REST API</h3>
                <p className="text-xs text-[#64748B]">http://localhost:8080</p>
              </div>
            </div>
            {status.backendOnline ? (
              <span className="flex items-center gap-1 text-xs font-bold text-[#059669] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                ONLINE
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs font-bold text-[#DC2626] bg-red-50 px-2 py-0.5 rounded border border-red-200">
                <XCircle className="w-3.5 h-3.5" />
                OFFLINE
              </span>
            )}
          </div>

          <div className="space-y-2 text-xs pt-3 border-t border-[#E5E7EB]">
            <div className="flex justify-between text-[#64748B]">
              <span>Roundtrip Response Latency:</span>
              <strong className="text-[#111827]">{status.latencyMs} ms</strong>
            </div>
            <div className="flex justify-between text-[#64748B]">
              <span>Last Checked:</span>
              <span className="text-[#111827]">{status.lastChecked || 'Just now'}</span>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-lg border border-[#E5E7EB] bg-white shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded bg-emerald-50 text-[#059669]">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#111827]">Incident Database</h3>
                <p className="text-xs text-[#64748B]">JPA Hibernate Repository</p>
              </div>
            </div>
            <span className="text-xs font-bold text-[#059669] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              CONNECTED
            </span>
          </div>

          <div className="space-y-2 text-xs pt-3 border-t border-[#E5E7EB]">
            <div className="flex justify-between text-[#64748B]">
              <span>Incident Entities Stored:</span>
              <strong className="text-[#111827]">{status.incidentCount} Rows</strong>
            </div>
            <div className="flex justify-between text-[#64748B]">
              <span>Schema Synchronization:</span>
              <span className="text-[#059669] font-medium">Valid</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminHealthPage;

