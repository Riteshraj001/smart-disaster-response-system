import React from 'react';
import { Link } from 'react-router-dom';
import { Eye, Edit3, Trash2, MapPin } from 'lucide-react';
import DisasterIcon from '../common/DisasterIcon';
import StatusBadge from '../common/StatusBadge';
import SeverityBadge from '../common/SeverityBadge';
import SourceBadge from '../common/SourceBadge';
import EmptyState from '../common/EmptyState';

const IncidentTable = ({
  incidents = [],
  onDeleteClick,
  emptyMessage = 'No incidents found matching your query.',
  onResetFilters,
}) => {
  if (!incidents || incidents.length === 0) {
    return (
      <EmptyState
        title="No Incidents Found"
        description={emptyMessage}
        onReset={onResetFilters}
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-700">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              <th scope="col" className="py-3.5 px-4 font-semibold">
                ID
              </th>
              <th scope="col" className="py-3.5 px-4 font-semibold">
                Disaster Type
              </th>
              <th scope="col" className="py-3.5 px-4 font-semibold">
                Location
              </th>
              <th scope="col" className="py-3.5 px-4 font-semibold">
                Source
              </th>
              <th scope="col" className="py-3.5 px-4 font-semibold">
                Severity
              </th>
              <th scope="col" className="py-3.5 px-4 font-semibold">
                Status
              </th>
              <th scope="col" className="py-3.5 px-4 text-right font-semibold">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {incidents.map((incident) => (
              <tr
                key={incident.id}
                className="group hover:bg-slate-50/80 transition-colors"
              >
                {/* ID Column */}
                <td className="py-3.5 px-4 font-bold text-slate-900">
                  #{incident.id}
                </td>

                {/* Disaster Type */}
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-2.5">
                    <DisasterIcon
                      type={incident.disasterType}
                      showContainer
                      size="sm"
                    />
                    <span className="font-semibold text-slate-900">
                      {incident.disasterType}
                    </span>
                  </div>
                </td>

                {/* Location */}
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-1.5 text-slate-700 max-w-[220px] truncate" title={incident.location}>
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{incident.location}</span>
                  </div>
                </td>

                {/* Source Column */}
                <td className="py-3.5 px-4">
                  <SourceBadge source={incident.source || 'MANUAL'} size="sm" />
                </td>

                {/* Severity Column */}
                <td className="py-3.5 px-4">
                  <SeverityBadge severity={incident.severity || 'Medium'} size="sm" />
                </td>

                {/* Status Badge */}
                <td className="py-3.5 px-4">
                  <StatusBadge status={incident.status} size="sm" />
                </td>

                {/* Actions */}
                <td className="py-3.5 px-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {/* View Button */}
                    <Link
                      to={`/incidents/${incident.id}`}
                      className="p-1.5 rounded-md text-slate-600 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                      title="View Details"
                      aria-label={`View details for incident ${incident.id}`}
                    >
                      <Eye className="w-4 h-4" />
                    </Link>

                    {/* Edit Button */}
                    <Link
                      to={`/incidents/${incident.id}/edit`}
                      className="p-1.5 rounded-md text-slate-600 hover:text-amber-700 hover:bg-amber-50 transition-colors"
                      title="Edit Incident"
                      aria-label={`Edit incident ${incident.id}`}
                    >
                      <Edit3 className="w-4 h-4" />
                    </Link>

                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={() => onDeleteClick(incident)}
                      className="p-1.5 rounded-md text-slate-400 hover:text-red-700 hover:bg-red-50 transition-colors"
                      title="Delete Incident"
                      aria-label={`Delete incident ${incident.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List View */}
      <div className="md:hidden divide-y divide-slate-200">
        {incidents.map((incident) => (
          <div
            key={incident.id}
            className="p-4 space-y-2.5 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  #{incident.id}
                </span>
                <span className="font-bold text-slate-900 text-sm">
                  {incident.disasterType}
                </span>
              </div>
              <StatusBadge status={incident.status} size="sm" />
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-600">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{incident.location}</span>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <SourceBadge source={incident.source || 'MANUAL'} size="sm" />
              <SeverityBadge severity={incident.severity || 'Medium'} size="sm" />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Link
                to={`/incidents/${incident.id}`}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-slate-100 text-xs font-semibold text-slate-700 hover:bg-slate-200"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>View</span>
              </Link>
              <Link
                to={`/incidents/${incident.id}/edit`}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </Link>
              <button
                type="button"
                onClick={() => onDeleteClick(incident)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-red-50 text-xs font-semibold text-red-700 hover:bg-red-100"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default IncidentTable;

