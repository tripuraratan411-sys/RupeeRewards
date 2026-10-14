import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import { formatDate } from '../../utils/formatters.ts';
import {
  Shield,
  Key,
  Smartphone,
  Lock,
  CheckCircle2,
  AlertCircle,
  User,
  History
} from 'lucide-react';

export const SecurityView: React.FC = () => {
  const { user, refreshUserData } = useAuth();

  // Profile Form
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [profileMsg, setProfileMsg] = useState<string | null>(null);

  // Password Form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 2FA
  const [twoFactorModal, setTwoFactorModal] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [twoFactorMsg, setTwoFactorMsg] = useState<string | null>(null);
  const [isLoading2FA, setIsLoading2FA] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updateProfile({ name, phone });
      setProfileMsg('Profile updated successfully.');
      await refreshUserData();
      setTimeout(() => setProfileMsg(null), 3000);
    } catch (err: any) {
      setProfileMsg(err.message || 'Update failed');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    try {
      await api.changePassword({ currentPassword, newPassword });
      setPasswordMsg({ type: 'success', text: 'Password successfully updated.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordMsg({ type: 'error', text: err.message || 'Password update failed' });
    }
  };

  const handleToggle2FA = async (targetState: boolean) => {
    if (targetState) {
      setTwoFactorModal(true);
      setTwoFactorCode('');
    } else {
      try {
        await api.toggle2FA({ enabled: false });
        await refreshUserData();
      } catch (err: any) {
        console.error(err);
      }
    }
  };

  const handleConfirm2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading2FA(true);
    setTwoFactorMsg(null);

    try {
      await api.toggle2FA({ enabled: true, otpCode: twoFactorCode });
      setTwoFactorModal(false);
      await refreshUserData();
    } catch (err: any) {
      setTwoFactorMsg(err.message || 'Verification failed');
    } finally {
      setIsLoading2FA(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Security &amp; Profile</h2>
        <p className="text-sm text-slate-500 mt-1">
          Manage your credentials, two-factor authentication, and account settings.
        </p>
      </div>

      {/* Profile Details */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-5 h-5 text-slate-700" />
          <h3 className="text-base font-bold text-slate-900">Account Details</h3>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email Address</label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Role Authorization</label>
              <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold uppercase tracking-wider text-slate-700">
                {user?.role}
              </div>
            </div>
          </div>

          {profileMsg && (
            <p className="text-xs text-emerald-700 font-medium">{profileMsg}</p>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-lg transition-colors"
            >
              Save Profile
            </button>
          </div>
        </form>
      </div>

      {/* Two-Factor Authentication */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-slate-100 rounded-xl text-slate-700 mt-0.5">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Two-Factor Authentication (2FA)</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Protect your funds with a 6-digit one-time verification code on sign-in and sensitive withdrawals.
              </p>
              <div className="mt-2 flex items-center gap-2">
                <span className={`text-xs font-semibold ${user?.twoFactorEnabled ? 'text-emerald-700' : 'text-slate-500'}`}>
                  Status: {user?.twoFactorEnabled ? 'Active & Protecting Account' : 'Disabled'}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleToggle2FA(!user?.twoFactorEnabled)}
            className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-colors ${
              user?.twoFactorEnabled
                ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                : 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {user?.twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA'}
          </button>
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Key className="w-5 h-5 text-slate-700" />
          <h3 className="text-base font-bold text-slate-900">Update Password</h3>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Current Password</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">New Password (Min 8 chars)</label>
            <input
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Confirm New Password</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {passwordMsg && (
            <div className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
              passwordMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
            }`}>
              {passwordMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{passwordMsg.text}</span>
            </div>
          )}

          <button
            type="submit"
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-lg transition-colors"
          >
            Update Password
          </button>
        </form>
      </div>

      {/* 2FA Enable Modal */}
      {twoFactorModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <h4 className="text-base font-bold text-slate-900">Activate Two-Factor Verification</h4>
            <p className="text-xs text-slate-500 mt-1">
              For testing and demonstration, enter the standard 6-digit confirmation code below:
            </p>

            <div className="my-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center text-xs text-emerald-900">
              <span>Demo OTP Code: </span>
              <strong className="font-mono text-base tracking-widest text-emerald-700">123456</strong>
            </div>

            <form onSubmit={handleConfirm2FA} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Enter 6-Digit Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value)}
                  placeholder="123456"
                  className="w-full text-center text-lg font-mono tracking-widest px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {twoFactorMsg && (
                <p className="text-xs text-rose-600 font-medium">{twoFactorMsg}</p>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setTwoFactorModal(false)}
                  className="w-1/2 py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading2FA || twoFactorCode.length !== 6}
                  className="w-1/2 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-xs font-semibold rounded-lg"
                >
                  {isLoading2FA ? 'Verifying...' : 'Confirm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
