import React from 'react';
import { Search, X, RefreshCw } from 'lucide-react';
import { DISASTER_TYPES, INCIDENT_STATUSES } from '../../constants/incidentConstants';

const IncidentFilter = ({
  searchTerm,
  onSearchChange,
  selectedType,
  onTypeChange,
  selectedStatus,
  onStatusChange,
  onReset,
  totalCount = 0,
  filteredCount = 0,
}) => {
  const isFiltered =
    Boolean(searchTerm) ||
    selectedType !== 'All' ||
    selectedStatus !== 'All';

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by disaster type, location (e.g., Delhi, Flood)..."
            className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-9 py-2 text-xs sm:text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-700"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Disaster Type Filter */}
          <div className="flex items-center gap-1.5">
            <label htmlFor="filter-disaster-type" className="text-xs font-medium text-slate-500 whitespace-nowrap">
              Type:
            </label>
            <select
              id="filter-disaster-type"
              value={selectedType}
              onChange={(e) => onTypeChange(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs sm:text-sm text-slate-800 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 cursor-pointer"
            >
              <option value="All">All Types</option>
              {DISASTER_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <label htmlFor="filter-status" className="text-xs font-medium text-slate-500 whitespace-nowrap">
              Status:
            </label>
            <select
              id="filter-status"
              value={selectedStatus}
              onChange={(e) => onStatusChange(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs sm:text-sm text-slate-800 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 cursor-pointer"
            >
              <option value="All">All Statuses</option>
              {INCIDENT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          {/* Clear Filters Button */}
          {isFiltered && (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors shadow-2xs"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Counter bar */}
      <div className="flex items-center justify-between pt-2 text-xs text-slate-500 border-t border-slate-100">
        <div>
          Showing <strong className="text-slate-900">{filteredCount}</strong> of{' '}
          <strong className="text-slate-900">{totalCount}</strong> incidents
        </div>
        {isFiltered && (
          <span className="text-blue-700 text-xs font-medium">
            Active Filter Applied
          </span>
        )}
      </div>
    </div>
  );
};

export default IncidentFilter;

