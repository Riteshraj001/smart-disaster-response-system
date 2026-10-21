import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  PlusCircle,
  RefreshCw,
  Search,
  ArrowLeft,
  X,
  AlertCircle,
} from 'lucide-react';
import incidentService from '../../services/incidentService';
import { useNotification } from '../../context/NotificationContext';
import {
  DISASTER_TYPES,
  INCIDENT_STATUSES,
  RESPONSE_TEAMS,
  SEVERITY_LEVELS,
} from '../../constants/incidentConstants';
import SourceBadge from '../../components/common/SourceBadge';
import SeverityBadge from '../../components/common/SeverityBadge';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import EmptyState from '../../components/common/EmptyState';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { sortIncidentsByPriority } from '../../utils/incidentSorting';

const LiveIncidentsPage = () => {
  const [searchParams] = useSearchParams();
  const { showToast } = useNotification();

  const [incidents, setIncidents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRetrying, setIsRetrying] = useState(false);

  // Selected incident for detail panel
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(RESPONSE_TEAMS[1]);
  const [selectedActionSeverity, setSelectedActionSeverity] = useState('High');
  const [pendingAction, setPendingAction] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [selectedType, setSelectedType] = useState(searchParams.get('type') || 'All');
  const [selectedStatus, setSelectedStatus] = useState(searchParams.get('status') || 'All');
  const [selectedSeverity, setSelectedSeverity] = useState(searchParams.get('severity') || 'All');
  const [selectedSource, setSelectedSource] = useState('All');

  const fetchIncidents = useCallback(async () => {
    try {
      setError(null);
      const data = await incidentService.getIncidents();
      setIncidents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading incidents:', err);
      setError(err.message || 'Unable to connect to disaster database.');
    } finally {
      setIsLoading(false);
      setIsRetrying(false);
    }
  }, []);

  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  const filteredIncidents = useMemo(() => {
    return sortIncidentsByPriority(incidents.filter((incident) => {
      if (searchTerm.trim()) {
        const q = searchTerm.trim().toLowerCase();
        const matchesType = (incident.disasterType || '').toLowerCase().includes(q);
        const matchesLocation = (incident.location || '').toLowerCase().includes(q);
        const matchesDesc = (incident.description || '').toLowerCase().includes(q);
        const matchesStatus = (incident.status || '').toLowerCase().includes(q);
        const matchesId = String(incident.id || '').toLowerCase().includes(q);
        if (!matchesType && !matchesLocation && !matchesDesc && !matchesStatus && !matchesId) {
          return false;
        }
      }

      if (selectedType !== 'All') {
        if ((incident.disasterType || '').trim().toLowerCase() !== selectedType.toLowerCase()) {
          return false;
        }
      }

      if (selectedStatus !== 'All') {
        if ((incident.status || '').trim().toLowerCase() !== selectedStatus.toLowerCase()) {
          return false;
        }
      }

      if (selectedSeverity !== 'All') {
        if ((incident.severity || '').trim().toLowerCase() !== selectedSeverity.toLowerCase()) {
          return false;
        }
      }

      if (selectedSource !== 'All') {
        const src = (incident.source || 'CITIZEN').toUpperCase();
        if (selectedSource === 'IOT_SENSOR' && src !== 'IOT_SENSOR') return false;
        if (selectedSource === 'CITIZEN' && src !== 'CITIZEN') return false;
      }

      return true;
    }));
  }, [incidents, searchTerm, selectedType, selectedStatus, selectedSeverity, selectedSource]);

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return dateString;
      return d.toLocaleString([], {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedType('All');
    setSelectedStatus('All');
    setSelectedSeverity('All');
    setSelectedSource('All');
  };

  const normalizeStatus = (status) => String(status || '').trim().toUpperCase();

  const getDefaultTeam = (incident) => {
    const assignedTeam = (incident?.assignedTeam || '').trim();
    if (assignedTeam && assignedTeam !== 'Unassigned') return assignedTeam;
    return RESPONSE_TEAMS[1];
  };

  const getLifecycleAction = (incident) => {
    if (!incident) return null;
    const status = normalizeStatus(incident.status);

    if (status === 'PENDING_VERIFICATION' || status === 'PENDING') {
      return { action: 'verify', label: 'Verify Incident' };
    }
    if (status === 'VERIFIED') {
      return { action: 'dispatch', label: 'Assign / Dispatch Team' };
    }
    if (status === 'RESPONSE_DISPATCHED' || status === 'ACTIVE' || status === 'ASSIGNED') {
      return { action: 'respond', label: 'Start Responding' };
    }
    if (status === 'RESPONDING') {
      return { action: 'complete', label: 'Mark Field Response Completed' };
    }
    if (status === 'RESPONSE_COMPLETED') {
      return { action: 'resolve', label: 'Resolve Incident' };
    }
    return null;
  };

  const refreshSelectedIncident = async (incidentId) => {
    const refreshed = await incidentService.getIncidentById(incidentId);
    setSelectedIncident(refreshed);
    setIncidents((prev) => prev.map((item) => (item.id === refreshed.id ? refreshed : item)));
    return refreshed;
  };

  useEffect(() => {
    if (selectedIncident) {
      setSelectedTeam(getDefaultTeam(selectedIncident));
      setSelectedActionSeverity(selectedIncident.severity || 'High');
    }
  }, [selectedIncident]);

  const handleLifecycleAction = async (incident, action) => {
    if (!incident || !action) return;
    setPendingAction({ incidentId: incident.id, action });
    try {
      let updatedIncident;
      switch (action) {
        case 'verify':
          updatedIncident = await incidentService.verifyIncident(incident.id, selectedTeam, selectedActionSeverity);
          showToast(`Incident #${incident.id} verified. Eligible responders have been offered the incident.`, 'success');
          break;
        case 'dispatch':
          updatedIncident = await incidentService.dispatchResponseTeam(incident.id, selectedTeam || getDefaultTeam(incident));
          showToast(`Response team dispatched for incident #${incident.id}.`, 'success');
          break;
        case 'respond':
          updatedIncident = await incidentService.startResponding(incident.id);
          showToast(`Incident #${incident.id} is now responding.`, 'success');
          break;
        case 'complete':
          updatedIncident = await incidentService.completeResponse(incident.id);
          showToast(`Field response completed for incident #${incident.id}.`, 'success');
          break;
        case 'resolve':
          updatedIncident = await incidentService.resolveIncident(incident.id);
          showToast(`Incident #${incident.id} marked as resolved.`, 'success');
          break;
        default:
          return;
      }

      if (updatedIncident) {
        setIncidents((prev) => prev.map((item) => (item.id === updatedIncident.id ? updatedIncident : item)));
        if (selectedIncident?.id === updatedIncident.id) {
          setSelectedIncident(updatedIncident);
        }
      } else {
        await refreshSelectedIncident(incident.id);
      }
      setConfirmAction(null);
    } catch (err) {
      console.error('Lifecycle action failed:', err);
      showToast(err.message || 'Unable to complete the requested action.', 'error');
    } finally {
      setPendingAction(null);
    }
  };

  const triggerLifecycleAction = (incident, action) => {
    if (!incident) return;
    if (action === 'dispatch' || action === 'resolve') {
      setConfirmAction({ incident, action });
      return;
    }
    handleLifecycleAction(incident, action);
  };

  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-8 font-sans space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E2E8F0]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#172033]">
            Incident Management
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Complete registry of citizen-reported emergencies and IoT-detected incidents.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              setIsRetrying(true);
              fetchIncidents();
            }}
            disabled={isLoading || isRetrying}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-[#E2E8F0] bg-white text-xs font-medium text-[#172033] hover:bg-slate-50 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin text-[#2563EB]' : ''}`} />
            <span>{isRetrying ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          <Link
            to="/citizen/report"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-[#2563EB] hover:bg-blue-700 text-xs font-semibold text-white transition shadow-xs"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Report Incident</span>
          </Link>
        </div>
      </div>

      {error && (
        <ErrorAlert title="Connection Notice" message={error} onRetry={fetchIncidents} isRetrying={isRetrying} />
      )}

      {/* Filter Controls */}
      <div className="rounded border border-[#E2E8F0] bg-white p-3.5 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5">
          {/* Search Input */}
          <div className="relative md:col-span-1">
            <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search ID, location, details..."
              className="w-full pl-8 pr-3 py-1.5 rounded border border-[#E2E8F0] bg-white text-xs text-[#172033] placeholder-[#64748B] focus:border-[#2563EB] focus:outline-none"
            />
          </div>

          {/* Disaster Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded border border-[#E2E8F0] bg-white text-xs text-[#172033] focus:border-[#2563EB] focus:outline-none"
          >
            <option value="All">All Types</option>
            {DISASTER_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          {/* Severity Filter */}
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded border border-[#E2E8F0] bg-white text-xs text-[#172033] focus:border-[#2563EB] focus:outline-none"
          >
            <option value="All">All Severities</option>
            {SEVERITY_LEVELS.map((sev) => (
              <option key={sev} value={sev}>{sev}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded border border-[#E2E8F0] bg-white text-xs text-[#172033] focus:border-[#2563EB] focus:outline-none"
          >
            <option value="All">All Statuses</option>
            {INCIDENT_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          {/* Source Filter */}
          <select
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded border border-[#E2E8F0] bg-white text-xs text-[#172033] focus:border-[#2563EB] focus:outline-none"
          >
            <option value="All">All Sources</option>
            <option value="CITIZEN">Citizen Report</option>
            <option value="IOT_SENSOR">IoT Sensor</option>
          </select>
        </div>

        {(searchTerm || selectedType !== 'All' || selectedStatus !== 'All' || selectedSeverity !== 'All' || selectedSource !== 'All') && (
          <div className="flex items-center justify-between text-xs pt-1 border-t border-[#E2E8F0]">
            <span className="text-[#64748B]">Showing {filteredIncidents.length} of {incidents.length} incidents</span>
            <button
              onClick={handleClearFilters}
              className="text-[#2563EB] hover:underline font-medium cursor-pointer"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Main Table */}
      {isLoading ? (
        <div className="py-8">
          <LoadingSpinner message="Loading incident registry records..." />
        </div>
      ) : filteredIncidents.length === 0 ? (
        <EmptyState
          title="No Matching Incidents"
          description="No incident records match the specified filters."
          actionText="Clear Filters"
          onAction={handleClearFilters}
        />
      ) : (
        <div className="overflow-x-auto rounded border border-[#E2E8F0] bg-white">
          <table className="w-full text-left text-xs text-[#172033]">
            <thead className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
              <tr>
                <th className="py-2.5 px-3">ID</th>
                <th className="py-2.5 px-3">Disaster</th>
                <th className="py-2.5 px-3">Location</th>
                <th className="py-2.5 px-3">Severity</th>
                <th className="py-2.5 px-3">Source</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Reported At</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {filteredIncidents.map((incident) => {
                const lifecycleAction = getLifecycleAction(incident);
                return (
                  <tr key={incident.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-[#172033]">
                      #{incident.id}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-[#172033]">
                      {incident.disasterType}
                    </td>
                    <td className="py-2.5 px-3 text-[#64748B] max-w-[180px] truncate">
                      {incident.location || '—'}
                    </td>
                    <td className="py-2.5 px-3">
                      <SeverityBadge severity={incident.severity || 'Medium'} size="xs" />
                    </td>
                    <td className="py-2.5 px-3">
                      <SourceBadge source={incident.source || 'CITIZEN'} size="xs" />
                    </td>
                    <td className="py-2.5 px-3">
                      <StatusBadge status={incident.status} size="xs" />
                    </td>
                    <td className="py-2.5 px-3 text-[#64748B]">
                      {formatDate(incident.reportedAt || incident.createdAt)}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {lifecycleAction && (
                          <button
                            type="button"
                            onClick={() => triggerLifecycleAction(incident, lifecycleAction.action)}
                            disabled={pendingAction?.incidentId === incident.id}
                            className="px-2 py-1 rounded bg-[#2563EB] hover:bg-blue-700 text-[10px] font-semibold text-white transition disabled:opacity-60"
                          >
                            {pendingAction?.incidentId === incident.id ? 'Working…' : lifecycleAction.label}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setSelectedIncident(incident)}
                          className="px-2.5 py-1 rounded border border-[#E2E8F0] bg-white hover:bg-slate-50 text-[11px] font-medium text-[#2563EB] transition"
                        >
                          View Details
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

      {/* Incident Detail Modal / Slide-Over */}
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
                  <span className="text-[#64748B] block text-[10px] uppercase font-semibold">Device ID</span>
                  <span className="font-mono text-[#172033]">{selectedIncident.deviceId || 'None (Citizen submission)'}</span>
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[#64748B] font-semibold block mb-0.5">Contact Info</span>
                  <p className="text-[#172033]">{selectedIncident.contactInfo || '—'}</p>
                </div>
                <div>
                  <span className="text-[#64748B] font-semibold block mb-0.5">Assigned Response Team</span>
                  <p className="text-[#172033]">{selectedIncident.assignedTeam || 'Unassigned'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#E2E8F0] text-[11px] text-[#64748B]">
                <div>
                  <span>Reported: </span>
                  <span className="text-[#172033]">{formatDate(selectedIncident.reportedAt || selectedIncident.createdAt)}</span>
                </div>
                <div>
                  <span>Updated: </span>
                  <span className="text-[#172033]">{formatDate(selectedIncident.updatedAt)}</span>
                </div>
              </div>

              {selectedIncident.imageUrl && (
                <div className="pt-2 border-t border-[#E2E8F0]">
                  <span className="text-[#64748B] font-semibold block mb-1">Image Metadata</span>
                  <span className="text-[11px] font-mono text-[#64748B]">{selectedIncident.imageUrl}</span>
                </div>
              )}
            </div>

            <div className="space-y-3 pt-3 border-t border-[#E2E8F0]">
              {(() => {
                const lifecycleAction = getLifecycleAction(selectedIncident);
                if (!lifecycleAction) return null;

                const isActionPending = pendingAction?.incidentId === selectedIncident.id;
                const isDispatchAction = lifecycleAction.action === 'dispatch';
                const isVerifyAction = lifecycleAction.action === 'verify';

                return (
                  <div className="space-y-3">
                    {isVerifyAction && <p className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs leading-relaxed text-blue-900">Verification creates backend offers for eligible responders. The incident becomes assigned only after an offer is accepted or a dispatcher explicitly assigns a team.</p>}
                    {isDispatchAction && (
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B]">
                          Select response team
                        </label>
                        <select
                          value={selectedTeam}
                          onChange={(e) => setSelectedTeam(e.target.value)}
                          className="w-full rounded-lg border border-[#E2E8F0] bg-white px-2.5 py-1.5 text-xs text-[#172033] focus:border-[#2563EB] focus:outline-none"
                        >
                          {RESPONSE_TEAMS.filter((team) => team !== 'Unassigned').map((team) => (
                            <option key={team} value={team}>{team}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => triggerLifecycleAction(selectedIncident, lifecycleAction.action)}
                        disabled={isActionPending}
                        className="w-full sm:w-auto px-3.5 py-2 rounded bg-[#2563EB] hover:bg-blue-700 text-xs font-semibold text-white transition disabled:opacity-60"
                      >
                        {isActionPending ? 'Processing…' : lifecycleAction.label}
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedIncident(null)}
                        className="w-full sm:w-auto px-4 py-2 rounded border border-[#E2E8F0] bg-white hover:bg-slate-50 text-xs font-medium text-[#172033]"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                );
              })()}

              {!getLifecycleAction(selectedIncident) && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setSelectedIncident(null)}
                    className="px-4 py-1.5 rounded border border-[#E2E8F0] bg-white hover:bg-slate-50 text-xs font-medium text-[#172033]"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {confirmAction && (
        <ConfirmDialog
          isOpen={Boolean(confirmAction)}
          title={confirmAction.action === 'dispatch' ? 'Confirm team dispatch' : 'Confirm incident resolution'}
          message={
            confirmAction.action === 'dispatch'
              ? `Dispatch ${selectedTeam || getDefaultTeam(confirmAction.incident)} for incident #${confirmAction.incident.id}? This updates the incident to the live response workflow.`
              : `Mark incident #${confirmAction.incident.id} as resolved? This will close the incident record after the backend confirms the field response.`
          }
          incident={confirmAction.incident}
          confirmText={confirmAction.action === 'dispatch' ? 'Dispatch Team' : 'Resolve Incident'}
          cancelText="Cancel"
          onConfirm={() => handleLifecycleAction(confirmAction.incident, confirmAction.action)}
          onCancel={() => setConfirmAction(null)}
          isLoading={pendingAction?.incidentId === confirmAction.incident.id}
        />
      )}
    </div>
  );
};

export default LiveIncidentsPage;
