import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const AdminLoginPage = () => {
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const [username, setUsername] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    const activeUser = username.trim() || 'admin@disaster-ops.gov';

    // Authorized Admin Session
    signIn({
      role: 'admin',
      name: activeUser,
      rememberMe: true,
    });
    navigate('/admin', { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-[#172033] flex flex-col justify-center items-center p-4 font-sans">
      <div className="w-full max-w-sm space-y-6">
        {/* Branding & Role Heading */}
        <div className="text-center space-y-1.5">
          <Link to="/" className="inline-flex items-center gap-2 text-[#172033] mb-1 hover:opacity-90">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-[#2563EB] text-white">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <span className="text-sm font-semibold tracking-tight">Smart Disaster Response</span>
          </Link>
          <h1 className="text-xl font-bold tracking-tight text-[#172033]">
            Administrator Sign In
          </h1>
          <p className="text-xs text-[#64748B]">
            System governance, incident oversight, IoT monitoring, and response team management.
          </p>
        </div>

        {/* Form Container */}
        <form
          onSubmit={handleSubmit}
          className="rounded border border-[#E2E8F0] bg-white p-6 space-y-4 shadow-xs"
        >
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#172033] block">
              Admin Username or Official Email <span className="text-[#64748B] font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin@disaster-ops.gov"
              className="w-full rounded border border-[#E2E8F0] px-3 py-2 text-xs text-[#172033] focus:border-[#2563EB] focus:outline-none"
            />
            <p className="text-[11px] text-[#64748B]">
              Leave empty to sign in with the default administrator demonstration account.
            </p>
          </div>

          <button
            type="submit"
            className="w-full rounded bg-[#2563EB] py-2 px-4 text-xs font-semibold text-white hover:bg-blue-700 transition cursor-pointer"
          >
            Sign In to Administrator Portal
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

export default AdminLoginPage;
