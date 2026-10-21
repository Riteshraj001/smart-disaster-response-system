import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Edit3,
  Trash2,
  MapPin,
  ShieldCheck,
  AlertTriangle,
  Server,
  Info,
} from 'lucide-react';
import incidentService from '../services/incidentService';
import { useNotification } from '../context/NotificationContext';
import DisasterIcon from '../components/common/DisasterIcon';
import StatusBadge from '../components/common/StatusBadge';
import ConfirmDialog from '../components/common/ConfirmDialog';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorAlert from '../components/common/ErrorAlert';
import { STATUS_CONFIG } from '../constants/incidentConstants';

const IncidentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useNotification();

  const [incident, setIncident] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Deletion modal state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchIncident = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await incidentService.getIncidentById(id);
      setIncident(data);
    } catch (err) {
      console.error('Error fetching incident details:', err);
      if (err.statusCode === 404) {
        setError('Incident #' + id + ' not found. It may have been deleted or does not exist.');
      } else {
        setError(err.message || 'Unable to fetch incident details.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchIncident();
  }, [fetchIncident]);

  const handleDeleteConfirm = async () => {
    if (!incident) return;
    setIsDeleting(true);
    try {
      await incidentService.deleteIncident(incident.id);
      showToast('Incident deleted successfully.', 'success');
      navigate('/incidents');
    } catch (err) {
      console.error('Failed to delete incident:', err);
      showToast(err.message || 'Failed to delete incident.', 'error');
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto py-8">
        <LoadingSpinner message={`Loading details for Incident #${id}...`} />
      </div>
    );
  }

  if (error || !incident) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <Link
          to="/incidents"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Incident Registry</span>
        </Link>

        <ErrorAlert
          title="Incident Not Found"
          message={error || 'The requested incident record could not be retrieved.'}
          onRetry={fetchIncident}
          showCorsHint={false}
        />
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[incident.status] || STATUS_CONFIG.Pending;

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Top Breadcrumb & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <Link
          to="/incidents"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Incident Registry</span>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            to={`/incidents/${incident.id}/edit`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs sm:text-sm font-semibold text-slate-700 transition-colors shadow-2xs"
          >
            <Edit3 className="w-4 h-4 text-slate-500" />
            <span>Edit Record</span>
          </Link>

          <button
            type="button"
            onClick={() => setIsDeleteDialogOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-xs sm:text-sm font-semibold text-red-700 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* Main Incident Overview Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
        {/* Header bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div className="flex items-center gap-3.5">
            <DisasterIcon
              type={incident.disasterType}
              showContainer
              size="lg"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  INCIDENT #{incident.id}
                </span>
                <span className="text-xs text-slate-500">
                  Server Entity
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-1">
                {incident.disasterType} Emergency
              </h1>
            </div>
          </div>

          <div>
            <StatusBadge status={incident.status} size="lg" />
          </div>
        </div>

        {/* 2x2 Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Disaster Type Card */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>Disaster Classification</span>
            </div>
            <p className="text-lg font-bold text-slate-900">{incident.disasterType}</p>
            <p className="text-xs text-slate-500">
              Emergency operations category mapped to response dispatch protocols.
            </p>
          </div>

          {/* Location Card */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <MapPin className="w-3.5 h-3.5 text-blue-700" />
              <span>Incident Location</span>
            </div>
            <p className="text-lg font-bold text-slate-900">{incident.location}</p>
            <p className="text-xs text-slate-500">
              Target operational zone registered in backend database.
            </p>
          </div>

          {/* Status Lifecycle Card */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Lifecycle Status</span>
            </div>
            <p className="text-lg font-bold text-slate-900">{incident.status}</p>
            <p className="text-xs text-slate-500">{statusConfig.description}</p>
          </div>

          {/* Technical Metadata Card */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <Server className="w-3.5 h-3.5 text-slate-500" />
              <span>API Resource</span>
            </div>
            <p className="text-sm font-mono font-semibold text-slate-800">
              GET /incidents/{incident.id}
            </p>
            <p className="text-xs text-slate-500">
              Synchronized with Spring Boot JPA REST endpoint.
            </p>
          </div>
        </div>

        {/* Operational Guidelines Note */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 flex items-start gap-3">
          <div className="p-1.5 rounded-md bg-blue-100 text-blue-700 shrink-0">
            <Info className="w-4 h-4" />
          </div>
          <div className="text-xs text-slate-700 space-y-1">
            <h4 className="font-bold text-slate-900 text-xs">Standard Operating Procedure</h4>
            <p className="leading-relaxed">
              Verify local field conditions before advancing status to "Resolved". Once containment
              is achieved, update the incident to reflect resolved status so statistics update across
              all dashboard viewers.
            </p>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        incident={incident}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setIsDeleteDialogOpen(false)}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default IncidentDetails;
