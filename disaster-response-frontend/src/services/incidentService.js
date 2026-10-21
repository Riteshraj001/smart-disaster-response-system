import apiClient from '../api/client';

const INCIDENTS_PATH = '/incidents';
const configuredPath = (value, id) => value?.replace('{id}', encodeURIComponent(id));
const configuredRequest = (method, url, data) => apiClient.request({ method: method || 'patch', url, data });
const operationUnavailable = (operation) => new Error(
  `${operation} is not configured for this backend. Set the matching VITE_API_* endpoint only when it exists in the Spring Boot API.`
);

const requireObject = (data, action) => {
  if (!data || typeof data !== 'object') {
    throw new Error(`The backend returned an invalid response while attempting to ${action}.`);
  }
  return data;
};

/** API access only: failures intentionally reach the UI instead of being replaced with demo data. */
export const incidentService = {
  async getIncidents() {
    const { data } = await apiClient.get(INCIDENTS_PATH);
    if (!Array.isArray(data)) throw new Error('The backend returned an invalid incident list.');
    return data;
  },

  async getIncidentById(id) {
    const { data } = await apiClient.get(`${INCIDENTS_PATH}/${encodeURIComponent(id)}`);
    return requireObject(data, 'load the incident');
  },

  async createIncident(incidentData) {
    const payload = {
      disasterType: incidentData.disasterType?.trim(),
      location: incidentData.location?.trim(),
      description: incidentData.description?.trim() || '',
      severity: incidentData.severity,
      source: incidentData.source || 'CITIZEN',
      status: incidentData.status || 'PENDING_VERIFICATION',
      contactInfo: incidentData.contactInfo || null,
      imageUrl: incidentData.imageUrl || null,
    };
    if (incidentData.latitude !== null && incidentData.latitude !== undefined && incidentData.latitude !== '') {
      payload.latitude = Number(incidentData.latitude);
    }
    if (incidentData.longitude !== null && incidentData.longitude !== undefined && incidentData.longitude !== '') {
      payload.longitude = Number(incidentData.longitude);
    }
    const latitudeField = import.meta.env.VITE_API_INCIDENT_LATITUDE_FIELD;
    const longitudeField = import.meta.env.VITE_API_INCIDENT_LONGITUDE_FIELD;
    if (latitudeField && payload.latitude !== undefined) payload[latitudeField] = payload.latitude;
    if (longitudeField && payload.longitude !== undefined) payload[longitudeField] = payload.longitude;
    const { data } = await apiClient.post(INCIDENTS_PATH, payload);
    return requireObject(data, 'create the incident');
  },

  async updateIncident(id, updateData) {
    const current = await this.getIncidentById(id);
    const { data } = await apiClient.put(`${INCIDENTS_PATH}/${encodeURIComponent(id)}`, {
      ...current,
      ...updateData,
    });
    return requireObject(data, 'update the incident');
  },

  // A stable public method used by existing response-team callers.
  async updateIncidentStatus(id, status) {
    const { data } = await apiClient.patch(`${INCIDENTS_PATH}/${encodeURIComponent(id)}/status`, { status });
    return requireObject(data, 'update the incident status');
  },

  async getAssignees() {
    const { data } = await apiClient.get('/api/response-members', { params: { availableOnly: false } });
    if (!Array.isArray(data)) throw new Error('The backend returned an invalid assignee list.');
    return data;
  },

  async getResponseTeams(availableOnly = false) {
    const { data } = await apiClient.get('/api/response-teams', { params: { availableOnly } });
    if (!Array.isArray(data)) throw new Error('The backend returned an invalid response team list.');
    return data;
  },

  async assignIncident(id, assigneeId, note = '') {
    let teamId = Number(assigneeId);
    if (!Number.isFinite(teamId) || teamId <= 0) {
      const selectedTeamName = String(assigneeId || '').trim();
      if (!selectedTeamName || selectedTeamName === 'Unassigned') {
        throw new Error('Select a response team before assigning the incident.');
      }
      const { data: teams } = await apiClient.get('/api/response-teams', { params: { availableOnly: false } });
      if (!Array.isArray(teams)) {
        throw new Error('The backend returned an invalid response team list.');
      }
      const match = teams.find((team) => team.name === selectedTeamName);
      if (!match || !Number.isFinite(Number(match.id)) || Number(match.id) <= 0) {
        throw new Error(`Response team "${selectedTeamName}" was not found on the backend.`);
      }
      teamId = Number(match.id);
    }

    const payload = { teamId };
    if (note && note.trim()) payload.notes = note.trim();
    const { data } = await apiClient.put(`${INCIDENTS_PATH}/${encodeURIComponent(id)}/assignment`, payload);
    return requireObject(data, 'assign the incident');
  },

  async assignIncidentToMember(id, memberId, note = '') {
    const numericMemberId = Number(memberId);
    if (!Number.isFinite(numericMemberId) || numericMemberId <= 0) {
      throw new Error('Select a responder before assigning the incident.');
    }
    const payload = { memberId: numericMemberId };
    if (note && note.trim()) payload.notes = note.trim();
    const { data } = await apiClient.put(`${INCIDENTS_PATH}/${encodeURIComponent(id)}/assignment`, payload);
    return requireObject(data, 'assign the incident to the responder');
  },

  async verifyIncident(id) {
    // Verification is intentionally separate from dispatch. The backend creates responder
    // offers at this transition; an assignment is created only after acceptance or an
    // explicit authorized dispatcher action.
    return this.updateIncidentStatus(id, 'VERIFIED');
  },

  async dispatchResponseTeam(id, teamName) {
    const selectedTeam = (teamName || '').trim();
    if (!selectedTeam || selectedTeam === 'Unassigned') {
      throw new Error('Select a response unit before dispatching.');
    }

    const updated = await this.assignIncident(id, selectedTeam, 'Authority dispatched response unit.');
    const refreshed = await this.getIncidentById(id);
    return refreshed || updated;
  },

  async startResponding(id) {
    const { data } = await apiClient.patch(`${INCIDENTS_PATH}/${encodeURIComponent(id)}/status`, { status: 'RESPONDING' });
    return requireObject(data, 'start responding');
  },

  async completeResponse(id) {
    const { data } = await apiClient.patch(`${INCIDENTS_PATH}/${encodeURIComponent(id)}/status`, { status: 'RESPONSE_COMPLETED' });
    return requireObject(data, 'mark response complete');
  },

  async resolveIncident(id) {
    const { data } = await apiClient.patch(`${INCIDENTS_PATH}/${encodeURIComponent(id)}/status`, { status: 'RESOLVED' });
    return requireObject(data, 'resolve the incident');
  },

  async rejectIncident(id, reason = 'False alarm / Invalid report') {
    const payload = { status: 'REJECTED', reason: reason?.trim() || 'False alarm / Invalid report' };
    const { data } = await apiClient.patch(`${INCIDENTS_PATH}/${encodeURIComponent(id)}/status`, payload);
    return requireObject(data, 'reject the incident');
  },

  async deleteIncident(id) {
    await apiClient.delete(`${INCIDENTS_PATH}/${encodeURIComponent(id)}`);
    return true;
  },

  async checkBackendHealth() {
    try {
      await apiClient.get(INCIDENTS_PATH, { timeout: 2500 });
      return true;
    } catch {
      return false;
    }
  },
};

export default incidentService;
