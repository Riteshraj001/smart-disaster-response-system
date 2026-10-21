import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CheckCircle2, MapPin, Radio, Square, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import trackingService from '../../services/trackingService';
import ErrorAlert from '../../components/common/ErrorAlert';

const UPDATE_INTERVAL_MS = Number(import.meta.env.VITE_RESPONDER_LOCATION_INTERVAL_MS) || 10000;
const MIN_MOVEMENT_METERS = 10;

const distanceMeters = (first, second) => {
  if (!first || !second) return Infinity;
  const earthRadius = 6371000;
  const lat1 = first.latitude * Math.PI / 180;
  const lat2 = second.latitude * Math.PI / 180;
  const dLat = (second.latitude - first.latitude) * Math.PI / 180;
  const dLon = (second.longitude - first.longitude) * Math.PI / 180;
  const value = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
};

const ResponderLocationPage = () => {
  const { session } = useAuth();
  const trackingToken = session?.trackingToken;
  const watchIdRef = useRef(null);
  const lastSentRef = useRef(null);
  const [consent, setConsent] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [locationStatus, setLocationStatus] = useState('UNAVAILABLE');
  const [lastLocation, setLastLocation] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [offers, setOffers] = useState([]);
  const [identity, setIdentity] = useState(null);
  const [offerAction, setOfferAction] = useState(null);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState(null);

  const stopLocalTracking = useCallback(() => {
    if (watchIdRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }
    watchIdRef.current = null;
    setIsTracking(false);
  }, []);

  const loadAssignments = useCallback(async () => {
    if (!trackingToken) {
      setIdentity(null);
      setAssignments([]);
      setOffers([]);
      return;
    }
    try {
      const [nextIdentity, nextAssignments, nextOffers, latest] = await Promise.all([
        trackingService.getResponderIdentity(trackingToken),
        trackingService.getResponderAssignments(trackingToken),
        trackingService.getResponderOffers(trackingToken),
        trackingService.getResponderLocation(trackingToken),
      ]);
      setIdentity(nextIdentity);
      setAssignments(nextAssignments);
      setOffers(nextOffers);
      if (!nextAssignments.length || !latest?.incidentId) stopLocalTracking();
      setLastLocation(latest?.locationTimestamp ? latest : null);
      setLocationStatus(latest?.status || (nextAssignments.length ? 'UNAVAILABLE' : 'OFFLINE'));
      setError(null);
    } catch (err) {
      setError(err.message || 'Unable to load authorized responder tracking state.');
    }
  }, [stopLocalTracking, trackingToken]);

  const decideOffer = async (offerId, action) => {
    setOfferAction(`${action}:${offerId}`);
    try {
      if (action === 'accept') await trackingService.acceptResponderOffer(trackingToken, offerId);
      else await trackingService.declineResponderOffer(trackingToken, offerId);
      await loadAssignments();
      setError(null);
    } catch (err) {
      setError(err.message || 'The dispatch offer could not be updated.');
    } finally {
      setOfferAction(null);
    }
  };

  useEffect(() => {
    loadAssignments();
    const interval = setInterval(loadAssignments, 15000);
    return () => {
      clearInterval(interval);
      stopLocalTracking();
    };
  }, [loadAssignments, stopLocalTracking]);

  const sendPosition = useCallback(async (position) => {
    const current = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };
    const now = Date.now();
    const previous = lastSentRef.current;
    if (previous && now - previous.sentAt < UPDATE_INTERVAL_MS && distanceMeters(previous, current) < MIN_MOVEMENT_METERS) return;

    try {
      const response = await trackingService.submitResponderLocation(trackingToken, {
        ...current,
        accuracy: Number.isFinite(position.coords.accuracy) ? position.coords.accuracy : null,
        timestamp: new Date(position.timestamp || now).toISOString(),
      });
      lastSentRef.current = { ...current, sentAt: now };
      setLastLocation(response);
      setLocationStatus(response.status || 'ONLINE');
      setError(null);
    } catch (err) {
      setError(err.message || 'The GPS update could not be sent. Tracking will retry on the next permitted update.');
      setLocationStatus('OFFLINE');
      stopLocalTracking();
    }
  }, [stopLocalTracking, trackingToken]);

  const startTracking = async () => {
    if (!consent) {
      setError('Confirm that you consent to share this device location before starting tracking.');
      return;
    }
    if (!trackingToken) {
      setError('No responder tracking token is present. Sign in with the token provisioned by the system administrator.');
      return;
    }
    if (!navigator.geolocation) {
      setError('This browser does not support GPS location.');
      return;
    }
    setError(null);
    setIsStarting(true);
    try {
      const assignmentState = await trackingService.getResponderLocation(trackingToken);
      if (!assignmentState?.incidentId) {
        setLocationStatus('OFFLINE');
        throw new Error('GPS tracking cannot start because this responder has no active incident assignment. Accept a dispatch offer first.');
      }
      setLocationStatus('UNAVAILABLE');
      setIsTracking(true);
      watchIdRef.current = navigator.geolocation.watchPosition(
        sendPosition,
        (geolocationError) => {
          stopLocalTracking();
          setLocationStatus('UNAVAILABLE');
          setError(geolocationError.code === geolocationError.PERMISSION_DENIED
            ? 'Location permission was denied. Allow GPS access and start tracking again.'
            : geolocationError.code === geolocationError.TIMEOUT
              ? 'The browser did not receive a GPS fix in time. Check device location services and try again.'
              : 'The browser could not obtain a GPS fix. Check device location services and try again.');
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
      );
    } catch (err) {
      stopLocalTracking();
      setError(err.message || 'The backend could not confirm an active assignment.');
    } finally {
      setIsStarting(false);
    }
  };

  const stopTracking = async () => {
    stopLocalTracking();
    setLocationStatus('OFFLINE');
    if (trackingToken) {
      try {
        await trackingService.stopResponderTracking(trackingToken);
      } catch (err) {
        setError(err.message || 'The server could not mark tracking offline.');
      }
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5 font-sans">
      <div>
        <h1 className="text-xl font-bold text-[#172033]">Responder GPS Tracking</h1>
        <p className="mt-1 text-xs text-[#64748B]">Share this device location only while you are authorized and assigned to an active incident.</p>
        {identity && <p className="mt-2 text-xs text-[#2563EB]">Backend identity: <strong>{identity.memberName}</strong> · {identity.teamName} · responder #{identity.memberId}</p>}
      </div>

      {error && <ErrorAlert title="GPS tracking notice" message={error} showCorsHint={false} />}

      <section className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-xs sm:p-6">
        <div className="flex items-start gap-3">
          <div className={`rounded-full p-2 ${isTracking ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}><Radio className="h-5 w-5" /></div>
          <div>
            <h2 className="text-sm font-bold text-[#172033]">Consent and device permission</h2>
            <p className="mt-1 text-xs leading-relaxed text-[#64748B]">Starting tracking asks the browser for precise location permission. Updates are sent to the backend only while this control is active and only the server-configured responder identity may submit them.</p>
          </div>
        </div>
        <label className="mt-5 flex items-start gap-2 text-xs text-[#172033]">
          <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} disabled={isTracking} className="mt-0.5" />
          <span>I consent to share this phone's GPS location for my authorized active response assignment.</span>
        </label>
        <div className="mt-5 flex flex-wrap gap-2">
          {!isTracking ? (
            <button type="button" onClick={startTracking} disabled={isStarting} className="inline-flex items-center gap-2 rounded bg-[#059669] px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:cursor-wait disabled:opacity-60"><MapPin className="h-4 w-4" />{isStarting ? 'Checking assignment…' : 'Start GPS tracking'}</button>
          ) : (
            <button type="button" onClick={stopTracking} className="inline-flex items-center gap-2 rounded bg-[#DC2626] px-4 py-2 text-xs font-semibold text-white hover:bg-red-700"><Square className="h-3.5 w-3.5" />Stop GPS tracking</button>
          )}
          <span className={`inline-flex items-center gap-1.5 rounded border px-3 py-2 text-xs font-semibold ${locationStatus === 'ONLINE' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-600'}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{locationStatus}</span>
        </div>
      </section>

      <section className="rounded-xl border border-amber-200 bg-amber-50/60 p-5 shadow-xs sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-[#172033]">Dispatch offers</h2>
            <p className="mt-1 text-xs leading-relaxed text-[#64748B]">Offers are addressed to this authenticated responder. Accepting one creates the active assignment that unlocks GPS updates; an offer is not an assignment until accepted.</p>
          </div>
          <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-amber-800">{offers.length} pending</span>
        </div>
        <div className="mt-4 space-y-3">
          {offers.length ? offers.map((offer) => (
            <div key={offer.id} className="rounded-lg border border-amber-200 bg-white p-3.5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-xs text-[#172033]">
                  <p className="font-bold">Incident #{offer.incidentId} · {offer.disasterType}</p>
                  <p className="mt-1 text-[#64748B]">{offer.location} · {offer.severity}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-[#64748B]">
                    <span>{offer.teamName}</span>
                    {offer.candidateRank && (
                      <span className="rounded bg-blue-50 px-1.5 py-0.5 font-medium text-blue-700">Rank #{offer.candidateRank}</span>
                    )}
                    {offer.distanceMeters !== null && offer.distanceMeters !== undefined && (
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 font-medium text-slate-700">{(offer.distanceMeters / 1000).toFixed(1)} km road distance</span>
                    )}
                    {offer.estimatedTravelSeconds ? (
                      <span className="rounded bg-emerald-50 px-1.5 py-0.5 font-semibold text-emerald-700">~{Math.max(1, Math.ceil(offer.estimatedTravelSeconds / 60))} min travel ETA</span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-[11px] text-[#64748B]">Expires {offer.expiresAt ? new Date(offer.expiresAt).toLocaleTimeString() : 'soon'}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button type="button" onClick={() => decideOffer(offer.id, 'decline')} disabled={Boolean(offerAction)} className="rounded border border-red-200 bg-white px-3 py-2 text-[11px] font-semibold text-red-700 disabled:opacity-50">{offerAction === `decline:${offer.id}` ? 'Declining…' : 'Decline'}</button>
                  <button type="button" onClick={() => decideOffer(offer.id, 'accept')} disabled={Boolean(offerAction)} className="rounded bg-[#2563EB] px-3 py-2 text-[11px] font-semibold text-white disabled:opacity-50">{offerAction === `accept:${offer.id}` ? 'Accepting…' : 'Accept offer'}</button>
                </div>
              </div>
            </div>
          )) : <p className="rounded border border-amber-200 bg-white/70 p-3 text-xs text-[#64748B]">No pending offers. The backend will show a new offer here when this responder is selected for a verified incident.</p>}
        </div>
      </section>

      <div className="grid gap-5 sm:grid-cols-2">
        <section className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-xs">
          <h2 className="flex items-center gap-2 text-sm font-bold text-[#172033]"><CheckCircle2 className="h-4 w-4 text-[#059669]" />Last accepted update</h2>
          {lastLocation?.locationTimestamp ? <div className="mt-4 space-y-1 text-xs text-[#64748B]"><p className="font-semibold text-[#172033]">{new Date(lastLocation.locationTimestamp).toLocaleString()}</p><p>Accuracy: {lastLocation.accuracy ? `${Math.round(lastLocation.accuracy)} m` : 'Not supplied'}</p><p>Coordinates are retained only as the latest location.</p></div> : <p className="mt-4 text-xs text-[#64748B]">No location update has been accepted yet.</p>}
        </section>
        <section className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-xs">
          <h2 className="flex items-center gap-2 text-sm font-bold text-[#172033]"><Users className="h-4 w-4 text-[#2563EB]" />Authorized active assignments</h2>
          {assignments.length ? <ul className="mt-4 space-y-2 text-xs text-[#172033]">{assignments.map((incident) => <li key={incident.id} className="rounded border border-[#E2E8F0] bg-slate-50 p-2.5"><strong>Incident #{incident.id}</strong><span className="ml-2 text-[#64748B]">{incident.disasterType} · {incident.status}</span></li>)}</ul> : <p className="mt-4 text-xs text-[#64748B]">No active assignment is authorized for this responder token.</p>}
        </section>
      </div>
    </div>
  );
};

export default ResponderLocationPage;
