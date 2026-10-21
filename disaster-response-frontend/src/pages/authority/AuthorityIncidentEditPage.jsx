import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import incidentService from '../../services/incidentService';
import { useNotification } from '../../context/NotificationContext';
import IncidentForm from '../../components/incidents/IncidentForm';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';

const AuthorityIncidentEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useNotification();

  const [initialData, setInitialData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updateError, setUpdateError] = useState(null);

  const fetchIncident = useCallback(async () => {
    try {
      setIsLoading(true);
      setFetchError(null);
      const data = await incidentService.getIncidentById(id);
      setInitialData(data);
    } catch (err) {
      console.error('Error fetching incident for edit:', err);
      setFetchError(err.message || 'Unable to retrieve incident from the backend.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchIncident();
  }, [fetchIncident]);

  const handleUpdate = async (formData) => {
    setIsSubmitting(true);
    setUpdateError(null);

    try {
      await incidentService.updateIncident(id, formData);
      showToast(`Incident #${id} updated successfully.`, 'success');
      navigate(`/authority/incidents/${id}`);
    } catch (err) {
      console.error('Error updating incident:', err);
      setUpdateError(
        err.message || 'Failed to update incident on the server.'
      );
      showToast(err.message || 'Failed to update incident.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLifecycleAction = async (action, payload) => {
    setIsSubmitting(true);
    setUpdateError(null);

    try {
      if (action === 'verify') {
        // payload = { severity, assignedTeam }
        await incidentService.verifyIncident(
          id,
          payload.assignedTeam || 'Unassigned',
          payload.severity || null
        );
        showToast(`Incident #${id} verified and team assigned.`, 'success');
      } else if (action === 'reject') {
        // payload = { reason }
        await incidentService.rejectIncident(id, payload.reason || 'False alarm / Invalid report');
        showToast(`Incident #${id} rejected.`, 'info');
      } else if (action === 'resolve') {
        // payload = { notes }
        await incidentService.resolveIncident(id);
        showToast(`Incident #${id} marked as Resolved.`, 'success');
      }
      navigate(`/authority/incidents/${id}`);
    } catch (err) {
      console.error(`Error during lifecycle action [${action}]:`, err);
      setUpdateError(err.message || 'Failed to execute lifecycle action.');
      showToast(err.message || 'Action failed.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <LoadingSpinner message={`Loading incident #${id}...`} />
      </div>
    );
  }

  if (fetchError || !initialData) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 font-sans">
        <Link
          to="/authority/incidents"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#64748B] hover:text-[#111827] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Incidents</span>
        </Link>
        <ErrorAlert
          title="Incident Not Found"
          message={fetchError || 'Unable to load incident for editing.'}
          onRetry={fetchIncident}
        />
      </div>
    );
  }

  // If incident is already resolved, show locked message
  const isResolved = (initialData.status || '').trim().toLowerCase() === 'resolved';

  if (isResolved) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 py-8 font-sans">
        <Link
          to={`/authority/incidents/${id}`}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#64748B] hover:text-[#111827] transition-colors mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Incident #{id}</span>
        </Link>

        <div className="bg-white border border-[#E5E7EB] rounded-lg p-8 text-center shadow-xs space-y-3">
          <CheckCircle2 className="w-8 h-8 text-[#059669] mx-auto" />
          <h2 className="text-base font-bold text-[#111827]">Incident #{id} is Resolved</h2>
          <p className="text-xs text-[#64748B] max-w-md mx-auto">
            This incident has been resolved and closed. The record is locked for auditing purposes.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => navigate(`/authority/incidents/${id}`)}
              className="px-4 py-2 rounded-md bg-[#1D4ED8] hover:bg-blue-800 text-xs font-semibold text-white transition-colors"
            >
              View Record Details
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-sans">
      <div>
        <Link
          to={`/authority/incidents/${id}`}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#64748B] hover:text-[#111827] transition-colors mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Incident #{id}</span>
        </Link>

        <h1 className="text-xl sm:text-2xl font-bold text-[#111827]">
          Edit Incident #{id}
        </h1>
        <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
          Update severity, assign response teams, and record operational notes.
        </p>
      </div>

      {updateError && (
        <ErrorAlert
          title="Update Failed"
          message={updateError}
          showCorsHint={false}
        />
      )}

      <IncidentForm
        initialData={initialData}
        onSubmit={handleUpdate}
        onLifecycleAction={handleLifecycleAction}
        isSubmitting={isSubmitting}
        mode="edit"
      />
    </div>
  );
};

export default AuthorityIncidentEditPage;

