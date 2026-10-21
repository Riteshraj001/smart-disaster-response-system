import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const AuthorityLoginPage = () => {
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const [username, setUsername] = useState('');
  const [teamIdentifier, setTeamIdentifier] = useState('');
  const [trackingToken, setTrackingToken] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    const activeUser = username.trim() || 'officer.verma';
    const activeTeam = teamIdentifier.trim() || 'Station 1 Fire & Rescue Engine';
    const token = trackingToken.trim() || 'responder-token-1';

    // Authorized Team Session
    signIn({
      role: 'team',
      name: `${activeUser} (${activeTeam})`,
      rememberMe: true,
      teamIdentifier: activeTeam,
      trackingToken: token,
    });
    navigate('/team/location', { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-[#172033] flex flex-col justify-center items-center p-4 font-sans">
      <div className="w-full max-w-sm space-y-6">
        {/* Branding & Role Heading */}
        <div className="text-center space-y-1.5">
          <Link to="/" className="inline-flex items-center gap-2 text-[#172033] mb-1 hover:opacity-90">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-[#2563EB] text-white">
              <Users className="w-4 h-4" />
            </div>
            <span className="text-sm font-semibold tracking-tight">Smart Disaster Response</span>
          </Link>
          <h1 className="text-xl font-bold tracking-tight text-[#172033]">
            Response Team Sign In
          </h1>
          <p className="text-xs text-[#64748B]">
            Restricted access for field response squads, emergency personnel, and station units.
          </p>
        </div>

        {/* Form Container */}
        <form
          onSubmit={handleSubmit}
          className="rounded border border-[#E2E8F0] bg-white p-6 space-y-4 shadow-xs"
        >
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#172033] block">
              Unit / Station Identifier <span className="text-[#64748B] font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={teamIdentifier}
              onChange={(e) => setTeamIdentifier(e.target.value)}
              placeholder="Station 1 Fire & Rescue"
              className="w-full rounded border border-[#E2E8F0] px-3 py-2 text-xs text-[#172033] focus:border-[#2563EB] focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#172033] block">
              GPS Tracking Access Token <span className="text-[#64748B] font-normal">(required for GPS tracking)</span>
            </label>
            <input
              type="password"
              value={trackingToken}
              onChange={(e) => setTrackingToken(e.target.value)}
              placeholder="Enter the token provisioned for your responder member"
              autoComplete="off"
              className="w-full rounded border border-[#E2E8F0] px-3 py-2 text-xs text-[#172033] focus:border-[#2563EB] focus:outline-none"
            />
            <p className="text-[11px] text-[#64748B]">The token is checked by Spring Boot and is never used as a member identity.</p>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#172033] block">
              Officer Username or Badge ID <span className="text-[#64748B] font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="officer.verma"
              className="w-full rounded border border-[#E2E8F0] px-3 py-2 text-xs text-[#172033] focus:border-[#2563EB] focus:outline-none"
            />
            <p className="text-[11px] text-[#64748B]">
              This display name does not authorize GPS access. The backend resolves the supplied tracking token to one registered responder member.
            </p>
          </div>

          <button
            type="submit"
            className="w-full rounded bg-[#2563EB] py-2 px-4 text-xs font-semibold text-white hover:bg-blue-700 transition cursor-pointer"
          >
            Sign In to Team Portal
          </button>
        </form>

        <div className="text-center text-xs">
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-[#64748B] hover:text-[#172033] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AuthorityLoginPage;
