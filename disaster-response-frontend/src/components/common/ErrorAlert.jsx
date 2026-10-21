import React from 'react';
import { AlertOctagon, RefreshCw, HelpCircle, Server } from 'lucide-react';
import { Link } from 'react-router-dom';

const ErrorAlert = ({
  title = 'API Server Connection Issue',
  message = 'Unable to connect to the disaster management server at http://localhost:8080.',
  onRetry,
  isRetrying = false,
  showCorsHint = true,
}) => {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-900 my-4 shadow-xs">
      <div className="flex flex-col sm:flex-row items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-700">
          <AlertOctagon className="h-5 w-5" />
        </div>

        <div className="flex-1 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h4 className="text-sm font-bold text-red-900">{title}</h4>
            <div className="flex items-center gap-2">
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  disabled={isRetrying}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-red-300 hover:bg-red-50 text-xs font-semibold text-red-800 transition-colors shadow-2xs self-start"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
                  <span>{isRetrying ? 'Retrying Connection...' : 'Retry Connection'}</span>
                </button>
              )}
              <Link
                to="/about"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-2xs"
              >
                <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
                <span>Guide</span>
              </Link>
            </div>
          </div>

          <p className="text-xs text-red-800 leading-relaxed font-mono">
            {message}
          </p>

          {showCorsHint && (
            <div className="pt-2 border-t border-red-200 text-xs text-red-800 space-y-1">
              <p className="font-semibold text-[11px] uppercase tracking-wider text-red-900">
                Troubleshooting Checklist:
              </p>
              <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                <li>Verify Spring Boot backend is active on port 8080 (<code className="font-mono text-red-900 bg-red-100 px-1 rounded">./mvnw spring-boot:run</code>).</li>
                <li>Ensure <code className="font-mono text-red-900 bg-red-100 px-1 rounded">@CrossOrigin(origins = "http://localhost:5173")</code> is enabled on the controller.</li>
                <li>Verify the endpoint <code className="font-mono text-red-900 bg-red-100 px-1 rounded">GET /incidents</code> returns HTTP 200 JSON.</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorAlert;

