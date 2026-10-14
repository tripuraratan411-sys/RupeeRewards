import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import { formatRupee, formatRupeeShort, formatDate } from '../../utils/formatters.ts';
import {
  Users,
  ArrowDownLeft,
  ArrowUpRight,
  Gift,
  ShieldCheck,
  AlertCircle,
  FileCheck,
  Settings,
  Clock,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Send,
  Building2,
  AlertTriangle,
  History,
  Bell,
  CheckCircle2,
  XCircle,
  Shield
} from 'lucide-react';

interface AdminDashboardProps {
  onNavigate: (view: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const [metrics, setMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.getAdminMetrics();
      setMetrics(res);
    } catch (err: any) {
      console.error('Failed to load admin metrics:', err);
      setError(err.message || 'Failed to authenticate or fetch administrative metrics.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  if (isLoading && !metrics) {
    return (
      <div className="py-24 text-center">
        <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs font-semibold text-slate-500">Loading Administrative Control Engine...</p>
      </div>
    );
  }

  if (error && !metrics) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center max-w-lg mx-auto my-12">
        <AlertCircle className="w-8 h-8 text-rose-600 mx-auto mb-2" />
        <h3 className="text-sm font-bold text-rose-900">Administrative Metrics Unavailable</h3>
        <p className="text-xs text-rose-700 mt-1">{error}</p>
        <button
          onClick={fetchMetrics}
          className="mt-4 px-4 py-2 bg-rose-600 text-white text-xs font-semibold rounded-lg hover:bg-rose-700 transition-colors"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const totalUsers = metrics?.totalUsers ?? 0;
  const activeUsers = metrics?.activeUsers ?? 0;
  const kycApproved = metrics?.kycApprovedCount ?? 0;
  const kycPending = metrics?.kycPendingCount ?? 0;
  const kycRejected = metrics?.kycRejectedCount ?? 0;

  const totalDeposited = metrics?.totalDeposited ?? 0;
  const totalWithdrawn = metrics?.totalWithdrawn ?? 0;
  const pendingWdCount = metrics?.pendingWithdrawalsCount ?? 0;
  const pendingWdAmount = metrics?.pendingWithdrawalsAmount ?? 0;
  const approvedWdCount = metrics?.approvedWithdrawalsCount ?? 0;
  const rejectedWdCount = metrics?.rejectedWithdrawalsCount ?? 0;

  const totalBonusCredited = metrics?.totalBonusCredited ?? 0;
  const totalCashbackIssued = metrics?.totalCashbackIssued ?? 0;

  const moneyTxVolume = metrics?.moneyTransferVolume ?? 0;
  const moneyTxCount = metrics?.moneyTransferCount ?? 0;
  const bankTxVolume = metrics?.bankTransferVolume ?? 0;
  const bankTxCount = metrics?.bankTransferCount ?? 0;

  const pendingTxCount = metrics?.pendingTransactionsCount ?? 0;
  const failedTxCount = metrics?.failedTransactionsCount ?? 0;

  const securityAlerts = metrics?.securityAlerts || [];
  const recentAuditLogs = metrics?.recentAuditLogs || [];
  const recentNotifications = metrics?.recentNotifications || [];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
              Administrative Control Console
            </span>
            <span className="text-xs text-slate-400">· RBAC Enforced</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Platform Management &amp; Financial Ledger
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time oversight of customer accounts, payout approval desks, transfer rails, and audit trails.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchMetrics}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
            title="Refresh metrics"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={() => onNavigate('admin-rules')}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-2 shadow-sm"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Configure Rules</span>
          </button>
        </div>
      </div>

      {/* Action Alerts Banner */}
      {(pendingWdCount > 0 || kycPending > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {pendingWdCount > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-amber-900">
                    {pendingWdCount} Pending Withdrawal Request{pendingWdCount > 1 ? 's' : ''}
                  </h4>
                  <p className="text-[11px] text-amber-700 mt-0.5">
                    Total volume: <span className="font-semibold tabular-nums">{formatRupee(pendingWdAmount)}</span> awaiting review.
                  </p>
                </div>
              </div>
              <button
                onClick={() => onNavigate('admin-withdrawals')}
                className="px-3 py-1.5 bg-amber-800 hover:bg-amber-900 text-white text-xs font-semibold rounded-lg shrink-0 transition-colors"
              >
                Review Payouts
              </button>
            </div>
          )}

          {kycPending > 0 && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileCheck className="w-5 h-5 text-indigo-600 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-indigo-900">
                    {kycPending} Identity Verification Submission{kycPending > 1 ? 's' : ''}
                  </h4>
                  <p className="text-[11px] text-indigo-700 mt-0.5">
                    Awaiting PAN &amp; Government ID approval for payout eligibility.
                  </p>
                </div>
              </div>
              <button
                onClick={() => onNavigate('admin-kyc')}
                className="px-3 py-1.5 bg-indigo-800 hover:bg-indigo-900 text-white text-xs font-semibold rounded-lg shrink-0 transition-colors"
              >
                Verify KYC
              </button>
            </div>
          )}
        </div>
      )}

      {/* Core Platform Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total & Active Users */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-slate-500">Customer Base</p>
              <p className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
                {totalUsers} <span className="text-xs font-medium text-emerald-600">({activeUsers} Active)</span>
              </p>
            </div>
            <div className="p-2 bg-slate-100 rounded-lg text-slate-700">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <button
            onClick={() => onNavigate('admin-users')}
            className="mt-4 pt-2 border-t border-slate-100 w-full flex justify-between items-center text-[11px] text-slate-500 hover:text-slate-900"
          >
            <span>Manage accounts &amp; limits</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* KYC Breakdown */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-slate-500">KYC Status</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm font-bold text-emerald-600 tabular-nums">{kycApproved} Approved</span>
                <span className="text-slate-300">·</span>
                <span className="text-sm font-bold text-amber-600 tabular-nums">{kycPending} Pending</span>
                <span className="text-slate-300">·</span>
                <span className="text-sm font-bold text-rose-600 tabular-nums">{kycRejected} Rej</span>
              </div>
            </div>
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-700">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <button
            onClick={() => onNavigate('admin-kyc')}
            className="mt-4 pt-2 border-t border-slate-100 w-full flex justify-between items-center text-[11px] text-slate-500 hover:text-slate-900"
          >
            <span>Open KYC compliance desk</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Total Deposits */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-slate-500">Total Deposits Processed</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1 tabular-nums">
                {formatRupee(totalDeposited)}
              </p>
            </div>
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-700">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <button
            onClick={() => onNavigate('admin-deposits')}
            className="mt-4 pt-2 border-t border-slate-100 w-full flex justify-between items-center text-[11px] text-slate-500 hover:text-slate-900"
          >
            <span>View deposit ledger records</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Total Withdrawals & Payouts */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-slate-500">Total Settled Withdrawals</p>
              <p className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
                {formatRupee(totalWithdrawn)}
              </p>
            </div>
            <div className="p-2 bg-slate-100 rounded-lg text-slate-700">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 pt-2 border-t border-slate-100 flex justify-between items-center text-[11px]">
            <span className="text-slate-500">
              {pendingWdCount} Pend · {approvedWdCount} Appr · {rejectedWdCount} Rej
            </span>
            <button
              onClick={() => onNavigate('admin-withdrawals')}
              className="text-emerald-700 font-semibold hover:underline flex items-center gap-0.5"
            >
              <span>Manage</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Rewards, Cashback, & Transfer Activity Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Bonuses Issued */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-slate-500">Total Bonuses Issued</p>
              <p className="text-2xl font-bold text-emerald-700 mt-1 tabular-nums">
                {formatRupee(totalBonusCredited)}
              </p>
            </div>
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-700">
              <Gift className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 pt-2 border-t border-slate-100 flex justify-between items-center text-[11px] text-slate-500">
            <span>Rule: ₹50 / ₹500 dep block</span>
            <button
              onClick={() => onNavigate('admin-rules')}
              className="text-emerald-600 font-semibold hover:underline"
            >
              Edit Rule
            </button>
          </div>
        </div>

        {/* Total Cashback Issued */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-slate-500">Total Cashback Issued</p>
              <p className="text-2xl font-bold text-indigo-600 mt-1 tabular-nums">
                {formatRupee(totalCashbackIssued)}
              </p>
            </div>
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-700">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 pt-2 border-t border-slate-100 flex justify-between items-center text-[11px] text-slate-500">
            <span>Rebate: {metrics?.cashbackRule?.cashbackPercentage || 5}% standard</span>
            <button
              onClick={() => onNavigate('admin-rules')}
              className="text-indigo-600 font-semibold hover:underline"
            >
              Settings
            </button>
          </div>
        </div>

        {/* Money Transfer Activity */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-slate-500">Money Transfer Activity (P2P)</p>
              <p className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
                {formatRupee(moneyTxVolume)}
              </p>
            </div>
            <div className="p-2 bg-purple-50 rounded-lg text-purple-700">
              <Send className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 pt-2 border-t border-slate-100 flex justify-between items-center text-[11px] text-slate-500">
            <span>{moneyTxCount} total peer transfers</span>
            <span className="font-semibold text-purple-700">P2P Wallet Rail</span>
          </div>
        </div>

        {/* Bank Transfer Activity */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-slate-500">Bank Transfer Activity (IMPS)</p>
              <p className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">
                {formatRupee(bankTxVolume)}
              </p>
            </div>
            <div className="p-2 bg-blue-50 rounded-lg text-blue-700">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 pt-2 border-t border-slate-100 flex justify-between items-center text-[11px] text-slate-500">
            <span>{bankTxCount} verified bank payouts</span>
            <span className="font-semibold text-blue-700">IMPS Rail</span>
          </div>
        </div>
      </div>

      {/* Transaction Integrity & Security Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Transaction Integrity Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-600" />
              <h3 className="font-bold text-slate-900 text-sm">Ledger Integrity &amp; Queue</h3>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
              Synced
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-600">Pending Transactions:</span>
              <span className={`font-bold tabular-nums ${pendingTxCount > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
                {pendingTxCount} tx
              </span>
            </div>
            <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-600">Failed / Rejected Transactions:</span>
              <span className={`font-bold tabular-nums ${failedTxCount > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                {failedTxCount} tx
              </span>
            </div>
            <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-600">Total Balance Liability:</span>
              <span className="font-bold tabular-nums text-slate-900">
                {formatRupee(metrics?.activeLiability || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-600">Double-Credit Prevention:</span>
              <span className="font-semibold text-emerald-700">Idempotency Active</span>
            </div>
          </div>
        </div>

        {/* Security Alerts Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm md:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <h3 className="font-bold text-slate-900 text-sm">Security Alerts &amp; Compliance Watch</h3>
            </div>
            <span className="text-[11px] text-slate-400">Automated Guardrails</span>
          </div>

          <div className="space-y-2.5">
            {securityAlerts.length > 0 ? (
              securityAlerts.map((alert: any) => (
                <div
                  key={alert.id}
                  className={`p-3 rounded-xl border flex items-start gap-3 text-xs ${
                    alert.level === 'warning'
                      ? 'bg-amber-50 border-amber-200 text-amber-900'
                      : alert.level === 'danger'
                      ? 'bg-rose-50 border-rose-200 text-rose-900'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  }`}
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium">{alert.message}</p>
                    <span className="text-[10px] opacity-75 mt-0.5 block uppercase tracking-wider font-semibold">
                      Severity: {alert.level}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>All security controls operational. No critical compliance alerts detected.</span>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
            <span className="text-slate-500">SHA-256 Hashing · Server Session Authorization</span>
            <button
              onClick={() => onNavigate('admin-audit')}
              className="text-emerald-700 font-semibold hover:underline flex items-center gap-1"
            >
              <span>View Audit Trail</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Two Column: Recent Audit Logs & System Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Audit Logs Preview */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-slate-700" />
              <h3 className="font-bold text-slate-900 text-sm">Recent Audit Logs</h3>
            </div>
            <button
              onClick={() => onNavigate('admin-audit')}
              className="text-xs text-emerald-700 font-semibold hover:underline"
            >
              View All ({recentAuditLogs.length > 0 ? 'Full Trail' : 'Empty'})
            </button>
          </div>

          <div className="space-y-2.5">
            {recentAuditLogs.length > 0 ? (
              recentAuditLogs.map((log: any) => (
                <div key={log.id} className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg text-xs">
                  <div className="flex justify-between items-start">
                    <span className="font-bold font-mono text-[11px] text-slate-800 uppercase">
                      {log.action}
                    </span>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap">
                      {formatDate(log.timestamp)}
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px] mt-1">{log.details}</p>
                  <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-2">
                    <span>By: {log.adminEmail}</span>
                    <span>·</span>
                    <span className="font-mono">IP: {log.ipAddress}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">No recent audit logs.</p>
            )}
          </div>
        </div>

        {/* System Notifications Preview */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-slate-700" />
              <h3 className="font-bold text-slate-900 text-sm">System Notifications &amp; Broadcasts</h3>
            </div>
            <button
              onClick={() => onNavigate('admin-notifications')}
              className="text-xs text-emerald-700 font-semibold hover:underline"
            >
              Manage &amp; Broadcast
            </button>
          </div>

          <div className="space-y-2.5">
            {recentNotifications.length > 0 ? (
              recentNotifications.map((n: any) => (
                <div key={n.id} className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg text-xs">
                  <div className="flex justify-between items-start">
                    <span className="font-semibold text-slate-900">{n.title}</span>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap">
                      {formatDate(n.createdAt)}
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px] mt-1 line-clamp-2">{n.message}</p>
                  <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-2">
                    <span className="uppercase font-semibold text-emerald-700">Category: {n.category}</span>
                    <span>·</span>
                    <span>Target: {n.targetRole || 'all'}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">No system notifications found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
