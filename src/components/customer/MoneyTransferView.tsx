import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import { formatRupee, formatDate } from '../../utils/formatters.ts';
import {
  Send,
  Search,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  User,
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  History
} from 'lucide-react';
import type { MoneyTransfer } from '../../types/index.ts';

export const MoneyTransferView: React.FC = () => {
  const { user, balances, refreshUserData } = useAuth();
  const [recipientQuery, setRecipientQuery] = useState('');
  const [recipient, setRecipient] = useState<any | null>(null);
  const [amount, setAmount] = useState<number>(200);
  const [customAmount, setCustomAmount] = useState<string>('200');
  const [note, setNote] = useState('');
  const [otpCode, setOtpCode] = useState('123456');
  const [step, setStep] = useState<'lookup' | 'confirm' | 'success'>('lookup');
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completedTransfer, setCompletedTransfer] = useState<MoneyTransfer | null>(null);

  const [history, setHistory] = useState<MoneyTransfer[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  const loadHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const res = await api.getMoneyTransferHistory();
      setHistory(res.transfers);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientQuery.trim()) return;
    setIsSearching(true);
    setError(null);

    try {
      const res = await api.lookupRecipient(recipientQuery.trim());
      setRecipient(res.recipient);
    } catch (err: any) {
      setError(err.message || 'Recipient not found. Please verify details.');
      setRecipient(null);
    } finally {
      setIsSearching(false);
    }
  };

  const handleProceedToConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (user?.kycStatus !== 'approved') {
      setError('KYC identity verification is required before sending transfers.');
      return;
    }

    if (amount < 50) {
      setError('Minimum transfer amount is ₹50.');
      return;
    }

    if (amount > 10000) {
      setError('Maximum transfer amount is ₹10,000 per transaction.');
      return;
    }

    const withdrawable = balances?.withdrawableBalance || 0;
    if (amount > withdrawable) {
      setError(`Insufficient withdrawable balance. Your available cash balance is ${formatRupee(withdrawable)}.`);
      return;
    }

    setStep('confirm');
  };

  const handleFinalSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const idempotencyKey = `mt_${Date.now()}_${Math.random()}`;
      const res = await api.sendMoneyTransfer({
        recipientId: recipient.id,
        amount,
        note,
        verificationOtp: otpCode,
        idempotencyKey
      });

      setCompletedTransfer(res.transfer);
      setStep('success');
      await refreshUserData();
      await loadHistory();
    } catch (err: any) {
      setError(err.message || 'Transfer failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setStep('lookup');
    setRecipient(null);
    setRecipientQuery('');
    setAmount(200);
    setCustomAmount('200');
    setNote('');
    setError(null);
    setCompletedTransfer(null);
  };

  const withdrawable = balances?.withdrawableBalance || 0;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">P2P Money Transfer</h2>
        <p className="text-sm text-slate-500 mt-1">
          Instant, fee-free money transfers directly to other registered RupeeRewards wallets.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Transfer Interface (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            {/* Balance strip */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl mb-5 flex justify-between items-center text-xs">
              <span className="text-slate-600 font-medium">Available Transferable Balance:</span>
              <span className="font-bold text-slate-900 tabular-nums text-sm">
                {formatRupee(withdrawable)}
              </span>
            </div>

            {user?.kycStatus !== 'approved' && (
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2.5 mb-5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">KYC Verification Required</p>
                  <p className="text-[11px] mt-0.5 text-amber-700">
                    To comply with digital payment directives, peer-to-peer transfers are unlocked once your identity documents are approved.
                  </p>
                </div>
              </div>
            )}

            {/* STEP 1: Lookup and Amount */}
            {step === 'lookup' && (
              <div className="space-y-4">
                {/* Recipient Lookup */}
                <form onSubmit={handleLookup} className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    Find Recipient (Phone, Email, or Wallet ID)
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. priya.patel@example.com or 9812345678"
                        value={recipientQuery}
                        onChange={(e) => setRecipientQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isSearching || !recipientQuery.trim()}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap"
                    >
                      {isSearching ? 'Searching...' : 'Find User'}
                    </button>
                  </div>
                </form>

                {/* Recipient Card */}
                {recipient && (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs animate-in fade-in">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                        {recipient.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                          <span>{recipient.name}</span>
                          <span className="text-[10px] bg-emerald-200 text-emerald-800 font-semibold px-1.5 py-0.2 rounded">
                            Verified User
                          </span>
                        </p>
                        <p className="text-slate-500 text-[11px]">{recipient.email} · {recipient.phone}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setRecipient(null)}
                      className="text-xs text-slate-400 hover:text-slate-600"
                    >
                      Change
                    </button>
                  </div>
                )}

                {/* Transfer Amount & Details */}
                {recipient && (
                  <form onSubmit={handleProceedToConfirm} className="space-y-4 pt-2 border-t border-slate-100">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Transfer Amount (₹50 to ₹10,000)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-sm">₹</span>
                        <input
                          type="text"
                          required
                          value={customAmount}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, '');
                            setCustomAmount(val);
                            setAmount(parseInt(val, 10) || 0);
                          }}
                          className="w-full pl-8 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 tabular-nums"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Note / Purpose (Optional)
                      </label>
                      <input
                        type="text"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="e.g. Dinner split, Gift, Reimbursement"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    {error && (
                      <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                        <span>{error}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={amount < 50 || amount > withdrawable || user?.kycStatus !== 'approved'}
                      className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
                    >
                      <span>Review Transfer Details</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* STEP 2: Review & OTP Verification */}
            {step === 'confirm' && recipient && (
              <form onSubmit={handleFinalSend} className="space-y-4">
                <h3 className="text-base font-bold text-slate-900">Confirm Transfer Summary</h3>
                <p className="text-xs text-slate-500">
                  Please inspect the transfer recipient and amount before completing verification.
                </p>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2.5">
                  <div className="flex justify-between text-slate-600">
                    <span>Recipient Name:</span>
                    <strong className="text-slate-900">{recipient.name}</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Recipient Account:</span>
                    <span className="font-mono text-slate-800">{recipient.email}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Transfer Amount:</span>
                    <strong className="text-slate-900 tabular-nums">{formatRupee(amount)}</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Transfer Processing Fee:</span>
                    <strong className="text-emerald-700">FREE (₹0.00)</strong>
                  </div>
                  {note && (
                    <div className="flex justify-between text-slate-600">
                      <span>Message / Note:</span>
                      <span className="italic text-slate-800">{note}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-sm text-slate-900">
                    <span>Total Debited from Wallet:</span>
                    <span className="text-emerald-700 tabular-nums">{formatRupee(amount)}</span>
                  </div>
                </div>

                {/* OTP Security Verification */}
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-emerald-950 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      Two-Step Transfer Verification
                    </span>
                    <span className="text-[11px] text-emerald-700 font-mono">Demo PIN: 123456</span>
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="Enter 6-digit code"
                    className="w-full text-center text-lg font-mono tracking-widest py-1.5 bg-white border border-emerald-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {error && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setStep('lookup')}
                    className="w-1/3 py-2.5 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || otpCode.length !== 6}
                    className="w-2/3 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    {isSubmitting ? 'Transferring...' : `Authorize Transfer of ${formatRupee(amount)}`}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: Success Screen */}
            {step === 'success' && completedTransfer && (
              <div className="text-center py-4 space-y-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Transfer Completed!</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {formatRupee(completedTransfer.amount)} successfully transferred to {completedTransfer.recipientName}.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-left text-xs space-y-2">
                  <div className="flex justify-between text-slate-600">
                    <span>Reference ID:</span>
                    <span className="font-mono text-slate-900 font-semibold">{completedTransfer.referenceId}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Recipient Email:</span>
                    <span className="text-slate-900">{completedTransfer.recipientEmail}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Transfer Amount:</span>
                    <span className="font-bold text-emerald-700 tabular-nums">{formatRupee(completedTransfer.amount)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Timestamp:</span>
                    <span className="text-slate-500">{formatDate(completedTransfer.createdAt)}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={resetForm}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-colors"
                >
                  Send Another Transfer
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Transfer History (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
              <History className="w-4 h-4 text-slate-700" />
              <span>Money Transfer History</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              All peer-to-peer wallet transfers sent and received.
            </p>

            {isLoadingHistory ? (
              <div className="py-12 text-center text-xs text-slate-400">Loading history...</div>
            ) : history.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">No transfers recorded yet.</div>
            ) : (
              <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                {history.map((t) => {
                  const isOutgoing = t.senderId === user?.id;
                  return (
                    <div
                      key={t.id}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`p-1.5 rounded-lg shrink-0 ${
                          isOutgoing ? 'bg-slate-200 text-slate-700' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {isOutgoing ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">
                            {isOutgoing ? `To: ${t.recipientName}` : `From: ${t.senderName}`}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono">{t.referenceId} · {formatDate(t.createdAt)}</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className={`font-bold tabular-nums ${
                          isOutgoing ? 'text-slate-900' : 'text-emerald-700'
                        }`}>
                          {isOutgoing ? '-' : '+'}{formatRupee(t.amount)}
                        </p>
                        <span className="text-[10px] text-slate-400 capitalize">{t.status}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
