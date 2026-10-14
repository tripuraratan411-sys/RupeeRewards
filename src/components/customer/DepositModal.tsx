import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import { formatRupee, formatRupeeShort } from '../../utils/formatters.ts';
import { X, Sparkles, AlertCircle, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const DepositModal: React.FC<DepositModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { balances, refreshUserData } = useAuth();
  const [amount, setAmount] = useState<number>(1000);
  const [customAmount, setCustomAmount] = useState<string>('1000');
  const [paymentMethod, setPaymentMethod] = useState<string>('UPI (Google Pay / PhonePe)');
  const [upiId, setUpiId] = useState<string>('rahul@okhdfcbank');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<any | null>(null);

  if (!isOpen) return null;

  const maxLimit = balances?.maxDepositLimit || 20000;
  const lifetimeDeposited = balances?.totalDepositedLifetime || 0;
  const remainingRoom = Math.max(0, maxLimit - lifetimeDeposited);
  const isCapReached = remainingRoom <= 0;

  // Preset options
  const presets = [500, 1000, 2000, 5000];

  const handleSelectPreset = (val: number) => {
    setAmount(val);
    setCustomAmount(val.toString());
    setError(null);
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    setCustomAmount(val);
    const num = parseInt(val, 10) || 0;
    setAmount(num);
    setError(null);
  };

  // Default Reward calculation: ₹50 promotional bonus for every ₹500 deposit
  const bonusBlocks = Math.floor(amount / 500);
  const estimatedBonus = bonusBlocks * 50;

  const willExceedCap = amount > remainingRoom;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCapReached) {
      setError(`Maximum total deposit limit of ₹${maxLimit.toLocaleString('en-IN')} has been reached.`);
      return;
    }
    if (amount < 100) {
      setError('Minimum deposit is ₹100.');
      return;
    }
    if (willExceedCap) {
      setError(`This deposit exceeds your remaining deposit allowance of ${formatRupeeShort(remainingRoom)}.`);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const idempotencyKey = `dep_req_${Date.now()}_${Math.random()}`;
      const res = await api.deposit({
        amount,
        paymentMethod: `${paymentMethod} - ${upiId}`,
        idempotencyKey
      });

      setSuccessData(res);
      await refreshUserData();
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Deposit failed. Please try again.');
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

        {!successData ? (
          <div>
            <div className="mb-5">
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">Deposit Funds to Wallet</h3>
              <p className="text-xs text-slate-500 mt-1">
                Instant deposit with automatic ₹50 promotional bonus for every ₹500 added.
              </p>
            </div>

            {/* Cap Warning or Progress */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-5 text-xs">
              <div className="flex justify-between items-center text-slate-600 mb-1.5 font-medium">
                <span>Lifetime Deposit Limit</span>
                <span className="font-semibold text-slate-900 tabular-nums">
                  {formatRupeeShort(lifetimeDeposited)} / {formatRupeeShort(maxLimit)}
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    isCapReached ? 'bg-amber-600' : 'bg-emerald-600'
                  }`}
                  style={{ width: `${Math.min(100, (lifetimeDeposited / maxLimit) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between items-center mt-2 text-[11px] text-slate-500">
                <span>Remaining allowance: <strong className="text-slate-700 tabular-nums">{formatRupeeShort(remainingRoom)}</strong></span>
                {isCapReached && (
                  <span className="text-amber-700 font-semibold">Deposit Limit Reached</span>
                )}
              </div>
            </div>

            {isCapReached ? (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-3 mb-4">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Maximum Deposit Limit Reached</p>
                  <p className="mt-0.5 text-amber-700">
                    Your account has reached the maximum permitted total deposit cap of ₹{maxLimit.toLocaleString('en-IN')}. Further deposits are currently disabled per system policy.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Preset Chips */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">
                    Select Quick Amount
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {presets.map((val) => {
                      const isDisabled = val > remainingRoom;
                      return (
                        <button
                          key={val}
                          type="button"
                          disabled={isDisabled}
                          onClick={() => handleSelectPreset(val)}
                          className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all text-center tabular-nums ${
                            amount === val
                              ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                              : isDisabled
                              ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
                          }`}
                        >
                          {formatRupeeShort(val)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Deposit Amount (INR)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-sm">₹</span>
                    <input
                      type="text"
                      value={customAmount}
                      onChange={handleCustomChange}
                      placeholder="Enter amount"
                      className="w-full pl-8 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 tabular-nums"
                    />
                  </div>
                </div>

                {/* Promotional Bonus Preview Box */}
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-emerald-800 font-semibold">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      <span>Promotional Bonus Preview</span>
                    </div>
                    <span className="font-bold text-emerald-700 tabular-nums text-sm">
                      +{formatRupeeShort(estimatedBonus)}
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-700 mt-1">
                    {bonusBlocks > 0
                      ? `Eligible for ₹50 x ${bonusBlocks} block${bonusBlocks > 1 ? 's' : ''}. Total credited: ${formatRupeeShort(amount + estimatedBonus)}`
                      : 'Add ₹500 or more to unlock instant ₹50 promotional bonus!'}
                  </p>
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="UPI (Google Pay / PhonePe)">UPI (Google Pay / PhonePe / BHIM)</option>
                    <option value="NetBanking (HDFC Bank)">NetBanking (HDFC Bank)</option>
                    <option value="NetBanking (State Bank of India)">NetBanking (State Bank of India)</option>
                    <option value="NetBanking (ICICI Bank)">NetBanking (ICICI Bank)</option>
                    <option value="Debit Card / Rupay">Debit Card / Rupay</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    VPA / UPI ID or Reference
                  </label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="e.g. yourname@okhdfcbank"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {error && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoading || willExceedCap || amount <= 0}
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    {isLoading ? (
                      <span>Processing Gateway...</span>
                    ) : (
                      <>
                        <span>Confirm Deposit of {formatRupeeShort(amount)}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                  <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 mt-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>256-Bit Encrypted Server-Authorised Gateway</span>
                  </div>
                </div>
              </form>
            )}
          </div>
        ) : (
          <div className="text-center py-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3 text-emerald-600">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h4 className="text-lg font-bold text-slate-900">Deposit Completed!</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Your wallet balance has been credited immediately. All calculations and ledger entries were authenticated server-side.
            </p>

            <div className="my-5 p-4 bg-slate-50 border border-slate-200 rounded-xl text-left text-xs space-y-2">
              <div className="flex justify-between text-slate-600">
                <span>Principal Deposited:</span>
                <span className="font-semibold text-slate-900 tabular-nums">{formatRupee(successData.transaction?.amount)}</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-medium">
                <span>Promotional Bonus Credited:</span>
                <span className="font-bold tabular-nums">+{formatRupee(successData.bonusCredited)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Transaction Reference:</span>
                <span className="font-mono text-slate-800">{successData.transaction?.referenceId}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between text-slate-900 font-bold">
                <span>New Available Balance:</span>
                <span className="tabular-nums text-emerald-600">{formatRupee(successData.balances?.totalAvailable)}</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-lg transition-colors"
            >
              Back to Wallet
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
