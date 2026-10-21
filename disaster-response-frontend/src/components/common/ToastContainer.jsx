import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

const ToastContainer = ({ toasts, onDismiss }) => {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none px-4 sm:px-0"
    >
      {toasts.map((toast) => {
        let bgClass = 'bg-white border-slate-200 text-slate-900';
        let Icon = Info;
        let iconColor = 'text-blue-700';

        if (toast.type === 'success') {
          bgClass = 'bg-white border-emerald-300 text-slate-900 shadow-sm';
          Icon = CheckCircle2;
          iconColor = 'text-emerald-700';
        } else if (toast.type === 'error') {
          bgClass = 'bg-white border-red-300 text-slate-900 shadow-sm';
          Icon = XCircle;
          iconColor = 'text-red-700';
        } else if (toast.type === 'warning') {
          bgClass = 'bg-white border-amber-300 text-slate-900 shadow-sm';
          Icon = AlertTriangle;
          iconColor = 'text-amber-700';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-lg transition-all duration-200 ${bgClass}`}
            role="alert"
          >
            <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${iconColor}`} />
            <div className="flex-1 text-xs font-semibold leading-relaxed text-slate-800">
              {toast.message}
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-100 transition-colors"
              aria-label="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default ToastContainer;

