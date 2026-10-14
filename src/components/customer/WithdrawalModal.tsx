import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import { formatRupee, formatRupeeShort } from '../../utils/formatters.ts';
import {
  X,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  Clock,
  ArrowLeft,
  Building,
  Smartphone,
  Info
} from 'lucide-react';
import type { PayoutMethod } from '../../types/index.ts';

interface WithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onNavigateToKyc: () => void;
}

export const WithdrawalModal: React.FC<WithdrawalModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onNavigateToKyc
}) => {
  const { balances, user, refreshUserData } = useAuth();
  const [step, setStep] = useState<'input' | 'confirm' | 'success'>('input');
  const [amount, setAmount] = useState<number>(500);
  const [customAmount, setCustomAmount] = useState<string>('500');
  const [method, setMethod] = useState<PayoutMethod>('upi');
  const [upiId, setUpiId] = useState<string>('rahul@okhdfcbank');
  const [bankDetails, setBankDetails] = useState({
    accountNumber: '5010049281920',
    ifscCode: 'HDFC0001234',
    bankName: 'HDFC Bank',
    accountHolderName: user?.name || 'Rahul Sharma'
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [eligibilityData, setEligibilityData] = useState<any>(null);
  const [submittedWithdrawal, setSubmittedWithdrawal] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      setStep('input');
      setError(null);
      api.getWithdrawalEligibility()
        .then(data => setEligibilityData(data))
        .catch(err => console.error('Eligibility fetch error:', err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const withdrawable = balances?.withdrawableBalance || 0;
  const isKycApproved = user?.kycStatus === 'approved';
  const minWithdrawal = 200;
  const maxWithdrawal = 10000;

  // Fee calculation
  const fee = method === 'bank_transfer' ? 10 : method === 'net_banking' ? 5 : 0;
  const netSettlement = Math.max(0, amount - fee);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    setCustomAmount(val);
    setAmount(parseInt(val, 10) || 0);
    setError(null);
  };

  const handleProceedToConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isKycApproved) {
      setError('KYC identity verification is required before initiating a withdrawal.');
      return;
    }
    if ((balances?.todayWithdrawalCount || 0) >= 1) {
      setError('Daily limit reached: Maximum 1 withdrawal permitted per calendar day. You have already initiated a withdrawal today. Next withdrawal available tomorrow.');
      return;
    }
    if (amount < minWithdrawal) {
      setError(`Minimum withdrawal amount is ${formatRupeeShort(minWithdrawal)}.`);
      return;
    }
    const remainingDaily = balances?.remainingDailyWithdrawalLimit ?? 10000;
    if (amount > remainingDaily) {
      setError(`Withdrawal exceeds your remaining daily limit of ${formatRupeeShort(remainingDaily)}. Daily maximum limit is ₹10,000.`);
      return;
    }
    if (amount > withdrawable) {
      setError(`Amount exceeds your available withdrawable balance of ${formatRupee(withdrawable)}.`);
      return;
    }
    if (method === 'upi' && (!upiId || !upiId.includes('@'))) {
      setError('Please provide a valid UPI ID (e.g., yourname@okhdfcbank).');
      return;
    }
    if ((method === 'bank_transfer' || method === 'net_banking') && (!bankDetails.accountNumber || !bankDetails.ifscCode)) {
      setError('Please provide bank account number and valid IFSC code.');
      return;
    }

    setError(null);
    setStep('confirm');
  };

  const handleFinalSubmit = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const idempotencyKey = `wd_req_${Date.now()}_${Math.random()}`;
      const payoutDetails = method === 'upi' ? { upiId } : bankDetails;

      const res = await api.withdraw({
        amount,
        method,
        payoutDetails,
        idempotencyKey
      });

      setSubmittedWithdrawal(res.withdrawal);
      setStep('success');
      await refreshUserData();
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Withdrawal request failed.');
      setStep('input');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 transition-colors p-1"
        >
          <X className="w-5 h-5" />
        </button>

        {/* STEP 1: Input details & Method Selection */}
        {step === 'input' && (
          <div>
            <div className="mb-5">
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">Withdraw Funds</h3>
              <p className="text-xs text-slate-500 mt-1">
                Fast settlement to your verified Indian bank account or UPI VPA.
              </p>
            </div>

            {/* Balances Notice */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl mb-4 text-xs space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-slate-600 font-medium">Available Withdrawable Balance:</span>
                <span className="font-bold text-slate-900 tabular-nums text-sm">
                  {formatRupee(withdrawable)}
                </span>
              </div>
              <div className="flex justify-between items-center text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                <span>Promotional Bonus &amp; Cashback:</span>
                <span className="tabular-nums">
                  {formatRupee((balances?.promotionalBonus || 0) + (balances?.cashbackBalance || 0))} (Non-withdrawable)
                </span>
              </div>
            </div>

            {/* KYC Enforcement Banner */}
            {!isKycApproved && (
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-3 mb-4">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold">KYC Verification Mandatory</p>
                  <p className="mt-0.5 text-amber-700 text-[11px]">
                    Under compliance guidelines, withdrawals are restricted until identity documents (PAN &amp; Govt ID) are approved.
                  </p>
                  <button
                    onClick={() => {
                      onClose();
                      onNavigateToKyc();
                    }}
                    className="mt-2 text-[11px] font-bold text-amber-900 hover:underline flex items-center gap-1"
                  >
                    <span>Complete KYC Verification Now</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleProceedToConfirm} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Withdrawal Amount (Min ₹200 · Max ₹10,000)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-sm">₹</span>
                  <input
                    type="text"
                    value={customAmount}
                    onChange={handleAmountChange}
                    disabled={!isKycApproved}
                    placeholder="Enter amount"
                    className="w-full pl-8 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 tabular-nums disabled:bg-slate-50 disabled:text-slate-400"
                  />
                </div>
                <div className="flex justify-between items-center text-[11px] text-slate-500 mt-1">
                  <span>Daily limit remaining: ₹10,000</span>
                  <button
                    type="button"
                    onClick={() => {
                      const maxVal = Math.min(withdrawable, 10000);
                      setAmount(maxVal);
                      setCustomAmount(maxVal.toString());
                    }}
                    className="text-emerald-600 font-semibold hover:underline"
                  >
                    Withdraw Max ({formatRupeeShort(Math.min(withdrawable, 10000))})
                  </button>
                </div>
              </div>

              {/* Payout Method */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Select Payout Method
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMethod('upi')}
                    className={`p-3 text-left rounded-xl border transition-all flex items-start gap-2.5 ${
                      method === 'upi'
                        ? 'border-emerald-600 bg-emerald-50/50 text-emerald-950 ring-1 ring-emerald-600'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <Smartphone className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-semibold text-xs">Instant UPI VPA</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">Zero Fee · 15-30 mins</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMethod('bank_transfer')}
                    className={`p-3 text-left rounded-xl border transition-all flex items-start gap-2.5 ${
                      method === 'bank_transfer'
                        ? 'border-emerald-600 bg-emerald-50/50 text-emerald-950 ring-1 ring-emerald-600'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <Building className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-semibold text-xs">IMPS Bank Transfer</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">₹10 flat fee · 24x7</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Method Details */}
              {method === 'upi' ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Your Registered UPI ID (VPA)
                  </label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="e.g. mobile@upi or username@okhdfcbank"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Must match registered KYC name ({user?.name}).</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Account Holder Name</label>
                    <input
                      type="text"
                      value={bankDetails.accountHolderName}
                      onChange={(e) => setBankDetails({ ...bankDetails, accountHolderName: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Account Number</label>
                      <input
                        type="text"
                        value={bankDetails.accountNumber}
                        onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">IFSC Code</label>
                      <input
                        type="text"
                        value={bankDetails.ifscCode}
                        onChange={(e) => setBankDetails({ ...bankDetails, ifscCode: e.target.value.toUpperCase() })}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={!isKycApproved || withdrawable < minWithdrawal}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <span>Review Withdrawal Summary</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* STEP 2: Clear Pre-Confirmation Screen (CRITICAL REQUIREMENT) */}
        {step === 'confirm' && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={() => setStep('input')}
                className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h3 className="text-lg font-bold text-slate-900">Confirm Withdrawal Details</h3>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 mb-4 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                Please inspect the breakdown below carefully. Once confirmed, funds will be locked and routed through RBI settlement rails.
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2.5 mb-5">
              <div className="flex justify-between text-slate-600">
                <span>Requested Amount:</span>
                <span className="font-semibold text-slate-900 tabular-nums">{formatRupee(amount)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Processing Fee:</span>
                <span className="tabular-nums font-semibold text-slate-800">
                  {fee === 0 ? 'FREE (₹0.00)' : formatRupee(fee)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Payout Method:</span>
                <span className="capitalize font-medium text-slate-800">
                  {method === 'upi' ? `UPI VPA (${upiId})` : `Bank A/C ending ...${bankDetails.accountNumber.slice(-4)}`}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Beneficiary:</span>
                <span className="font-medium text-slate-800">{user?.name}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Estimated Processing Time:</span>
                <span className="font-medium text-emerald-700 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  15-30 minutes
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-bold text-slate-900">
                <span>Net Credited Amount:</span>
                <span className="text-emerald-700 tabular-nums">{formatRupee(netSettlement)}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep('input')}
                disabled={isLoading}
                className="w-1/3 py-2.5 px-3 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
              >
                Modify
              </button>
              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={isLoading}
                className="w-2/3 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                {isLoading ? (
                  <span>Submitting to Gateway...</span>
                ) : (
                  <>
                    <span>Confirm &amp; Authorize Payout</span>
                    <ShieldCheck className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Success Screen */}
        {step === 'success' && submittedWithdrawal && (
          <div className="text-center py-3">
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3 text-emerald-600">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h4 className="text-lg font-bold text-slate-900">Withdrawal Initiated!</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Your request for {formatRupee(submittedWithdrawal.amount)} has been recorded in the processing queue.
            </p>

            <div className="my-5 p-4 bg-slate-50 border border-slate-200 rounded-xl text-left text-xs space-y-2">
              <div className="flex justify-between text-slate-600">
                <span>Withdrawal ID:</span>
                <span className="font-mono text-slate-900">{submittedWithdrawal.id}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Net Transfer Amount:</span>
                <span className="font-bold text-emerald-700 tabular-nums">{formatRupee(submittedWithdrawal.netPayout)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Current Status:</span>
                <span className="font-semibold text-amber-700 uppercase">Pending Review</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Payout Destination:</span>
                <span className="font-medium text-slate-800">
                  {submittedWithdrawal.method.toUpperCase()}
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-lg transition-colors"
            >
              Done &amp; Return to Wallet
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
