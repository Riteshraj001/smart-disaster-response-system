import React from 'react';
import { Link } from 'react-router-dom';
import { AlertOctagon, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-5 text-[#111827]">
      <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-red-50 border border-red-200 text-[#DC2626]">
        <AlertOctagon className="w-7 h-7" />
      </div>

      <div className="space-y-2">
        <p className="text-sm font-semibold text-[#64748B]">Error 404</p>
        <h1 className="text-2xl font-bold tracking-tight">Page not found</h1>
        <p className="text-sm text-[#64748B] max-w-md mx-auto">
          The page you requested is unavailable or may have moved.
        </p>
      </div>

      <Link
        to="/"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#1D4ED8] hover:bg-blue-800 text-sm font-semibold text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to home</span>
      </Link>
    </div>
  );
};

export default NotFound;
