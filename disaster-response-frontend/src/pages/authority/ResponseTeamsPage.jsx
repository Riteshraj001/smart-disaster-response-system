import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, MapPin, Phone, RefreshCw, Users } from 'lucide-react';
import incidentService from '../../services/incidentService';
import ErrorAlert from '../../components/common/ErrorAlert';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const ResponseTeamsPage = () => {
  const [teams, setTeams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadTeams = useCallback(async () => {
    try {
      setError(null);
      setTeams(await incidentService.getResponseTeams(false));
    } catch (err) {
      setError(err.message || 'Unable to load response teams from the backend.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadTeams(); }, [loadTeams]);

  if (isLoading) return <LoadingSpinner message="Loading registered response teams..." />;

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col justify-between gap-3 border-b border-[#E5E7EB] pb-2 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-xl font-bold text-[#111827] sm:text-2xl">Response Teams &amp; Emergency Units</h1>
          <p className="mt-0.5 text-xs text-[#64748B] sm:text-sm">Live directory of response teams and members registered in the emergency backend.</p>
        </div>
        <button type="button" onClick={loadTeams} className="inline-flex items-center gap-1.5 self-start rounded border border-[#E2E8F0] bg-white px-3 py-2 text-xs font-semibold text-[#172033] hover:bg-slate-50 sm:self-auto"><RefreshCw className="h-3.5 w-3.5" />Refresh</button>
      </div>

      {error && <ErrorAlert title="Response teams unavailable" message={error} onRetry={loadTeams} />}
      {!error && !teams.length && <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">No response teams are registered. Create an authorized team and responder before expecting dispatch offers.</div>}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {teams.map((team) => {
          const members = Array.isArray(team.members) ? team.members : [];
          return (
            <div key={team.id} className="flex flex-col justify-between space-y-4 rounded-lg border border-[#E5E7EB] bg-white p-5 shadow-xs">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold text-[#64748B]">Team #{team.id}</span>
                  <span className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-xs font-semibold ${team.available ? 'border-emerald-200 bg-emerald-50 text-[#059669]' : 'border-slate-200 bg-slate-100 text-[#64748B]'}`}><CheckCircle2 className="h-3 w-3" />{team.available ? 'Available' : 'Unavailable'}</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#111827]">{team.name}</h3>
                  <p className="mt-0.5 text-xs font-medium text-[#1D4ED8]">{team.specialization || 'Specialization not recorded'}</p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-md border border-[#E5E7EB] bg-[#F5F7FA] p-2.5"><span className="block text-[11px] text-[#64748B]">Registered members</span><span className="font-semibold text-[#111827]">{members.length}</span></div>
                  <div className="rounded-md border border-[#E5E7EB] bg-[#F5F7FA] p-2.5"><span className="block text-[11px] text-[#64748B]">Available members</span><span className="font-semibold text-[#111827]">{members.filter((member) => member.available).length}</span></div>
                </div>
                <div className="space-y-1.5 border-t border-[#E5E7EB] pt-3">
                  {members.length ? members.map((member) => <div key={member.id} className="flex items-center justify-between gap-2 text-xs"><span className="flex items-center gap-1.5 text-[#172033]"><Users className="h-3.5 w-3.5 text-[#2563EB]" />{member.name}<span className="text-[#64748B]">· {member.role || 'Responder'}</span></span><span className={member.available ? 'font-semibold text-emerald-700' : 'text-[#64748B]'}>{member.available ? 'Available' : 'Unavailable'}</span></div>) : <p className="text-xs text-[#64748B]">No responder members registered for this team.</p>}
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-[#E5E7EB] pt-3 text-xs text-[#64748B]"><span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />Station location not recorded</span><span className="flex items-center gap-1 text-[#64748B]"><Phone className="h-3 w-3" />Contact data is member-scoped</span></div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ResponseTeamsPage;
