import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  MapPin,
  CheckCircle2,
  Shield,
  Loader2,
  XCircle,
  Lock,
  Radio,
  Users,
  FileText,
  Zap,
  Ban,
  Clock,
} from 'lucide-react';
import {
  DISASTER_TYPES,
  SEVERITY_LEVELS,
  SEVERITY_CONFIG,
  RESPONSE_TEAMS,
} from '../../constants/incidentConstants';
import DisasterIcon from '../common/DisasterIcon';
import StatusBadge from '../common/StatusBadge';
import SeverityBadge from '../common/SeverityBadge';
import SourceBadge from '../common/SourceBadge';
import LifecycleActionModal from '../common/LifecycleActionModal';

const IncidentForm = ({
  initialData = null,
  onSubmit,
  onLifecycleAction,
  isSubmitting = false,
  mode = 'create', // 'create' | 'edit'
}) => {
  const navigate = useNavigate();

  // Create Mode state
  const [createFormData, setCreateFormData] = useState({
    disasterType: '',
    location: '',
    severity: 'Medium',
    assignedTeam: 'Unassigned',
    responseNotes: '',
  });

  // Edit Mode state (Operational fields)
  const [operationalData, setOperationalData] = useState({
    severity: 'Medium',
    assignedTeam: 'Unassigned',
    responseNotes: '',
  });

  // Modal State for lifecycle action confirmations
  const [modalState, setModalState] = useState({
    isOpen: false,
    action: 'verify',
    isProcessing: false,
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setOperationalData({
        severity: initialData.severity || 'Medium',
        assignedTeam: initialData.assignedTeam || 'Unassigned',
        responseNotes: initialData.responseNotes || '',
      });
      setCreateFormData({
        disasterType: initialData.disasterType || '',
        location: initialData.location || '',
        severity: initialData.severity || 'Medium',
        assignedTeam: initialData.assignedTeam || 'Unassigned',
        responseNotes: initialData.responseNotes || '',
      });
    }
  }, [initialData]);

  // Current status
  const currentStatus = (initialData?.status || 'Pending').trim().toLowerCase();
  const isPending = currentStatus === 'pending';
  const isActive = currentStatus === 'active';
  const isResolved = currentStatus === 'resolved';

  // Validation for Create Mode
  const validateCreate = (data) => {
    const errs = {};
    if (!data.disasterType?.trim()) {
      errs.disasterType = 'Disaster classification is required.';
    }
    if (!data.location?.trim()) {
      errs.location = 'Incident location is required.';
    } else if (data.location.trim().length < 2) {
      errs.location = 'Location description must be at least 2 characters.';
    }
    return errs;
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();

    const valErrors = validateCreate(createFormData);
    setErrors(valErrors);
    if (Object.keys(valErrors).length > 0) return;

    onSubmit({
      disasterType: createFormData.disasterType.trim(),
      location: createFormData.location.trim(),
      status: 'Pending',
      severity: createFormData.severity,
      assignedTeam: createFormData.assignedTeam,
      responseNotes: createFormData.responseNotes?.trim(),
    });
  };

  // Operational Updates Submit (without changing status)
  const handleSaveOperationalUpdates = (e) => {
    e.preventDefault();
    onSubmit({
      disasterType: initialData.disasterType,
      location: initialData.location,
      status: initialData.status,
      severity: operationalData.severity,
      assignedTeam: operationalData.assignedTeam,
      responseNotes: operationalData.responseNotes?.trim(),
    });
  };

  const openActionModal = (action) => {
    setModalState({
      isOpen: true,
      action,
      isProcessing: false,
    });
  };

  const closeModal = () => {
    setModalState({
      isOpen: false,
      action: 'verify',
      isProcessing: false,
    });
  };

  const handleModalConfirm = (payload = {}) => {
    closeModal();
    if (onLifecycleAction) {
      onLifecycleAction(modalState.action, payload);
    } else {
      if (modalState.action === 'verify') {
        onSubmit({
          disasterType: initialData.disasterType,
          location: initialData.location,
          status: 'Active',
          severity: payload.severity || operationalData.severity,
          assignedTeam: payload.assignedTeam || operationalData.assignedTeam,
          responseNotes: payload.responseNotes || operationalData.responseNotes,
        });
      } else if (modalState.action === 'reject') {
        const note = `[REJECTED]: ${payload.reason || 'False alarm'}`;
        onSubmit({
          disasterType: initialData.disasterType,
          location: initialData.location,
          status: 'Resolved',
          severity: 'Low',
          assignedTeam: 'Unassigned',
          responseNotes: operationalData.responseNotes ? `${operationalData.responseNotes}\n${note}` : note,
          rejectionReason: payload.reason,
        });
      } else if (modalState.action === 'resolve') {
        const note = `[RESOLVED]: ${payload.notes || 'Contained'}`;
        onSubmit({
          disasterType: initialData.disasterType,
          location: initialData.location,
          status: 'Resolved',
          severity: operationalData.severity,
          assignedTeam: operationalData.assignedTeam,
          responseNotes: operationalData.responseNotes ? `${operationalData.responseNotes}\n${note}` : note,
        });
      }
    }
  };

  // -------------------------------------------------------------
  // RENDER: CREATE MODE (Intake)
  // -------------------------------------------------------------
  if (mode === 'create') {
    return (
      <form onSubmit={handleCreateSubmit} className="space-y-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
          {/* Disaster Type */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Disaster Classification</span>
              <span className="text-red-600">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {DISASTER_TYPES.map((type) => {
                const isSelected = createFormData.disasterType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      setCreateFormData((prev) => ({ ...prev, disasterType: type }));
                      setErrors((prev) => ({ ...prev, disasterType: '' }));
                    }}
                    className={`p-3 rounded-lg border text-left flex flex-col items-center justify-center text-center gap-2 transition-all ${
                      isSelected
                        ? 'bg-blue-50 border-blue-600 text-blue-900 ring-1 ring-blue-600 shadow-2xs font-semibold'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <DisasterIcon type={type} showContainer size="sm" />
                    <span className="text-xs font-semibold leading-tight">{type}</span>
                  </button>
                );
              })}
            </div>
            {errors.disasterType && (
              <p className="flex items-center gap-1 text-xs text-red-600 font-medium">
                <XCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.disasterType}</span>
              </p>
            )}
          </div>

          {/* Location */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-slate-500" />
              <span>Incident Location</span>
              <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={createFormData.location}
              onChange={(e) => {
                const val = e.target.value;
                setCreateFormData((prev) => ({ ...prev, location: val }));
                if (val.trim()) setErrors((prev) => ({ ...prev, location: '' }));
              }}
              placeholder="e.g., Sector 18 Market, Delhi or 28.6139, 77.2090"
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
            />
            {errors.location && (
              <p className="flex items-center gap-1 text-xs text-red-600 font-medium">
                <XCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.location}</span>
              </p>
            )}
          </div>

          {/* Initial Severity */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-slate-500" />
              <span>Initial Severity Assessment</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {SEVERITY_LEVELS.map((sev) => {
                const isSelected = createFormData.severity === sev;
                const config = SEVERITY_CONFIG[sev];
                return (
                  <button
                    key={sev}
                    type="button"
                    onClick={() => setCreateFormData((prev) => ({ ...prev, severity: sev }))}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      isSelected
                        ? `${config.badgeBg} ${config.badgeText} border-blue-600 ring-1 ring-blue-600 shadow-2xs`
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-slate-900">{sev}</span>
                      <span className={`h-2 w-2 rounded-full ${config.dotBg}`} />
                    </div>
                    <span className="text-[11px] text-slate-500 line-clamp-2">{config.description}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Initial Operational Notes */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-slate-500" />
              <span>Operational Intake Notes</span>
            </label>
            <textarea
              rows={3}
              value={createFormData.responseNotes}
              onChange={(e) => setCreateFormData((prev) => ({ ...prev, responseNotes: e.target.value }))}
              placeholder="Initial triage findings, dispatch warnings, or preliminary situation notes..."
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-xs sm:text-sm font-semibold text-white shadow-xs transition-colors disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Submitting Incident...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Log Incident Record</span>
              </>
            )}
          </button>
        </div>
      </form>
    );
  }

  // -------------------------------------------------------------
  // RENDER: EDIT / OPERATIONAL DISPATCH WORKFLOW MODE
  // -------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* SECTION 1: READ-ONLY ORIGINAL SUBMISSION DOSSIER */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
              <Lock className="w-3 h-3 text-slate-500" />
              <span>Original Incident Data (Read-Only)</span>
            </span>
          </div>
          <span className="text-xs text-slate-500">
            Locked for record integrity
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1">
          {/* Read-Only Disaster Type */}
          <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center gap-3">
            <DisasterIcon type={initialData?.disasterType} showContainer size="sm" />
            <div className="min-w-0">
              <span className="text-[10px] font-semibold uppercase text-slate-500 block">Disaster Type</span>
              <strong className="text-sm text-slate-900 truncate block">{initialData?.disasterType}</strong>
            </div>
          </div>

          {/* Read-Only Location */}
          <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-700">
              <MapPin className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-semibold uppercase text-slate-500 block">Location</span>
              <strong className="text-xs text-slate-900 truncate block" title={initialData?.location}>
                {initialData?.location}
              </strong>
            </div>
          </div>

          {/* Read-Only Ingestion Channel */}
          <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-700">
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-semibold uppercase text-slate-500 block">Source</span>
              <SourceBadge source={initialData?.source || 'MANUAL'} size="sm" />
            </div>
          </div>

          {/* Read-Only Reported Timestamp */}
          <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-slate-100 text-slate-600">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-semibold uppercase text-slate-500 block">Reported At</span>
              <strong className="text-xs text-slate-800 block">
                {initialData?.reportedAt
                  ? new Date(initialData.reportedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : 'Logged'}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: CONTROLLED LIFECYCLE STAGE & ACTIONS */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                <Shield className="h-3.5 w-3.5" />
                <span>Incident Lifecycle Stage</span>
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight mt-1">
              Current Status: <span className="text-blue-700">{initialData?.status}</span>
            </h2>
          </div>
          <div>
            <StatusBadge status={initialData?.status} size="lg" />
          </div>
        </div>

        {/* 3-Stage Lifecycle Stepper */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div
            className={`p-3 rounded-lg border flex items-center justify-between ${
              isPending
                ? 'bg-amber-50 border-amber-300 text-amber-900 font-semibold shadow-2xs'
                : 'bg-slate-50 border-slate-200 text-slate-500'
            }`}
          >
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">STAGE 1</span>
              <strong className="text-slate-900 block">Pending Verification</strong>
            </div>
            {isPending && <span className="h-2 w-2 rounded-full bg-amber-500" />}
          </div>

          <div
            className={`p-3 rounded-lg border flex items-center justify-between ${
              isActive
                ? 'bg-red-50 border-red-300 text-red-900 font-semibold shadow-2xs'
                : 'bg-slate-50 border-slate-200 text-slate-500'
            }`}
          >
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">STAGE 2</span>
              <strong className="text-slate-900 block">Active Response</strong>
            </div>
            {isActive && <span className="h-2 w-2 rounded-full bg-red-600" />}
          </div>

          <div
            className={`p-3 rounded-lg border flex items-center justify-between ${
              isResolved
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold shadow-2xs'
                : 'bg-slate-50 border-slate-200 text-slate-500'
            }`}
          >
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">STAGE 3</span>
              <strong className="text-slate-900 block">Resolved / Contained</strong>
            </div>
            {isResolved && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
          </div>
        </div>

        {/* Dynamic Controlled Lifecycle Action Bar */}
        <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-3">
          <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
            Authorized Authority Actions:
          </span>

          {/* Actions for PENDING incident */}
          {isPending && (
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => openActionModal('verify')}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-xs sm:text-sm font-semibold text-white shadow-xs transition-colors disabled:opacity-50"
              >
                <Zap className="w-4 h-4" />
                <span>Verify &amp; Activate</span>
              </button>

              <button
                type="button"
                onClick={() => openActionModal('reject')}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-red-300 bg-white hover:bg-red-50 text-xs sm:text-sm font-semibold text-red-700 transition-colors shadow-2xs"
              >
                <Ban className="w-4 h-4" />
                <span>Reject Incident</span>
              </button>
            </div>
          )}

          {/* Actions for ACTIVE incident */}
          {isActive && (
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => openActionModal('resolve')}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-xs sm:text-sm font-semibold text-white shadow-xs transition-colors disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Mark as Resolved</span>
              </button>
            </div>
          )}

          {/* Actions for RESOLVED incident */}
          {isResolved && (
            <div className="flex items-center gap-2 text-xs font-medium text-emerald-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>This incident has been resolved and represents a completed emergency record.</span>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 3: OPERATIONAL DISPATCH PARAMETERS (Editable by Authority ONLY if not resolved) */}
      {!isResolved ? (
        <form onSubmit={handleSaveOperationalUpdates} className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-700" />
                  <span>Operational Dispatch Parameters</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Authorities adjust operational severity, unit deployment, and response notes.
                </p>
              </div>
              <SeverityBadge severity={operationalData.severity} size="sm" />
            </div>

            {/* Operational Severity Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>Operational Severity Level</span>
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {SEVERITY_LEVELS.map((sev) => {
                  const isSelected = operationalData.severity === sev;
                  const config = SEVERITY_CONFIG[sev];
                  return (
                    <button
                      key={sev}
                      type="button"
                      onClick={() => setOperationalData((prev) => ({ ...prev, severity: sev }))}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        isSelected
                          ? `${config.badgeBg} ${config.badgeText} border-blue-600 ring-1 ring-blue-600 shadow-2xs`
                          : 'bg-white border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs text-slate-900">{sev}</span>
                        <span className={`h-2 w-2 rounded-full ${config.dotBg}`} />
                      </div>
                      <span className="text-[10px] text-slate-500 block leading-tight">{config.description}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Assigned Response Team */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-slate-500" />
                <span>Assigned Emergency Response Unit</span>
              </label>
              <select
                value={operationalData.assignedTeam}
                onChange={(e) => setOperationalData((prev) => ({ ...prev, assignedTeam: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
              >
                {RESPONSE_TEAMS.map((team) => (
                  <option key={team} value={team}>
                    {team}
                  </option>
                ))}
              </select>
            </div>

            {/* Operational Response Notes */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  <span>Command Log &amp; Operational Notes</span>
                </label>
                <span className="text-xs text-slate-400">Authority Log</span>
              </div>
              <textarea
                rows={4}
                value={operationalData.responseNotes}
                onChange={(e) => setOperationalData((prev) => ({ ...prev, responseNotes: e.target.value }))}
                placeholder="Record field telemetry, dispatch directives, containment updates, or road closure orders..."
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Footer save bar */}
          <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => navigate(`/authority/incidents/${initialData?.id || ''}`)}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-xs sm:text-sm font-semibold text-white shadow-xs transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Updates...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save Operational Updates</span>
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-center space-y-3 shadow-xs">
          <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
          <h4 className="text-base font-bold text-slate-900">Completed Incident Record</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            This incident record is locked and archived as resolved. New emergencies should be logged as separate incidents.
          </p>
          <button
            type="button"
            onClick={() => navigate(`/authority/incidents/${initialData?.id}`)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-colors"
          >
            View Record Details
          </button>
        </div>
      )}

      {/* Confirmation Modal */}
      <LifecycleActionModal
        isOpen={modalState.isOpen}
        action={modalState.action}
        incident={initialData}
        isLoading={isSubmitting}
        onConfirm={handleModalConfirm}
        onCancel={closeModal}
      />
    </div>
  );
};

export default IncidentForm;

