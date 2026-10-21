import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, PlusCircle } from 'lucide-react';
import incidentService from '../../services/incidentService';
import { useNotification } from '../../context/NotificationContext';
import IncidentForm from '../../components/incidents/IncidentForm';
import ErrorAlert from '../../components/common/ErrorAlert';

const AuthorityIncidentCreatePage = () => {
  const navigate = useNavigate();
  const { showToast } = useNotification();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);

  const handleCreate = async (formData) => {
    setIsSubmitting(true);
    setServerError(null);

    try {
      await incidentService.createIncident(formData);
      showToast('Incident created successfully.', 'success');
      navigate('/authority/incidents');
    } catch (err) {
      console.error('Error logging incident:', err);
      setServerError(
        err.message || 'Failed to create incident on the backend server.'
      );
      showToast(err.message || 'Failed to create incident.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 font-sans">
      <div>
        <Link
          to="/authority/incidents"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#64748B] hover:text-[#111827] transition-colors mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Incidents</span>
        </Link>

        <h1 className="text-xl sm:text-2xl font-bold text-[#111827]">
          Create Incident Record
        </h1>
        <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
          Manually register a new emergency incident into the system.
        </p>
      </div>

      {serverError && (
        <ErrorAlert
          title="Submission Failed"
          message={serverError}
          showCorsHint={false}
        />
      )}

      <IncidentForm
        onSubmit={handleCreate}
        isSubmitting={isSubmitting}
        mode="create"
      />
    </div>
  );
};

export default AuthorityIncidentCreatePage;

