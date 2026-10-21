import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Edit3,
  Trash2,
  MapPin,
  Clock,
  Radio,
  Users,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  ShieldCheck,
  Send,
  XCircle,
} from 'lucide-react';
import incidentService from '../../services/incidentService';
import { RESPONSE_TEAMS, SEVERITY_LEVELS } from '../../constants/incidentConstants';
import { useNotification } from '../../context/NotificationContext';
import DisasterIcon from '../../components/common/DisasterIcon';
import StatusBadge from '../../components/common/StatusBadge';
import SourceBadge from '../../components/common/SourceBadge';
import SeverityBadge from '../../components/common/SeverityBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';

const getStepNumber = (status) => {
  switch (status) {
    case 'PENDING_VERIFICATION':
    case 'Pending':
      return 1;
    case 'VERIFIED':
      return 2;
    case 'ASSIGNED':
    case 'RESPONSE_DISPATCHED':
    case 'Active':
      return 3;
    case 'RESPONDING':
    case 'RESPONSE_COMPLETED':
      return 4;
    case 'RESOLVED':
    case 'Resolved':
      return 5;
    case 'REJECTED':
      return -1;
    default:
      return 1;
  }
};

const AuthorityIncidentDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useNotification();

  const [incident, setIncident] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Action controls
  const [selectedTeam, setSelectedTeam] = useState(RESPONSE_TEAMS[1]);
  const [selectedSeverity, setSelectedSeverity] = useState('High');
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchIncident = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await incidentService.getIncidentById(id);
      setIncident(data);
      if (data) {
        setSelectedSeverity(data.severity || 'High');
        setSelectedTeam(data.assignedTeam && data.assignedTeam !== 'Unassigned' ? data.assignedTeam : RESPONSE_TEAMS[1]);
      }
    } catch (err) {
      console.error('Error fetching incident details:', err);
      setError(err.message || 'Unable to fetch incident details.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchIncident();
  }, [fetchIncident]);

  const handleVerify = async () => {
    setIsUpdating(true);
    try {
      const updated = await incidentService.verifyIncident(id, selectedTeam, selectedSeverity);
      setIncident(updated);
      await fetchIncident();
      showToast(`Incident #${id} verified. Assigned to ${selectedTeam}.`, 'success');
    } catch (err) {
      showToast(err.message || 'Verification failed.', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDispatch = async () => {
    setIsUpdating(true);
    try {
      const updated = await incidentService.dispatchResponseTeam(id, selectedTeam);
      setIncident(updated);
      await fetchIncident();
      showToast(`Response team dispatched for Incident #${id}.`, 'success');
    } catch (err) {
      showToast(err.message || 'Dispatch failed.', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStartResponding = async () => {
    setIsUpdating(true);
    try {
      const updated = await incidentService.startResponding(id);
      setIncident(updated);
      await fetchIncident();
      showToast(`Incident #${id} is now RESPONDING.`, 'success');
    } catch (err) {
      showToast(err.message || 'Failed to start responding.', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCompleteOps = async () => {
    setIsUpdating(true);
    try {
      const updated = await incidentService.completeResponse(id);
      setIncident(updated);
      await fetchIncident();
      showToast(`Field response operations marked as Completed.`, 'info');
    } catch (err) {
      showToast(err.message || 'Update failed.', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleResolve = async () => {
    setIsUpdating(true);
    try {
      const updated = await incidentService.resolveIncident(id);
      setIncident(updated);
      await fetchIncident();
      showToast(`Incident #${id} marked as Resolved.`, 'success');
    } catch (err) {
      showToast(err.message || 'Resolution failed.', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReject = async () => {
    const reason = prompt('Please enter rejection / false alarm reason:', 'False alarm / Invalid report');
    if (!reason) return;
    setIsUpdating(true);
    try {
      const updated = await incidentService.rejectIncident(id, reason);
      setIncident(updated);
      await fetchIncident();
      showToast(`Incident #${id} rejected as false alarm.`, 'info');
    } catch (err) {
      showToast(err.message || 'Rejection failed.', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete incident record #${id}?`)) return;
    try {
      await incidentService.deleteIncident(id);
      showToast(`Incident #${id} deleted from records.`, 'success');
      navigate('/authority/incidents');
    } catch (err) {
      showToast(err.message || 'Delete failed.', 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <LoadingSpinner message={`Loading incident record #${id}...`} />
      </div>
    );
  }

  if (error || !incident) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 font-sans">
        <Link
          to="/authority/incidents"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#64748B] hover:text-[#172033]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Incidents</span>
        </Link>
        <ErrorAlert
          title="Incident Record Unavailable"
          message={error || 'The requested incident could not be retrieved from the server.'}
          onRetry={fetchIncident}
        />
      </div>
    );
  }

  const step = getStepNumber(incident.status);
  const isRejected = step === -1;

  const formatTimestamp = (dateStr) => {
    if (!dateStr) return 'Recently';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', ' + d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const timelineSteps = [
    { label: 'Detected', completed: step >= 1, desc: 'Logged into system' },
    { label: 'Verified', completed: step >= 2, desc: 'Reviewed by authority' },
    { label: 'Response Dispatched', completed: step >= 3, desc: 'Unit mobilized' },
    { label: 'Response Completed', completed: step >= 4, desc: 'On-site operations done' },
    { label: 'Resolved', completed: step >= 5, desc: 'Incident closed' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-sans">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          to="/authority/incidents"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#64748B] hover:text-[#172033]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Incidents</span>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            to={`/authority/incidents/${incident.id}/edit`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E2E8F0] bg-white hover:bg-slate-50 text-xs font-semibold text-[#172033] shadow-2xs"
          >
            <Edit3 className="w-3.5 h-3.5 text-[#64748B]" />
            <span>Edit Record</span>
          </Link>

          <button
            type="button"
            onClick={handleDelete}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 bg-white hover:bg-red-50 text-xs font-semibold text-[#DC2626]"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* Incident Container Card */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-xs overflow-hidden space-y-6">
        {/* Card Header */}
        <div className="p-6 border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white">
          <div className="flex items-center gap-3.5">
            <DisasterIcon type={incident.disasterType} showContainer size="md" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-[#172033]">
                  Incident #{incident.id}
                </h1>
                <StatusBadge status={incident.status} size="sm" />
              </div>
              <p className="text-xs text-[#64748B] mt-0.5">
                Official Incident Record &bull; Emergency Command Dispatch
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <SourceBadge source={incident.source || 'CITIZEN'} size="md" />
            <SeverityBadge severity={incident.severity || 'Medium'} size="md" />
          </div>
        </div>

        {/* Core Fields Grid */}
        <div className="px-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-sm">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] block">Disaster Type</span>
            <p className="font-bold text-[#172033]">{incident.disasterType}</p>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] block">Location</span>
            <p className="font-semibold text-[#172033] flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
              <span>{incident.location}</span>
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] block">Source</span>
            <p className="font-bold text-[#172033]">
              {incident.source === 'IOT_SENSOR' ? 'IoT Sensor Alert (ESP32)' : 'Citizen Report'}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] block">Severity Level</span>
            <p className="font-bold text-[#172033]">{incident.severity || 'Medium'}</p>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] block">Current Status</span>
            <p className="font-bold text-[#172033]">{incident.status}</p>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] block">Reported Time</span>
            <p className="font-medium text-[#172033] flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#64748B]" />
              <span>{formatTimestamp(incident.reportedAt || incident.createdAt)}</span>
            </p>
          </div>
        </div>

        {/* Description & Contact */}
        <div className="px-6 space-y-4">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] block">Incident Description</span>
            <p className="text-xs text-[#172033] bg-slate-50 p-3.5 rounded-lg border border-[#E2E8F0] leading-relaxed">
              {incident.description || 'No additional narrative recorded.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3.5 rounded-lg border border-[#E2E8F0] bg-slate-50/50 space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] block flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-[#2563EB]" />
                Assigned Response Unit
              </span>
              <p className="text-xs font-bold text-[#172033]">
                {incident.assignedTeam || 'Unassigned'}
              </p>
            </div>

            <div className="p-3.5 rounded-lg border border-[#E2E8F0] bg-slate-50/50 space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] block flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#2563EB]" />
                Contact / Node Identifier
              </span>
              <p className="text-xs font-semibold text-[#172033]">
                {incident.contactInfo || (incident.deviceId ? `Node: ${incident.deviceId}` : 'Direct System Channel')}
              </p>
            </div>
          </div>
        </div>

        {/* 5-Step Timeline */}
        <div className="px-6 pt-4 border-t border-[#E2E8F0] space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#172033]">
            Emergency Lifecycle Timeline
          </h3>

          {!isRejected ? (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {timelineSteps.map((s, idx) => (
                <div
                  key={s.label}
                  className={`p-3 rounded-lg border text-center ${
                    s.completed
                      ? 'bg-emerald-50 border-emerald-200 text-[#059669]'
                      : 'bg-slate-50 border-[#E2E8F0] text-[#64748B]'
                  }`}
                >
                  <div className="flex items-center justify-center mb-1">
                    {s.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-[#059669]" />
                    ) : (
                      <span className="w-4 h-4 rounded-full border border-[#64748B] text-[10px] flex items-center justify-center font-bold">
                        {idx + 1}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-bold block">{s.label}</span>
                  <span className="text-[10px] block opacity-80 mt-0.5">{s.desc}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-xs text-[#DC2626] font-bold text-center">
              Incident marked as REJECTED / False Alarm
            </div>
          )}
        </div>

        {/* Lifecycle Action Operations Box */}
        <div className="p-6 border-t border-[#E2E8F0] bg-slate-50/50 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#172033]">
            Authority Command Actions
          </h3>

          {/* If Pending Verification */}
          {(step === 1) && (
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="w-full sm:w-auto flex-1">
                <select
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  className="w-full rounded-lg border border-[#E2E8F0] bg-white p-2 text-xs font-medium"
                >
                  {RESPONSE_TEAMS.filter((t) => t !== 'Unassigned').map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={handleVerify}
                disabled={isUpdating}
                className="w-full sm:w-auto px-5 py-2 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-xs font-bold text-white shadow-xs inline-flex items-center justify-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Verify Incident &amp; Assign Unit</span>
              </button>

              <button
                type="button"
                onClick={handleReject}
                disabled={isUpdating}
                className="w-full sm:w-auto px-4 py-2 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-xs font-bold text-[#DC2626]"
              >
                Reject False Alarm
              </button>
            </div>
          )}

          {/* If Verified -> Dispatch */}
          {(step === 2) && (
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <span className="text-xs text-[#64748B]">Assigned Unit: <strong>{incident.assignedTeam}</strong></span>
              <button
                type="button"
                onClick={handleDispatch}
                disabled={isUpdating}
                className="px-5 py-2 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-xs font-bold text-white shadow-xs inline-flex items-center gap-1.5"
              >
                <Send className="w-4 h-4" />
                <span>Dispatch Response Unit</span>
              </button>
            </div>
          )}

          {/* If Dispatched -> Start Responding */}
          {(step === 3) && (
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                type="button"
                onClick={handleStartResponding}
                disabled={isUpdating}
                className="px-5 py-2 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-xs font-bold text-white shadow-xs inline-flex items-center gap-1.5"
              >
                <Send className="w-4 h-4" />
                <span>Start Responding</span>
              </button>
            </div>
          )}

          {/* If Responding -> Mark Completed; If Completed -> Mark Resolved */}
          {(step === 4) && (
            <div className="flex flex-col sm:flex-row items-center gap-3">
              {incident.status === 'RESPONDING' && (
                <button
                  type="button"
                  onClick={handleCompleteOps}
                  disabled={isUpdating}
                  className="px-5 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-xs font-bold text-white shadow-xs inline-flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Mark Field Response Completed</span>
                </button>
              )}

              {incident.status === 'RESPONSE_COMPLETED' && (
                <button
                  type="button"
                  onClick={handleResolve}
                  disabled={isUpdating}
                  className="px-5 py-2 rounded-lg bg-[#059669] hover:bg-emerald-700 text-xs font-bold text-white shadow-xs inline-flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Mark Incident as Fully Resolved</span>
                </button>
              )}
            </div>
          )}

          {/* If Resolved */}
          {(step === 5) && (
            <div className="flex items-center gap-2 text-xs font-bold text-[#059669] bg-emerald-50 p-3 rounded-lg border border-emerald-200">
              <CheckCircle2 className="w-4 h-4" />
              <span>Incident is fully contained, resolved, and archived.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthorityIncidentDetailsPage;
