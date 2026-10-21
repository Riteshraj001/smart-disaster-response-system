import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Activity,
  Clock,
  CheckCircle2,
  PlusCircle,
  ArrowRight,
  RefreshCw,
  Layers,
  Flame,
} from 'lucide-react';
import incidentService from '../services/incidentService';
import { useNotification } from '../context/NotificationContext';
import StatCard from '../components/common/StatCard';
import IncidentTable from '../components/incidents/IncidentTable';
import ConfirmDialog from '../components/common/ConfirmDialog';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorAlert from '../components/common/ErrorAlert';
import DisasterTypeChart from '../components/dashboard/DisasterTypeChart';
import StatusBreakdownChart from '../components/dashboard/StatusBreakdownChart';
import EmergencyAdvisory from '../components/dashboard/EmergencyAdvisory';
import { sortIncidentsByPriority } from '../utils/incidentSorting';

const Dashboard = () => {
  const navigate = useNavigate();
  const { showToast } = useNotification();

  const [incidents, setIncidents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRetrying, setIsRetrying] = useState(false);

  // Deletion modal state
  const [incidentToDelete, setIncidentToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchIncidents = useCallback(async () => {
    try {
      setError(null);
      const data = await incidentService.getIncidents();
      setIncidents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching dashboard incidents:', err);
      setError(err.message || 'Unable to connect to the disaster management server.');
    } finally {
      setIsLoading(false);
      setIsRetrying(false);
    }
  }, []);

  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  const handleManualRefresh = () => {
    setIsRetrying(true);
    fetchIncidents();
  };

  // Dynamic calculation of statistics from GET /incidents (NO hardcoding)
  const totalIncidents = incidents.length;

  const activeIncidents = incidents.filter(
    (item) => (item.status || '').trim().toLowerCase() === 'active'
  ).length;

  const pendingIncidents = incidents.filter(
    (item) => (item.status || '').trim().toLowerCase() === 'pending'
  ).length;

  const resolvedIncidents = incidents.filter(
    (item) => (item.status || '').trim().toLowerCase() === 'resolved'
  ).length;

  // Recent 5 incidents (latest first if sorted by ID descending)
  const recentIncidents = sortIncidentsByPriority(incidents).slice(0, 5);

  // Delete flow
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
      console.error('Delete error:', err);
      showToast(err.message || 'Failed to delete incident.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-600"></span>
              LIVE OPERATIONS MONITOR
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Emergency Operations Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time overview of active disaster situations and response tracking.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={isLoading || isRetrying}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs sm:text-sm font-semibold text-slate-700 transition-colors shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
            <span>{isRetrying ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          <Link
            to="/incidents/create"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-xs sm:text-sm font-semibold text-white shadow-xs transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Report Incident</span>
          </Link>
        </div>
      </div>

      {/* Error state if backend disconnected */}
      {error && (
        <ErrorAlert
          title="Backend Connection Failed"
          message={error}
          onRetry={fetchIncidents}
          isRetrying={isRetrying}
        />
      )}

      {/* Loading state */}
      {isLoading ? (
        <LoadingSpinner message="Calculating real-time incident statistics..." />
      ) : (
        <>
          {/* Dynamic Statistic Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Incidents"
              value={totalIncidents}
              icon={Layers}
              variant="default"
              subtitle="All registered records"
              onClick={() => navigate('/incidents')}
            />

            <StatCard
              title="Active Incidents"
              value={activeIncidents}
              icon={Flame}
              variant="active"
              subtitle={
                totalIncidents > 0
                  ? `${Math.round((activeIncidents / totalIncidents) * 100)}% of total response`
                  : 'Requires response'
              }
              badgeText="ACTIVE"
              onClick={() => navigate('/incidents?status=Active')}
            />

            <StatCard
              title="Pending Verification"
              value={pendingIncidents}
              icon={Clock}
              variant="pending"
              subtitle={
                totalIncidents > 0
                  ? `${Math.round((pendingIncidents / totalIncidents) * 100)}% in triage queue`
                  : 'Awaiting triage'
              }
              badgeText="PENDING"
              onClick={() => navigate('/incidents?status=Pending')}
            />

            <StatCard
              title="Resolved Incidents"
              value={resolvedIncidents}
              icon={CheckCircle2}
              variant="resolved"
              subtitle={
                totalIncidents > 0
                  ? `${Math.round((resolvedIncidents / totalIncidents) * 100)}% containment rate`
                  : 'Closed & secured'
              }
              badgeText="RESOLVED"
              onClick={() => navigate('/incidents?status=Resolved')}
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <DisasterTypeChart incidents={incidents} />
            <StatusBreakdownChart incidents={incidents} />
          </div>

          {/* Recent Incidents Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-700" />
                  <span>Recent Incident Log</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Latest 5 transmissions logged in the database
                </p>
              </div>

              <Link
                to="/incidents"
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-800 transition-colors"
              >
                <span>View All Incidents</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <IncidentTable
              incidents={recentIncidents}
              onDeleteClick={(incident) => setIncidentToDelete(incident)}
              emptyMessage="No recent incidents reported in the database."
            />
          </div>

          {/* Operations & Advisory Guide */}
          <EmergencyAdvisory />
        </>
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

export default Dashboard;
