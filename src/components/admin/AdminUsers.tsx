import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import { formatRupee, formatDate } from '../../utils/formatters.ts';
import {
  Search,
  ShieldCheck,
  AlertCircle,
  Clock,
  UserX,
  UserCheck,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import type { User, UserBalances } from '../../types/index.ts';

interface AdminUsersProps {
  onNavigateToKyc?: () => void;
}

export const AdminUsers: React.FC<AdminUsersProps> = ({ onNavigateToKyc }) => {
  const [users, setUsers] = useState<(User & { balances: UserBalances })[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'customer' | 'admin'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const res = await api.getAdminUsers();
      setUsers(res.users);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleToggleSuspend = async (userId: string, currentStatus: boolean) => {
    try {
      await api.toggleUserSuspension(userId);
      setActionMsg(`User account ${currentStatus ? 'reactivated' : 'suspended'}.`);
      await loadUsers();
      setTimeout(() => setActionMsg(null), 3000);
    } catch (err: any) {
      setActionMsg(err.message || 'Action failed');
    }
  };

  const filtered = users.filter(u => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.id.toLowerCase().includes(q) ||
      u.phone.includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">User Management</h2>
          <p className="text-sm text-slate-500 mt-1">
            View customer ledger balances, KYC verification states, and administrative account controls.
          </p>
        </div>
      </div>

      {actionMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold">
          {actionMsg}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
          <button
            onClick={() => setRoleFilter('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              roleFilter === 'all' ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Accounts ({users.length})
          </button>
          <button
            onClick={() => setRoleFilter('customer')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              roleFilter === 'customer' ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Customers ({users.filter(u => u.role === 'customer').length})
          </button>
          <button
            onClick={() => setRoleFilter('admin')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              roleFilter === 'admin' ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Admins ({users.filter(u => u.role === 'admin' || u.role === 'superadmin').length})
          </button>
        </div>

        <div className="relative sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by name, email, ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-xs text-slate-400">Loading user records...</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-500">No users match your criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-3.5 px-4">User Details</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">KYC State</th>
                  <th className="py-3.5 px-4">Deposit Balance</th>
                  <th className="py-3.5 px-4">Promo Bonus</th>
                  <th className="py-3.5 px-4">Cashback</th>
                  <th className="py-3.5 px-4">Total Available</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                        <span>{u.name}</span>
                        {u.isSuspended && (
                          <span className="text-[10px] bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded font-bold">
                            Suspended
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500">{u.email} · {u.phone}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">{u.id}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="capitalize font-medium text-slate-700">{u.role}</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`font-semibold capitalize ${
                        u.kycStatus === 'approved'
                          ? 'text-emerald-700'
                          : u.kycStatus === 'pending'
                          ? 'text-amber-700'
                          : 'text-slate-500'
                      }`}>
                        {u.kycStatus.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-slate-900 tabular-nums">
                      {formatRupee(u.balances?.depositBalance)}
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-emerald-700 tabular-nums">
                      {formatRupee(u.balances?.promotionalBonus)}
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-indigo-700 tabular-nums">
                      {formatRupee(u.balances?.cashbackBalance)}
                    </td>

                    <td className="py-3.5 px-4 font-bold text-slate-900 tabular-nums">
                      {formatRupee(u.balances?.totalAvailable)}
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      {u.role === 'customer' && (
                        <button
                          onClick={() => handleToggleSuspend(u.id, u.isSuspended)}
                          className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                            u.isSuspended
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                          }`}
                        >
                          {u.isSuspended ? 'Activate' : 'Suspend'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
