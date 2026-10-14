import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import { formatRupee, formatDate } from '../../utils/formatters.ts';
import {
  Gift,
  Sparkles,
  Save,
  CheckCircle2,
  AlertCircle,
  History,
  Calculator,
  ShieldCheck
} from 'lucide-react';
import type { BonusRuleConfig, CashbackRuleConfig, AuditLog } from '../../types/index.ts';

export const AdminRules: React.FC = () => {
  // Bonus Rule state
  const [bonusRule, setBonusRule] = useState<BonusRuleConfig | null>(null);
  const [bonusAmount, setBonusAmount] = useState<number>(50);
  const [depositThreshold, setDepositThreshold] = useState<number>(500);
  const [maxDepositLimit, setMaxDepositLimit] = useState<number>(20000);
  const [minDepositRequired, setMinDepositRequired] = useState<number>(500);
  const [isBonusActive, setIsBonusActive] = useState<boolean>(true);
  const [bonusDesc, setBonusDesc] = useState<string>('');

  // Cashback Rule state
  const [cashbackRule, setCashbackRule] = useState<CashbackRuleConfig | null>(null);
  const [cashbackPct, setCashbackPct] = useState<number>(5);
  const [maxCashback, setMaxCashback] = useState<number>(200);
  const [expiryDays, setExpiryDays] = useState<number>(30);
  const [minSpend, setMinSpend] = useState<number>(200);
  const [isCashbackActive, setIsCashbackActive] = useState<boolean>(true);

  // Test Simulation
  const [simDeposit, setSimDeposit] = useState<number>(1500);

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSavingBonus, setIsSavingBonus] = useState(false);
  const [isSavingCashback, setIsSavingCashback] = useState(false);

  const loadRules = async () => {
    try {
      const [bRes, cRes, aRes] = await Promise.all([
        api.getBonusRule(),
        api.getCashbackRule(),
        api.getAdminAuditLogs()
      ]);

      setBonusRule(bRes.rule);
      setBonusAmount(bRes.rule.bonusAmount);
      setDepositThreshold(bRes.rule.depositThreshold);
      setMaxDepositLimit(bRes.rule.maxDepositLimit);
      setMinDepositRequired(bRes.rule.minDepositRequired);
      setIsBonusActive(bRes.rule.isActive);
      setBonusDesc(bRes.rule.description);

      setCashbackRule(cRes.rule);
      setCashbackPct(cRes.rule.cashbackPercentage);
      setMaxCashback(cRes.rule.maxCashbackPerTx);
      setExpiryDays(cRes.rule.expiryDays);
      setMinSpend(cRes.rule.minSpendAmount);
      setIsCashbackActive(cRes.rule.isActive);

      const ruleLogs = aRes.auditLogs.filter(
        l => l.targetType === 'bonus_rule' || l.targetType === 'cashback_rule'
      );
      setAuditLogs(ruleLogs);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadRules();
  }, []);

  const handleSaveBonusRule = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingBonus(true);
    setStatusMsg(null);

    try {
      const res = await api.updateBonusRule({
        bonusAmount,
        depositThreshold,
        maxDepositLimit,
        minDepositRequired,
        isActive: isBonusActive,
        description: bonusDesc
      });

      setStatusMsg({ type: 'success', text: res.message });
      await loadRules();
      setTimeout(() => setStatusMsg(null), 4000);
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to update bonus rules' });
    } finally {
      setIsSavingBonus(false);
    }
  };

  const handleSaveCashbackRule = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingCashback(true);
    setStatusMsg(null);

    try {
      const res = await api.updateCashbackRule({
        cashbackPercentage: cashbackPct,
        maxCashbackPerTx: maxCashback,
        expiryDays,
        minSpendAmount: minSpend,
        isActive: isCashbackActive
      });

      setStatusMsg({ type: 'success', text: res.message });
      await loadRules();
      setTimeout(() => setStatusMsg(null), 4000);
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to update cashback rules' });
    } finally {
      setIsSavingCashback(false);
    }
  };

  // Sim calculation
  const simBlocks = Math.floor(simDeposit / (depositThreshold || 500));
  const simBonus = isBonusActive && simDeposit >= minDepositRequired ? simBlocks * bonusAmount : 0;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Reward &amp; Bonus Configuration</h2>
        <p className="text-sm text-slate-500 mt-1">
          Configure server-side promotional deposit bonuses, maximum lifetime deposit limits, and cashback rules with audit logs.
        </p>
      </div>

      {statusMsg && (
        <div className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2 ${
          statusMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          {statusMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Grid: 2 Configuration Forms */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* BONUS REWARD ENGINE */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
                <Gift className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Deposit Bonus Reward System</h3>
                <p className="text-[11px] text-slate-500">Default: ₹50 bonus for every ₹500 deposit</p>
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
              <input
                type="checkbox"
                checked={isBonusActive}
                onChange={(e) => setIsBonusActive(e.target.checked)}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
              />
              <span className={isBonusActive ? 'text-emerald-700' : 'text-slate-400'}>
                {isBonusActive ? 'Rule Active' : 'Paused'}
              </span>
            </label>
          </div>

          <form onSubmit={handleSaveBonusRule} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Bonus Amount (₹ per block)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 font-bold text-xs">₹</span>
                  <input
                    type="number"
                    required
                    value={bonusAmount}
                    onChange={(e) => setBonusAmount(parseFloat(e.target.value) || 0)}
                    className="w-full pl-7 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Deposit Threshold (₹ block)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 font-bold text-xs">₹</span>
                  <input
                    type="number"
                    required
                    value={depositThreshold}
                    onChange={(e) => setDepositThreshold(parseFloat(e.target.value) || 0)}
                    className="w-full pl-7 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Lifetime Deposit Cap (Default ₹20,000)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 font-bold text-xs">₹</span>
                  <input
                    type="number"
                    required
                    value={maxDepositLimit}
                    onChange={(e) => setMaxDepositLimit(parseFloat(e.target.value) || 0)}
                    className="w-full pl-7 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Min Qualifying Deposit (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 font-bold text-xs">₹</span>
                  <input
                    type="number"
                    required
                    value={minDepositRequired}
                    onChange={(e) => setMinDepositRequired(parseFloat(e.target.value) || 0)}
                    className="w-full pl-7 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Rule Description / Human Notice
              </label>
              <textarea
                rows={2}
                value={bonusDesc}
                onChange={(e) => setBonusDesc(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Live Calculation Simulator */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5">
              <div className="flex items-center justify-between font-semibold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <Calculator className="w-3.5 h-3.5 text-emerald-600" />
                  Live Engine Simulator
                </span>
                <span className="tabular-nums">Deposit: {formatRupee(simDeposit)}</span>
              </div>
              <input
                type="range"
                min={500}
                max={10000}
                step={500}
                value={simDeposit}
                onChange={(e) => setSimDeposit(parseInt(e.target.value, 10))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
              <div className="flex justify-between items-center text-[11px] text-slate-600 pt-1">
                <span>Calculated Promotional Bonus:</span>
                <strong className="text-emerald-700 tabular-nums">+{formatRupee(simBonus)} ({simBlocks} blocks)</strong>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSavingBonus}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingBonus ? 'Committing to Ledger...' : 'Save & Log Bonus Configuration'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* CASHBACK PARAMETERS ENGINE */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Cashback Program Settings</h3>
                <p className="text-[11px] text-slate-500">Rebates, validity duration, and minimum criteria</p>
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
              <input
                type="checkbox"
                checked={isCashbackActive}
                onChange={(e) => setIsCashbackActive(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
              />
              <span className={isCashbackActive ? 'text-indigo-700' : 'text-slate-400'}>
                {isCashbackActive ? 'Rule Active' : 'Paused'}
              </span>
            </label>
          </div>

          <form onSubmit={handleSaveCashbackRule} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Cashback Rate (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={cashbackPct}
                    onChange={(e) => setCashbackPct(parseFloat(e.target.value) || 0)}
                    className="w-full pr-7 pl-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="absolute right-3 top-2 text-slate-400 font-bold text-xs">%</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Max Cashback per Tx (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 font-bold text-xs">₹</span>
                  <input
                    type="number"
                    required
                    value={maxCashback}
                    onChange={(e) => setMaxCashback(parseFloat(e.target.value) || 0)}
                    className="w-full pl-7 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Expiry Period (Days)
                </label>
                <input
                  type="number"
                  required
                  value={expiryDays}
                  onChange={(e) => setExpiryDays(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Min Qualifying Spend (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 font-bold text-xs">₹</span>
                  <input
                    type="number"
                    required
                    value={minSpend}
                    onChange={(e) => setMinSpend(parseFloat(e.target.value) || 0)}
                    className="w-full pl-7 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
              <p className="font-semibold text-slate-800">Behavior Summary:</p>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Eligible transactions above {formatRupee(minSpend)} generate vouchers with a {cashbackPct}% reward value, capped at {formatRupee(maxCashback)}. Vouchers automatically expire in {expiryDays} days.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSavingCashback}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingCashback ? 'Updating Parameters...' : 'Save & Log Cashback Configuration'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Rule Audit Trail */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
          <History className="w-5 h-5 text-slate-700" />
          <span>Rule Change Audit Trail</span>
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Every modification to financial rules is stamped with the author, timestamp, IP, and previous vs new value state.
        </p>

        {auditLogs.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">No rule adjustments recorded yet.</div>
        ) : (
          <div className="space-y-3">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                    {log.action}
                  </span>
                  <span className="text-slate-400 text-[11px]">{formatDate(log.timestamp)}</span>
                </div>
                <p className="text-slate-700">{log.details}</p>
                <div className="flex items-center gap-3 text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-200">
                  <span>Author: {log.adminEmail}</span>
                  <span>IP: {log.ipAddress}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
