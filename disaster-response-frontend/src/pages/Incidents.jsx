import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  FileSpreadsheet,
  PlusCircle,
  RefreshCw,
} from 'lucide-react';
import incidentService from '../services/incidentService';
import { useNotification } from '../context/NotificationContext';
import IncidentTable from '../components/incidents/IncidentTable';
import IncidentFilter from '../components/incidents/IncidentFilter';
import ConfirmDialog from '../components/common/ConfirmDialog';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorAlert from '../components/common/ErrorAlert';

const Incidents = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useNotification();

  const [incidents, setIncidents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRetrying, setIsRetrying] = useState(false);

  // Search & Filter states initialized from URL params if present
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [selectedType, setSelectedType] = useState(searchParams.get('type') || 'All');
  const [selectedStatus, setSelectedStatus] = useState(searchParams.get('status') || 'All');

  // Deletion modal state
  const [incidentToDelete, setIncidentToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchIncidents = useCallback(async () => {
    try {
      setError(null);
      const data = await incidentService.getIncidents();
      setIncidents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading incidents:', err);
      setError(err.message || 'Unable to connect to the disaster management server.');
    } finally {
      setIsLoading(false);
      setIsRetrying(false);
    }
  }, []);

  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  // Sync state if URL search parameters change externally
  useEffect(() => {
    const urlStatus = searchParams.get('status');
    const urlType = searchParams.get('type');
    const urlQuery = searchParams.get('q');

    if (urlStatus) setSelectedStatus(urlStatus);
    if (urlType) setSelectedType(urlType);
    if (urlQuery) setSearchTerm(urlQuery);
  }, [searchParams]);

  // Frontend Filtering logic (NO excess network calls on keystrokes)
  const filteredIncidents = useMemo(() => {
    return incidents.filter((incident) => {
      // 1. Search Query Filter (Case-insensitive across type, location, status, ID)
      if (searchTerm.trim()) {
        const query = searchTerm.trim().toLowerCase();
        const matchesType = (incident.disasterType || '').toLowerCase().includes(query);
        const matchesLocation = (incident.location || '').toLowerCase().includes(query);
        const matchesStatus = (incident.status || '').toLowerCase().includes(query);
        const matchesId = String(incident.id || '').toLowerCase().includes(query);

        if (!matchesType && !matchesLocation && !matchesStatus && !matchesId) {
          return false;
        }
      }

      // 2. Disaster Type Filter
      if (selectedType !== 'All') {
        const normalizedItemType = (incident.disasterType || '').trim().toLowerCase();
        const normalizedFilterType = selectedType.trim().toLowerCase();
        if (normalizedItemType !== normalizedFilterType) {
          return false;
        }
      }

      // 3. Status Filter
      if (selectedStatus !== 'All') {
        const normalizedItemStatus = (incident.status || '').trim().toLowerCase();
        const normalizedFilterStatus = selectedStatus.trim().toLowerCase();
        if (normalizedItemStatus !== normalizedFilterStatus) {
          return false;
        }
      }

      return true;
    });
  }, [incidents, searchTerm, selectedType, selectedStatus]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedType('All');
    setSelectedStatus('All');
    setSearchParams({});
  };

  const handleSearchChange = (term) => {
    setSearchTerm(term);
  };

  const handleTypeChange = (type) => {
    setSelectedType(type);
    const newParams = new URLSearchParams(searchParams);
    if (type === 'All') newParams.delete('type');
    else newParams.set('type', type);
    setSearchParams(newParams);
  };

  const handleStatusChange = (status) => {
    setSelectedStatus(status);
    const newParams = new URLSearchParams(searchParams);
    if (status === 'All') newParams.delete('status');
    else newParams.set('status', status);
    setSearchParams(newParams);
  };

  // Delete Action
  const handleDeleteConfirm = async () => {
    if (!incidentToDelete) return;
    setIsDeleting(true);
    try {
      await incidentService.deleteIncident(incidentToDelete.id);
      showToast(
        `Incident #${incidentToDelete.id} (${incidentToDelete.disasterType}) deleted successfully.`,
        'success'
      );
      setIncidents((prev) => prev.filter((item) => item.id !== incidentToDelete.id));
      setIncidentToDelete(null);
    } catch (err) {
      console.error('Delete incident error:', err);
      showToast(err.message || 'Failed to delete incident.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span>INCIDENT RECORDS DATABASE</span>
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Incident Management Records
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Search, filter, inspect and manage emergency disaster records.
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
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs sm:text-sm font-semibold text-slate-700 transition-colors shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
            <span>{isRetrying ? 'Reloading...' : 'Refresh'}</span>
          </button>

          <Link
            to="/incidents/create"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-xs sm:text-sm font-semibold text-white shadow-xs transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Incident</span>
          </Link>
        </div>
      </div>

      {/* Backend Error Alert */}
      {error && (
        <ErrorAlert
          title="Incident Data Unavailable"
          message={error}
          onRetry={fetchIncidents}
          isRetrying={isRetrying}
        />
      )}

      {/* Filters Section */}
      <IncidentFilter
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        selectedType={selectedType}
        onTypeChange={handleTypeChange}
        selectedStatus={selectedStatus}
        onStatusChange={handleStatusChange}
        onReset={handleResetFilters}
        totalCount={incidents.length}
        filteredCount={filteredIncidents.length}
      />

      {/* Incidents Table / Loading state */}
      {isLoading ? (
        <LoadingSpinner message="Loading registered incidents..." />
      ) : (
        <IncidentTable
          incidents={filteredIncidents}
          onDeleteClick={(incident) => setIncidentToDelete(incident)}
          emptyMessage={
            searchTerm || selectedType !== 'All' || selectedStatus !== 'All'
              ? 'No incidents matched your current search filters.'
              : 'No incidents have been recorded in the database yet.'
          }
          onResetFilters={handleResetFilters}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={Boolean(incidentToDelete)}
        incident={incidentToDelete}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setIncidentToDelete(null)}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default Incidents;

