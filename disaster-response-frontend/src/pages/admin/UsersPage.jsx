import React, { useState } from 'react';
import { Search } from 'lucide-react';

const UsersPage = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const usersList = [
    {
      id: 'USR-001',
      name: 'Ritesh Raj',
      email: 'ritesh.citizen@emergency.gov',
      role: 'ROLE_CITIZEN',
      status: 'Active',
      created: '2025-08-10',
    },
    {
      id: 'USR-002',
      name: 'Capt. Rajesh Sharma',
      email: 'commander.north@disaster-ops.gov',
      role: 'ROLE_AUTHORITY',
      status: 'Active',
      created: '2025-08-01',
    },
    {
      id: 'USR-003',
      name: 'Dr. Priya Desai',
      email: 'triage.medical@disaster-ops.gov',
      role: 'ROLE_AUTHORITY',
      status: 'Active',
      created: '2025-08-05',
    },
    {
      id: 'USR-004',
      name: 'System Admin Root',
      email: 'admin.root@disaster-ops.gov',
      role: 'ROLE_ADMIN',
      status: 'Active',
      created: '2025-07-15',
    },
  ];

  const filtered = usersList.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 font-sans">
      <div className="pb-2 border-b border-[#E5E7EB]">
        <h1 className="text-xl sm:text-2xl font-bold text-[#111827]">
          User Accounts &amp; Roles
        </h1>
        <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
          Directory of registered user accounts and their assigned role access permissions.
        </p>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative max-w-sm w-full">
          <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, email, or role..."
            className="w-full pl-9 pr-4 py-2 rounded-md border border-[#E5E7EB] bg-white text-xs text-[#111827] placeholder-[#64748B] focus:outline-none focus:ring-1 focus:ring-[#1D4ED8]"
          />
        </div>
        <span className="text-xs text-[#64748B]">
          {filtered.length} user records
        </span>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-[#E5E7EB] bg-white shadow-xs">
        <table className="w-full text-left text-xs text-[#111827]">
          <thead className="border-b border-[#E5E7EB] bg-[#F5F7FA] text-[11px] font-semibold uppercase text-[#64748B]">
            <tr>
              <th className="py-2.5 px-4">User ID</th>
              <th className="py-2.5 px-4">User Name</th>
              <th className="py-2.5 px-4">Email Address</th>
              <th className="py-2.5 px-4">Security Role</th>
              <th className="py-2.5 px-4">Status</th>
              <th className="py-2.5 px-4 text-right">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E7EB]">
            {filtered.map((u) => {
              const isCitizen = u.role === 'ROLE_CITIZEN';
              const isAuthority = u.role === 'ROLE_AUTHORITY';

              return (
                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-semibold text-[#111827]">{u.id}</td>
                  <td className="py-3 px-4 font-semibold text-[#111827]">{u.name}</td>
                  <td className="py-3 px-4 text-[#64748B]">{u.email}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                        isCitizen
                          ? 'bg-blue-50 text-[#1D4ED8] border-blue-200'
                          : isAuthority
                          ? 'bg-amber-50 text-[#D97706] border-amber-200'
                          : 'bg-purple-50 text-purple-700 border-purple-200'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-[#059669] font-medium">{u.status}</span>
                  </td>
                  <td className="py-3 px-4 text-right text-[#64748B]">{u.created}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UsersPage;

