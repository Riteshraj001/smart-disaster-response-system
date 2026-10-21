import { getIncidentCoordinates } from './incidentCoordinates.js';
import apiClient from '../api/client.js';

const CACHE_KEY = 'smart_disaster_geocode_cache';

const readCache = () => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

const writeCache = (cache) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Ignore storage exceptions so the map still works in restrictive browser contexts.
  }
};

const cleanQuery = (value) => {
  if (value === null || value === undefined) return '';
  return String(value).trim().replace(/\s+/g, ' ');
};

export const geocodeLocation = async (locationText) => {
  const query = cleanQuery(locationText);
  if (!query) return null;

  const cache = readCache();
  const cached = cache[query];
  if (cached && Array.isArray(cached) && cached.length === 2 && Number.isFinite(cached[0]) && Number.isFinite(cached[1])) {
    return [Number(cached[0]), Number(cached[1])];
  }

  try {
    const { data } = await apiClient.get('/api/geocoding/search', {
      params: { q: query, limit: 1 },
    });
    const match = Array.isArray(data) ? data[0] : null;
    if (!match || !Number.isFinite(Number(match.latitude)) || !Number.isFinite(Number(match.longitude))) return null;

    const coords = [Number(match.latitude), Number(match.longitude)];
    cache[query] = coords;
    writeCache(cache);
    return coords;
  } catch {
    return null;
  }
};

export const searchLocationSuggestions = async (locationText, { signal, limit = 5 } = {}) => {
  const query = cleanQuery(locationText);
  if (query.length < 3) return [];

  const { data } = await apiClient.get('/api/geocoding/search', {
    params: { q: query, limit },
    signal,
  });
  return Array.isArray(data) ? data : [];
};

export const resolveIncidentCoordinates = async (incident) => {
  const direct = getIncidentCoordinates(incident);
  if (direct) return direct;

  const locationText = cleanQuery(
    incident?.location ||
      incident?.address ||
      incident?.formattedLocation ||
      incident?.city ||
      incident?.place ||
      incident?.addressText,
  );

  if (!locationText) return null;
  return geocodeLocation(locationText);
};

export const hydrateIncidentCoordinates = async (incidents = []) => {
  if (!Array.isArray(incidents)) return [];

  const hydrated = await Promise.all(
    incidents.map(async (incident) => {
      const coordinates = await resolveIncidentCoordinates(incident);
      if (!coordinates) return incident;
      return {
        ...incident,
        latitude: coordinates[0],
        longitude: coordinates[1],
      };
    }),
  );

  return hydrated;
};
