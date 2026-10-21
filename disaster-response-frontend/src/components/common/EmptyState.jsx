import React from 'react';
import { Link } from 'react-router-dom';
import { Inbox, PlusCircle, RefreshCw } from 'lucide-react';

const EmptyState = ({
  title = 'No Incidents Recorded',
  description = 'No active incidents found matching your criteria.',
  icon: Icon = Inbox,
  actionText,
  actionLink,
  onAction,
  onReset,
  resetText = 'Clear Filters',
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center rounded-xl bg-white border border-slate-200 shadow-xs my-4">
      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-slate-100 text-slate-500 mb-4">
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="text-base font-bold text-slate-900 mb-1">{title}</h3>
      <p className="max-w-md text-xs text-slate-500 leading-relaxed mb-6">
        {description}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors shadow-2xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{resetText}</span>
          </button>
        )}

        {actionText && onAction && (
          <button
            type="button"
            onClick={onAction}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-xs sm:text-sm font-semibold text-white transition-colors shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{actionText}</span>
          </button>
        )}

        {actionText && actionLink && (
          <Link
            to={actionLink}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-xs sm:text-sm font-semibold text-white transition-colors shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{actionText}</span>
          </Link>
        )}
      </div>
    </div>
  );
};

export default EmptyState;

