import React, { useEffect, useState } from 'react';
import {
  Zap,
  Ban,
  CheckCircle2,
  Trash2,
  X,
  Loader2,
  AlertTriangle,
  Users,
} from 'lucide-react';
import { SEVERITY_LEVELS, SEVERITY_CONFIG, RESPONSE_TEAMS } from '../../constants/incidentConstants';
import DisasterIcon from './DisasterIcon';
import StatusBadge from './StatusBadge';
import SourceBadge from './SourceBadge';

/**
 * Modal to execute controlled lifecycle state actions:
 * - 'verify': Verify & Activate (Pending -> Active)
 * - 'reject': Reject Incident (Pending -> Resolved with reason)
 * - 'resolve': Mark Resolved (Active -> Resolved with notes)
 * - 'delete': Delete Record
 */
const LifecycleActionModal = ({
  isOpen,
  action = 'verify', // 'verify' | 'reject' | 'resolve' | 'delete'
  incident = null,
  onConfirm,
  onCancel,
  isLoading = false,
}) => {
  const [severity, setSeverity] = useState('High');
  const [assignedTeam, setAssignedTeam] = useState('North Zone Rapid Fire Engine');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (incident) {
      setSeverity(incident.severity || 'High');
      setAssignedTeam(
        incident.assignedTeam && incident.assignedTeam !== 'Unassigned'
          ? incident.assignedTeam
          : 'North Zone Rapid Fire Engine'
      );
      if (action === 'verify') {
        setNotes('Verified by Command Authority. Emergency response units mobilized.');
      } else if (action === 'reject') {
        setNotes('False alarm / Duplicate transmission');
      } else if (action === 'resolve') {
        setNotes('Hazard contained, site secured, and public safety restored.');
      } else {
        setNotes('');
      }
    }
  }, [incident, action]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onCancel]);

  if (!isOpen || !incident) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (action === 'verify') {
      onConfirm({
        severity,
        assignedTeam,
        responseNotes: notes.trim(),
      });
    } else if (action === 'reject') {
      onConfirm({
        reason: notes.trim() || 'False alarm / Invalid report',
      });
    } else if (action === 'resolve') {
      onConfirm({
        notes: notes.trim() || 'Emergency resolved by field units.',
      });
    } else if (action === 'delete') {
      onConfirm();
    }
  };

  let title = 'Verify & Activate Emergency';
  let subtitle = 'Authorize field unit dispatch and advance lifecycle to Active.';
  let confirmLabel = 'Verify & Mobilize Units';
  let themeColor = 'bg-blue-50 text-blue-700 border-blue-200';
  let buttonStyle = 'bg-blue-700 hover:bg-blue-800 text-white';
  let Icon = Zap;

  if (action === 'reject') {
    title = 'Reject Incident Report';
    subtitle = 'Flag transmission as false/invalid and close from active triage.';
    confirmLabel = 'Confirm Rejection';
    themeColor = 'bg-red-50 text-red-700 border-red-200';
    buttonStyle = 'bg-red-700 hover:bg-red-800 text-white';
    Icon = Ban;
  } else if (action === 'resolve') {
    title = 'Mark Incident as Resolved';
    subtitle = 'Confirm that hazards have been neutralized and response is completed.';
    confirmLabel = 'Mark Resolved & Secure';
    themeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    buttonStyle = 'bg-emerald-700 hover:bg-emerald-800 text-white';
    Icon = CheckCircle2;
  } else if (action === 'delete') {
    title = 'Delete Incident Record';
    subtitle = 'Permanently delete this emergency record from the database.';
    confirmLabel = 'Delete Incident';
    themeColor = 'bg-red-50 text-red-700 border-red-200';
    buttonStyle = 'bg-red-700 hover:bg-red-800 text-white';
    Icon = Trash2;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        onClick={() => !isLoading && onCancel()}
        aria-hidden="true"
      />

      {/* Modal Box */}
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-lg overflow-hidden rounded-xl bg-white border border-slate-200 p-6 shadow-xl z-10 space-y-4 animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-2">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg border ${themeColor}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">{title}</h3>
              <p className="text-xs text-slate-500">{subtitle}</p>
            </div>
          </div>

          <button
            onClick={onCancel}
            disabled={isLoading}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Incident Summary Card */}
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700">Incident #{incident.id}</span>
              <SourceBadge source={incident.source || 'MANUAL'} size="sm" />
            </div>
            <StatusBadge status={incident.status} size="sm" />
          </div>

          <div className="flex items-center gap-3 pt-1 border-t border-slate-200/60">
            <DisasterIcon type={incident.disasterType} showContainer size="sm" />
            <div className="min-w-0">
              <h4 className="font-semibold text-slate-900">{incident.disasterType} Emergency</h4>
              <p className="text-slate-500 truncate">{incident.location}</p>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* VERIFY ACTION: Configure Severity & Assigned Unit */}
          {action === 'verify' && (
            <>
              {/* Severity Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Confirm Operational Severity Level</span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {SEVERITY_LEVELS.map((sev) => {
                    const isSelected = severity === sev;
                    const config = SEVERITY_CONFIG[sev];
                    return (
                      <button
                        key={sev}
                        type="button"
                        onClick={() => setSeverity(sev)}
                        className={`py-1.5 px-2 rounded-lg border text-center text-xs font-semibold transition-all ${
                          isSelected
                            ? `${config.badgeBg} ${config.badgeText} border-blue-600 ring-1 ring-blue-600`
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {sev}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Response Team Selection */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-slate-500" />
                  <span>Dispatch Response Unit</span>
                </label>
                <select
                  value={assignedTeam}
                  onChange={(e) => setAssignedTeam(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                >
                  {RESPONSE_TEAMS.filter((t) => t !== 'Unassigned').map((team) => (
                    <option key={team} value={team}>
                      {team}
                    </option>
                  ))}
                </select>
              </div>

              {/* Verification Notes */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Dispatch Directives / Verification Notes
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                />
              </div>
            </>
          )}

          {/* REJECT ACTION: Collect Audit Reason */}
          {action === 'reject' && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Rejection Reason <span className="text-red-600">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Specify reason for rejection (e.g., False alarm, duplicate report, test)..."
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-red-600 focus:ring-1 focus:ring-red-600 focus:outline-none"
              />
            </div>
          )}

          {/* RESOLVE ACTION: Resolution Summary */}
          {action === 'resolve' && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Containment &amp; Resolution Summary <span className="text-emerald-600">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Document containment measures and safety clearance details..."
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
              />
            </div>
          )}

          {/* DELETE ACTION: Warning Note */}
          {action === 'delete' && (
            <p className="text-xs text-red-800 leading-relaxed bg-red-50 border border-red-200 p-3 rounded-lg">
              Warning: This action will permanently remove Incident #{incident.id} from the database. This cannot be undone.
            </p>
          )}

          {/* Footer Controls */}
          <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="w-full sm:w-auto px-4 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold shadow-xs transition-colors ${buttonStyle} disabled:opacity-50`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Icon className="w-3.5 h-3.5" />
                  <span>{confirmLabel}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LifecycleActionModal;

