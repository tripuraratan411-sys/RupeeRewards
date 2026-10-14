import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import { formatDate } from '../../utils/formatters.ts';
import {
  ShieldCheck,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  FileText
} from 'lucide-react';
import type { KycDetails } from '../../types/index.ts';

export const AdminKyc: React.FC = () => {
  const [kycList, setKycList] = useState<(KycDetails & { userEmail: string; userName: string })[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedKyc, setSelectedKyc] = useState<any | null>(null);
  const [actionType, setActionType] = useState<'approved' | 'rejected'>('approved');
  const [remarks, setRemarks] = useState('');
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadKyc = async () => {
    setIsLoading(true);
    try {
      const res = await api.getAdminKycList();
      setKycList(res.kycList);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadKyc();
  }, []);

  const handleOpenAction = (item: any, type: 'approved' | 'rejected') => {
    setSelectedKyc(item);
    setActionType(type);
    setRemarks(type === 'approved' ? 'Identity verified against PAN records.' : 'Name mismatch with PAN database.');
  };

  const handleConfirmReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKyc) return;

    setIsSubmitting(true);
    try {
      await api.reviewKyc(selectedKyc.userId, {
        status: actionType,
        remarks
      });

      setActionMsg(`KYC for ${selectedKyc.userEmail} has been marked as ${actionType.toUpperCase()}.`);
      setSelectedKyc(null);
      await loadKyc();
      setTimeout(() => setActionMsg(null), 3500);
    } catch (err: any) {
      setActionMsg(`Review failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = kycList.filter(k => {
    if (filter === 'all') return true;
    return k.status === filter;
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">KYC Verification Desk</h2>
        <p className="text-sm text-slate-500 mt-1">
          Review customer identity submissions, authenticate PAN card formats, and grant withdrawal privileges.
        </p>
      </div>

      {actionMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold">
          {actionMsg}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
        {[
          { id: 'pending', label: 'Pending Review' },
          { id: 'approved', label: 'Approved Verified' },
          { id: 'rejected', label: 'Rejected' },
          { id: 'all', label: 'All Records' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setFilter(t.id as any)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              filter === t.id ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.label} ({t.id === 'all' ? kycList.length : kycList.filter(k => k.status === t.id).length})
          </button>
        ))}
      </div>

      {/* KYC List */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-xs text-slate-400">Loading KYC submissions...</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-500">No KYC submissions found in this category.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map(k => (
              <div key={k.userId} className="p-5 hover:bg-slate-50/60 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">{k.fullName}</span>
                    <span className="text-xs text-slate-500">({k.userEmail})</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      k.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                      k.status === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {k.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-600">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">PAN Number</span>
                      <strong className="font-mono text-slate-800">{k.panNumber}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Document</span>
                      <span className="capitalize">{k.idType} (...{k.idNumberLast4})</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">DOB</span>
                      <span>{k.dob}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Submitted</span>
                      <span>{formatDate(k.submittedAt)}</span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-600">
                    <span className="text-slate-400 text-[10px] uppercase font-semibold block">Residential Address</span>
                    <span>{k.address}</span>
                  </div>

                  {k.rejectionReason && (
                    <div className="text-xs text-rose-700 bg-rose-50 p-2 rounded-lg">
                      <strong>Remarks: </strong> {k.rejectionReason}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {k.status === 'pending' ? (
                    <>
                      <button
                        onClick={() => handleOpenAction(k, 'approved')}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approve KYC</span>
                      </button>
                      <button
                        onClick={() => handleOpenAction(k, 'rejected')}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleOpenAction(k, k.status === 'approved' ? 'rejected' : 'approved')}
                      className="px-3 py-1.5 border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold rounded-lg transition-colors"
                    >
                      Change Status
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selectedKyc && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">
              Confirm KYC Action: {actionType.toUpperCase()}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Customer: {selectedKyc.fullName} ({selectedKyc.panNumber})
            </p>

            <form onSubmit={handleConfirmReview} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Administrative Feedback / Audit Remarks
                </label>
                <textarea
                  rows={3}
                  required
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedKyc(null)}
                  className="w-1/2 py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-1/2 py-2 text-white text-xs font-semibold rounded-lg transition-colors ${
                    actionType === 'approved' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {isSubmitting ? 'Recording...' : `Confirm ${actionType}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
