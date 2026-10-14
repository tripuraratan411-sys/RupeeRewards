import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import { formatRupee, formatDate } from '../../utils/formatters.ts';
import {
  Search,
  Filter,
  Download,
  ArrowDownLeft,
  ArrowUpRight,
  Gift,
  Sparkles,
  RefreshCw,
  Send,
  Building2
} from 'lucide-react';
import type { Transaction } from '../../types/index.ts';

export const TransactionsView: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const res = await api.getTransactions({
        type: filterType !== 'all' ? filterType : undefined
      });
      setTransactions(res.transactions);
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [filterType]);

  const filtered = transactions.filter(t => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.title.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.referenceId.toLowerCase().includes(q) ||
      (t.paymentMethod && t.paymentMethod.toLowerCase().includes(q))
    );
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownLeft className="w-4 h-4 text-emerald-600" />;
      case 'withdrawal':
        return <ArrowUpRight className="w-4 h-4 text-slate-700" />;
      case 'bonus':
        return <Gift className="w-4 h-4 text-emerald-600" />;
      case 'cashback':
        return <Sparkles className="w-4 h-4 text-indigo-600" />;
      case 'money_transfer':
        return <Send className="w-4 h-4 text-purple-600" />;
      case 'bank_transfer':
        return <Building2 className="w-4 h-4 text-blue-600" />;
      default:
        return <RefreshCw className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Ledger &amp; Transaction History</h2>
          <p className="text-sm text-slate-500 mt-1">
            Complete transparent financial ledger of deposits, rewards, cashbacks, peer transfers, and bank payouts.
          </p>
        </div>

        <button
          onClick={() => {
            const jsonStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filtered, null, 2));
            const dl = document.createElement('a');
            dl.setAttribute("href", jsonStr);
            dl.setAttribute("download", `rupee_rewards_ledger_${new Date().toISOString().slice(0, 10)}.json`);
            dl.click();
          }}
          className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 self-start sm:self-auto shadow-sm"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Ledger JSON</span>
        </button>
      </div>

      {/* Filter Bar & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
        {/* Type Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
          {[
            { id: 'all', label: 'All Activity' },
            { id: 'deposit', label: 'Deposits' },
            { id: 'withdrawal', label: 'Withdrawals' },
            { id: 'bonus', label: 'Promotional Bonuses' },
            { id: 'cashback', label: 'Cashbacks' },
            { id: 'money_transfer', label: 'Money Transfers' },
            { id: 'bank_transfer', label: 'Bank Transfers' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                filterType === tab.id
                  ? 'bg-white text-slate-900 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by ID, title, VPA..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-xs text-slate-400">Loading ledger data...</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-500">
            No transaction records found matching your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-3.5 px-4">Transaction / Type</th>
                  <th className="py-3.5 px-4">Date &amp; Time</th>
                  <th className="py-3.5 px-4">Reference ID</th>
                  <th className="py-3.5 px-4">Method / Channel</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Net Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(t => {
                  const isDebit = t.type === 'withdrawal' || t.type === 'bank_transfer' || (t.type === 'money_transfer' && t.metadata?.direction === 'out');
                  return (
                    <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 bg-slate-100 rounded-lg shrink-0">
                            {getIcon(t.type)}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{t.title}</p>
                            <p className="text-[11px] text-slate-500">{t.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {formatDate(t.createdAt)}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-700">
                        {t.referenceId}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {t.paymentMethod || 'Wallet Internal'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`capitalize font-semibold text-[11px] px-2 py-0.5 rounded ${
                          t.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-700'
                            : t.status === 'pending' || t.status === 'processing' || t.status === 'approved'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold tabular-nums whitespace-nowrap">
                        <span
                          className={
                            isDebit
                              ? 'text-slate-900'
                              : 'text-emerald-600'
                          }
                        >
                          {isDebit ? '-' : '+'}
                          {formatRupee(t.amount)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
