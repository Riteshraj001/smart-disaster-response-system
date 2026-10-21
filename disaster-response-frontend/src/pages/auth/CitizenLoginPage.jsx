import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const CitizenLoginPage = () => {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    // Establish demo session directly without password requirement
    const activeUser = email.trim() || 'citizen@example.gov';
    signIn({
      role: 'citizen',
      name: activeUser.split('@')[0],
      rememberMe: true,
    });
    navigate('/citizen', { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-[#172033] flex flex-col justify-center items-center p-4 font-sans">
      <div className="w-full max-w-sm space-y-6">
        {/* Branding & Role Heading */}
        <div className="text-center space-y-1.5">
          <Link to="/" className="inline-flex items-center gap-2 text-[#172033] mb-1 hover:opacity-90">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-[#2563EB] text-white">
              <Shield className="w-4 h-4" />
            </div>
            <span className="text-sm font-semibold tracking-tight">Smart Disaster Response</span>
          </Link>
          <h1 className="text-xl font-bold tracking-tight text-[#172033]">
            Citizen Sign In
          </h1>
          <p className="text-xs text-[#64748B]">
            Sign in to submit emergency reports and monitor status updates.
          </p>
        </div>

        {/* Form Container */}
        <form
          onSubmit={handleSubmit}
          className="rounded border border-[#E2E8F0] bg-white p-6 space-y-4 shadow-xs"
        >
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#172033] block">
              Email Address or Citizen Username <span className="text-[#64748B] font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="citizen@example.gov"
              className="w-full rounded border border-[#E2E8F0] px-3 py-2 text-xs text-[#172033] focus:border-[#2563EB] focus:outline-none"
            />
            <p className="text-[11px] text-[#64748B]">
              Leave empty to sign in with the default demonstration citizen profile.
            </p>
          </div>

          <button
            type="submit"
            className="w-full rounded bg-[#2563EB] py-2 px-4 text-xs font-semibold text-white hover:bg-blue-700 transition cursor-pointer"
          >
            Sign In to Citizen Portal
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

export default CitizenLoginPage;
