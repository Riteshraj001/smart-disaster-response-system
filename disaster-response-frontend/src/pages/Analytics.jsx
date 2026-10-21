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
import incidentService from '../services/incidentService';
import StatCard from '../components/common/StatCard';
import DisasterTypeChart from '../components/dashboard/DisasterTypeChart';
import StatusBreakdownChart from '../components/dashboard/StatusBreakdownChart';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorAlert from '../components/common/ErrorAlert';

const Analytics = () => {
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
      console.error('Error fetching analytics data:', err);
      setError(err.message || 'Unable to load analytics data.');
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
    (i) => (i.status || '').trim().toLowerCase() === 'active'
  ).length;

  const pendingCount = incidents.filter(
    (i) => (i.status || '').trim().toLowerCase() === 'pending'
  ).length;

  const resolvedCount = incidents.filter(
    (i) => (i.status || '').trim().toLowerCase() === 'resolved'
  ).length;

  const resolutionRate = total > 0 ? Math.round((resolvedCount / total) * 100) : 0;
  const activeLoadRate = total > 0 ? Math.round((activeCount / total) * 100) : 0;

  // Location density aggregation
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/20">
              <BarChart3 className="h-3.5 w-3.5" />
              <span>DYNAMIC ANALYTICS ENGINE</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
            Disaster Response Analytics
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Aggregated operational performance, geographical density, and containment rates.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsRetrying(true);
            fetchIncidents();
          }}
          disabled={isLoading || isRetrying}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-xs sm:text-sm font-medium text-slate-300 hover:text-white transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
          <span>{isRetrying ? 'Refreshing...' : 'Refresh Metrics'}</span>
        </button>
      </div>

      {error && (
        <ErrorAlert
          title="Failed to Load Analytics"
          message={error}
          onRetry={fetchIncidents}
          isRetrying={isRetrying}
        />
      )}

      {isLoading ? (
        <LoadingSpinner message="Aggregating disaster data from backend..." />
      ) : (
        <>
          {/* Key Metric Gauges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <StatCard
              title="Total Recorded"
              value={total}
              variant="default"
              subtitle="All registered database records"
            />
            <StatCard
              title="Resolution Rate"
              value={`${resolutionRate}%`}
              icon={CheckCircle2}
              variant="resolved"
              subtitle={`${resolvedCount} of ${total} resolved`}
              badgeText="CONTAINMENT"
            />
            <StatCard
              title="Active Load"
              value={`${activeLoadRate}%`}
              icon={Flame}
              variant="active"
              subtitle={`${activeCount} in critical response`}
              badgeText="PRESSURE"
            />
            <StatCard
              title="Triage Queue"
              value={pendingCount}
              icon={Clock}
              variant="pending"
              subtitle="Awaiting field assignment"
              badgeText="QUEUE"
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DisasterTypeChart incidents={incidents} />
            <StatusBreakdownChart incidents={incidents} />
          </div>

          {/* Regional Geographic Distribution Table */}
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6 backdrop-blur-xl shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-orange-400" />
                  <span>Regional Incident Hotspots</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Locations with the highest concentration of reported emergencies
                </p>
              </div>
              <span className="text-xs font-mono text-slate-400">
                {topLocations.length} Regions Mapped
              </span>
            </div>

            {topLocations.length === 0 ? (
              <p className="text-sm text-slate-500 py-4 text-center">
                No location data available in backend.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                {topLocations.map((item, idx) => (
                  <Link
                    key={item.location}
                    to={`/incidents?q=${encodeURIComponent(item.location)}`}
                    className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 hover:border-orange-500/40 hover:bg-slate-900 transition-all group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono text-slate-400">
                        Rank #{idx + 1}
                      </span>
                      <span className="text-xs font-mono font-bold text-orange-400 px-2 py-0.5 rounded bg-orange-500/10 border border-orange-500/20">
                        {item.count} {item.count === 1 ? 'incident' : 'incidents'}
                      </span>
                    </div>
                    <div className="text-base font-bold text-white group-hover:text-orange-400 transition-colors">
                      {item.location}
                    </div>
                    {/* Progress Bar */}
                    <div className="mt-3 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-orange-500 h-full rounded-full"
                        style={{ width: `${item.pct}%` }}
                      />
                    </div>
                    <div className="mt-1.5 flex justify-between text-[11px] font-mono text-slate-500">
                      <span>Share of total</span>
                      <span>{item.pct}%</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Analytics;
