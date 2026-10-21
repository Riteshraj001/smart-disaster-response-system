import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw, Search, X } from 'lucide-react';
import incidentService from '../../services/incidentService';
import { sortIncidentsByPriority } from '../../utils/incidentSorting';
import { useNotification } from '../../context/NotificationContext';
import SeverityBadge from '../../components/common/SeverityBadge';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';

const label = (person) => person?.name || person?.teamName || person?.displayName || person?.id;
const assignment = (incident) => incident.assignee?.name || incident.assigneeName || incident.assignedTeam || 'Unassigned';
const when = (value) => value ? new Date(value).toLocaleString() : '—';

export default function AdminIncidentsPage() {
  const { showToast } = useNotification();
  const [incidents, setIncidents] = useState([]); const [assignees, setAssignees] = useState([]);
  const [search, setSearch] = useState(''); const [unassigned, setUnassigned] = useState(false);
  const [selected, setSelected] = useState(null); const [assigneeId, setAssigneeId] = useState('');
  const [assignmentNote, setAssignmentNote] = useState('');
  const [loading, setLoading] = useState(true); const [refreshing, setRefreshing] = useState(false); const [saving, setSaving] = useState(false); const [error, setError] = useState(null);
  const load = useCallback(async () => {
    try {
      setError(null); setIncidents(sortIncidentsByPriority(await incidentService.getIncidents()));
      try { setAssignees(await incidentService.getAssignees()); } catch { setAssignees([]); }
    } catch (err) { setError(err.message || 'Unable to load incidents.'); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  const rows = useMemo(() => sortIncidentsByPriority(incidents.filter((item) => {
    const none = !item.assignee && !item.assigneeName && (!item.assignedTeam || item.assignedTeam === 'Unassigned');
    const text = `${item.id || ''} ${item.disasterType || ''} ${item.location || ''} ${item.status || ''}`.toLowerCase();
    return (!unassigned || none) && text.includes(search.trim().toLowerCase());
  })), [incidents, search, unassigned]);
  const open = (incident) => { setSelected(incident); setAssigneeId(String(incident.currentAssignment?.memberId || incident.assignee?.id || incident.assigneeId || '')); setAssignmentNote(''); };
  const save = async () => { setSaving(true); try { await incidentService.assignIncidentToMember(selected.id, assigneeId, assignmentNote); showToast(`Incident #${selected.id} assignment saved.`, 'success'); setSelected(null); await load(); } catch (err) { showToast(err.message || 'Assignment was not saved.', 'error'); } finally { setSaving(false); } };
  return <div className="space-y-5 font-sans">
    <div className="flex flex-col gap-3 border-b border-[#E2E8F0] pb-3 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="text-xl font-bold text-[#172033]">All Incidents</h1><p className="text-xs text-[#64748B]">Ordered by severity, action state, then report time.</p></div><button onClick={() => { setRefreshing(true); load(); }} disabled={loading || refreshing} className="inline-flex items-center gap-1.5 self-start rounded border border-[#E2E8F0] bg-white px-3 py-1.5 text-xs"><RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />Refresh</button></div>
    {error && <ErrorAlert title="Incident service unavailable" message={error} onRetry={load} isRetrying={refreshing} />}
    <div className="flex flex-col gap-2 rounded border border-[#E2E8F0] bg-white p-3 sm:flex-row"><label className="relative flex-1"><Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-[#64748B]" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search incident ID, type, location, or status" className="w-full rounded border border-[#E2E8F0] py-1.5 pl-8 pr-2 text-xs" /></label><label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={unassigned} onChange={(e) => setUnassigned(e.target.checked)} />Unassigned only</label></div>
    {loading ? <LoadingSpinner message="Loading incidents..." /> : <div className="overflow-x-auto rounded border border-[#E2E8F0] bg-white"><table className="w-full text-left text-xs"><thead className="bg-[#F8FAFC] text-[11px] uppercase text-[#64748B]"><tr><th className="p-3">ID</th><th className="p-3">Type / location</th><th className="p-3">Severity</th><th className="p-3">Status</th><th className="p-3">Assignee</th><th className="p-3">Assigned</th><th className="p-3" /></tr></thead><tbody>{rows.map((item) => <tr key={item.id} className="border-t border-[#E2E8F0]"><td className="p-3 font-semibold">#{item.id}</td><td className="p-3"><div className="font-medium">{item.disasterType || '—'}</div><div className="text-[#64748B]">{item.location || '—'}</div></td><td className="p-3"><SeverityBadge severity={item.severity || 'LOW'} size="xs" /></td><td className="p-3"><StatusBadge status={item.status} size="xs" /></td><td className="p-3">{assignment(item)}</td><td className="p-3 text-[#64748B]">{when(item.assignedAt || item.assignmentTime)}</td><td className="p-3 text-right"><button onClick={() => open(item)} className="rounded border border-[#E2E8F0] px-2 py-1 text-[11px] text-[#2563EB]">Details</button></td></tr>)}</tbody></table>{!rows.length && <p className="p-8 text-center text-xs text-[#64748B]">No incidents match the current filters.</p>}</div>}
    {selected && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"><div className="w-full max-w-lg space-y-4 rounded border border-[#E2E8F0] bg-white p-5"><div className="flex justify-between border-b pb-2"><div><p className="text-xs text-[#64748B]">Incident #{selected.id}</p><h2 className="font-bold">{selected.disasterType}</h2></div><button onClick={() => setSelected(null)}><X className="h-4 w-4" /></button></div><p className="text-xs"><strong>Location:</strong> {selected.location || '—'}</p><p className="text-xs"><strong>Description:</strong> {selected.description || '—'}</p><p className="text-xs"><strong>Assigned:</strong> {assignment(selected)} · {when(selected.assignedAt || selected.assignmentTime)}</p>{Array.isArray(selected.responseHistory || selected.statusHistory) && <div className="text-xs"><strong>Response history</strong><ul className="mt-1 list-disc pl-4">{(selected.responseHistory || selected.statusHistory).map((entry, i) => <li key={i}>{entry.status || entry.action || JSON.stringify(entry)}</li>)}</ul></div>}<div className="border-t pt-3"><label className="mb-1 block text-xs font-semibold">Assign / reassign</label>{assignees.length ? <><select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} className="w-full rounded border border-[#E2E8F0] p-2 text-xs"><option value="">Select backend assignee</option>{assignees.map((person) => <option key={person.id} value={person.id}>{label(person)}</option>)}</select>{import.meta.env.VITE_API_ASSIGNMENT_NOTE_FIELD && <textarea value={assignmentNote} onChange={(e) => setAssignmentNote(e.target.value)} placeholder="Assignment note (saved when backend supports it)" className="mt-2 w-full p-2 text-xs" rows={2} />}<button onClick={save} disabled={!assigneeId || saving} className="mt-2 rounded bg-[#2563EB] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">{saving ? 'Saving...' : 'Save assignment'}</button></> : <p className="text-xs text-[#64748B]">Assignee controls require the configured backend assignee endpoints.</p>}</div></div></div>}
  </div>;
}
