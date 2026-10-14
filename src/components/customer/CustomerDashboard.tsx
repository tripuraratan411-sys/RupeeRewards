import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import { formatRupee, formatRupeeShort, formatDate } from '../../utils/formatters.ts';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Gift,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  Clock,
  ChevronRight,
  TrendingUp,
  CreditCard,
  Send,
  Building2
} from 'lucide-react';
import { DepositModal } from './DepositModal.tsx';
import { WithdrawalModal } from './WithdrawalModal.tsx';
import type { Transaction } from '../../types/index.ts';

interface CustomerDashboardProps {
  onNavigate: (view: string) => void;
}

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({ onNavigate }) => {
  const { user, balances, refreshUserData } = useAuth();
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await api.getTransactions();
      setRecentTransactions(res.transactions.slice(0, 5));
    } catch (err) {
      console.error('Failed to load recent activity:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const maxLimit = balances?.maxDepositLimit || 20000;
  const lifetimeDeposited = balances?.totalDepositedLifetime || 0;
  const remainingRoom = Math.max(0, maxLimit - lifetimeDeposited);
  const capPercent = Math.min(100, Math.round((lifetimeDeposited / maxLimit) * 100));
  const isCapReached = remainingRoom <= 0;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
            Secure Rewards Wallet
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Welcome back, {user?.name}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Account ID: <span className="font-mono">{user?.id}</span> · KYC Status:{' '}
            <span className={`font-semibold capitalize ${
              user?.kycStatus === 'approved' ? 'text-emerald-600' : 'text-amber-600'
            }`}>
              {user?.kycStatus?.replace('_', ' ')}
            </span>
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setIsDepositOpen(true)}
            disabled={isCapReached}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-xl transition-all shadow-sm flex items-center gap-2"
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span>Deposit Funds</span>
          </button>

          <button
            onClick={() => onNavigate('money-transfer')}
            className="px-3.5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition-all shadow-sm flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5 text-purple-600" />
            <span>Send Money</span>
          </button>

          <button
            onClick={() => onNavigate('bank-transfer')}
            className="px-3.5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition-all shadow-sm flex items-center gap-1.5"
          >
            <Building2 className="w-3.5 h-3.5 text-blue-600" />
            <span>Bank Transfer</span>
          </button>

          <button
            onClick={() => setIsWithdrawOpen(true)}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-all shadow-sm flex items-center gap-2"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Withdraw</span>
          </button>
        </div>
      </div>

      {/* 4 Separate Balances Display */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Available Balance */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-xs font-medium text-slate-300">Total Available Balance</span>
            <span className="p-1.5 bg-white/10 rounded-lg text-emerald-400">
              <Wallet className="w-4 h-4" />
            </span>
          </div>
          <p className="text-3xl font-extrabold mt-3 tabular-nums tracking-tight">
            {formatRupee(balances?.totalAvailable)}
          </p>
          <div className="mt-3 text-[11px] text-slate-300 flex items-center gap-1.5 border-t border-white/10 pt-2">
            <span>Combines Deposit + Bonus + Cashback</span>
          </div>
        </div>

        {/* Deposit Balance */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-medium text-slate-500">Deposit Balance</span>
              <p className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
                {formatRupee(balances?.depositBalance)}
              </p>
            </div>
            <span className="p-1.5 bg-slate-100 rounded-lg text-slate-700">
              <CreditCard className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-4 pt-2 border-t border-slate-100 flex justify-between items-center text-[11px]">
            <span className="text-slate-500">Withdrawable Cash</span>
            <span className="font-semibold text-emerald-700 tabular-nums">100% Eligible</span>
          </div>
        </div>

        {/* Promotional Bonus Balance */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-medium text-slate-500">Promotional Bonus</span>
              <p className="text-2xl font-bold text-emerald-600 mt-1 tabular-nums">
                {formatRupee(balances?.promotionalBonus)}
              </p>
            </div>
            <span className="p-1.5 bg-emerald-50 rounded-lg text-emerald-700">
              <Gift className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-4 pt-2 border-t border-slate-100 flex justify-between items-center text-[11px]">
            <span className="text-slate-500">Earned: ₹50 / ₹500 dep</span>
            <span className="text-slate-700 font-medium">In-App Rewards</span>
          </div>
        </div>

        {/* Cashback Balance */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-medium text-slate-500">Cashback Balance</span>
              <p className="text-2xl font-bold text-indigo-600 mt-1 tabular-nums">
                {formatRupee(balances?.cashbackBalance)}
              </p>
            </div>
            <span className="p-1.5 bg-indigo-50 rounded-lg text-indigo-700">
              <Sparkles className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-4 pt-2 border-t border-slate-100 flex justify-between items-center text-[11px]">
            <span className="text-slate-500">Active Vouchers</span>
            <button
              onClick={() => onNavigate('cashback')}
              className="text-indigo-600 font-semibold hover:underline flex items-center"
            >
              <span>View Hub</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Reward System Rule & ₹20,000 Maximum Deposit Limit Tracker */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                Active Reward System
              </span>
              <span className="text-xs text-slate-500">Lifetime Cap: ₹20,000</span>
            </div>
            <h3 className="text-base font-bold text-slate-900">
              ₹50 Promotional Bonus for Every ₹500 Deposited
            </h3>
            <p className="text-xs text-slate-500 max-w-2xl">
              Every deposit made in blocks of ₹500 automatically credits an instant ₹50 promotional bonus to your wallet. Cumulative lifetime deposits are capped at ₹20,000 per user for regulatory safety.
            </p>
          </div>

          <div className="lg:w-80 shrink-0 bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="flex justify-between items-center text-xs font-medium text-slate-700 mb-2">
              <span>Lifetime Deposit Limit</span>
              <span className="font-bold tabular-nums text-slate-900">
                {formatRupeeShort(lifetimeDeposited)} / {formatRupeeShort(maxLimit)} ({capPercent}%)
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  isCapReached ? 'bg-amber-600' : 'bg-emerald-600'
                }`}
                style={{ width: `${capPercent}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[11px] text-slate-500 mt-2">
              <span>Remaining allowance:</span>
              <span className={`font-semibold tabular-nums ${isCapReached ? 'text-amber-700' : 'text-slate-800'}`}>
                {isCapReached ? 'Cap Reached (Deposits Disabled)' : formatRupeeShort(remainingRoom)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* KYC Warning if pending/not_submitted */}
      {user?.kycStatus !== 'approved' && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-amber-900">KYC Verification Incomplete</h4>
              <p className="text-xs text-amber-700 mt-0.5">
                Your KYC status is currently <strong className="capitalize">{user?.kycStatus.replace('_', ' ')}</strong>. You must complete verification to enable bank and UPI withdrawals.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('kyc')}
            className="px-3 py-1.5 bg-amber-800 hover:bg-amber-900 text-white text-xs font-semibold rounded-lg shrink-0 transition-colors"
          >
            Verify Now
          </button>
        </div>
      )}

      {/* Recent Ledger Activity */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Recent Transactions</h3>
            <p className="text-xs text-slate-500">Real-time ledger entries verified by the core engine.</p>
          </div>
          <button
            onClick={() => onNavigate('transactions')}
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-1"
          >
            <span>View All Activity</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs">
            No transactions found. Deposit funds to start earning rewards!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-medium">
                  <th className="pb-3 font-semibold">Transaction</th>
                  <th className="pb-3 font-semibold">Date &amp; Time</th>
                  <th className="pb-3 font-semibold">Reference</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3">
                      <div className="font-semibold text-slate-900">{tx.title}</div>
                      <div className="text-[11px] text-slate-500">{tx.description}</div>
                    </td>
                    <td className="py-3 text-slate-500 whitespace-nowrap">
                      {formatDate(tx.createdAt)}
                    </td>
                    <td className="py-3 font-mono text-[11px] text-slate-600">
                      {tx.referenceId}
                    </td>
                    <td className="py-3">
                      <span className="capitalize text-slate-700 font-medium">
                        {tx.status}
                      </span>
                    </td>
                    <td className="py-3 text-right font-bold tabular-nums whitespace-nowrap">
                      <span
                        className={
                          tx.type === 'deposit' || tx.type === 'bonus' || tx.type === 'cashback'
                            ? 'text-emerald-600'
                            : 'text-slate-900'
                        }
                      >
                        {tx.type === 'withdrawal' ? '-' : '+'}
                        {formatRupee(tx.amount)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <DepositModal
        isOpen={isDepositOpen}
        onClose={() => setIsDepositOpen(false)}
        onSuccess={() => {
          loadData();
          refreshUserData();
        }}
      />

      <WithdrawalModal
        isOpen={isWithdrawOpen}
        onClose={() => setIsWithdrawOpen(false)}
        onSuccess={() => {
          loadData();
          refreshUserData();
        }}
        onNavigateToKyc={() => onNavigate('kyc')}
      />
    </div>
  );
};
