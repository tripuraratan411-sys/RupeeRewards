import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import { formatDate } from '../../utils/formatters.ts';
import { Bell, Send, CheckCircle2, AlertCircle, MessageSquare, Reply } from 'lucide-react';
import type { SystemNotification, SupportTicket } from '../../types/index.ts';

export const AdminNotifications: React.FC = () => {
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [activeTab, setActiveTab] = useState<'broadcast' | 'tickets'>('broadcast');

  // Broadcast Form
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState<'promo' | 'security' | 'system' | 'compliance'>('promo');
  const [targetRole, setTargetRole] = useState<'all' | 'customer' | 'admin'>('all');
  const [isPublishing, setIsPublishing] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Ticket Reply Form
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyStatus, setReplyStatus] = useState<any>('resolved');
  const [isReplying, setIsReplying] = useState(false);

  const loadData = async () => {
    try {
      const [nRes, tRes] = await Promise.all([
        api.getNotifications(),
        api.getAdminSupportTickets()
      ]);
      setNotifications(nRes.notifications);
      setTickets(tRes.tickets);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPublishing(true);
    setStatusMsg(null);

    try {
      await api.broadcastNotification({
        title,
        message,
        category,
        targetRole
      });

      setStatusMsg('Announcement broadcasted to all customer notification feeds.');
      setTitle('');
      setMessage('');
      await loadData();
      setTimeout(() => setStatusMsg(null), 3500);
    } catch (err: any) {
      setStatusMsg(err.message || 'Broadcast failed');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleReplyTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;

    setIsReplying(true);
    try {
      await api.replyAdminSupportTicket(selectedTicket.id, {
        adminReply: replyText,
        status: replyStatus
      });

      setSelectedTicket(null);
      setReplyText('');
      setStatusMsg('Reply sent to user support ticket successfully.');
      await loadData();
      setTimeout(() => setStatusMsg(null), 3500);
    } catch (err: any) {
      setStatusMsg(`Response failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsReplying(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            System Communications &amp; Desk
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Broadcast platform bulletins, promotional alerts, and respond to user inquiry tickets.
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
          <button
            onClick={() => setActiveTab('broadcast')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'broadcast' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            System Broadcasts
          </button>
          <button
            onClick={() => setActiveTab('tickets')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'tickets' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Support Tickets ({tickets.filter(t => t.status === 'open').length} Open)
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold">
          {statusMsg}
        </div>
      )}

      {activeTab === 'broadcast' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Create Broadcast Form */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Bell className="w-5 h-5 text-emerald-600" />
              <span>Compose Broadcast Notification</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Instantly published to active user notification feeds.
            </p>

            <form onSubmit={handleBroadcast} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Alert Headline</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Festival Deposit Booster Active"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e: any) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800"
                  >
                    <option value="promo">Promotional Reward</option>
                    <option value="compliance">KYC Compliance</option>
                    <option value="security">Security Advisory</option>
                    <option value="system">System Maintenance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Audience Scope</label>
                  <select
                    value={targetRole}
                    onChange={(e: any) => setTargetRole(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800"
                  >
                    <option value="all">All Registered Users</option>
                    <option value="customer">Customers Only</option>
                    <option value="admin">Admins Only</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Announcement Body</label>
                <textarea
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Details of promotional criteria, rules, or advisory notice..."
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={isPublishing}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <Send className="w-4 h-4" />
                <span>{isPublishing ? 'Publishing...' : 'Broadcast Platform Notice'}</span>
              </button>
            </form>
          </div>

          {/* Active Notices Feed */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col">
            <h3 className="text-base font-bold text-slate-900 mb-1">Live Published Notices</h3>
            <p className="text-xs text-slate-500 mb-4">
              Historical broadcasts delivered across the application.
            </p>

            <div className="space-y-3 overflow-y-auto max-h-[460px] pr-1 flex-1">
              {notifications.map((n) => (
                <div key={n.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5">
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="font-bold text-slate-900">{n.title}</h4>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap">{formatDate(n.createdAt)}</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">{n.message}</p>
                  <div className="flex gap-2 text-[10px] text-slate-400 font-semibold pt-1 border-t border-slate-200">
                    <span className="uppercase">Category: {n.category}</span>
                    <span>·</span>
                    <span className="uppercase">Target: {n.targetRole || 'all'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Support Tickets Desk */
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-900 text-sm">Customer Support Inquiries</h3>
            <span className="text-xs text-slate-500">Total {tickets.length} tickets</span>
          </div>

          <div className="divide-y divide-slate-100">
            {tickets.map((t) => (
              <div key={t.id} className="p-4 hover:bg-slate-50/60 transition-colors flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{t.subject}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      t.status === 'resolved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {t.status}
                    </span>
                    <span className="text-xs text-slate-400">· {t.priority} priority</span>
                  </div>

                  <p className="text-xs text-slate-600">{t.message}</p>
                  <div className="text-[11px] text-slate-400">
                    From: <strong>{t.userName}</strong> ({t.userEmail}) · Category: {t.category} · {formatDate(t.createdAt)}
                  </div>

                  {t.adminReply && (
                    <div className="mt-2 p-2.5 bg-emerald-50 border border-emerald-100 rounded-lg text-xs text-emerald-900">
                      <strong>Executive Reply: </strong> {t.adminReply}
                    </div>
                  )}
                </div>

                <div className="shrink-0">
                  <button
                    onClick={() => {
                      setSelectedTicket(t);
                      setReplyText(t.adminReply || '');
                    }}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <Reply className="w-3.5 h-3.5" />
                    <span>{t.adminReply ? 'Update Reply' : 'Respond'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reply Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">
              Respond to: {selectedTicket.subject}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              User: {selectedTicket.userName} ({selectedTicket.userEmail})
            </p>

            <form onSubmit={handleReplyTicket} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Status After Reply
                </label>
                <select
                  value={replyStatus}
                  onChange={(e: any) => setReplyStatus(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800"
                >
                  <option value="resolved">Resolved</option>
                  <option value="in_progress">In Progress</option>
                  <option value="open">Keep Open</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Executive Response Message
                </label>
                <textarea
                  rows={4}
                  required
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type clear resolution notes for the customer..."
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  className="w-1/2 py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isReplying}
                  className="w-1/2 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  {isReplying ? 'Sending...' : 'Send Response'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
