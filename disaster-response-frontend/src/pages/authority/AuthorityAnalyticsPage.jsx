import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  MapPin,
  CheckCircle2,
  RefreshCw,
  Clock,
  Flame,
} from 'lucide-react';
import incidentService from '../../services/incidentService';
import StatCard from '../../components/common/StatCard';
import DisasterTypeChart from '../../components/dashboard/DisasterTypeChart';
import StatusBreakdownChart from '../../components/dashboard/StatusBreakdownChart';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import EmptyState from '../../components/common/EmptyState';

const AuthorityAnalyticsPage = () => {
  const [incidents, setIncidents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRetrying, setIsRetrying] = useState(false);

  const fetchIncidents = useCallback(async () => {
    try {
      setError(null);
      const data = await incidentService.getIncidents();
      setIncidents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching analytics metrics:', err);
      setError(err.message || 'Unable to connect to incident metrics server.');
    } finally {
      setIsLoading(false);
      setIsRetrying(false);
    }
  }, []);

  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  const total = incidents.length;
  const activeCount = incidents.filter(
    (i) => {
      const s = (i.status || '').trim().toUpperCase();
      return s === 'RESPONSE_DISPATCHED' || s === 'VERIFIED' || s === 'ACTIVE';
    }
  ).length;
  const pendingCount = incidents.filter(
    (i) => {
      const s = (i.status || '').trim().toUpperCase();
      return s === 'PENDING_VERIFICATION' || s === 'PENDING';
    }
  ).length;
  const resolvedCount = incidents.filter(
    (i) => {
      const s = (i.status || '').trim().toUpperCase();
      return s === 'RESOLVED';
    }
  ).length;

  const resolutionRate = total > 0 ? Math.round((resolvedCount / total) * 100) : 0;
  const activeLoadRate = total > 0 ? Math.round((activeCount / total) * 100) : 0;

  // Regional hotspot density
  const locationCounts = incidents.reduce((acc, curr) => {
    const loc = (curr.location || 'Unknown').trim();
    acc[loc] = (acc[loc] || 0) + 1;
    return acc;
  }, {});

  const topLocations = Object.entries(locationCounts)
    .map(([loc, count]) => ({
      location: loc,
      count,
      pct: total > 0 ? Math.round((count / total) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E5E7EB]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#111827]">
            Analytics &amp; Statistics
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
            Statistical breakdown of reported disasters, resolution metrics, and location hotspots.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsRetrying(true);
            fetchIncidents();
          }}
          disabled={isLoading || isRetrying}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#E5E7EB] bg-white hover:bg-slate-50 text-xs font-semibold text-[#111827] transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
          <span>{isRetrying ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      {error && (
        <ErrorAlert
          title="Data Error"
          message={error}
          onRetry={fetchIncidents}
          isRetrying={isRetrying}
        />
      )}

      {isLoading ? (
        <LoadingSpinner message="Calculating analytics metrics..." />
      ) : total === 0 ? (
        <EmptyState
          title="No Incident Data Available"
          description="There are currently no incidents recorded in the database to generate analytical charts."
          actionText="Create an Incident"
          onAction={() => window.location.assign('/authority/incidents/create')}
        />
      ) : (
        <>
          {/* Key Gauges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Incidents"
              value={total}
              variant="default"
              subtitle="All recorded incidents"
            />
            <StatCard
              title="Resolution Rate"
              value={`${resolutionRate}%`}
              icon={CheckCircle2}
              variant="resolved"
              subtitle={`${resolvedCount} of ${total} resolved`}
            />
            <StatCard
              title="Active Cases"
              value={activeCount}
              icon={Flame}
              variant="active"
              subtitle={`${activeLoadRate}% of total load`}
            />
            <StatCard
              title="Pending Review"
              value={pendingCount}
              icon={Clock}
              variant="pending"
              subtitle="Awaiting triage action"
            />
          </div>

          {/* Visualizations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DisasterTypeChart incidents={incidents} />
            <StatusBreakdownChart incidents={incidents} />
          </div>

          {/* Regional Hotspots */}
          <div className="bg-white border border-[#E5E7EB] rounded-lg p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <div>
                <h3 className="text-sm font-bold text-[#111827]">
                  Incident Locations Breakdown
                </h3>
                <p className="text-xs text-[#64748B]">
                  Locations with the highest frequency of emergency incidents
                </p>
              </div>
              <span className="text-xs text-[#64748B]">
                {topLocations.length} locations tracked
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {topLocations.map((item, idx) => (
                <Link
                  key={item.location}
                  to={`/authority/incidents?q=${encodeURIComponent(item.location)}`}
                  className="p-3.5 rounded-md border border-[#E5E7EB] bg-[#F5F7FA] hover:bg-slate-100 hover:border-slate-300 transition-colors block"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-[#64748B]">Rank #{idx + 1}</span>
                    <span className="text-xs font-semibold text-[#1D4ED8] px-2 py-0.5 rounded bg-blue-50">
                      {item.count} {item.count === 1 ? 'incident' : 'incidents'}
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-[#111827] truncate">
                    {item.location}
                  </div>
                  <div className="mt-2.5 w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-[#1D4ED8] h-full rounded-full"
                      style={{ width: `${item.pct}%` }}
                    />
                  </div>
                  <div className="mt-1 flex justify-between text-[11px] text-[#64748B]">
                    <span>Share</span>
                    <span>{item.pct}%</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AuthorityAnalyticsPage;

