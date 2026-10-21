import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Shield, CheckCircle2 } from 'lucide-react';
import incidentService from '../services/incidentService';
import { useNotification } from '../context/NotificationContext';
import IncidentForm from '../components/incidents/IncidentForm';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorAlert from '../components/common/ErrorAlert';

const EditIncident = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useNotification();

  const [incident, setIncident] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const fetchIncident = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await incidentService.getIncidentById(id);
      setIncident(data);
    } catch (err) {
      console.error('Error fetching incident for edit:', err);
      if (err.statusCode === 404) {
        setError('Incident #' + id + ' not found. It cannot be edited.');
      } else {
        setError(err.message || 'Unable to load incident for editing.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchIncident();
  }, [fetchIncident]);

  const handleUpdate = async (formData) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await incidentService.updateIncident(id, formData);
      showToast(`Operational parameters for Incident #${id} saved.`, 'success');
      navigate(`/authority/incidents/${id}`);
    } catch (err) {
      console.error('Error updating incident:', err);
      setError(err.message || 'Failed to update incident. Please try again.');
      showToast(err.message || 'Failed to update incident.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLifecycleAction = async (action, payload) => {
    setIsSubmitting(true);
    setError(null);
    try {
      if (action === 'verify') {
        // payload = { severity, assignedTeam }
        await incidentService.verifyIncident(
          id,
          payload.assignedTeam || 'Unassigned',
          payload.severity || null
        );
        showToast(`Incident #${id} verified & team assigned.`, 'success');
      } else if (action === 'reject') {
        // payload = { reason }
        await incidentService.rejectIncident(id, payload.reason || 'False alarm / Invalid report');
        showToast(`Incident #${id} rejected.`, 'info');
      } else if (action === 'resolve') {
        // payload = { notes }
        await incidentService.resolveIncident(id);
        showToast(`Incident #${id} resolved.`, 'success');
      }
      navigate(`/authority/incidents/${id}`);
    } catch (err) {
      console.error(`Error during lifecycle action [${action}]:`, err);
      setError(err.message || 'Failed to execute lifecycle transition.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto py-8">
        <LoadingSpinner message={`Loading data for Incident #${id}...`} />
      </div>
    );
  }

  if (error && !incident) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Link
          to="/authority/incidents"
          className="inline-flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Incidents</span>
        </Link>

        <ErrorAlert
          title="Cannot Edit Incident"
          message={error}
          onRetry={fetchIncident}
          showCorsHint={false}
        />
      </div>
    );
  }

  const isResolved = (incident?.status || '').trim().toLowerCase() === 'resolved';
  if (isResolved) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 py-8">
        <Link
          to={`/authority/incidents/${id}`}
          className="inline-flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-white transition-colors mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Incident #{id}</span>
        </Link>

        <div className="rounded-3xl border border-emerald-500/30 bg-slate-900/80 p-8 text-center backdrop-blur-xl shadow-2xl space-y-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white">Incident #{id} is Resolved</h2>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Resolved incidents represent completed emergency records and cannot be modified. If another emergency occurs, please log a new incident.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => navigate(`/authority/incidents/${id}`)}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-colors"
            >
              View Completed Record
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <Link
          to={`/authority/incidents/${id}`}
          className="inline-flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-white transition-colors mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Incident #{id}</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/20">
            <Shield className="h-3.5 w-3.5" />
            <span>OPERATIONAL DISPATCH WORKFLOW</span>
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
          Operational Edit &bull; Incident #{id}
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Adjust severity, assign response teams, add command logs, and execute controlled lifecycle state actions.
        </p>
      </div>

      {error && (
        <ErrorAlert
          title="Update Failed"
          message={error}
          showCorsHint={false}
        />
      )}

      <IncidentForm
        initialData={incident}
        onSubmit={handleUpdate}
        onLifecycleAction={handleLifecycleAction}
        isSubmitting={isSubmitting}
        mode="edit"
      />
    </div>
  );
};

export default EditIncident;
