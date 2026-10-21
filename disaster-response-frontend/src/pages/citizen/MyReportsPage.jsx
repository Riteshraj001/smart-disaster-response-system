import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  PlusCircle,
  MapPin,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  Phone,
  ShieldAlert,
  Navigation,
} from 'lucide-react';
import incidentService from '../../services/incidentService';
import StatusBadge from '../../components/common/StatusBadge';
import SeverityBadge from '../../components/common/SeverityBadge';
import SourceBadge from '../../components/common/SourceBadge';
import DisasterIcon from '../../components/common/DisasterIcon';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { sortIncidentsByPriority } from '../../utils/incidentSorting';

const getStepNumber = (status) => {
  switch (status) {
    case 'PENDING_VERIFICATION':
    case 'Pending':
      return 1;
    case 'VERIFIED':
      return 2;
    case 'RESPONSE_DISPATCHED':
    case 'ASSIGNED':
    case 'Active':
      return 3;
    case 'RESPONDING':
    case 'RESPONSE_COMPLETED':
      return 4;
    case 'RESOLVED':
    case 'Resolved':
      return 5;
    case 'REJECTED':
      return -1;
    default:
      return 1;
  }
};

const MyReportsPage = () => {
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadReports = useCallback(async () => {
    try {
      setError(null);
      const allIncidents = await incidentService.getIncidents();
      setReports(sortIncidentsByPriority(allIncidents.filter((inc) => inc.source === 'CITIZEN')));
    } catch (err) {
      setError(err.message || 'Unable to load reports from the backend.');
      setReports([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E2E8F0]">
        <div>
          <h1 className="text-2xl font-bold text-[#172033]">
            My Incident Reports
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Monitor real-time verification and response unit milestones for your submitted reports.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setIsRefreshing(true);
              loadReports();
            }}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white hover:bg-slate-50 text-xs font-semibold text-[#172033] transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>

          <Link
            to="/citizen/report"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-xs font-semibold text-white shadow-xs transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Submit New Report</span>
          </Link>
        </div>
      </div>

      {error && <p className="rounded border border-red-200 bg-red-50 p-3 text-xs text-red-700">{error}</p>}

      {isLoading ? (
        <LoadingSpinner message="Loading your submitted reports..." />
      ) : reports.length === 0 ? (
        <EmptyState
          title="No Incident Reports on Record"
          description="You have not submitted any emergency reports from this terminal. Report hazards promptly to mobilize response teams."
          actionText="Submit Incident Report"
          onAction={() => window.location.assign('/citizen/report')}
        />
      ) : (
        <div className="space-y-4">
          {reports.map((report) => {
            const step = getStepNumber(report.status);
            const isRejected = step === -1;

            return (
              <div
                key={report.id}
                className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs space-y-4 hover:border-[#2563EB]/30 transition-all"
              >
                {/* Header info */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E2E8F0]">
                  <div className="flex items-center gap-3">
                    <DisasterIcon type={report.disasterType} showContainer size="sm" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#172033]">
                          Incident #{report.id}
                        </span>
                        <SourceBadge source={report.source || 'CITIZEN'} size="sm" />
                        <SeverityBadge severity={report.severity || 'Medium'} size="sm" />
                      </div>
                      <h3 className="text-sm font-semibold text-[#172033] mt-0.5">
                        {report.disasterType} Emergency
                      </h3>
                    </div>
                  </div>

                  <div>
                    <StatusBadge status={report.status} size="sm" />
                  </div>
                </div>

                {/* Location & Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 rounded-lg border border-[#E2E8F0] bg-slate-50/50 space-y-1.5">
                    <span className="text-[#64748B] font-bold flex items-center gap-1 uppercase tracking-wider text-[10px]">
                      <MapPin className="w-3.5 h-3.5 text-[#2563EB]" />
                      Location Details
                    </span>
                    <p className="text-xs font-semibold text-[#172033]">{report.location}</p>
                    <p className="text-[11px] text-[#64748B]">
                      Reported: {report.reportedAt ? new Date(report.reportedAt).toLocaleString() : 'Recently'}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-lg border border-[#E2E8F0] bg-slate-50/50 space-y-1.5">
                    <span className="text-[#64748B] font-bold uppercase tracking-wider text-[10px]">
                      Description &amp; Contact
                    </span>
                    <p className="text-xs text-[#172033]">
                      {report.description || 'No description provided.'}
                    </p>
                    <p className="text-[11px] text-[#64748B]">
                      Assigned Unit: <strong className="text-[#172033]">{report.assignedTeam || 'Triage Pending'}</strong>
                    </p>
                    {report.dispatchState && <p className="text-[11px] text-[#2563EB]">Dispatch: <strong>{String(report.dispatchState).replaceAll('_', ' ')}</strong></p>}
                  </div>
                </div>

                {/* 5-Step Progress Bar */}
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                      Response Lifecycle Progression
                    </span>
                    {isRejected && (
                      <span className="text-[11px] font-bold text-[#DC2626]">Report Marked as False Alarm</span>
                    )}
                  </div>

                  {!isRejected ? (
                    <div className="grid grid-cols-5 gap-1.5 text-center text-[10px] font-medium">
                      <div className={`p-2 rounded-lg border ${step >= 1 ? 'bg-blue-50 border-blue-200 text-[#2563EB] font-bold' : 'bg-slate-50 border-[#E2E8F0] text-[#64748B]'}`}>
                        1. Detected
                      </div>
                      <div className={`p-2 rounded-lg border ${step >= 2 ? 'bg-blue-50 border-blue-200 text-[#2563EB] font-bold' : 'bg-slate-50 border-[#E2E8F0] text-[#64748B]'}`}>
                        2. Verified
                      </div>
                      <div className={`p-2 rounded-lg border ${step >= 3 ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-bold' : 'bg-slate-50 border-[#E2E8F0] text-[#64748B]'}`}>
                        3. Dispatched
                      </div>
                      <div className={`p-2 rounded-lg border ${step >= 4 ? 'bg-teal-50 border-teal-200 text-teal-700 font-bold' : 'bg-slate-50 border-[#E2E8F0] text-[#64748B]'}`}>
                        4. Ops Done
                      </div>
                      <div className={`p-2 rounded-lg border ${step >= 5 ? 'bg-emerald-50 border-emerald-200 text-[#059669] font-bold' : 'bg-slate-50 border-[#E2E8F0] text-[#64748B]'}`}>
                        5. Resolved
                      </div>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-lg border border-red-200 bg-red-50 text-xs text-[#DC2626] font-medium text-center">
                      Report was rejected after authority review (False report or duplicate entry).
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E2E8F0] pt-3">
                  <p className="text-[11px] text-[#64748B]">
                    Status and assignment details are read from the emergency backend.
                  </p>
                  <Link
                    to={`/citizen/track/${encodeURIComponent(report.id)}`}
                    className="inline-flex items-center gap-1.5 rounded border border-blue-200 bg-blue-50 px-3 py-1.5 text-[11px] font-semibold text-blue-700 hover:bg-blue-100"
                  >
                    <Navigation className="h-3.5 w-3.5" />
                    Track response
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyReportsPage;
