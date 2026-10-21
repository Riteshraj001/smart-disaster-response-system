import apiClient from '../api/client';

const incidentTokenKey = (id) => `smart_disaster_incident_tracking_${id}`;
const INCIDENT_TRACKING_TOKEN_PARAM = 'trackingToken';

export const getCitizenTrackingUrl = (id, token = null) => {
  const path = `/citizen/track/${encodeURIComponent(id)}`;
  const normalizedToken = typeof token === 'string' ? token.trim() : '';
  return normalizedToken
    ? `${path}?${INCIDENT_TRACKING_TOKEN_PARAM}=${encodeURIComponent(normalizedToken)}`
    : path;
};

export const saveIncidentTrackingToken = (id, token) => {
  const normalizedToken = typeof token === 'string' ? token.trim() : '';
  if (!id || !normalizedToken) return;
  sessionStorage.setItem(incidentTokenKey(id), normalizedToken);
  localStorage.setItem(incidentTokenKey(id), normalizedToken);
};

const getIncidentTrackingToken = (id) => (
  sessionStorage.getItem(incidentTokenKey(id)) || localStorage.getItem(incidentTokenKey(id))
);

const authConfig = (token) => ({
  headers: { Authorization: `Bearer ${token}` },
});

const requireToken = (token, message) => {
  if (!token) throw new Error(message);
  return token;
};

export const trackingService = {
  async getCitizenIncidentTracking(id, tokenFromUrl = null) {
    const token = requireToken(
      (typeof tokenFromUrl === 'string' && tokenFromUrl.trim()) || getIncidentTrackingToken(id),
      'This report does not have a citizen tracking token in this browser. Submit a new report or use the original tracking session.'
    );
    const { data } = await apiClient.get(`/api/tracking/incidents/${encodeURIComponent(id)}`, {
      headers: { 'X-Incident-Tracking-Token': token },
    });
    return data;
  },

  async getResponderAssignments(token) {
    const { data } = await apiClient.get('/api/tracking/responder/assignments', authConfig(requireToken(token, 'Responder tracking credentials are not configured for this session.')));
    return Array.isArray(data) ? data : [];
  },

  async getResponderIdentity(token) {
    const { data } = await apiClient.get('/api/tracking/responder/identity', authConfig(requireToken(token, 'Responder tracking credentials are not configured for this session.')));
    return data;
  },

  async getResponderOffers(token) {
    const { data } = await apiClient.get('/api/tracking/responder/offers', authConfig(requireToken(token, 'Responder tracking credentials are not configured for this session.')));
    return Array.isArray(data) ? data : [];
  },

  async acceptResponderOffer(token, offerId) {
    const { data } = await apiClient.post(`/api/tracking/responder/offers/${encodeURIComponent(offerId)}/accept`, {}, authConfig(requireToken(token, 'Responder tracking credentials are not configured for this session.')));
    return data;
  },

  async declineResponderOffer(token, offerId, reason) {
    const { data } = await apiClient.post(`/api/tracking/responder/offers/${encodeURIComponent(offerId)}/decline`, reason ? { reason } : {}, authConfig(requireToken(token, 'Responder tracking credentials are not configured for this session.')));
    return data;
  },

  async submitResponderLocation(token, location) {
    const { data } = await apiClient.post('/api/tracking/responder/location', location, authConfig(requireToken(token, 'Responder tracking credentials are not configured for this session.')));
    return data;
  },

  async getResponderLocation(token) {
    const { data } = await apiClient.get('/api/tracking/responder/location', authConfig(requireToken(token, 'Responder tracking credentials are not configured for this session.')));
    return data;
  },

  async stopResponderTracking(token) {
    const { data } = await apiClient.post('/api/tracking/responder/location/stop', {}, authConfig(requireToken(token, 'Responder tracking credentials are not configured for this session.')));
    return data;
  },
};

export default trackingService;
