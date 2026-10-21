import React, { useEffect } from 'react';
import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react';
import DisasterIcon from './DisasterIcon';
import StatusBadge from './StatusBadge';

const ConfirmDialog = ({
  isOpen,
  title = 'Delete Incident Record',
  message = 'Are you sure you want to delete this incident record? This action will remove it permanently from the system.',
  incident = null,
  confirmText = 'Delete Incident',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  isLoading = false,
}) => {
  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        onClick={() => !isLoading && onCancel()}
        aria-hidden="true"
      />

      {/* Modal Card */}
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-md overflow-hidden rounded-xl bg-white border border-slate-200 p-6 shadow-xl z-10 animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Top Icon & Close */}
        <div className="flex items-start justify-between pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-700">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{title}</h3>
              <p className="text-xs text-slate-500">Confirmation Required</p>
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

        {/* Message */}
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed my-2">
          {message}
        </p>

        {/* Incident Summary Card if provided */}
        {incident && (
          <div className="my-4 rounded-lg border border-slate-200 bg-slate-50 p-3.5 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700">Incident #{incident.id}</span>
              <StatusBadge status={incident.status} size="sm" />
            </div>
            <div className="flex items-center gap-2.5 pt-1 border-t border-slate-200/60">
              <DisasterIcon type={incident.disasterType} showContainer size="sm" />
              <div>
                <div className="font-semibold text-slate-900">
                  {incident.disasterType}
                </div>
                <div className="text-slate-500">
                  Location: <span className="text-slate-800 font-medium">{incident.location}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="w-full sm:w-auto px-4 py-2 rounded-lg border border-slate-200 bg-white text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-2xs"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-red-700 hover:bg-red-800 text-xs sm:text-sm font-semibold text-white transition-colors shadow-xs disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>{confirmText}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;

