import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { getIncidentCoordinates } from '../../utils/incidentCoordinates';
import { fetchEmergencyRoute, formatDurationEta } from '../../utils/routing';

// Ensure standard Leaflet default marker icons resolve correctly in Vite bundler environments
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

const severityColors = { CRITICAL: '#dc2626', HIGH: '#ea580c', MEDIUM: '#d97706', LOW: '#2563eb' };
const safe = (value) => String(value ?? '—').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
const dateText = (value) => value ? new Date(value).toLocaleString() : '—';
const normalizeBasePath = (path) => (path || '/authority/incidents').replace(/\/$/, '');

const IncidentMap = ({
  incidents = [],
  responderLocation = null,
  routeCoordinates = null,
  // `undefined` keeps the component's internal route lookup for existing map
  // callers; `null` explicitly means the parent owns routing and no route is
  // currently available.
  routeData,
  detailsBasePath = '/authority/incidents',
  heightClassName = 'h-[420px]',
  emptyTitle = 'No valid incident coordinates available',
  emptyDescription = 'The backend records in this view do not include valid latitude and longitude values, so no markers can be placed on the map.',
}) => {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const tileLayerRef = useRef(null);
  const resizeFrameRef = useRef(null);
  const [activeRoute, setActiveRoute] = useState(null);
  const [tileError, setTileError] = useState(false);

  const mapped = useMemo(() => incidents
    .map((incident) => ({ incident, coordinates: getIncidentCoordinates(incident) }))
    .filter(({ coordinates }) => coordinates), [incidents]);

  const responderCoordinates = useMemo(() => responderLocation?.latitude !== null && responderLocation?.latitude !== undefined
    && responderLocation?.longitude !== null && responderLocation?.longitude !== undefined
    ? [Number(responderLocation.latitude), Number(responderLocation.longitude)]
    : null, [responderLocation]);
  const hasResponderCoordinates = Boolean(responderCoordinates && responderCoordinates.every(Number.isFinite));

  // Fetch or calculate route when both responder and incident are present
  useEffect(() => {
    let isCancelled = false;
    if (routeData !== undefined) {
      setActiveRoute(routeData?.coordinates?.length >= 2 ? routeData : null);
      return () => { isCancelled = true; };
    }
    if (routeCoordinates && routeCoordinates.length >= 2) {
      setActiveRoute({ coordinates: routeCoordinates, isRoadRoute: true });
      return () => { isCancelled = true; };
    }
    if (hasResponderCoordinates && mapped.length > 0) {
      const targetCoords = mapped[0].coordinates;
      fetchEmergencyRoute(responderCoordinates, targetCoords).then((route) => {
        if (!isCancelled && route) {
          setActiveRoute(route);
        } else if (!isCancelled) {
          setActiveRoute(null);
        }
      });
    } else {
      setActiveRoute(null);
    }
    return () => { isCancelled = true; };
  }, [hasResponderCoordinates, responderCoordinates, mapped, routeCoordinates, routeData]);

  // Lifecycle Effect: Mount map instance, add base tileLayer, and attach ResizeObserver
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const map = L.map(container, {
      zoomControl: true,
      attributionControl: true,
      fadeAnimation: true,
      zoomAnimation: true,
    });
    mapRef.current = map;

    const tileLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      minZoom: 1,
      // OSM's public tile service requires a valid origin referrer. Make the
      // browser send the app origin even when a stricter page/browser policy is
      // active, while never exposing incident-page paths to the tile service.
      referrerPolicy: 'origin',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
    }).addTo(map);
    tileLayerRef.current = tileLayer;

    tileLayer.on('tileload', () => {
      setTileError(false);
    });

    tileLayer.on('tileerror', (error) => {
      console.warn('Map tile failed to load from tile.openstreetmap.org:', error?.coords);
      setTileError(true);
    });

    const layerGroup = L.layerGroup().addTo(map);
    layerRef.current = layerGroup;

    // Initial default center
    map.setView([20.5937, 78.9629], 5);

    // Invalidate map size safely after mount and layout passes
    const safeInvalidateSize = () => {
      if (mapRef.current && container.clientWidth > 0 && container.clientHeight > 0) {
        mapRef.current.invalidateSize({ debounceMoveend: true });
      }
    };

    const rafId = requestAnimationFrame(safeInvalidateSize);
    const timer100 = setTimeout(safeInvalidateSize, 100);
    const timer300 = setTimeout(safeInvalidateSize, 300);

    // Continuous responsive recalculation whenever container dimensions change
    let resizeObserver = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
            if (resizeFrameRef.current) {
              cancelAnimationFrame(resizeFrameRef.current);
            }
            resizeFrameRef.current = requestAnimationFrame(safeInvalidateSize);
          }
        }
      });
      resizeObserver.observe(container);
    }

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timer100);
      clearTimeout(timer300);
      if (resizeFrameRef.current) {
        cancelAnimationFrame(resizeFrameRef.current);
      }
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
      tileLayerRef.current = null;
    };
  }, []);

  // Data Layer Effect: Render incident markers, responder marker, route, and update bounds
  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;

    const basePath = normalizeBasePath(detailsBasePath);
    layer.clearLayers();

    if (!mapped.length && !hasResponderCoordinates) {
      map.setView([20.5937, 78.9629], 5);
      return;
    }

    const bounds = L.latLngBounds();

    // Draw route polyline if available
    if (activeRoute?.coordinates?.length >= 2) {
      L.polyline(activeRoute.coordinates, {
        color: '#2563EB',
        weight: 5,
        opacity: 0.85,
        lineJoin: 'round',
        dashArray: activeRoute.isRoadRoute ? null : '6, 8',
      }).addTo(layer);

      activeRoute.coordinates.forEach((point) => bounds.extend(point));
    }

    // Render incident destinations
    mapped.forEach(({ incident, coordinates }) => {
      const color = severityColors[String(incident.severity || '').toUpperCase()] || '#64748b';
      const icon = L.divIcon({
        className: 'incident-marker',
        html: `<span style="display:grid;place-items:center;width:28px;height:28px;border-radius:50%;border:2px solid white;background:${color};box-shadow:0 2px 6px rgba(0,0,0,0.35);color:white;font:700 11px system-ui">🚨</span>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });
      const href = `${basePath}/${encodeURIComponent(incident.id)}`;
      const popup = `<div style="min-width:190px;font:12px system-ui;color:#172033"><strong>#${safe(incident.id)} · ${safe(incident.disasterType)}</strong><br/><span>${safe(incident.location)}</span><br/><span>Severity: ${safe(incident.severity)} · ${safe(incident.status)}</span><br/><span>Source: ${safe(incident.source)}</span><br/><span>Reported: ${safe(dateText(incident.reportedAt || incident.createdAt))}</span><br/><a style="display:inline-block;margin-top:8px;color:#2563eb;font-weight:600" href="${href}">Open incident details</a></div>`;
      L.marker(coordinates, { icon }).bindPopup(popup).addTo(layer);
      bounds.extend(coordinates);
    });

    // Render responder location
    if (hasResponderCoordinates) {
      const isOnline = responderLocation?.status === 'ONLINE';
      const iconHtml = `
        <div style="position:relative;width:34px;height:34px;display:flex;align-items:center;justify-content:center;">
          ${isOnline ? '<div style="position:absolute;width:100%;height:100%;border-radius:50%;background:#10B981;opacity:0.4;animation:pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;"></div>' : ''}
          <div style="position:relative;z-index:2;display:grid;place-items:center;width:28px;height:28px;border-radius:50%;border:2.5px solid white;background:#059669;box-shadow:0 2px 8px rgba(0,0,0,0.35);color:white;font:700 13px system-ui">
            🚑
          </div>
        </div>
      `;
      const responderIcon = L.divIcon({
        className: 'responder-marker',
        html: iconHtml,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });

      const distanceText = activeRoute?.distanceMeters
        ? `${(activeRoute.distanceMeters / 1000).toFixed(1)} km away`
        : '';
      const etaText = activeRoute?.durationSeconds
        ? `ETA: ${formatDurationEta(activeRoute.durationSeconds)}`
        : '';

      L.marker(responderCoordinates, { icon: responderIcon })
        .bindPopup(`<div style="min-width:180px;font:12px system-ui;color:#172033"><strong>${safe(responderLocation.sourceType === 'VEHICLE' ? 'Response vehicle' : 'Response Team Unit')}</strong><br/><span>${safe(responderLocation.teamName || 'Assigned responder')}</span><br/><span style="display:inline-block;margin-top:4px;padding:2px 6px;border-radius:4px;font-weight:700;font-size:10px;background:${isOnline ? '#ECFDF5;color:#065F46' : '#F1F5F9;color:#475569'}">${safe(responderLocation.status || 'ONLINE')}</span>${distanceText ? `<br/><span>📍 ${distanceText}</span>` : ''}${etaText ? `<br/><span style="color:#2563EB;font-weight:600">⏱ ${etaText}</span>` : ''}<br/><span style="color:#64748B;font-size:10px">Updated: ${safe(dateText(responderLocation.locationTimestamp))}</span></div>`)
        .addTo(layer);
      bounds.extend(responderCoordinates);
    }

    // Ensure map container pixel dimensions are fresh before computing view / bounds
    map.invalidateSize({ debounceMoveend: true });

    if (mapped.length === 1 && !hasResponderCoordinates) {
      map.setView(mapped[0].coordinates, 14);
    } else if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [45, 45], maxZoom: 16 });
    }
  }, [detailsBasePath, mapped, responderCoordinates, hasResponderCoordinates, responderLocation, activeRoute]);

  const handleRetryTiles = (e) => {
    e?.stopPropagation();
    setTileError(false);
    if (tileLayerRef.current) {
      tileLayerRef.current.redraw();
    }
    if (mapRef.current) {
      mapRef.current.invalidateSize({ debounceMoveend: true });
    }
  };

  const hasContent = mapped.length > 0 || hasResponderCoordinates;

  return (
    <div
      ref={containerRef}
      className={`relative ${heightClassName} w-full rounded-b-xl overflow-hidden`}
      style={{ minHeight: '340px' }}
      aria-label="Incident map"
    >
      {/* Diagnostic message if OpenStreetMap tiles are blocked by network/ad-blocker */}
      {tileError && (
        <div className="absolute top-3 left-12 right-12 z-[1000] rounded-md border border-amber-300 bg-amber-50/95 p-2.5 text-xs text-amber-900 shadow-sm flex items-center justify-between gap-2 backdrop-blur-xs">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-amber-600 text-sm">⚠️</span>
            <span className="truncate">
              OpenStreetMap tiles failed to load. Check network or ad-blocker for <code>tile.openstreetmap.org</code>. Real incident coordinates remain mapped above.
            </span>
          </div>
          <button
            type="button"
            onClick={handleRetryTiles}
            className="shrink-0 px-2.5 py-1 rounded bg-amber-600 text-white font-semibold text-[10px] hover:bg-amber-700 transition-colors"
          >
            Retry Tiles
          </button>
        </div>
      )}

      {/* Empty coordinates fallback overlay */}
      {!hasContent && (
        <div className="absolute inset-0 z-[500] flex items-center justify-center bg-[#F8FAFC] text-center border border-[#E2E8F0] rounded-b-xl">
          <div className="max-w-sm px-4">
            <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-slate-600">📍</div>
            <h3 className="text-sm font-semibold text-[#172033]">{emptyTitle}</h3>
            <p className="mt-1 text-xs text-[#64748B]">{emptyDescription}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default IncidentMap;
