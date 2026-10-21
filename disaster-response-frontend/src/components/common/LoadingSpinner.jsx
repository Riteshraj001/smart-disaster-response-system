import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingSpinner = ({
  message = 'Loading incident data...',
  variant = 'full',
}) => {
  if (variant === 'inline') {
    return (
      <div className="inline-flex items-center gap-2 text-sm text-slate-600 font-medium">
        <Loader2 className="w-4 h-4 animate-spin text-blue-700" />
        <span>{message}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-10 text-center rounded-xl bg-white border border-slate-200 my-4 shadow-xs">
      <div className="p-3 rounded-xl bg-blue-50 text-blue-700 mb-3">
        <Loader2 className="w-7 h-7 animate-spin" />
      </div>
      <h4 className="text-sm font-semibold text-slate-800 mb-0.5">{message}</h4>
      <p className="text-xs text-slate-500">
        Connecting to Spring Boot REST Service (http://localhost:8080)
      </p>
    </div>
  );
};

export default LoadingSpinner;

