import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, PlusCircle } from 'lucide-react';
import incidentService from '../services/incidentService';
import { useNotification } from '../context/NotificationContext';
import IncidentForm from '../components/incidents/IncidentForm';
import ErrorAlert from '../components/common/ErrorAlert';

const CreateIncident = () => {
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
      navigate('/incidents');
    } catch (err) {
      console.error('Error creating incident:', err);
      setServerError(
        err.message ||
          'Failed to create incident on the server. Please check your backend connection.'
      );
      showToast(err.message || 'Failed to create incident.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Top back button */}
      <div>
        <Link
          to="/incidents"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Incident Registry</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <PlusCircle className="h-3.5 w-3.5" />
            <span>DISPATCH INTAKE</span>
          </span>
        </div>

        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-1">
          Log Emergency Incident
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Record emergency classification, location coordinates, and operational notes for response teams.
        </p>
      </div>

      {serverError && (
        <ErrorAlert
          title="Submission Failed"
          message={serverError}
          showCorsHint={false}
        />
      )}

      {/* Reusable Form */}
      <IncidentForm
        onSubmit={handleCreate}
        isSubmitting={isSubmitting}
        mode="create"
      />
    </div>
  );
};

export default CreateIncident;

