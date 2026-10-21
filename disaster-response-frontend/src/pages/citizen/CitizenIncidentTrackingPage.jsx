import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  MapPin,
  Navigation,
  Radio,
  RefreshCw,
  ShieldCheck,
  Truck,
  Users,
} from 'lucide-react';
import trackingService, { saveIncidentTrackingToken } from '../../services/trackingService';
import IncidentMap from '../../components/maps/IncidentMap';
import DisasterIcon from '../../components/common/DisasterIcon';
import ErrorAlert from '../../components/common/ErrorAlert';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import SeverityBadge from '../../components/common/SeverityBadge';
import StatusBadge from '../../components/common/StatusBadge';
import { STATUS_CONFIG } from '../../constants/incidentConstants';
import { fetchEmergencyRoute, formatDurationEta } from '../../utils/routing';
import { getIncidentCoordinates } from '../../utils/incidentCoordinates';

const TIMELINE_STEPS = [
  { status: 'PENDING_VERIFICATION', label: 'Report received', description: 'Your report is recorded and awaiting authority review.' },
  { status: 'VERIFIED', label: 'Incident verified', description: 'An authority has reviewed and verified the report.' },
  { status: 'ASSIGNED', label: 'Response team assigned', description: 'A response team has been assigned to this incident.' },
  { status: 'RESPONSE_DISPATCHED', label: 'Team dispatched', description: 'The assigned team has been dispatched.' },
  { status: 'RESPONDING', label: 'Team on scene', description: 'The team is on scene and actively handling the incident.' },
  { status: 'RESPONSE_COMPLETED', label: 'Response completed', description: 'On-site response operations have been completed.' },
  { status: 'RESOLVED', label: 'Incident resolved', description: 'The emergency has been safely resolved and closed.' },
];

const STATUS_ORDER = TIMELINE_STEPS.reduce((result, step, index) => {
  result[step.status] = index + 1;
  return result;
}, {});

const normalizeStatus = (status) => {
  const value = String(status || '').trim().toUpperCase();
  return {
    PENDING: 'PENDING_VERIFICATION',
    ACTIVE: 'RESPONSE_DISPATCHED',
    RESOLVED: 'RESOLVED',
  }[value] || value;
};

const formatTimestamp = (value, fallback = 'Not available') => {
  if (!value) return fallback;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', ' + date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const getAssignment = (incident) => incident?.currentAssignment || null;

const dispatchStateLabel = (state) => ({
  WAITING_FOR_VERIFICATION: 'Waiting for verification',
  WAITING_FOR_PRIORITY: 'Waiting for critical-priority dispatch',
  OFFERED: 'Responder offer pending',
  WAITING_FOR_RESPONDER: 'Waiting for responder acceptance',
  ACCEPTED: 'Responder accepted',
  ESCALATED: 'Dispatch escalated',
}[state] || state || 'Not available');

const getResponderCoordinates = (incident) => {
  const latitude = incident?.responderLocation?.latitude;
  const longitude = incident?.responderLocation?.longitude;
  if (latitude === null || latitude === undefined || longitude === null || longitude === undefined) return null;
  const lat = Number(latitude);
  const lon = Number(longitude);
  return Number.isFinite(lat) && Number.isFinite(lon) ? [lat, lon] : null;
};

const getResponderLocationUpdatedAt = (incident) => {
  return incident?.responderLocation?.locationTimestamp || null;
};

const distanceMeters = (first, second) => {
  if (!first || !second) return Infinity;
  const earthRadius = 6371000;
  const lat1 = first[0] * Math.PI / 180;
  const lat2 = second[0] * Math.PI / 180;
  const dLat = (second[0] - first[0]) * Math.PI / 180;
  const dLon = (second[1] - first[1]) * Math.PI / 180;
  const value = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
};

const ROUTE_REFRESH_DISTANCE_METERS = 50;
const ROUTE_RETRY_INTERVAL_MS = 30000;

const TrackingUnavailable = ({ title, children }) => (
  <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
    <div className="flex items-start gap-3">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
      <div>
        <h3 className="text-xs font-bold text-amber-900">{title}</h3>
        <p className="mt-1 text-xs leading-relaxed text-amber-800">{children}</p>
      </div>
    </div>
  </div>
);

const CitizenIncidentTrackingPage = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const trackingTokenFromUrl = searchParams.get('trackingToken');
  const [incident, setIncident] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const [routeData, setRouteData] = useState(null);
  const [routeStatus, setRouteStatus] = useState('unavailable');
  const routeRequestRef = useRef(null);

  const fetchIncident = useCallback(async ({ silent = false } = {}) => {
    if (silent) setIsRefreshing(true);
    else setIsLoading(true);
    try {
      const data = await trackingService.getCitizenIncidentTracking(id, trackingTokenFromUrl);
      if (data.source && data.source !== 'CITIZEN') {
        throw new Error('This report is not available in the citizen tracking portal.');
      }
      setIncident(data);
      setError(null);
      setLastSyncedAt(new Date());
    } catch (err) {
      setError(err.message || 'Unable to load this incident from the emergency backend.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [id, trackingTokenFromUrl]);

  useEffect(() => {
    if (trackingTokenFromUrl) saveIncidentTrackingToken(id, trackingTokenFromUrl);
  }, [id, trackingTokenFromUrl]);

  useEffect(() => {
    fetchIncident();
    // Fast polling (6s) for Uber/Rapido real-time tracking updates until resolved
    const interval = window.setInterval(() => {
      fetchIncident({ silent: true });
    }, 6000);
    return () => window.clearInterval(interval);
  }, [fetchIncident]);

  const currentStatus = normalizeStatus(incident?.status);
  const currentStep = STATUS_ORDER[currentStatus] || 0;
  const statusConfig = STATUS_CONFIG[currentStatus] || STATUS_CONFIG.PENDING_VERIFICATION;
  const assignment = getAssignment(incident);
  const assignedTeam = assignment?.teamName || incident?.assignedTeam || null;
  const assignedMember = assignment?.memberName || null;
  const dispatchState = incident?.dispatchState;
  const responderCoordinates = useMemo(
    () => getResponderCoordinates(incident),
    [incident?.responderLocation?.latitude, incident?.responderLocation?.longitude]
  );
  const responderLocationUpdatedAt = getResponderLocationUpdatedAt(incident);
  const responderLocation = incident?.responderLocation;
  const incidentCoordinates = useMemo(
    () => getIncidentCoordinates(incident),
    [incident?.latitude, incident?.longitude, incident?.location]
  );
  const isRejected = currentStatus === 'REJECTED';
  const isResolved = currentStatus === 'RESOLVED';

  useEffect(() => {
    const origin = responderCoordinates;
    const destination = incidentCoordinates;
    const responderStatus = responderLocation?.status;

    if (isResolved || !origin || !destination || responderStatus !== 'ONLINE') {
      routeRequestRef.current?.controller?.abort();
      routeRequestRef.current = null;
      setRouteData(null);
      setRouteStatus(isResolved ? 'resolved' : responderStatus === 'STALE' || responderStatus === 'OFFLINE' ? 'stale' : 'unavailable');
      return undefined;
    }

    const previous = routeRequestRef.current;
    const destinationChanged = !previous || distanceMeters(previous.destination, destination) > 1;
    const responderMoved = !previous || distanceMeters(previous.origin, origin) >= ROUTE_REFRESH_DISTANCE_METERS;
    const retryDue = previous?.status === 'unavailable'
      && Date.now() - previous.requestedAt >= ROUTE_RETRY_INTERVAL_MS;
    if (previous && !destinationChanged && !responderMoved && !retryDue) return undefined;

    const controller = new AbortController();
    routeRequestRef.current = { origin, destination, requestedAt: Date.now(), status: 'loading', controller };
    setRouteStatus('loading');
    fetchEmergencyRoute(origin, destination, { signal: controller.signal }).then((route) => {
      if (controller.signal.aborted) return;
      routeRequestRef.current = { origin, destination, requestedAt: Date.now(), status: route ? 'ready' : 'unavailable' };
      setRouteData(route);
      setRouteStatus(route ? 'ready' : 'unavailable');
    });
    return () => controller.abort();
  }, [incidentCoordinates, isResolved, responderCoordinates, responderLocation?.status]);

  const travelSeconds = routeData?.durationSeconds || null;
  const distanceMetersValue = routeData?.distanceMeters || null;
  const eta = travelSeconds ? new Date(Date.now() + travelSeconds * 1000) : null;

  const responderLocationStatus = responderCoordinates
    ? responderLocation?.status === 'ONLINE' ? 'live' : responderLocation?.status === 'OFFLINE' ? 'offline' : 'stale'
    : (assignedTeam || dispatchState === 'ACCEPTED')
      ? 'waiting-gps'
      : dispatchState === 'OFFERED'
        ? 'waiting-acceptance'
        : dispatchState === 'ESCALATED'
          ? 'escalated'
          : 'not-assigned';

  if (isLoading) {
    return <LoadingSpinner message={`Connecting to tracking channel for incident #${id}...`} />;
  }

  if (!incident) {
    return (
      <div className="mx-auto max-w-4xl space-y-5">
        <Link to="/citizen/reports" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#64748B] hover:text-[#172033]">
          <ArrowLeft className="h-4 w-4" />
          Back to My Reports
        </Link>
        <ErrorAlert title="Tracking record unavailable" message={error || 'This incident could not be retrieved.'} onRetry={fetchIncident} />
      </div>
    );
  }

  const isEnRoute = responderLocationStatus === 'live' || responderLocationStatus === 'stale';

  const mapMessage = responderLocationStatus === 'live'
    ? 'Live GPS broadcast received from authorized emergency responder.'
    : responderLocationStatus === 'stale'
      ? 'A previously received responder location is available, but the signal is currently stale.'
    : responderLocationStatus === 'offline'
      ? 'The responder is offline. The last accepted GPS fix is retained for context, but no live route is shown.'
    : responderLocationStatus === 'waiting-gps'
      ? 'Waiting for responder GPS location. Response unit assigned; awaiting broadcast.'
    : responderLocationStatus === 'waiting-acceptance'
      ? 'Dispatch offer has been sent to nearby emergency units; waiting for responder acceptance.'
      : responderLocationStatus === 'escalated'
        ? 'No responder has accepted yet; automatic priority escalation is active.'
    : 'A response team has not yet been assigned to this incident.';

  return (
    <div className="mx-auto max-w-6xl space-y-5 font-sans">
      {/* Top Navigation & Status Bar */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <Link to="/citizen/reports" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#64748B] hover:text-[#172033]">
          <ArrowLeft className="h-4 w-4" />
          Back to My Reports
        </Link>
        <div className="flex items-center gap-2">
          {lastSyncedAt && (
            <span className="text-[11px] text-[#64748B]">
              Updated {lastSyncedAt.toLocaleTimeString()}
            </span>
          )}
          <button
            type="button"
            onClick={() => fetchIncident({ silent: true })}
            disabled={isRefreshing}
            className="inline-flex items-center justify-center gap-1.5 rounded border border-[#E2E8F0] bg-white px-3 py-1.5 text-xs font-semibold text-[#172033] hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-[#2563EB]' : ''}`} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          Tracking connection notice: {error}
        </div>
      )}

      {/* Uber/Rapido-Style Live Tracking Hero Card */}
      {isEnRoute && !isResolved && (
        <section className="rounded-xl border border-blue-200 bg-gradient-to-r from-blue-900 to-indigo-900 p-5 text-white shadow-md sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                  {responderLocationStatus === 'live' ? 'Live GPS Active' : 'Signal Stale'}
                </span>
                <span className="text-xs text-blue-200">&bull; {incident.disasterType} Unit</span>
              </div>
              <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
                {currentStatus === 'RESPONDING'
                  ? 'Unit Arrived on Scene'
                  : travelSeconds ? `~${formatDurationEta(travelSeconds)} away` : 'Unit en route'}
              </h2>
              <p className="text-xs text-blue-100 flex items-center gap-1.5 pt-0.5">
                <Truck className="h-3.5 w-3.5 text-emerald-400" />
                <span><strong>{assignedMember || assignedTeam}</strong> travelling toward incident location</span>
                {distanceMetersValue && <span>&bull; {(distanceMetersValue / 1000).toFixed(1)} km road distance</span>}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 bg-white/10 p-3.5 rounded-lg backdrop-blur-xs border border-white/15">
              <div>
                <p className="text-[10px] uppercase font-bold text-blue-200 tracking-wider">Estimated Arrival</p>
                <p className="text-sm font-black text-white mt-0.5">
                  {eta ? new Date(eta).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Calculating...'}
                </p>
              </div>
              <div className="h-8 w-px bg-white/20 hidden sm:block" />
              <div>
                <p className="text-[10px] uppercase font-bold text-blue-200 tracking-wider">GPS Accuracy</p>
                <p className="text-sm font-semibold text-emerald-300 mt-0.5">
                  {responderLocation?.accuracy ? `&plusmn;${Math.round(responderLocation.accuracy)}m` : 'Verified'}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Waiting for GPS banner when responder has accepted but no GPS fix transmitted yet */}
      {responderLocationStatus === 'waiting-gps' && !isResolved && (
        <section className="rounded-xl border border-blue-200 bg-blue-50/70 p-4 text-[#172033] shadow-xs">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-blue-100 p-2 text-[#2563EB]">
              <Radio className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-blue-900">Waiting for responder GPS location</h2>
              <p className="mt-1 text-xs text-blue-800">
                {assignedMember || assignedTeam || 'Response team'} has accepted this emergency dispatch. The live road route and map position will appear as soon as the responder unit transmits its first GPS coordinates.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Incident Header Info Card */}
      <section className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white shadow-xs">
        <div className="flex flex-col justify-between gap-4 border-b border-[#E2E8F0] p-5 sm:flex-row sm:items-center sm:p-6">
          <div className="flex items-center gap-3">
            <DisasterIcon type={incident.disasterType} showContainer size="md" />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-[#172033]">Incident #{incident.id}</h1>
                <StatusBadge status={incident.status} size="sm" />
              </div>
              <p className="mt-1 text-xs text-[#64748B]">Live Emergency Response Status</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <SeverityBadge severity={incident.severity} size="sm" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4 sm:p-6">
          <div className="rounded-lg border border-[#E2E8F0] bg-slate-50/60 p-3.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Disaster Type</p>
            <p className="mt-1 text-sm font-semibold text-[#172033]">{incident.disasterType || 'Not recorded'}</p>
          </div>
          <div className="rounded-lg border border-[#E2E8F0] bg-slate-50/60 p-3.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Reported Location</p>
            <p className="mt-1 flex items-start gap-1 text-sm font-semibold text-[#172033]">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#2563EB]" />
              <span className="truncate">{incident.location || 'Not recorded'}</span>
            </p>
          </div>
          <div className="rounded-lg border border-[#E2E8F0] bg-slate-50/60 p-3.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Dispatch Status</p>
            <p className="mt-1 text-sm font-semibold text-[#172033]">{statusConfig.displayLabel || incident.status}</p>
            <p className="mt-0.5 text-[11px] text-[#2563EB] font-medium">{dispatchStateLabel(dispatchState)}</p>
          </div>
          <div className="rounded-lg border border-[#E2E8F0] bg-slate-50/60 p-3.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Reported At</p>
            <p className="mt-1 text-sm font-semibold text-[#172033]">{formatTimestamp(incident.reportedAt)}</p>
          </div>
        </div>
      </section>

      {/* Progress Timeline */}
      {!isRejected && (
        <section className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-xs sm:p-6">
          <div className="mb-5 flex items-start gap-3">
            <div className="rounded-full bg-blue-50 p-2 text-blue-700"><Radio className="h-4 w-4" /></div>
            <div>
              <h2 className="text-sm font-bold text-[#172033]">Emergency Response Milestones</h2>
              <p className="mt-1 text-xs text-[#64748B]">{statusConfig.description}</p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-7">
            {TIMELINE_STEPS.map((step, index) => {
              const stepNumber = index + 1;
              const complete = currentStep >= stepNumber;
              const active = currentStatus === step.status;
              return (
                <div key={step.status} className="relative flex gap-3 md:block md:text-center">
                  {index < TIMELINE_STEPS.length - 1 && (
                    <div className={`absolute left-[9px] top-5 h-[calc(100%+1rem)] w-px md:left-1/2 md:top-5 md:h-px md:w-full ${currentStep > stepNumber ? 'bg-blue-500' : 'bg-slate-200'}`} />
                  )}
                  <div className={`relative z-10 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 md:mx-auto ${complete ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 bg-white text-slate-400'}`}>
                    {complete ? <CheckCircle2 className="h-3.5 w-3.5" /> : <span className="text-[9px] font-bold">{stepNumber}</span>}
                  </div>
                  <div className="pb-3 md:pt-2">
                    <p className={`text-xs font-bold ${active ? 'text-blue-700' : complete ? 'text-[#172033]' : 'text-[#64748B]'}`}>{step.label}</p>
                    <p className="mt-0.5 text-[10px] leading-snug text-[#64748B]">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Main Interactive Map & Details Grid */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_0.8fr]">
        <section className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white shadow-xs min-w-0">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] p-5">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-bold text-[#172033]"><MapPin className="h-4 w-4 text-[#2563EB]" />Live Dispatch &amp; Route Map</h2>
              <p className="mt-1 text-xs text-[#64748B]">Showing real-time responder location, incident destination, and travel route.</p>
            </div>
            <Navigation className="h-4 w-4 text-[#64748B]" />
          </div>
          <IncidentMap
            incidents={[incident]}
            responderLocation={responderLocation}
            routeData={routeData}
            detailsBasePath="/citizen/track"
            heightClassName="h-[380px] sm:h-[440px]"
            emptyTitle="Incident location coordinates unavailable"
            emptyDescription="The backend returned no valid coordinates for this report."
          />
          <div className="border-t border-[#E2E8F0] p-4 bg-slate-50">
            <div className="flex items-start gap-2 text-xs text-[#64748B]">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
              <span>{mapMessage}</span>
            </div>
          </div>
        </section>

        {/* Sidebar Cards */}
        <div className="space-y-5 min-w-0">
          <section className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-xs">
            <h2 className="flex items-center gap-2 text-sm font-bold text-[#172033]"><Users className="h-4 w-4 text-[#2563EB]" />Assigned Response Unit</h2>
            <div className="mt-4 rounded-lg border border-[#E2E8F0] bg-slate-50/60 p-4">
              {assignedTeam ? (
                <>
                  <p className="text-base font-bold text-[#172033]">{assignedTeam}</p>
                  {assignment?.memberName && (
                    <p className="mt-1 text-xs text-[#2563EB] font-semibold">
                      Responder: {assignment.memberName}
                    </p>
                  )}
                  {assignment?.assignedAt && (
                    <p className="mt-3 flex items-center gap-1 text-[11px] text-[#64748B]">
                      <Clock3 className="h-3.5 w-3.5" />
                      Assigned {formatTimestamp(assignment.assignedAt)}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm font-semibold text-[#64748B]">
                  {dispatchState === 'OFFERED' ? 'Waiting for offered responder to accept dispatch.'
                    : dispatchState === 'ESCALATED' ? 'Dispatch escalation is active for this incident.'
                    : dispatchState === 'WAITING_FOR_PRIORITY' ? 'Waiting for priority dispatch capacity.'
                    : 'No response team assigned yet.'}
                </p>
              )}
            </div>
          </section>

          <section className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-xs">
            <h2 className="flex items-center gap-2 text-sm font-bold text-[#172033]"><Clock3 className="h-4 w-4 text-[#2563EB]" />Road-Based Arrival Time</h2>
            <div className="mt-4 rounded-lg border border-[#E2E8F0] bg-slate-50/60 p-4">
              {eta ? (
                <div>
                  <p className="text-lg font-bold text-[#172033]">
                    {formatTimestamp(eta)}
                  </p>
                  {travelSeconds && (
                    <p className="mt-1 text-xs font-semibold text-emerald-700">
                      Estimated travel time: {formatDurationEta(travelSeconds)}
                    </p>
                  )}
                  {distanceMetersValue && (
                    <p className="mt-0.5 text-xs text-[#64748B]">
                      Distance: {(distanceMetersValue / 1000).toFixed(1)} km
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm font-semibold text-[#64748B]">
                  {routeStatus === 'loading' ? 'Calculating road route…' : 'ETA unavailable'}
                </p>
              )}
              <p className="mt-2 text-[11px] leading-relaxed text-[#64748B]">
                {routeStatus === 'unavailable'
                  ? 'A route-based ETA will appear only after fresh GPS coordinates and a successful OSRM road route response.'
                  : routeStatus === 'stale'
                    ? 'A route-based ETA is paused until the responder provides a fresh GPS fix.'
                    : 'ETA uses the latest real GPS fix and OSRM road-route duration.'}
              </p>
            </div>
          </section>

          <section className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-xs">
            <h2 className="flex items-center gap-2 text-sm font-bold text-[#172033]"><Radio className="h-4 w-4 text-[#2563EB]" />Last Responder GPS Fix</h2>
            <p className="mt-3 text-sm font-semibold text-[#172033]">
              {responderLocationUpdatedAt
                ? formatTimestamp(responderLocationUpdatedAt)
                : (assignedTeam || dispatchState === 'ACCEPTED')
                  ? 'Waiting for responder GPS location'
                  : 'Awaiting first GPS fix'}
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-[#64748B]">
              Only genuine coordinates transmitted by the authorized responder are displayed.
            </p>
          </section>
        </div>
      </div>

      <div className="flex items-center gap-2 rounded border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900">
        <ShieldCheck className="h-4 w-4 shrink-0" />
        <span>For emergencies requiring immediate life-safety help, call your local emergency service (e.g., 112 / 911).</span>
      </div>
    </div>
  );
};

export default CitizenIncidentTrackingPage;
