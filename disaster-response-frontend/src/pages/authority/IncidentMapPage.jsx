import React, { useState, useEffect, useCallback } from 'react';
import { Map, RefreshCw, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import incidentService from '../../services/incidentService';
import IncidentMap from '../../components/maps/IncidentMap';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import { DISASTER_TYPES, INCIDENT_STATUSES, SEVERITY_LEVELS } from '../../constants/incidentConstants';
import { getIncidentCoordinates } from '../../utils/incidentCoordinates';
import SeverityBadge from '../../components/common/SeverityBadge';
import StatusBadge from '../../components/common/StatusBadge';

const IncidentMapPage = () => {
  const [incidents, setIncidents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRetrying, setIsRetrying] = useState(false);

  const [selectedType, setSelectedType] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedSeverity, setSelectedSeverity] = useState('All');

  const fetchIncidents = useCallback(async () => {
    try {
      setError(null);
      const data = await incidentService.getIncidents();
      setIncidents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching incidents for map:', err);
      setError(err.message || 'Unable to connect to incident server.');
    } finally {
      setIsLoading(false);
      setIsRetrying(false);
    }
  }, []);

  useEffect(() => {
    fetchIncidents();
    const interval = setInterval(fetchIncidents, 20000);
    return () => clearInterval(interval);
  }, [fetchIncidents]);

  const filteredIncidents = incidents.filter((inc) => {
    if (selectedType !== 'All') {
      if ((inc.disasterType || '').trim().toLowerCase() !== selectedType.toLowerCase()) return false;
    }
    if (selectedStatus !== 'All') {
      if ((inc.status || '').trim().toLowerCase() !== selectedStatus.toLowerCase()) return false;
    }
    if (selectedSeverity !== 'All' && (inc.severity || '').trim().toLowerCase() !== selectedSeverity.toLowerCase()) return false;
    return true;
  });
  const mappedIncidents = filteredIncidents.filter((incident) => getIncidentCoordinates(incident));
  const unmappedIncidents = filteredIncidents.filter((incident) => !getIncidentCoordinates(incident));

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E5E7EB]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#111827]">
            Incident Map
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
            Geographic view of reported incidents, active responses, and verified emergency zones.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsRetrying(true);
            fetchIncidents();
          }}
          disabled={isLoading || isRetrying}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#E5E7EB] bg-white hover:bg-slate-50 text-xs font-semibold text-[#111827] transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
          <span>{isRetrying ? 'Syncing...' : 'Sync Map'}</span>
        </button>
      </div>

      {error && (
        <ErrorAlert
          title="Map Feed Error"
          message={error}
          onRetry={fetchIncidents}
          isRetrying={isRetrying}
        />
      )}

      {/* Map Filter Controls */}
      <div className="flex flex-wrap items-center gap-3 p-3.5 rounded-lg border border-[#E5E7EB] bg-white shadow-xs">
        <div className="flex items-center gap-1.5 text-xs text-[#64748B] font-medium">
          <Filter className="w-3.5 h-3.5" />
          <span>Filter:</span>
        </div>

        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="px-2.5 py-1 rounded-md border border-[#E5E7EB] bg-white text-xs text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#1D4ED8]"
        >
          <option value="All">All Disaster Types</option>
          {DISASTER_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        <select value={selectedSeverity} onChange={(e) => setSelectedSeverity(e.target.value)} className="px-2.5 py-1 rounded-md border border-[#E5E7EB] bg-white text-xs text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#1D4ED8]">
          <option value="All">All Severities</option>
          {SEVERITY_LEVELS.map((severity) => <option key={severity} value={severity}>{severity}</option>)}
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-2.5 py-1 rounded-md border border-[#E5E7EB] bg-white text-xs text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#1D4ED8]"
        >
          <option value="All">All Statuses</option>
          {INCIDENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <div className="ml-auto text-xs text-[#64748B]">
          {mappedIncidents.length} mapped · {unmappedIncidents.length} without coordinates
        </div>
      </div>

      {/* Interactive Map */}
      {isLoading ? (
        <LoadingSpinner message="Loading map markers..." />
      ) : mappedIncidents.length ? (
        <div className="rounded-lg overflow-hidden border border-[#E5E7EB] shadow-xs min-w-0">
          <IncidentMap incidents={mappedIncidents} heightClassName="h-[460px] sm:h-[540px]" />
        </div>
      ) : (<div className="rounded border border-[#E2E8F0] bg-white p-8 text-center"><Map className="mx-auto h-5 w-5 text-[#64748B]" /><h2 className="mt-2 text-sm font-semibold">No incident coordinates available</h2><p className="mt-1 text-xs text-[#64748B]">The current filtered incidents do not contain valid latitude and longitude values returned by the backend. Use the incident table to review them.</p><Link to="/authority/incidents" className="mt-3 inline-block text-xs font-semibold text-[#2563EB]">Open incident table</Link></div>)
      }

      {unmappedIncidents.length > 0 && <div className="rounded border border-[#E2E8F0] bg-white"><div className="border-b border-[#E2E8F0] p-3"><h2 className="text-xs font-bold text-[#172033]">Map location unavailable ({unmappedIncidents.length})</h2><p className="text-xs text-[#64748B]">These backend records have no valid latitude/longitude and are not placed on the map.</p></div><div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead className="bg-[#F8FAFC] text-[#64748B]"><tr><th className="p-2">ID</th><th className="p-2">Incident</th><th className="p-2">Severity</th><th className="p-2">Status</th><th className="p-2" /></tr></thead><tbody>{unmappedIncidents.map((incident) => <tr key={incident.id} className="border-t border-[#E2E8F0]"><td className="p-2 font-semibold">#{incident.id}</td><td className="p-2"><div>{incident.disasterType || '—'}</div><div className="text-[#64748B]">{incident.location || '—'}</div></td><td className="p-2"><SeverityBadge severity={incident.severity || 'LOW'} size="xs" /></td><td className="p-2"><StatusBadge status={incident.status} size="xs" /></td><td className="p-2 text-right"><Link className="text-[#2563EB]" to={`/authority/incidents/${incident.id}`}>Details</Link></td></tr>)}</tbody></table></div></div>}
    </div>
  );
};

export default IncidentMapPage;
