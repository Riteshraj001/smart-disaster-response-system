import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  MapPin,
  RefreshCw,
  Eye,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Radio,
} from 'lucide-react';
import incidentService from '../../services/incidentService';
import { useNotification } from '../../context/NotificationContext';
import DisasterIcon from '../../components/common/DisasterIcon';
import SourceBadge from '../../components/common/SourceBadge';
import StatusBadge from '../../components/common/StatusBadge';
import SeverityBadge from '../../components/common/SeverityBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import EmptyState from '../../components/common/EmptyState';
import { sortIncidentsByPriority } from '../../utils/incidentSorting';

const PendingVerificationPage = () => {
  const { showToast } = useNotification();
  const [pendingIncidents, setPendingIncidents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRetrying, setIsRetrying] = useState(false);

  // Quick Action Modal State
  const [activeIncident, setActiveIncident] = useState(null);
  const [actionType, setActionType] = useState('verify'); // 'verify' | 'reject'
  const [rejectReason, setRejectReason] = useState('False alarm / invalid report');
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchPending = useCallback(async () => {
    try {
      setError(null);
      const allIncidents = await incidentService.getIncidents();
      const filtered = (Array.isArray(allIncidents) ? allIncidents : []).filter(
        (i) => (i.status || '').trim() === 'PENDING_VERIFICATION' || (i.status || '').trim() === 'Pending'
      );
      setPendingIncidents(sortIncidentsByPriority(filtered));
    } catch (err) {
      console.error('Error fetching pending incidents:', err);
      setError(err.message || 'Unable to connect to incident server.');
    } finally {
      setIsLoading(false);
      setIsRetrying(false);
    }
  }, []);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  const handleVerify = async (incident) => {
    setActiveIncident(incident);
    setActionType('verify');
  };

  const handleReject = async (incident) => {
    setActiveIncident(incident);
    setActionType('reject');
    setRejectReason('False alarm / invalid submission');
  };

  const executeAction = async () => {
    if (!activeIncident) return;
    setIsProcessing(true);
    try {
      if (actionType === 'verify') {
        await incidentService.verifyIncident(activeIncident.id);
        showToast(`Incident #${activeIncident.id} verified. Eligible responders have been offered the incident.`, 'success');
      } else {
        await incidentService.rejectIncident(activeIncident.id, rejectReason);
        showToast(`Incident #${activeIncident.id} rejected.`, 'info');
      }
      setActiveIncident(null);
      fetchPending();
    } catch (err) {
      showToast(err.message || 'Action failed.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E2E8F0]">
        <div>
          <h1 className="text-2xl font-bold text-[#172033]">
            Pending Verification Queue
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Incoming citizen reports and automated triggers awaiting triage and responder assignment.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsRetrying(true);
            fetchPending();
          }}
          disabled={isLoading || isRetrying}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white hover:bg-slate-50 text-xs font-semibold text-[#172033] transition-colors shadow-2xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin text-[#2563EB]' : ''}`} />
          <span>{isRetrying ? 'Refreshing...' : 'Refresh Queue'}</span>
        </button>
      </div>

      {error && (
        <ErrorAlert title="Connection Error" message={error} onRetry={fetchPending} isRetrying={isRetrying} />
      )}

      {isLoading ? (
        <LoadingSpinner message="Checking for pending emergency submissions..." />
      ) : pendingIncidents.length === 0 ? (
        <EmptyState
          title="Triage Queue Clear"
          description="All incident submissions have been verified and processed. No pending items require immediate review."
          actionText="View All Incidents"
          onAction={() => window.location.assign('/authority/incidents')}
        />
      ) : (
        <div className="space-y-4">
          <div className="text-xs text-[#64748B] font-bold uppercase tracking-wider">
            {pendingIncidents.length} Incident(s) Requiring Verification
          </div>

          <div className="grid grid-cols-1 gap-4">
            {pendingIncidents.map((incident) => (
              <div
                key={incident.id}
                className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-[#2563EB]/40 transition-all"
              >
                <div className="space-y-2.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#172033]">
                      Incident #{incident.id}
                    </span>
                    <SourceBadge source={incident.source || 'CITIZEN'} size="sm" />
                    <SeverityBadge severity={incident.severity || 'Medium'} size="sm" />
                    <StatusBadge status="PENDING_VERIFICATION" size="sm" />
                  </div>

                  <div className="flex items-center gap-3">
                    <DisasterIcon type={incident.disasterType} showContainer size="sm" />
                    <div>
                      <h3 className="text-sm font-bold text-[#172033]">
                        {incident.disasterType}
                      </h3>
                      <p className="text-xs text-[#64748B] flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-[#64748B] shrink-0" />
                        <span>{incident.location}</span>
                      </p>
                      {incident.description && (
                        <p className="text-xs text-slate-600 mt-1 line-clamp-1 italic">
                          "{incident.description}"
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Triage Controls */}
                <div className="flex items-center gap-2 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-[#E2E8F0]">
                  <Link
                    to={`/authority/incidents/${incident.id}`}
                    className="px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white hover:bg-slate-50 text-[#172033] text-xs font-semibold flex items-center gap-1 transition-colors shadow-2xs"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#64748B]" />
                    <span>Details</span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => handleReject(incident)}
                    className="px-3 py-2 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-xs font-semibold text-[#DC2626] transition-colors"
                  >
                    Reject Report
                  </button>

                  <button
                    type="button"
                    onClick={() => handleVerify(incident)}
                    className="px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-xs font-semibold text-white transition-colors shadow-xs inline-flex items-center gap-1.5"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Verify &amp; Offer</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Verification / Rejection Modal */}
      {activeIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 max-w-md w-full shadow-lg space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <h3 className="text-sm font-bold text-[#172033]">
                {actionType === 'verify' ? 'Verify Incident & Offer to Responders' : 'Reject False Report'}
              </h3>
              <button
                type="button"
                onClick={() => setActiveIncident(null)}
                className="text-[#64748B] hover:text-[#172033] text-xs font-bold"
              >
                &times;
              </button>
            </div>

            <div className="text-xs space-y-1 bg-slate-50 p-3 rounded-lg border border-[#E2E8F0]">
              <p><strong>Incident #{activeIncident.id}:</strong> {activeIncident.disasterType}</p>
              <p><strong>Location:</strong> {activeIncident.location}</p>
              <p><strong>Source:</strong> {activeIncident.source || 'CITIZEN'}</p>
            </div>

            {actionType === 'verify' ? (
              <p className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs leading-relaxed text-blue-900">Verification will create a real backend dispatch offer for eligible available responders. No assignment is created until a responder accepts, or an authorized dispatcher explicitly assigns a team.</p>
            ) : (
              <div>
                <label className="block text-[11px] font-bold text-[#64748B] uppercase mb-1">
                  Rejection Reason
                </label>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Specify why this report is rejected (e.g., False alarm, duplicate entry, incorrect location)..."
                  className="w-full rounded-lg border border-[#E2E8F0] p-2 text-xs focus:ring-2 focus:ring-[#DC2626]"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E2E8F0]">
              <button
                type="button"
                onClick={() => setActiveIncident(null)}
                disabled={isProcessing}
                className="px-4 py-2 rounded-lg border border-[#E2E8F0] bg-white hover:bg-slate-50 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeAction}
                disabled={isProcessing}
                className={`px-5 py-2 rounded-lg text-xs font-bold text-white shadow-xs ${
                  actionType === 'verify' ? 'bg-[#2563EB] hover:bg-blue-700' : 'bg-[#DC2626] hover:bg-red-700'
                }`}
              >
                {isProcessing ? 'Processing...' : actionType === 'verify' ? 'Confirm Verification' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingVerificationPage;
