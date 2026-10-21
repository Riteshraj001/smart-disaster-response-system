const SEVERITY_RANK = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

const CLOSED_STATUSES = new Set(['RESOLVED', 'REJECTED', 'RESPONSE_COMPLETED', 'CLOSED']);

export const normalizeIncidentValue = (value) => String(value || '').trim().toUpperCase();

export const isAwaitingAction = (incident) => !CLOSED_STATUSES.has(normalizeIncidentValue(incident?.status));

/** The shared operational queue order. It never mutates the source list. */
export const sortIncidentsByPriority = (incidents = []) => [...incidents].sort((a, b) => {
  const severityDifference = (SEVERITY_RANK[normalizeIncidentValue(a?.severity)] ?? 99)
    - (SEVERITY_RANK[normalizeIncidentValue(b?.severity)] ?? 99);
  if (severityDifference) return severityDifference;

  const actionDifference = Number(isAwaitingAction(b)) - Number(isAwaitingAction(a));
  if (actionDifference) return actionDifference;

  const aTime = new Date(a?.reportedAt || a?.createdAt || 0).getTime() || 0;
  const bTime = new Date(b?.reportedAt || b?.createdAt || 0).getTime() || 0;
  return aTime - bTime;
});
