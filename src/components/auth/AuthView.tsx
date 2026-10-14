import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { ShieldCheck, Lock, Mail, User, Phone, ArrowRight, AlertCircle, Key } from 'lucide-react';

interface AuthViewProps {
  onSuccess: (targetRole?: string) => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onSuccess }) => {
  const { login, register, quickDemoLogin } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [twoFactorTempToken, setTwoFactorTempToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (twoFactorTempToken) {
        // Complete 2FA login
        const res = await login({ otpCode, tempToken: twoFactorTempToken });
        onSuccess(email.includes('admin') ? 'admin' : 'customer');
        return;
      }

      if (isRegister) {
        await register({ name, email, phone, password });
        onSuccess('customer');
      } else {
        const res = await login({ email, password });
        if (res.requiresTwoFactor) {
          setTwoFactorTempToken(res.tempToken || null);
          return;
        }
        onSuccess(email.includes('admin') ? 'admin' : 'customer');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-8">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3 shadow-sm">
            ₹
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            {twoFactorTempToken
              ? 'Two-Factor Verification'
              : isRegister
              ? 'Create Rewards Account'
              : 'Sign in to RupeeRewards'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {twoFactorTempToken
              ? 'Enter the 6-digit verification code from your authenticator'
              : isRegister
              ? 'Earn ₹50 promotional bonus for every ₹500 deposited'
              : 'Manage your deposit, bonus, and cashback balances securely'}
          </p>
        </div>

        {/* Quick Demo Logins Banner */}
        {!twoFactorTempToken && (
          <div className="mb-6 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2">
            <p className="font-semibold text-slate-700 text-center">Fast Demo Access (Instant Login)</p>
            <div className="grid grid-cols-1 gap-1.5">
              <button
                type="button"
                onClick={async () => {
                  await quickDemoLogin('customer');
                  onSuccess('customer');
                }}
                className="w-full py-1.5 px-3 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-left transition-colors flex items-center justify-between"
              >
                <div>
                  <span className="font-semibold text-slate-900">Rahul Sharma</span>
                  <span className="text-[11px] text-slate-500 block">Customer · KYC Verified · Active Ledger</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={async () => {
                  await quickDemoLogin('customer2');
                  onSuccess('customer');
                }}
                className="w-full py-1.5 px-3 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-left transition-colors flex items-center justify-between"
              >
                <div>
                  <span className="font-semibold text-slate-900">Priya Patel</span>
                  <span className="text-[11px] text-slate-500 block">Customer 2 · KYC Pending Review</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={async () => {
                  await quickDemoLogin('admin');
                  onSuccess('admin');
                }}
                className="w-full py-1.5 px-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-left transition-colors flex items-center justify-between"
              >
                <div>
                  <span className="font-semibold text-emerald-900">Ananya Deshmukh (Admin Console)</span>
                  <span className="text-[11px] text-emerald-700 block">Rule Engine · Withdrawals · Audits</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-emerald-600" />
              </button>
            </div>
          </div>
        )}

        {/* 2FA Form or Normal Form */}
        {twoFactorTempToken ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-center text-xs text-emerald-800">
              Demo Code: <strong className="font-mono text-sm tracking-widest text-emerald-700">123456</strong>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 text-center">
                Enter 6-Digit Authenticator Code
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="123456"
                className="w-full text-center text-xl font-mono tracking-widest py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-emerald-500"
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
              disabled={isLoading || otpCode.length !== 6}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl transition-colors shadow-sm"
            >
              {isLoading ? 'Authenticating...' : 'Verify & Continue'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {isRegister && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Legal Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {isRegister && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm pt-2.5"
            >
              <span>{isLoading ? 'Processing...' : isRegister ? 'Register & Claim Bonus' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Toggle Register / Login */}
        {!twoFactorTempToken && (
          <div className="mt-5 text-center text-xs text-slate-500 pt-4 border-t border-slate-100">
            {isRegister ? (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(false);
                    setError(null);
                  }}
                  className="font-semibold text-emerald-600 hover:underline"
                >
                  Sign In
                </button>
              </p>
            ) : (
              <p>
                New to RupeeRewards?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(true);
                    setError(null);
                  }}
                  className="font-semibold text-emerald-600 hover:underline"
                >
                  Register Account
                </button>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
