import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  RefreshCw,
  CheckCircle2,
  Clock,
  ArrowRight,
  MapPin,
  Calendar,
  AlertTriangle,
  Radio,
  X,
  Send,
} from 'lucide-react';
import incidentService from '../../services/incidentService';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/common/StatusBadge';
import SeverityBadge from '../../components/common/SeverityBadge';
import SourceBadge from '../../components/common/SourceBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import IncidentMap from '../../components/maps/IncidentMap';
import { sortIncidentsByPriority } from '../../utils/incidentSorting';
import { getIncidentCoordinates } from '../../utils/incidentCoordinates';

const AuthorityDashboard = () => {
  const { showToast } = useNotification();
  const { session } = useAuth();

  const [incidents, setIncidents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [priorityOverride, setPriorityOverride] = useState(null);
  const [overrideReason, setOverrideReason] = useState('');

  const fetchIncidents = useCallback(async () => {
    try {
      setError(null);
      const data = await incidentService.getIncidents();
      const teamName = session?.teamIdentifier;
      const assigned = teamName
        ? data.filter((incident) => [incident.assignedTeam, incident.assignee?.name, incident.assigneeName].includes(teamName))
        : data;
      setIncidents(sortIncidentsByPriority(assigned));
    } catch (err) {
      console.error('Error fetching team dashboard incidents:', err);
      setError(err.message || 'Unable to connect to incident service.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [session?.teamIdentifier]);

  useEffect(() => {
    fetchIncidents();
    const interval = setInterval(fetchIncidents, 20000);
    return () => clearInterval(interval);
  }, [fetchIncidents]);

  const mapIncidents = incidents.filter((incident) => getIncidentCoordinates(incident));

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ', ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateStr;
    }
  };

  // Operational status update actions
  const handleUpdateStatus = async (incidentId, newStatus) => {
    setIsUpdatingStatus(true);
    try {
      await incidentService.updateIncidentStatus(incidentId, newStatus);
      showToast(`Incident #${incidentId} status updated to ${newStatus}.`, 'success');
      await fetchIncidents();
      if (selectedIncident && selectedIncident.id === incidentId) {
        setSelectedIncident((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
    } catch (err) {
      console.error('Failed to update incident status:', err);
      showToast(err.message || 'Status update failed.', 'error');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const unresolvedCriticals = incidents.filter((incident) => String(incident.severity || '').toUpperCase() === 'CRITICAL' && !['RESOLVED', 'REJECTED', 'RESPONSE_COMPLETED', 'CLOSED'].includes(String(incident.status || '').toUpperCase()));
  const needsPriorityConfirmation = (incident) => String(incident.severity || '').toUpperCase() !== 'CRITICAL' && unresolvedCriticals.length > 0;
  const viewIncident = (incident) => {
    if (needsPriorityConfirmation(incident)) { setOverrideReason(''); setPriorityOverride({ incident, type: 'details' }); return; }
    setSelectedIncident(incident);
  };
  const updateWithPriorityCheck = (incident, status) => {
    if (needsPriorityConfirmation(incident)) { setOverrideReason(''); setPriorityOverride({ incident, type: 'status', status }); return; }
    handleUpdateStatus(incident.id, status);
  };
  const confirmPriorityOverride = () => {
    if (!priorityOverride) return;
    if (priorityOverride.type === 'details') setSelectedIncident(priorityOverride.incident);
    else handleUpdateStatus(priorityOverride.incident.id, priorityOverride.status);
    setPriorityOverride(null);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E2E8F0]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#172033]">
            Response Team Operations
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Active incidents, assigned emergency operations, and field dispatch status.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsRefreshing(true);
            fetchIncidents();
          }}
          disabled={isLoading || isRefreshing}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-[#E2E8F0] bg-white text-xs font-medium text-[#172033] hover:bg-slate-50 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#2563EB]' : ''}`} />
          <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      {error && (
        <ErrorAlert title="Connection Notice" message={error} onRetry={fetchIncidents} isRetrying={isRefreshing} />
      )}

      <div className="rounded border border-[#E2E8F0] bg-white overflow-hidden min-w-0">
        <div className="flex items-center justify-between gap-3 border-b border-[#E2E8F0] p-4">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#172033]">Assigned Incident Map</h2>
            <p className="text-[11px] text-[#64748B] mt-0.5">Live field incidents assigned to your team and monitored by severity.</p>
          </div>
          <Link to="/authority/map" className="text-[11px] font-semibold text-[#2563EB] hover:underline">
            Open full map
          </Link>
        </div>
        <div className="p-3">
          <IncidentMap
            incidents={mapIncidents}
            detailsBasePath="/authority/incidents"
            heightClassName="h-[360px]"
            emptyTitle="No team incident coordinates available"
            emptyDescription="Assigned incidents are loading or do not include valid GPS data for map placement."
          />
        </div>
      </div>

      {/* Main Incidents Table */}
      <div className="rounded border border-[#E2E8F0] bg-white">
        <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#172033]">
            Assigned &amp; Active Incidents ({incidents.length})
          </h2>
        </div>

        {isLoading ? (
          <div className="py-8">
            <LoadingSpinner message="Loading incidents from disaster database..." />
          </div>
        ) : incidents.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#64748B] bg-[#F8FAFC]">
            No incidents currently logged in the system.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#172033]">
              <thead className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                <tr>
                  <th className="py-2.5 px-3">ID</th>
                  <th className="py-2.5 px-3">Disaster</th>
                  <th className="py-2.5 px-3">Location</th>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3">Severity</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Reported</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {incidents.map((inc) => {
                  const status = (inc.status || '').toUpperCase();
                  const isVerified = status === 'VERIFIED';
                  const isDispatched = status === 'RESPONSE_DISPATCHED' || status === 'ACTIVE';

                  return (
                    <tr key={inc.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-[#172033]">
                        #{inc.id}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-[#172033]">
                        {inc.disasterType}
                      </td>
                      <td className="py-2.5 px-3 text-[#64748B] max-w-[160px] truncate">
                        {inc.location || '—'}
                      </td>
                      <td className="py-2.5 px-3 text-[#64748B] max-w-[200px] truncate">
                        {inc.description || '—'}
                      </td>
                      <td className="py-2.5 px-3">
                        <SeverityBadge severity={inc.severity || 'Medium'} size="xs" />
                      </td>
                      <td className="py-2.5 px-3">
                        <StatusBadge status={inc.status} size="xs" />
                      </td>
                      <td className="py-2.5 px-3 text-[#64748B]">
                        {formatDate(inc.reportedAt || inc.createdAt)}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isVerified && (
                            <button
                              type="button"
                              onClick={() => updateWithPriorityCheck(inc, 'RESPONSE_DISPATCHED')}
                              disabled={isUpdatingStatus}
                              className="px-2 py-1 rounded bg-[#2563EB] hover:bg-blue-700 text-[11px] font-semibold text-white transition disabled:opacity-50"
                            >
                              Acknowledge / Dispatch
                            </button>
                          )}

                          {isDispatched && (
                            <button
                              type="button"
                              onClick={() => updateWithPriorityCheck(inc, 'RESOLVED')}
                              disabled={isUpdatingStatus}
                              className="px-2 py-1 rounded bg-[#059669] hover:bg-emerald-700 text-[11px] font-semibold text-white transition disabled:opacity-50"
                            >
                              Mark Resolved
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => viewIncident(inc)}
                            className="px-2 py-1 rounded border border-[#E2E8F0] bg-white hover:bg-slate-50 text-[11px] font-medium text-[#172033] transition"
                          >
                            Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Incident Details Modal */}
      {selectedIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-lg rounded border border-[#E2E8F0] bg-white p-5 sm:p-6 space-y-4 shadow-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <div>
                <span className="text-xs font-mono font-semibold text-[#64748B]">Incident #{selectedIncident.id}</span>
                <h2 className="text-base font-bold text-[#172033]">{selectedIncident.disasterType}</h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedIncident(null)}
                className="p-1 rounded text-[#64748B] hover:text-[#172033] hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 rounded border border-[#E2E8F0] bg-[#F8FAFC]">
                <div>
                  <span className="text-[#64748B] block text-[10px] uppercase font-semibold">Status</span>
                  <StatusBadge status={selectedIncident.status} size="xs" />
                </div>
                <div>
                  <span className="text-[#64748B] block text-[10px] uppercase font-semibold">Severity</span>
                  <SeverityBadge severity={selectedIncident.severity || 'Medium'} size="xs" />
                </div>
                <div>
                  <span className="text-[#64748B] block text-[10px] uppercase font-semibold">Source</span>
                  <SourceBadge source={selectedIncident.source || 'CITIZEN'} size="xs" />
                </div>
                <div>
                  <span className="text-[#64748B] block text-[10px] uppercase font-semibold">Assigned Unit</span>
                  <span className="font-semibold text-[#172033]">{selectedIncident.assignedTeam || 'Unassigned'}</span>
                </div>
              </div>

              <div>
                <span className="text-[#64748B] font-semibold block mb-0.5">Location</span>
                <p className="text-[#172033] bg-white border border-[#E2E8F0] p-2.5 rounded">
                  {selectedIncident.location || '—'}
                </p>
              </div>

              <div>
                <span className="text-[#64748B] font-semibold block mb-0.5">Description</span>
                <p className="text-[#172033] bg-white border border-[#E2E8F0] p-2.5 rounded whitespace-pre-wrap">
                  {selectedIncident.description || 'No description provided.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#E2E8F0] text-[11px] text-[#64748B]">
                <div>
                  <span>Reported: </span>
                  <span className="text-[#172033]">{formatDate(selectedIncident.reportedAt || selectedIncident.createdAt)}</span>
                </div>
                <div>
                  <span>Contact: </span>
                  <span className="text-[#172033]">{selectedIncident.contactInfo || '—'}</span>
                </div>
              </div>
            </div>

            {/* Action buttons inside modal */}
            <div className="flex items-center justify-between pt-3 border-t border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => updateWithPriorityCheck(selectedIncident, 'RESPONDING')}
                  disabled={isUpdatingStatus}
                  className="px-3 py-1.5 rounded bg-[#2563EB] hover:bg-blue-700 text-xs font-semibold text-white transition disabled:opacity-50"
                >
                  Start Responding
                </button>
                <button
                  type="button"
                  onClick={() => updateWithPriorityCheck(selectedIncident, 'RESOLVED')}
                  disabled={isUpdatingStatus}
                  className="px-3 py-1.5 rounded bg-[#059669] hover:bg-emerald-700 text-xs font-semibold text-white transition disabled:opacity-50"
                >
                  Mark Resolved
                </button>
              </div>

              <button
                type="button"
                onClick={() => setSelectedIncident(null)}
                className="px-4 py-1.5 rounded border border-[#E2E8F0] bg-white hover:bg-slate-50 text-xs font-medium text-[#172033]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {priorityOverride && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md space-y-4 rounded border border-amber-300 bg-white p-5 shadow-md">
            <div><h2 className="text-sm font-bold text-[#172033]">Critical incidents still require attention</h2><p className="mt-1 text-xs text-[#64748B]">{unresolvedCriticals.length} unresolved critical incident(s) remain visible at the top of this queue. You may continue with incident #{priorityOverride.incident.id} when operationally necessary.</p></div>
            <textarea value={overrideReason} onChange={(event) => setOverrideReason(event.target.value)} rows={2} placeholder="Optional operational reason (not saved unless the backend supports an override-note field)" className="w-full p-2 text-xs" />
            <div className="flex justify-end gap-2"><button onClick={() => setPriorityOverride(null)} className="rounded border border-[#E2E8F0] px-3 py-1.5 text-xs">Cancel</button><button onClick={confirmPriorityOverride} className="rounded bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white">Continue with lower priority</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthorityDashboard;
