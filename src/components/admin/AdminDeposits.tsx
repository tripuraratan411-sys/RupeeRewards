import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import { formatRupee, formatDate } from '../../utils/formatters.ts';
import { ArrowDownLeft, Search, Download, CreditCard, ShieldCheck } from 'lucide-react';
import type { Transaction } from '../../types/index.ts';

export const AdminDeposits: React.FC = () => {
  const [deposits, setDeposits] = useState<Transaction[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const loadDeposits = async () => {
    setIsLoading(true);
    try {
      const res = await api.getAdminDeposits();
      setDeposits(res.deposits);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDeposits();
  }, []);

  const totalVol = deposits.reduce((sum, d) => sum + d.amount, 0);

  const filtered = deposits.filter(d => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      d.referenceId.toLowerCase().includes(q) ||
      (d.userName && d.userName.toLowerCase().includes(q)) ||
      (d.userEmail && d.userEmail.toLowerCase().includes(q)) ||
      (d.paymentMethod && d.paymentMethod.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Deposit Review &amp; Ledger</h2>
          <p className="text-sm text-slate-500 mt-1">
            Complete list of verified gateway deposits, idempotency hashes, and bonus linkages.
          </p>
        </div>

        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-900">
          <span>Gross Processed Volume: </span>
          <strong className="text-sm tabular-nums text-emerald-700">{formatRupee(totalVol)}</strong>
        </div>
      </div>

      <div className="flex justify-between items-center bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
        <div className="relative w-full max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search reference, user name, email, UPI..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <span className="text-xs text-slate-500 font-medium">Showing {filtered.length} records</span>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-xs text-slate-400">Loading deposits...</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-500">No deposits found matching search.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-3.5 px-4">Customer Details</th>
                  <th className="py-3.5 px-4">Reference &amp; Hash</th>
                  <th className="py-3.5 px-4">Payment Channel</th>
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Deposited Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(d => (
                  <tr key={d.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{d.userName}</div>
                      <div className="text-[11px] text-slate-500">{d.userEmail}</div>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-700">
                      {d.referenceId}
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {d.paymentMethod || 'UPI Gateway'}
                    </td>
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {formatDate(d.createdAt)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-emerald-700 capitalize">
                        {d.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900 tabular-nums whitespace-nowrap text-sm">
                      {formatRupee(d.amount)}
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
