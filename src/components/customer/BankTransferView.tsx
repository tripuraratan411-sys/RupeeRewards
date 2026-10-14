import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import { formatRupee, formatDate } from '../../utils/formatters.ts';
import {
  Building2,
  Plus,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Clock,
  History,
  X
} from 'lucide-react';
import type { BankAccount, BankTransfer } from '../../types/index.ts';

export const BankTransferView: React.FC = () => {
  const { user, balances, refreshUserData } = useAuth();
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [amount, setAmount] = useState<number>(500);
  const [customAmount, setCustomAmount] = useState<string>('500');
  const [note, setNote] = useState('');
  const [otpCode, setOtpCode] = useState('123456');
  const [step, setStep] = useState<'input' | 'confirm' | 'success'>('input');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completedTransfer, setCompletedTransfer] = useState<BankTransfer | null>(null);

  // New Account Modal
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [holderName, setHolderName] = useState(user?.name || '');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [bankName, setBankName] = useState('HDFC Bank');
  const [accountModalError, setAccountModalError] = useState<string | null>(null);
  const [isAddingAccount, setIsAddingAccount] = useState(false);

  // Transfer History
  const [history, setHistory] = useState<BankTransfer[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  const loadData = async () => {
    setIsLoadingHistory(true);
    try {
      const [accRes, histRes] = await Promise.all([
        api.getBankAccounts(),
        api.getBankTransferHistory()
      ]);
      setBankAccounts(accRes.accounts);
      if (accRes.accounts.length > 0 && !selectedAccountId) {
        setSelectedAccountId(accRes.accounts[0].id);
      }
      setHistory(histRes.transfers);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setAccountModalError(null);
    setIsAddingAccount(true);

    try {
      const res = await api.addBankAccount({
        accountHolderName: holderName,
        accountNumber,
        ifscCode,
        bankName
      });

      setShowAddAccount(false);
      setAccountNumber('');
      setIfscCode('');
      await loadData();
      setSelectedAccountId(res.account.id);
    } catch (err: any) {
      setAccountModalError(err.message || 'Failed to add bank account.');
    } finally {
      setIsAddingAccount(false);
    }
  };

  const handleProceedToConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (user?.kycStatus !== 'approved') {
      setError('KYC verification is mandatory before transferring funds to external bank accounts.');
      return;
    }

    if (!selectedAccountId) {
      setError('Please add or select a bank account.');
      return;
    }

    if (amount < 100) {
      setError('Minimum bank transfer amount is ₹100.');
      return;
    }

    if (amount > 10000) {
      setError('Maximum bank transfer amount is ₹10,000 per transaction.');
      return;
    }

    const withdrawable = balances?.withdrawableBalance || 0;
    if (amount > withdrawable) {
      setError(`Insufficient withdrawable balance. Your available cash is ${formatRupee(withdrawable)}.`);
      return;
    }

    setStep('confirm');
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const idempotencyKey = `bt_${Date.now()}_${Math.random()}`;
      const res = await api.initiateBankTransfer({
        bankAccountId: selectedAccountId,
        amount,
        note,
        verificationOtp: otpCode,
        idempotencyKey
      });

      setCompletedTransfer(res.transfer);
      setStep('success');
      await refreshUserData();
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Bank transfer failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setStep('input');
    setAmount(500);
    setCustomAmount('500');
    setNote('');
    setError(null);
    setCompletedTransfer(null);
  };

  const withdrawable = balances?.withdrawableBalance || 0;
  const selectedAccount = bankAccounts.find(a => a.id === selectedAccountId);
  const fee = 5;
  const netAmount = Math.max(0, amount - fee);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Direct Bank Transfer</h2>
        <p className="text-sm text-slate-500 mt-1">
          Disburse funds from your wallet to any verified Indian commercial bank account via 24x7 IMPS.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Transfer Interface (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            {/* Balance strip */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl mb-5 flex justify-between items-center text-xs">
              <span className="text-slate-600 font-medium">Available Cash for Transfer:</span>
              <span className="font-bold text-slate-900 tabular-nums text-sm">
                {formatRupee(withdrawable)}
              </span>
            </div>

            {user?.kycStatus !== 'approved' && (
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2.5 mb-5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">KYC Verification Mandatory</p>
                  <p className="text-[11px] mt-0.5 text-amber-700">
                    Bank transfers can only be processed once identity documentation is approved.
                  </p>
                </div>
              </div>
            )}

            {/* STEP 1: Input details */}
            {step === 'input' && (
              <form onSubmit={handleProceedToConfirm} className="space-y-4">
                {/* Select Bank Account */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-semibold text-slate-700">Select Beneficiary Bank Account</label>
                    <button
                      type="button"
                      onClick={() => setShowAddAccount(true)}
                      className="text-xs text-emerald-600 font-semibold hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add New Bank</span>
                    </button>
                  </div>

                  {bankAccounts.length === 0 ? (
                    <div className="p-4 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-500">
                      <p>No verified bank accounts found.</p>
                      <button
                        type="button"
                        onClick={() => setShowAddAccount(true)}
                        className="mt-2 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold"
                      >
                        Add Bank Account
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {bankAccounts.map((acc) => (
                        <label
                          key={acc.id}
                          className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                            selectedAccountId === acc.id
                              ? 'border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-600'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="bank_account"
                              checked={selectedAccountId === acc.id}
                              onChange={() => setSelectedAccountId(acc.id)}
                              className="text-emerald-600 focus:ring-emerald-500"
                            />
                            <div>
                              <p className="text-xs font-bold text-slate-900">{acc.bankName}</p>
                              <p className="text-[11px] text-slate-500">
                                A/C: •••• {acc.accountNumber.slice(-4)} · IFSC: {acc.ifscCode}
                              </p>
                            </div>
                          </div>
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded">
                            Verified
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Transfer Amount (₹100 to ₹10,000)
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
                  <div className="flex justify-between items-center text-[11px] text-slate-500 mt-1">
                    <span>Processing Fee: ₹5.00 IMPS Flat</span>
                    <span>Net Disbursed: <strong className="text-slate-800">{formatRupee(netAmount)}</strong></span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Transfer Note / Reference (Optional)
                  </label>
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="e.g. Monthly rent, Savings transfer"
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
                  disabled={amount < 100 || amount > withdrawable || user?.kycStatus !== 'approved' || !selectedAccountId}
                  className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <span>Review Bank Payout</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* STEP 2: Review Screen */}
            {step === 'confirm' && selectedAccount && (
              <form onSubmit={handleFinalSubmit} className="space-y-4">
                <h3 className="text-base font-bold text-slate-900">Review Bank Transfer</h3>
                <p className="text-xs text-slate-500">
                  Please inspect beneficiary details carefully. Payout will be dispatched immediately through the IMPS gateway.
                </p>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2.5">
                  <div className="flex justify-between text-slate-600">
                    <span>Beneficiary Name:</span>
                    <strong className="text-slate-900">{selectedAccount.accountHolderName}</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Bank &amp; IFSC:</span>
                    <span className="font-mono text-slate-800">{selectedAccount.bankName} ({selectedAccount.ifscCode})</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Account Number:</span>
                    <span className="font-mono text-slate-900 font-bold">{selectedAccount.accountNumber}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Gross Debit:</span>
                    <strong className="text-slate-900 tabular-nums">{formatRupee(amount)}</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>IMPS Processing Fee:</span>
                    <strong className="text-slate-800 tabular-nums">₹5.00</strong>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-sm text-slate-900">
                    <span>Net Disbursed to Bank:</span>
                    <span className="text-emerald-700 tabular-nums">{formatRupee(netAmount)}</span>
                  </div>
                </div>

                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-emerald-950 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      Two-Step Payout Security Code
                    </span>
                    <span className="text-[11px] text-emerald-700 font-mono">Demo: 123456</span>
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="Enter 6-digit PIN"
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
                    onClick={() => setStep('input')}
                    className="w-1/3 py-2.5 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
                  >
                    Modify
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || otpCode.length !== 6}
                    className="w-2/3 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    {isSubmitting ? 'Dispatching IMPS...' : `Authorize Payout of ${formatRupee(amount)}`}
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
                  <h3 className="text-lg font-bold text-slate-900">Bank Transfer Dispatched!</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {formatRupee(completedTransfer.netAmount)} successfully routed via IMPS to {completedTransfer.bankName}.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-left text-xs space-y-2">
                  <div className="flex justify-between text-slate-600">
                    <span>Bank UTR Reference:</span>
                    <span className="font-mono text-emerald-800 font-bold">{completedTransfer.utrNumber}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Beneficiary:</span>
                    <span className="text-slate-900">{completedTransfer.accountHolderName}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Account:</span>
                    <span className="font-mono text-slate-900 font-semibold">•••• {completedTransfer.accountNumber.slice(-4)} ({completedTransfer.ifscCode})</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Net Disbursed:</span>
                    <span className="font-bold text-emerald-700 tabular-nums">{formatRupee(completedTransfer.netAmount)}</span>
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
                  Initiate Another Bank Transfer
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Bank Transfer History (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
              <History className="w-4 h-4 text-slate-700" />
              <span>Bank Transfer History</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              All IMPS and NEFT external disbursements.
            </p>

            {isLoadingHistory ? (
              <div className="py-12 text-center text-xs text-slate-400">Loading history...</div>
            ) : history.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">No bank transfers completed yet.</div>
            ) : (
              <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                {history.map((t) => (
                  <div
                    key={t.id}
                    className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-slate-900">{t.bankName}</p>
                        <p className="text-[11px] text-slate-500">
                          A/C: •••• {t.accountNumber.slice(-4)} ({t.accountHolderName})
                        </p>
                      </div>
                      <span className="font-bold text-slate-900 tabular-nums text-sm">
                        -{formatRupee(t.amount)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-200">
                      <span>UTR: {t.utrNumber || t.referenceId}</span>
                      <span>{formatDate(t.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Bank Account Modal */}
      {showAddAccount && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative">
            <button
              onClick={() => setShowAddAccount(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900">Add Beneficiary Bank Account</h3>
            <p className="text-xs text-slate-500 mt-1">
              Must match your verified KYC legal identity ({user?.name}).
            </p>

            <form onSubmit={handleAddAccount} className="space-y-3.5 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Account Holder Full Legal Name
                </label>
                <input
                  type="text"
                  required
                  value={holderName}
                  onChange={(e) => setHolderName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Bank Name
                </label>
                <select
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800"
                >
                  <option value="HDFC Bank">HDFC Bank</option>
                  <option value="State Bank of India">State Bank of India</option>
                  <option value="ICICI Bank">ICICI Bank</option>
                  <option value="Axis Bank">Axis Bank</option>
                  <option value="Kotak Mahindra Bank">Kotak Mahindra Bank</option>
                  <option value="Punjab National Bank">Punjab National Bank</option>
                  <option value="Bank of Baroda">Bank of Baroda</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Bank Account Number
                </label>
                <input
                  type="text"
                  required
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="e.g. 5010049281920"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-900 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  IFSC Code (11 Characters)
                </label>
                <input
                  type="text"
                  required
                  maxLength={11}
                  value={ifscCode}
                  onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                  placeholder="e.g. HDFC0001234"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono uppercase text-slate-900 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {accountModalError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
                  {accountModalError}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddAccount(false)}
                  className="w-1/2 py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAddingAccount}
                  className="w-1/2 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg"
                >
                  {isAddingAccount ? 'Verifying...' : 'Save Bank Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
