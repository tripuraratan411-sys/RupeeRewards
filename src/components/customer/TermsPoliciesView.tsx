import React, { useState } from 'react';
import { ShieldCheck, FileText, CheckCircle2, Lock, Gift, ArrowDownLeft, ArrowUpRight, Sparkles } from 'lucide-react';

export const TermsPoliciesView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'general' | 'privacy' | 'rewards' | 'deposits' | 'withdrawals' | 'cashback'
  >('rewards');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Legal, Compliance &amp; Policy Terms</h2>
        <p className="text-sm text-slate-500 mt-1">
          Written in plain, transparent language so you understand exactly how deposits, rewards, and withdrawals operate.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl overflow-x-auto">
        {[
          { id: 'rewards', label: 'Reward & Bonus Terms', icon: Gift },
          { id: 'deposits', label: 'Deposit Terms (₹20,000 Cap)', icon: ArrowDownLeft },
          { id: 'withdrawals', label: 'Withdrawal Terms & Fees', icon: ArrowUpRight },
          { id: 'cashback', label: 'Cashback Terms', icon: Sparkles },
          { id: 'general', label: 'General Terms & Conditions', icon: FileText },
          { id: 'privacy', label: 'Privacy & Security Policy', icon: Lock }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 ${
                activeTab === tab.id
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content Container */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6 text-sm text-slate-700 leading-relaxed">
        {/* REWARD TERMS */}
        {activeTab === 'rewards' && (
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Policy Document 01</span>
              <h3 className="text-xl font-bold text-slate-900 mt-1">Reward &amp; Promotional Bonus Terms</h3>
            </div>

            <section className="space-y-2">
              <h4 className="font-bold text-slate-900">1. Default Bonus Crediting Rule</h4>
              <p>
                Every user deposit credited to the wallet in integral blocks of ₹500 automatically qualifies for an instant promotional bonus credit of ₹50 per block. For instance:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-xs">
                <li>Deposit ₹500 &rarr; Earn ₹50 Promotional Bonus (Total wallet credit: ₹550)</li>
                <li>Deposit ₹1,000 &rarr; Earn ₹100 Promotional Bonus (Total wallet credit: ₹1,100)</li>
                <li>Deposit ₹2,000 &rarr; Earn ₹200 Promotional Bonus (Total wallet credit: ₹2,200)</li>
                <li>Deposit ₹5,000 &rarr; Earn ₹500 Promotional Bonus (Total wallet credit: ₹5,500)</li>
              </ul>
              <p className="text-xs text-slate-500">
                Deposits below ₹500 or fractional remainders do not qualify for fractional bonuses unless configured otherwise by platform administrators.
              </p>
            </section>

            <section className="space-y-2">
              <h4 className="font-bold text-slate-900">2. Separation of Balances</h4>
              <p>
                To maintain total financial transparency, your wallet separates your <strong>Deposit Balance</strong>, <strong>Promotional Bonus Balance</strong>, and <strong>Cashback Balance</strong>. Promotional bonus credits cannot be withdrawn directly to a bank account or UPI address; they are allocated strictly for in-app reward redemptions and partner transactions.
              </p>
            </section>

            <section className="space-y-2">
              <h4 className="font-bold text-slate-900">3. Prevention of Double Bonus Credits</h4>
              <p>
                Each deposit transaction is assigned a unique cryptographic transaction hash and idempotency token. The server-side calculation engine guarantees that promotional bonuses are credited exactly once per qualifying deposit, preventing double bonus credits or replay exploits.
              </p>
            </section>

            <section className="space-y-2">
              <h4 className="font-bold text-slate-900">4. Bonus Expiration</h4>
              <p>
                Unless stated otherwise in promotional bulletins, promotional bonuses carry a standard validity of 60 calendar days from the date of credit. Unutilized bonuses after expiration automatically expire without financial liability.
              </p>
            </section>
          </div>
        )}

        {/* DEPOSIT TERMS */}
        {activeTab === 'deposits' && (
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Policy Document 02</span>
              <h3 className="text-xl font-bold text-slate-900 mt-1">Deposit Terms &amp; ₹20,000 Maximum Limit</h3>
            </div>

            <section className="space-y-2">
              <h4 className="font-bold text-slate-900">1. Maximum Cumulative Lifetime Deposit Limit</h4>
              <p>
                In strict adherence to consumer safety and risk control frameworks, each registered user account is subject to a <strong>maximum cumulative deposit ceiling of ₹20,000 (Twenty Thousand Indian Rupees)</strong>.
              </p>
              <p>
                The platform monitors total deposited funds cumulatively. Once total historical deposits reach ₹20,000, all further deposit operations are automatically disabled by the server engine. Any attempt to submit a deposit exceeding the remaining allowance is rejected.
              </p>
            </section>

            <section className="space-y-2">
              <h4 className="font-bold text-slate-900">2. Accepted Payment Channels</h4>
              <p>
                Deposits may only be executed via verified Indian payment mechanisms including Unified Payments Interface (UPI: Google Pay, PhonePe, Paytm, BHIM), authorized NetBanking channels, and Rupay/Visa/MasterCard debit cards.
              </p>
            </section>

            <section className="space-y-2">
              <h4 className="font-bold text-slate-900">3. Real-Time Balance Posting &amp; Idempotency</h4>
              <p>
                All deposits are calculated and posted atomically on the server. If a network interruption occurs, client requests containing the same idempotency key will not create duplicate debits or credits.
              </p>
            </section>
          </div>
        )}

        {/* WITHDRAWAL TERMS */}
        {activeTab === 'withdrawals' && (
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Policy Document 03</span>
              <h3 className="text-xl font-bold text-slate-900 mt-1">Withdrawal Eligibility, Processing &amp; Fee Terms</h3>
            </div>

            <section className="space-y-2">
              <h4 className="font-bold text-slate-900">1. Mandatory KYC Eligibility</h4>
              <p>
                Withdrawals can only be initiated by accounts with an <strong>Approved KYC</strong> verification status. Accounts with pending or unsubmitted KYC documents are blocked from creating payout requests until PAN and Government ID are approved by our compliance desk.
              </p>
            </section>

            <section className="space-y-2">
              <h4 className="font-bold text-slate-900">2. Pre-Confirmation Transparency &amp; Limits</h4>
              <p>
                Before confirming any withdrawal, the user is presented with a complete pre-confirmation summary displaying the requested amount, applicable transaction processing fees, net settlement amount, destination account, and estimated timeline.
              </p>
              <ul className="list-disc pl-5 space-y-1 text-xs">
                <li><strong>Minimum Withdrawal:</strong> ₹200 per request</li>
                <li><strong>Maximum Daily Limit:</strong> ₹10,000 per 24-hour cycle</li>
                <li><strong>UPI Payout Fee:</strong> ₹0.00 (Free of charge)</li>
                <li><strong>IMPS Bank Transfer Fee:</strong> Flat ₹10.00 processing fee</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h4 className="font-bold text-slate-900">3. Processing States &amp; Settlement Timelines</h4>
              <p>
                Payout requests transition through four transparent states:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-xs">
                <li><strong>Pending:</strong> Queued for compliance and automated fraud checks.</li>
                <li><strong>Processing:</strong> Dispatched to RBI banking gateway / UPI switch (15–30 minutes).</li>
                <li><strong>Completed:</strong> Confirmed credited to beneficiary account with official UTR reference.</li>
                <li><strong>Rejected:</strong> In the event of invalid IFSC or bank outage, the full requested amount is automatically returned to the user withdrawable balance with administrative remarks.</li>
              </ul>
            </section>
          </div>
        )}

        {/* CASHBACK TERMS */}
        {activeTab === 'cashback' && (
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Policy Document 04</span>
              <h3 className="text-xl font-bold text-slate-900 mt-1">Cashback Program &amp; Expiry Terms</h3>
            </div>

            <section className="space-y-2">
              <h4 className="font-bold text-slate-900">1. Cashback Issuance &amp; Eligibility</h4>
              <p>
                Cashback vouchers are issued under special promotional campaigns, welcome programs, or qualifying merchant checkout spendings. Each voucher defines its own eligibility criteria, such as minimum transaction spend thresholds.
              </p>
            </section>

            <section className="space-y-2">
              <h4 className="font-bold text-slate-900">2. Expiration Dates</h4>
              <p>
                All cashback vouchers carry an explicit expiry date (typically 30 to 45 calendar days from issuance). Active vouchers remain displayed in your Cashback Hub with live day countdowns. Once expired, unused credits are retired without balance rollover.
              </p>
            </section>
          </div>
        )}

        {/* GENERAL TERMS */}
        {activeTab === 'general' && (
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Policy Document 05</span>
              <h3 className="text-xl font-bold text-slate-900 mt-1">General Terms &amp; Conditions</h3>
            </div>

            <section className="space-y-2">
              <h4 className="font-bold text-slate-900">1. Acceptance of Terms</h4>
              <p>
                By registering an account with RupeeRewards, you agree to comply with all operational, security, and financial policies outlined across these terms. You confirm that you are at least 18 years of age and an Indian citizen or tax resident.
              </p>
            </section>

            <section className="space-y-2">
              <h4 className="font-bold text-slate-900">2. Account Responsibility &amp; Audit Trail</h4>
              <p>
                Users are solely responsible for maintaining the confidentiality of their credentials and two-factor authentication tokens. Platform operations are recorded in an immutable administrative audit ledger to resolve discrepancies and enforce fair-play standards.
              </p>
            </section>
          </div>
        )}

        {/* PRIVACY POLICY */}
        {activeTab === 'privacy' && (
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Policy Document 06</span>
              <h3 className="text-xl font-bold text-slate-900 mt-1">Privacy &amp; Data Protection Policy</h3>
            </div>

            <section className="space-y-2">
              <h4 className="font-bold text-slate-900">1. Data Storage &amp; Encryption</h4>
              <p>
                Passwords are never stored in plaintext and are protected using HMAC-SHA256 salted hashes. Sensitive identity documents submitted during KYC verification are encrypted in transit and at rest in compliance with Indian Information Technology regulations.
              </p>
            </section>

            <section className="space-y-2">
              <h4 className="font-bold text-slate-900">2. Non-Disclosure Commitment</h4>
              <p>
                We do not sell, rent, or trade your personal information to third-party marketing entities. User information is utilized strictly to provide wallet processing, regulatory compliance, fraud prevention, and customer support.
              </p>
            </section>
          </div>
        )}
      </div>
    </div>
  );
};
