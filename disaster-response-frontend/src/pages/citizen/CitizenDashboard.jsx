import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  PlusCircle,
  PhoneCall,
  MapPin,
  Clock,
  ArrowRight,
  CheckCircle2,
  FileText,
  Activity,
} from 'lucide-react';
import incidentService from '../../services/incidentService';
import { EMERGENCY_HELPLINES } from '../../constants/incidentConstants';
import StatusBadge from '../../components/common/StatusBadge';
import SeverityBadge from '../../components/common/SeverityBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { sortIncidentsByPriority } from '../../utils/incidentSorting';

const CitizenDashboard = () => {
  const [incidents, setIncidents] = useState([]);
  const [myReports, setMyReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const data = await incidentService.getIncidents();
      setIncidents(Array.isArray(data) ? data : []);
      setMyReports(sortIncidentsByPriority(data.filter((item) => item.source === 'CITIZEN')));
    } catch (err) {
      console.error('Failed to load citizen dashboard data:', err);
      setError(err.message || 'Unable to connect to emergency backend.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const stats = {
    total: myReports.length,
    pending: myReports.filter((r) => r.status === 'PENDING_VERIFICATION' || r.status === 'Pending').length,
    verified: myReports.filter((r) => r.status === 'VERIFIED' || r.status === 'RESPONSE_DISPATCHED' || r.status === 'Active').length,
    resolved: myReports.filter((r) => r.status === 'RESOLVED' || r.status === 'Resolved').length,
  };

  const recentReports = sortIncidentsByPriority(myReports).slice(0, 5);

  return (
    <div className="space-y-6 font-sans">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E2E8F0]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#172033]">
            Citizen Emergency Dashboard
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Submit emergency incident reports and track authority response status.
          </p>
        </div>
        <Link
          to="/citizen/report"
          className="inline-flex items-center justify-center gap-1.5 rounded bg-[#2563EB] px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition"
        >
          <PlusCircle className="h-3.5 w-3.5" />
          <span>Report New Incident</span>
        </Link>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded border border-[#E2E8F0] bg-white p-4">
          <div className="flex items-center justify-between text-xs text-[#64748B]">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Total Submissions</span>
            <FileText className="h-3.5 w-3.5 text-[#2563EB]" />
          </div>
          <p className="mt-1.5 text-2xl font-bold text-[#172033]">{stats.total}</p>
        </div>

        <div className="rounded border border-[#E2E8F0] bg-white p-4">
          <div className="flex items-center justify-between text-xs text-[#64748B]">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Pending Review</span>
            <Clock className="h-3.5 w-3.5 text-amber-600" />
          </div>
          <p className="mt-1.5 text-2xl font-bold text-amber-700">{stats.pending}</p>
        </div>

        <div className="rounded border border-[#E2E8F0] bg-white p-4">
          <div className="flex items-center justify-between text-xs text-[#64748B]">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Verified / Dispatched</span>
            <Activity className="h-3.5 w-3.5 text-[#2563EB]" />
          </div>
          <p className="mt-1.5 text-2xl font-bold text-[#2563EB]">{stats.verified}</p>
        </div>

        <div className="rounded border border-[#E2E8F0] bg-white p-4">
          <div className="flex items-center justify-between text-xs text-[#64748B]">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Resolved</span>
            <CheckCircle2 className="h-3.5 w-3.5 text-[#059669]" />
          </div>
          <p className="mt-1.5 text-2xl font-bold text-[#059669]">{stats.resolved}</p>
        </div>
      </div>

      {/* Main Split: My Recent Reports & Helplines */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Reports Table */}
        <div className="lg:col-span-2 rounded border border-[#E2E8F0] bg-white p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#172033]">
                Recent Reports
              </h2>
            </div>
            <Link
              to="/citizen/reports"
              className="text-xs font-medium text-[#2563EB] hover:underline inline-flex items-center gap-1"
            >
              <span>View all ({myReports.length})</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {isLoading ? (
            <div className="py-6">
              <LoadingSpinner message="Loading your reports..." />
            </div>
          ) : recentReports.length === 0 ? (
            <div className="p-6 text-center text-xs text-[#64748B] bg-[#F8FAFC] rounded border border-[#E2E8F0]">
              <p className="font-medium text-[#172033]">No incident reports submitted yet</p>
              <p className="text-[11px] text-[#64748B] mt-0.5">Use the "Report New Incident" button to file an emergency incident.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#E2E8F0]">
              {recentReports.map((report) => (
                <div key={report.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#172033]">
                        {report.disasterType}
                      </span>
                      <span className="text-[11px] text-[#64748B]">#{report.id}</span>
                      <SeverityBadge severity={report.severity} size="xs" />
                    </div>
                    <p className="text-[11px] text-[#64748B] mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span className="truncate max-w-[280px]">{report.location}</span>
                    </p>
                  </div>
                  <div>
                    <StatusBadge status={report.status} size="xs" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 24/7 Helplines */}
        <div className="rounded border border-[#E2E8F0] bg-white p-4 space-y-3">
          <div className="pb-2 border-b border-[#E2E8F0]">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#172033]">
              Emergency Helplines
            </h2>
            <p className="text-[11px] text-[#64748B]">24/7 public emergency contact numbers</p>
          </div>

          <div className="space-y-2">
            {EMERGENCY_HELPLINES.map((hl) => (
              <div
                key={hl.number}
                className="p-2.5 rounded border border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between gap-2 text-xs"
              >
                <div>
                  <p className="font-semibold text-[#172033]">{hl.name}</p>
                  <p className="text-[11px] text-[#64748B]">{hl.desc}</p>
                </div>
                <a
                  href={`tel:${hl.number.split('/')[0].trim()}`}
                  className="px-2 py-0.5 rounded border border-[#E2E8F0] bg-white text-[#2563EB] font-bold text-xs"
                >
                  {hl.number}
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CitizenDashboard;
