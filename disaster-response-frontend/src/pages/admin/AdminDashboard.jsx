import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Radio,
  X,
  Trash2,
} from 'lucide-react';
import incidentService from '../../services/incidentService';
import { useNotification } from '../../context/NotificationContext';
import {
  DISASTER_TYPES,
  INCIDENT_STATUSES,
  SEVERITY_LEVELS,
} from '../../constants/incidentConstants';
import StatusBadge from '../../components/common/StatusBadge';
import SeverityBadge from '../../components/common/SeverityBadge';
import SourceBadge from '../../components/common/SourceBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import EmptyState from '../../components/common/EmptyState';
import IncidentMap from '../../components/maps/IncidentMap';
import { getIncidentCoordinates } from '../../utils/incidentCoordinates';

const AdminDashboard = () => {
  const { showToast } = useNotification();

  const [incidents, setIncidents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedSeverity, setSelectedSeverity] = useState('All');
  const [selectedSource, setSelectedSource] = useState('All');

  const fetchIncidents = useCallback(async () => {
    try {
      setError(null);
      const data = await incidentService.getIncidents();
      setIncidents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load admin incidents:', err);
      setError(err.message || 'Unable to connect to incident backend database.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchIncidents();
    const interval = setInterval(fetchIncidents, 20000);
    return () => clearInterval(interval);
  }, [fetchIncidents]);

  const mapIncidents = useMemo(
    () => incidents.filter((incident) => getIncidentCoordinates(incident)),
    [incidents],
  );

  // EXACT THREE REQUIRED COUNTS CALCULATED FROM ACTUAL BACKEND DATA:
  // 1. Active Incidents (RESPONSE_DISPATCHED / VERIFIED / ACTIVE)
  // 2. Pending Verification (PENDING_VERIFICATION / PENDING)
  // 3. Critical Incidents (Severity === 'Critical' and not resolved/rejected)
  const activeCount = useMemo(() => {
    return incidents.filter((i) => {
      const s = (i.status || '').toUpperCase();
      return s === 'RESPONSE_DISPATCHED' || s === 'VERIFIED' || s === 'ACTIVE';
    }).length;
  }, [incidents]);

  const pendingCount = useMemo(() => {
    return incidents.filter((i) => {
      const s = (i.status || '').toUpperCase();
      return s === 'PENDING_VERIFICATION' || s === 'PENDING';
    }).length;
  }, [incidents]);

  const criticalCount = useMemo(() => {
    return incidents.filter((i) => {
      const sev = (i.severity || '').toUpperCase();
      const st = (i.status || '').toUpperCase();
      return sev === 'CRITICAL' && st !== 'RESOLVED' && st !== 'REJECTED';
    }).length;
  }, [incidents]);

  // Table filtering logic
  const filteredIncidents = useMemo(() => {
    return incidents.filter((incident) => {
      if (searchTerm.trim()) {
        const q = searchTerm.trim().toLowerCase();
        const matchesType = (incident.disasterType || '').toLowerCase().includes(q);
        const matchesLocation = (incident.location || '').toLowerCase().includes(q);
        const matchesDesc = (incident.description || '').toLowerCase().includes(q);
        const matchesId = String(incident.id || '').toLowerCase().includes(q);
        if (!matchesType && !matchesLocation && !matchesDesc && !matchesId) return false;
      }

      if (selectedStatus !== 'All') {
        if ((incident.status || '').toUpperCase() !== selectedStatus.toUpperCase()) return false;
      }

      if (selectedType !== 'All') {
        if ((incident.disasterType || '').toLowerCase() !== selectedType.toLowerCase()) return false;
      }

      if (selectedSeverity !== 'All') {
        if ((incident.severity || '').toLowerCase() !== selectedSeverity.toLowerCase()) return false;
      }

      if (selectedSource !== 'All') {
        const src = (incident.source || 'CITIZEN').toUpperCase();
        if (selectedSource === 'IOT_SENSOR' && src !== 'IOT_SENSOR') return false;
        if (selectedSource === 'CITIZEN' && src !== 'CITIZEN') return false;
      }

      return true;
    });
  }, [incidents, searchTerm, selectedStatus, selectedType, selectedSeverity, selectedSource]);

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return dateString;
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ', ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateString;
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedStatus('All');
    setSelectedType('All');
    setSelectedSeverity('All');
    setSelectedSource('All');
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E2E8F0]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#172033]">
            Incident Management
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Administrator console for system-wide incident oversight and response governance.
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
          <span>{isRefreshing ? 'Refreshing...' : 'Refresh Records'}</span>
        </button>
      </div>

      {error && (
        <ErrorAlert title="Backend Connection Notice" message={error} onRetry={fetchIncidents} isRetrying={isRefreshing} />
      )}

      {/* Exactly Three Useful Summary Counts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Active Incidents */}
        <div className="rounded border border-[#E2E8F0] bg-white p-4">
          <div className="flex items-center justify-between text-xs text-[#64748B]">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Active Incidents</span>
            <Radio className="h-4 w-4 text-[#2563EB]" />
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-bold text-[#2563EB]">{activeCount}</p>
          <span className="text-[11px] text-[#64748B] mt-0.5 block">Response units dispatched or active</span>
        </div>

        {/* Pending Verification */}
        <div className="rounded border border-[#E2E8F0] bg-white p-4">
          <div className="flex items-center justify-between text-xs text-[#64748B]">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Pending Verification</span>
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-bold text-amber-700">{pendingCount}</p>
          <span className="text-[11px] text-[#64748B] mt-0.5 block">Awaiting authority assessment</span>
        </div>

        {/* Critical Incidents */}
        <div className="rounded border border-[#E2E8F0] bg-white p-4">
          <div className="flex items-center justify-between text-xs text-[#64748B]">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Critical Incidents</span>
            <AlertTriangle className="h-4 w-4 text-[#DC2626]" />
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-bold text-[#DC2626]">{criticalCount}</p>
          <span className="text-[11px] text-[#64748B] mt-0.5 block">High priority emergency situations</span>
        </div>
      </div>

      <div className="rounded border border-[#E2E8F0] bg-white overflow-hidden min-w-0">
        <div className="flex items-center justify-between gap-3 border-b border-[#E2E8F0] p-4">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#172033]">Live Incident Map</h2>
            <p className="text-[11px] text-[#64748B] mt-0.5">Mapped incidents from the backend with severity and status details.</p>
          </div>
          <Link to="/admin/map" className="text-[11px] font-semibold text-[#2563EB] hover:underline">
            Open full map
          </Link>
        </div>
        <div className="p-3">
          <IncidentMap
            incidents={mapIncidents}
            detailsBasePath="/authority/incidents"
            heightClassName="h-[360px]"
            emptyTitle="No incident coordinates available"
            emptyDescription="Waiting for valid GPS data from the backend to place live incident markers."
          />
        </div>
      </div>

      {/* Filter Controls */}
      <div className="rounded border border-[#E2E8F0] bg-white p-3.5 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search ID, location, details..."
              className="w-full pl-8 pr-3 py-1.5 rounded border border-[#E2E8F0] bg-white text-xs text-[#172033] placeholder-[#64748B] focus:border-[#2563EB] focus:outline-none"
            />
          </div>

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

        {(searchTerm || selectedStatus !== 'All' || selectedType !== 'All' || selectedSeverity !== 'All' || selectedSource !== 'All') && (
          <div className="flex items-center justify-between text-xs pt-1 border-t border-[#E2E8F0]">
            <span className="text-[#64748B]">Filtered: {filteredIncidents.length} of {incidents.length} records</span>
            <button
              onClick={handleClearFilters}
              className="text-[#2563EB] hover:underline font-medium cursor-pointer"
            >
              Reset filters
            </button>
          </div>
        )}
      </div>

      {/* Clean Single Incident Table */}
      {isLoading ? (
        <div className="py-8">
          <LoadingSpinner message="Loading central incident database..." />
        </div>
      ) : filteredIncidents.length === 0 ? (
        <EmptyState
          title="No Incidents Found"
          description="No incidents matched your query criteria."
          actionText="Clear Filters"
          onAction={handleClearFilters}
        />
      ) : (
        <div className="rounded border border-[#E2E8F0] bg-white overflow-hidden min-w-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#172033]">
              <thead className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                <tr>
                  <th className="py-2.5 px-3">ID</th>
                  <th className="py-2.5 px-3">Disaster Type</th>
                  <th className="py-2.5 px-3">Location</th>
                  <th className="py-2.5 px-3">Source</th>
                  <th className="py-2.5 px-3">Severity</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Reported At</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {filteredIncidents.map((incident) => (
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
                      <SourceBadge source={incident.source || 'CITIZEN'} size="xs" />
                    </td>
                    <td className="py-2.5 px-3">
                      <SeverityBadge severity={incident.severity || 'Medium'} size="xs" />
                    </td>
                    <td className="py-2.5 px-3">
                      <StatusBadge status={incident.status} size="xs" />
                    </td>
                    <td className="py-2.5 px-3 text-[#64748B]">
                      {formatDate(incident.reportedAt || incident.createdAt)}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedIncident(incident)}
                        className="px-2.5 py-1 rounded border border-[#E2E8F0] bg-white hover:bg-slate-50 text-[11px] font-medium text-[#2563EB] transition"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Inspect Detail Modal */}
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
                  <span className="font-mono text-[#172033]">{selectedIncident.deviceId || 'None'}</span>
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
                  <span className="text-[#64748B] font-semibold block mb-0.5">Contact</span>
                  <p className="text-[#172033]">{selectedIncident.contactInfo || '—'}</p>
                </div>
                <div>
                  <span className="text-[#64748B] font-semibold block mb-0.5">Assigned Unit</span>
                  <p className="text-[#172033]">{selectedIncident.assignedTeam || 'Unassigned'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#E2E8F0] text-[11px] text-[#64748B]">
                <div>
                  <span>Reported: </span>
                  <span className="text-[#172033]">{formatDate(selectedIncident.reportedAt || selectedIncident.createdAt)}</span>
                </div>
                <div>
                  <span>Last Updated: </span>
                  <span className="text-[#172033]">{formatDate(selectedIncident.updatedAt)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-[#E2E8F0]">
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
    </div>
  );
};

export default AdminDashboard;
