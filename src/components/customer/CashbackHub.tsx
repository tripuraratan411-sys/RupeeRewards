import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import { formatRupee, formatDate, getDaysRemaining } from '../../utils/formatters.ts';
import { Sparkles, Clock, CheckCircle2, AlertCircle, Info, Calendar, Tag } from 'lucide-react';
import type { CashbackSummary, CashbackRuleConfig } from '../../types/index.ts';

export const CashbackHub: React.FC = () => {
  const [data, setData] = useState<CashbackSummary | null>(null);
  const [rule, setRule] = useState<CashbackRuleConfig | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<'all' | 'available' | 'used' | 'expired'>('all');

  const loadCashback = async () => {
    setIsLoading(true);
    try {
      const res = await api.getCashback();
      setData(res.summary);
      setRule(res.rule);
    } catch (err) {
      console.error('Failed to load cashback data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCashback();
  }, []);

  const items = data?.items || [];
  const filteredItems = items.filter(item => {
    if (filter === 'all') return true;
    return item.status === filter;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Cashback Hub</h2>
        <p className="text-sm text-slate-500 mt-1">
          Track your earned cashback vouchers, expiration dates, eligibility criteria, and redemption rules.
        </p>
      </div>

      {/* 4 Summary Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Available Cashback</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1.5 tabular-nums">
            {formatRupee(data?.available || 0)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Ready for voucher offsets</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Total Lifetime Earned</p>
          <p className="text-2xl font-bold text-slate-900 mt-1.5 tabular-nums">
            {formatRupee(data?.totalEarned || 0)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Cumulative rewards credited</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Redeemed &amp; Used</p>
          <p className="text-2xl font-bold text-slate-700 mt-1.5 tabular-nums">
            {formatRupee(data?.used || 0)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Applied towards purchases</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Expired Credits</p>
          <p className="text-2xl font-bold text-slate-400 mt-1.5 tabular-nums">
            {formatRupee(data?.expired || 0)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Passed validity window</p>
        </div>
      </div>

      {/* Active Cashback Rules Banner */}
      {rule && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg text-emerald-700 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-sm">Active Cashback Program</p>
              <p className="text-slate-600 mt-0.5">
                Earn <strong className="text-emerald-700">{rule.cashbackPercentage}% cashback</strong> (up to {formatRupee(rule.maxCashbackPerTx)}) on partner checkouts over {formatRupee(rule.minSpendAmount)}.
              </p>
            </div>
          </div>
          <div className="text-slate-500 text-right md:border-l md:border-slate-200 md:pl-4 shrink-0">
            <p className="font-medium text-slate-700">Validity Standard</p>
            <p className="text-[11px] mt-0.5">{rule.expiryDays} days from credit timestamp</p>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              filter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Vouchers ({items.length})
          </button>
          <button
            onClick={() => setFilter('available')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              filter === 'available' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Available ({items.filter(i => i.status === 'available').length})
          </button>
          <button
            onClick={() => setFilter('used')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              filter === 'used' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Used ({items.filter(i => i.status === 'used').length})
          </button>
          <button
            onClick={() => setFilter('expired')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              filter === 'expired' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Expired ({items.filter(i => i.status === 'expired').length})
          </button>
        </div>
      </div>

      {/* Cashback Vouchers List */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <p className="text-sm font-semibold text-slate-800">No cashback vouchers found in this category.</p>
          <p className="text-xs text-slate-500 mt-1">Deposit funds or complete qualifying transactions to unlock promotional cashbacks.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredItems.map((item) => {
            const daysLeft = getDaysRemaining(item.expiryDate);
            const isExpiringSoon = item.status === 'available' && daysLeft <= 7;

            return (
              <div
                key={item.id}
                className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-slate-300 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{item.title}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">{item.earnedFrom}</p>
                    </div>
                    <span className="text-lg font-bold text-emerald-600 tabular-nums shrink-0">
                      {formatRupee(item.amount)}
                    </span>
                  </div>

                  <div className="mt-3 p-2.5 bg-slate-50 rounded-lg text-xs text-slate-600">
                    <p className="font-semibold text-slate-700 text-[11px] uppercase tracking-wider mb-1">
                      Eligibility &amp; Redemption Rule:
                    </p>
                    <p>{item.eligibilityRule}</p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Expires: {formatDate(item.expiryDate)}</span>
                  </div>

                  {item.status === 'available' ? (
                    <span className={`font-semibold ${isExpiringSoon ? 'text-amber-600' : 'text-emerald-700'}`}>
                      {daysLeft} days remaining
                    </span>
                  ) : item.status === 'used' ? (
                    <span className="text-slate-500 font-medium">Redeemed</span>
                  ) : (
                    <span className="text-slate-400 font-medium">Expired</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
