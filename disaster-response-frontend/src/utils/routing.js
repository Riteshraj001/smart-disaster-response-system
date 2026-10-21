/**
 * Emergency response routing utility.
 *
 * A route is returned only when OSRM returns real road geometry, distance,
 * and duration. There is intentionally no straight-line or fixed-speed ETA
 * fallback because that would present fabricated travel information to users.
 */
export const fetchEmergencyRoute = async (origin, destination, { signal } = {}) => {
  if (!origin || !destination) return null;
  const [lat1, lon1] = origin;
  const [lat2, lon2] = destination;
  const validCoordinate = (latitude, longitude) => Number.isFinite(latitude) && Number.isFinite(longitude)
    && latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
  if (!validCoordinate(lat1, lon1) || !validCoordinate(lat2, lon2)) return null;

  const controller = signal ? null : new AbortController();
  const requestSignal = signal || controller.signal;
  const timeout = setTimeout(() => controller?.abort(), 8000);
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=full&geometries=geojson`;
    const response = await fetch(url, { signal: requestSignal });
    if (!response.ok) return null;
    const data = await response.json();
    const route = data?.routes?.[0];
    const coordinates = (route?.geometry?.coordinates || [])
      .filter((point) => Array.isArray(point) && point.length >= 2)
      .map(([longitude, latitude]) => [latitude, longitude]);
    if (!route || !coordinates.length || !Number.isFinite(route.distance) || !Number.isFinite(route.duration)) {
      return null;
    }
    // OSRM coordinates are [lon, lat], Leaflet requires [lat, lon].
    return {
      coordinates,
      distanceMeters: Math.round(route.distance),
      durationSeconds: Math.round(route.duration),
      isRoadRoute: true,
    };
  } catch (error) {
    if (error?.name !== 'AbortError') console.warn('Road routing request failed:', error);
    return null;
  } finally {
    clearTimeout(timeout);
  }
};

export const formatDurationEta = (seconds) => {
  if (!seconds || seconds <= 0) return 'Arriving soon';
  const mins = Math.ceil(seconds / 60);
  if (mins < 60) return `${mins} min${mins > 1 ? 's' : ''}`;
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  return `${hours}h ${remMins}m`;
};
