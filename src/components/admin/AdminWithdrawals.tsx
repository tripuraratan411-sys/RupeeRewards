import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import { formatRupee, formatDate } from '../../utils/formatters.ts';
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Search,
  Settings,
  Sliders,
  Save,
  RefreshCw,
  Info
} from 'lucide-react';
import type { WithdrawalRequest, TransactionStatus, WithdrawalRuleConfig } from '../../types/index.ts';

export const AdminWithdrawals: React.FC = () => {
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Limit Configuration Panel State
  const [showConfig, setShowConfig] = useState(false);
  const [withdrawalRule, setWithdrawalRule] = useState<WithdrawalRuleConfig | null>(null);
  const [maxPerDay, setMaxPerDay] = useState(1);
  const [dailyCap, setDailyCap] = useState(10000);
  const [minAmount, setMinAmount] = useState(200);
  const [kycMandatory, setKycMandatory] = useState(true);
  const [upiFee, setUpiFee] = useState(0);
  const [impsFee, setImpsFee] = useState(10);
  const [isRuleActive, setIsRuleActive] = useState(true);
  const [isSavingRule, setIsSavingRule] = useState(false);
  const [ruleSaveMsg, setRuleSaveMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Action Modal State
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [statusToSet, setStatusToSet] = useState<TransactionStatus>('processing');
  const [adminNote, setAdminNote] = useState('');
  const [payoutReference, setPayoutReference] = useState('');
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [wRes, rRes] = await Promise.all([
        api.getAdminWithdrawals(),
        api.getWithdrawalRule()
      ]);
      setWithdrawals(wRes.withdrawals);
      setWithdrawalRule(rRes.rule);
      setMaxPerDay(rRes.rule.maxWithdrawalsPerDay);
      setDailyCap(rRes.rule.maxDailyAmount);
      setMinAmount(rRes.rule.minWithdrawalAmount);
      setKycMandatory(rRes.rule.kycRequired);
      setUpiFee(rRes.rule.upiFee);
      setImpsFee(rRes.rule.impsFee);
      setIsRuleActive(rRes.rule.isActive);
    } catch (err) {
      console.error('Failed to load withdrawals or rules:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingRule(true);
    setRuleSaveMsg(null);

    try {
      const res = await api.updateWithdrawalRule({
        maxWithdrawalsPerDay: maxPerDay,
        maxDailyAmount: dailyCap,
        minWithdrawalAmount: minAmount,
        kycRequired: kycMandatory,
        upiFee,
        impsFee,
        isActive: isRuleActive
      });

      setRuleSaveMsg({ type: 'success', text: res.message || 'Withdrawal limits updated and logged.' });
      setWithdrawalRule(res.rule);
      setTimeout(() => setRuleSaveMsg(null), 4000);
    } catch (err: any) {
      setRuleSaveMsg({ type: 'error', text: err.message || 'Failed to update withdrawal limits' });
    } finally {
      setIsSavingRule(false);
    }
  };

  const handleOpenAction = (req: any, targetStatus: TransactionStatus) => {
    setSelectedRequest(req);
    setStatusToSet(targetStatus);
    setAdminNote('');
    setActionError(null);
    setPayoutReference(targetStatus === 'completed' ? `UTR-${Date.now().toString().slice(-8)}${Math.floor(1000 + Math.random() * 9000)}` : '');
  };

  const handleConfirmStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;

    if (statusToSet === 'rejected' && !adminNote.trim()) {
      setActionError('A rejection reason is strictly required for the compliance audit log.');
      return;
    }

    setIsSubmitting(true);
    setActionError(null);

    try {
      await api.updateWithdrawalStatus(selectedRequest.id, {
        status: statusToSet,
        adminNote: adminNote.trim(),
        payoutReference: payoutReference.trim() || undefined
      });

      setActionMsg(`Withdrawal ${selectedRequest.id} moved to ${statusToSet.toUpperCase()}`);
      setSelectedRequest(null);
      await loadData();
      setTimeout(() => setActionMsg(null), 3500);
    } catch (err: any) {
      setActionError(err.message || 'Status update failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = withdrawals.filter(w => {
    if (filter !== 'all' && w.status !== filter) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      w.id.toLowerCase().includes(q) ||
      w.userName.toLowerCase().includes(q) ||
      w.userEmail.toLowerCase().includes(q) ||
      (w.payoutReference && w.payoutReference.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
              Withdrawal Desk
            </span>
            <span className="text-xs text-slate-400">· Authorization Required</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">Withdrawal Management</h2>
          <p className="text-xs text-slate-500 mt-1">
            Review user eligibility, enforce daily limits, approve payout orders, and log immutable rejection reasons.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className={`px-3.5 py-2 text-xs font-semibold rounded-xl border transition-colors flex items-center gap-1.5 shadow-sm ${
              showConfig
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{showConfig ? 'Hide Limits Config' : 'Configure Limits'}</span>
          </button>
          <button
            onClick={loadData}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
            title="Refresh withdrawals"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {actionMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionMsg}</span>
        </div>
      )}

      {/* WITHDRAWAL LIMIT CONFIGURATION PANEL */}
      {showConfig && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Settings className="w-4 h-4 text-emerald-600" />
                <span>Withdrawal Rules &amp; Daily Limits Policy</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Every limit update is authorized server-side and recorded in the immutable audit log.
              </p>
            </div>
            {withdrawalRule?.updatedBy && (
              <span className="text-[11px] text-slate-400">
                Last modified: {formatDate(withdrawalRule.updatedAt)} by {withdrawalRule.updatedBy}
              </span>
            )}
          </div>

          {ruleSaveMsg && (
            <div className={`p-3 mb-4 rounded-xl text-xs font-semibold flex items-center gap-2 ${
              ruleSaveMsg.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-rose-50 border border-rose-200 text-rose-800'
            }`}>
              <Info className="w-4 h-4 shrink-0" />
              <span>{ruleSaveMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleSaveRule} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Max Withdrawals Per Day (Strict limit)
              </label>
              <input
                type="number"
                min={1}
                max={5}
                required
                value={maxPerDay}
                onChange={(e) => setMaxPerDay(parseInt(e.target.value, 10) || 1)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">Default rule: strictly 1 withdrawal per day.</p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Max Daily Withdrawal Limit (₹)
              </label>
              <input
                type="number"
                min={500}
                max={100000}
                required
                value={dailyCap}
                onChange={(e) => setDailyCap(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">Default rule: maximum ₹10,000 daily cap.</p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Minimum Withdrawal Amount (₹)
              </label>
              <input
                type="number"
                min={50}
                max={2000}
                required
                value={minAmount}
                onChange={(e) => setMinAmount(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">Default rule: minimum ₹200.</p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                UPI Fee (₹)
              </label>
              <input
                type="number"
                min={0}
                value={upiFee}
                onChange={(e) => setUpiFee(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">Standard: ₹0 for UPI payouts.</p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                IMPS / Bank Fee (₹)
              </label>
              <input
                type="number"
                min={0}
                value={impsFee}
                onChange={(e) => setImpsFee(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">Standard: ₹10 for IMPS bank transfer.</p>
            </div>

            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700 mb-2">
                <input
                  type="checkbox"
                  checked={kycMandatory}
                  onChange={(e) => setKycMandatory(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>KYC Identity Verification Mandatory</span>
              </label>
              <button
                type="submit"
                disabled={isSavingRule}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSavingRule ? 'Updating...' : 'Save Withdrawal Limits'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
          {[
            { id: 'all', label: 'All Requests' },
            { id: 'pending', label: 'Pending Review' },
            { id: 'approved', label: 'Approved' },
            { id: 'processing', label: 'In Processing' },
            { id: 'completed', label: 'Completed Payout' },
            { id: 'rejected', label: 'Rejected & Refunded' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setFilter(t.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                filter === t.id ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.label} ({t.id === 'all' ? withdrawals.length : withdrawals.filter(w => w.status === t.id).length})
            </button>
          ))}
        </div>

        <div className="relative sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search request ID, email, UTR..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Table with User Eligibility & Usage */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-xs text-slate-400">Loading payout queue...</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-500">No withdrawal records matching this filter.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-3.5 px-4">Customer &amp; Eligibility</th>
                  <th className="py-3.5 px-4">Daily Usage &amp; Limit</th>
                  <th className="py-3.5 px-4">Amount &amp; Fee</th>
                  <th className="py-3.5 px-4">Destination Details</th>
                  <th className="py-3.5 px-4">Date &amp; Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(w => {
                  const isKycValid = w.userKycStatus === 'approved';
                  return (
                    <tr key={w.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{w.userName}</div>
                        <div className="text-[11px] text-slate-500">{w.userEmail}</div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${
                            isKycValid ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                          }`}>
                            KYC: {w.userKycStatus || 'unverified'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Dep: {formatRupee(w.userTotalDepositBalance)}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-slate-800 font-medium">
                          Today Withdrawn: <span className="font-bold tabular-nums">{formatRupee(w.userDailyWithdrawnAmount || 0)}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Remaining Daily Limit: <strong className="text-emerald-700 tabular-nums">{formatRupee(w.userDailyRemainingLimit || 0)}</strong>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Daily Cap: ₹10,000 (Max 1/day)
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 tabular-nums text-sm">{formatRupee(w.amount)}</div>
                        <div className="text-[11px] text-slate-500">
                          Fee: {formatRupee(w.fee)} · Net: <strong className="text-emerald-700 tabular-nums">{formatRupee(w.netPayout)}</strong>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800 uppercase text-[11px]">{w.method}</div>
                        <div className="text-[11px] text-slate-600 mt-0.5">
                          {w.method === 'upi' ? (
                            <span>VPA: {w.payoutDetails?.upiId}</span>
                          ) : (
                            <span>A/C: {w.payoutDetails?.accountNumber} ({w.payoutDetails?.ifscCode})</span>
                          )}
                        </div>
                        {w.payoutReference && (
                          <div className="text-[10px] font-mono text-emerald-800 mt-0.5">
                            Ref: {w.payoutReference}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                          w.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-700'
                            : w.status === 'processing'
                            ? 'bg-indigo-50 text-indigo-700'
                            : w.status === 'approved'
                            ? 'bg-blue-50 text-blue-700'
                            : w.status === 'pending'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}>
                          {w.status}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-1">
                          {formatDate(w.createdAt)}
                        </div>
                        {w.adminNote && (
                          <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1 italic max-w-xs">
                            Note: {w.adminNote}
                          </p>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-1">
                        {w.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleOpenAction(w, 'approved')}
                              className="px-2.5 py-1 text-xs font-semibold rounded bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleOpenAction(w, 'processing')}
                              className="px-2.5 py-1 text-xs font-semibold rounded bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
                            >
                              Process
                            </button>
                            <button
                              onClick={() => handleOpenAction(w, 'rejected')}
                              className="px-2.5 py-1 text-xs font-semibold rounded bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors"
                            >
                              Reject &amp; Reason
                            </button>
                          </>
                        )}

                        {(w.status === 'approved' || w.status === 'processing') && (
                          <>
                            <button
                              onClick={() => handleOpenAction(w, 'completed')}
                              className="px-2.5 py-1 text-xs font-semibold rounded bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                            >
                              Complete Payout
                            </button>
                            <button
                              onClick={() => handleOpenAction(w, 'rejected')}
                              className="px-2.5 py-1 text-xs font-semibold rounded bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors"
                            >
                              Reject &amp; Refund
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Action Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">
              Update Withdrawal: {statusToSet.toUpperCase()}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              User: <span className="font-semibold text-slate-700">{selectedRequest.userEmail}</span> · Net Payout: <strong className="text-emerald-700">{formatRupee(selectedRequest.netPayout)}</strong>
            </p>

            {actionError && (
              <div className="p-3 my-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs">
                {actionError}
              </div>
            )}

            <form onSubmit={handleConfirmStatus} className="space-y-4 mt-4 text-xs">
              {statusToSet === 'completed' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Bank UTR / Payout Reference Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={payoutReference}
                    onChange={(e) => setPayoutReference(e.target.value)}
                    placeholder="e.g. UTR-20261014-998822"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Proof of settlement recorded into audit trail.</p>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Administrative Note / Recorded Reason {statusToSet === 'rejected' && <span className="text-rose-600">*</span>}
                </label>
                <textarea
                  rows={3}
                  required={statusToSet === 'rejected'}
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder={
                    statusToSet === 'rejected'
                      ? 'State the reason for rejection (e.g. Invalid IFSC code, KYC name discrepancy, daily quota exceeded). Funds will be refunded to user wallet.'
                      : 'Optional internal tracking note or bank transaction advice...'
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {statusToSet === 'rejected' && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800">
                  <p className="font-semibold">Automatic Ledger Refund</p>
                  <p className="text-[11px] mt-0.5">
                    Rejecting this withdrawal will automatically credit {formatRupee(selectedRequest.amount)} back to the customer's available withdrawable balance and log an immutable audit trail.
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedRequest(null)}
                  className="w-1/2 py-2 border border-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-1/2 py-2 text-white font-semibold rounded-lg transition-colors ${
                    statusToSet === 'rejected'
                      ? 'bg-rose-600 hover:bg-rose-700'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {isSubmitting ? 'Updating...' : `Confirm ${statusToSet}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
