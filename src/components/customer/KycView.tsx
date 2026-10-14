import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import { formatDate } from '../../utils/formatters.ts';
import {
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  Lock,
  ArrowRight
} from 'lucide-react';
import type { KycDetails } from '../../types/index.ts';

export const KycView: React.FC = () => {
  const { user, refreshUserData } = useAuth();
  const [kycData, setKycData] = useState<KycDetails | null>(null);
  const [fullName, setFullName] = useState(user?.name || '');
  const [panNumber, setPanNumber] = useState('');
  const [idType, setIdType] = useState<'aadhaar' | 'passport' | 'voter_id' | 'driving_license'>('aadhaar');
  const [idNumberLast4, setIdNumberLast4] = useState('');
  const [dob, setDob] = useState('1994-06-15');
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadKyc = async () => {
    try {
      const res = await api.getKyc();
      if (res.kyc) {
        setKycData(res.kyc);
        setFullName(res.kyc.fullName);
        setPanNumber(res.kyc.panNumber);
        setIdType(res.kyc.idType);
        setIdNumberLast4(res.kyc.idNumberLast4);
        setDob(res.kyc.dob);
        setAddress(res.kyc.address);
      }
    } catch (err) {
      console.error('Failed to load KYC info:', err);
    }
  };

  useEffect(() => {
    loadKyc();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      const res = await api.submitKyc({
        fullName,
        panNumber,
        idType,
        idNumberLast4,
        dob,
        address
      });

      setSuccessMsg(res.message);
      setKycData(res.kyc);
      await refreshUserData();
    } catch (err: any) {
      setError(err.message || 'KYC submission failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const status = user?.kycStatus || 'not_submitted';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">KYC &amp; Identity Verification</h2>
        <p className="text-sm text-slate-500 mt-1">
          Government-authorized identification verification in compliance with digital payment directives.
        </p>
      </div>

      {/* Verification Status Banner */}
      <div className={`p-5 rounded-2xl border flex items-start gap-4 ${
        status === 'approved'
          ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
          : status === 'pending'
          ? 'bg-amber-50/70 border-amber-200 text-amber-950'
          : status === 'rejected'
          ? 'bg-rose-50/70 border-rose-200 text-rose-950'
          : 'bg-slate-50 border-slate-200 text-slate-800'
      }`}>
        <div className="p-2 rounded-xl bg-white/80 shadow-sm shrink-0">
          {status === 'approved' && <ShieldCheck className="w-6 h-6 text-emerald-600" />}
          {status === 'pending' && <Clock className="w-6 h-6 text-amber-600" />}
          {status === 'rejected' && <AlertCircle className="w-6 h-6 text-rose-600" />}
          {status === 'not_submitted' && <FileText className="w-6 h-6 text-slate-600" />}
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-base">
              KYC Status:{' '}
              <span className="capitalize">
                {status === 'not_submitted' ? 'Action Required: Unverified' : status}
              </span>
            </h3>
          </div>
          <p className="text-xs mt-1 text-slate-600">
            {status === 'approved' &&
              'Your profile is fully verified. You enjoy unrestricted withdrawals to UPI and IMPS bank accounts.'}
            {status === 'pending' &&
              'Your documents have been submitted and are being reviewed by the compliance desk. Average review time: 30-90 minutes.'}
            {status === 'rejected' &&
              `Verification was rejected. Reason: ${user?.kycRemarks || 'Document discrepancy'}. Please correct details and resubmit.`}
            {status === 'not_submitted' &&
              'Please submit your Permanent Account Number (PAN) and Government Photo ID to unlock withdrawals.'}
          </p>

          {kycData?.verifiedAt && (
            <p className="text-[11px] text-slate-500 mt-2">
              Verified on: {formatDate(kycData.verifiedAt)}
            </p>
          )}
        </div>
      </div>

      {/* Form or Verified Details Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 mb-4">
          {status === 'approved' ? 'Verified Document Records' : 'Submit Identity Details'}
        </h3>

        {status === 'approved' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-slate-500 font-medium">Full Legal Name</span>
              <p className="font-semibold text-slate-900 mt-0.5">{kycData?.fullName}</p>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-slate-500 font-medium">PAN Card Number</span>
              <p className="font-mono font-semibold text-slate-900 mt-0.5">{kycData?.panNumber}</p>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-slate-500 font-medium">Government ID</span>
              <p className="font-semibold text-slate-900 mt-0.5 capitalize">
                {kycData?.idType} (Ending in {kycData?.idNumberLast4})
              </p>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-slate-500 font-medium">Date of Birth</span>
              <p className="font-semibold text-slate-900 mt-0.5">{kycData?.dob}</p>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl md:col-span-2">
              <span className="text-slate-500 font-medium">Registered Address</span>
              <p className="font-semibold text-slate-900 mt-0.5">{kycData?.address}</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Full Legal Name (as on PAN)
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  PAN Number (10 Characters)
                </label>
                <input
                  type="text"
                  required
                  maxLength={10}
                  value={panNumber}
                  onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                  placeholder="e.g. ABCPS1234F"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono uppercase text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Secondary Identity Document
                </label>
                <select
                  value={idType}
                  onChange={(e: any) => setIdType(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="aadhaar">Aadhaar Card</option>
                  <option value="passport">Indian Passport</option>
                  <option value="voter_id">Voter ID (EPIC)</option>
                  <option value="driving_license">Driving License</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Last 4 Digits of ID Document
                </label>
                <input
                  type="text"
                  required
                  maxLength={4}
                  value={idNumberLast4}
                  onChange={(e) => setIdNumberLast4(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="e.g. 8842"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Date of Birth
                </label>
                <input
                  type="date"
                  required
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Residential Address
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Flat/Street, City, State, PIN"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            <div className="pt-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Encrypted with SHA-256 vault standard</span>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl transition-colors flex items-center gap-2 shadow-sm"
              >
                {isLoading ? 'Verifying...' : 'Submit Documents for Review'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
