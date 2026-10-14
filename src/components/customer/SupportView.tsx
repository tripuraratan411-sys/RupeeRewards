import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import { formatDate } from '../../utils/formatters.ts';
import {
  HelpCircle,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock
} from 'lucide-react';
import type { SupportTicket } from '../../types/index.ts';

export const SupportView: React.FC = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<any>('bonus');
  const [priority, setPriority] = useState<any>('medium');
  const [message, setMessage] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ticketStatusMsg, setTicketStatusMsg] = useState<string | null>(null);

  const faqs = [
    {
      q: 'How does the ₹50 deposit bonus credit work?',
      a: 'Whenever you deposit funds in multiples of ₹500 (e.g. ₹500, ₹1,000, ₹1,500), the system automatically calculates and credits an instant ₹50 promotional bonus per ₹500 block into your promotional bonus balance. Your principal deposit remains 100% withdrawable to your bank or UPI once KYC is approved.'
    },
    {
      q: 'Why is there a ₹20,000 maximum deposit limit?',
      a: 'In compliance with digital wallet security thresholds and risk-management principles, each account has an overall cumulative lifetime deposit cap of ₹20,000. Once you reach this cumulative deposit amount, further deposits are safely disabled.'
    },
    {
      q: 'Why are bonus and cashback balances separated from my deposit balance?',
      a: 'Deposit balance represents your deposited cash which can be withdrawn directly back to your external bank account or UPI ID. Promotional bonuses and cashback vouchers are promotional incentives provided for use within the platform.'
    },
    {
      q: 'What are the withdrawal processing times and fees?',
      a: 'UPI transfers are processed with zero fees within 15–30 minutes. IMPS bank payouts carry a nominal ₹10 processing fee for 24x7 instant settlement. Minimum withdrawal is ₹200 and maximum daily limit is ₹10,000.'
    },
    {
      q: 'Why is KYC mandatory before withdrawal?',
      a: 'Under regulatory and anti-money laundering (AML) guidelines, customer identity must be verified before external disbursements can be sanctioned to third-party bank accounts or VPAs.'
    }
  ];

  const loadTickets = async () => {
    try {
      const res = await api.getSupportTickets();
      setTickets(res.tickets);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTicketStatusMsg(null);

    try {
      const res = await api.createSupportTicket({
        subject,
        category,
        priority,
        message
      });
      setTicketStatusMsg(res.message);
      setSubject('');
      setMessage('');
      await loadTickets();
      setTimeout(() => setTicketStatusMsg(null), 4000);
    } catch (err: any) {
      setTicketStatusMsg(err.message || 'Failed to submit ticket');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Help &amp; Support</h2>
        <p className="text-sm text-slate-500 mt-1">
          Explore frequently asked questions or raise a priority ticket with our compliance and billing desk.
        </p>
      </div>

      {/* FAQ Accordion */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-emerald-600" />
          <span>Frequently Answered Inquiries</span>
        </h3>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="border border-slate-200 rounded-xl overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between p-4 text-left text-xs font-bold text-slate-900 hover:bg-slate-50 transition-colors"
                >
                  <span>{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-slate-500 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="p-4 pt-0 text-xs text-slate-600 bg-slate-50/50 leading-relaxed border-t border-slate-100">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Raise a Support Ticket Form */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-slate-700" />
            <span>Submit a Support Request</span>
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Our technical support team reviews all requests with an SLA of under 4 business hours.
          </p>

          <form onSubmit={handleCreateTicket} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Subject</label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Brief summary of inquiry"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800"
                >
                  <option value="deposit">Deposit &amp; Payment Gateway</option>
                  <option value="withdrawal">Withdrawal &amp; Settlement</option>
                  <option value="bonus">Promotional Bonus &amp; Rules</option>
                  <option value="cashback">Cashback Vouchers</option>
                  <option value="kyc">KYC &amp; Verification</option>
                  <option value="security">Security &amp; 2FA</option>
                  <option value="other">Other Inquiry</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800"
                >
                  <option value="low">Standard (Low)</option>
                  <option value="medium">Medium</option>
                  <option value="high">Urgent (High)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Detailed Message</label>
              <textarea
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Include reference IDs or details if applicable..."
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {ticketStatusMsg && (
              <p className="text-xs text-emerald-700 font-medium">{ticketStatusMsg}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Sending Ticket...' : 'Submit Support Ticket'}</span>
            </button>
          </form>
        </div>

        {/* Existing Tickets */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col">
          <h3 className="text-base font-bold text-slate-900 mb-2">Your Open &amp; Past Tickets</h3>
          <p className="text-xs text-slate-500 mb-4">
            Track communication logs with support representatives.
          </p>

          {tickets.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs flex-1 flex items-center justify-center">
              No tickets submitted yet.
            </div>
          ) : (
            <div className="space-y-3 overflow-y-auto max-h-[420px] pr-1 flex-1">
              {tickets.map((t) => (
                <div key={t.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-bold text-slate-900">{t.subject}</p>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                      t.status === 'resolved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {t.status}
                    </span>
                  </div>

                  <p className="text-slate-600 leading-relaxed">{t.message}</p>

                  {t.adminReply && (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-950 mt-2">
                      <p className="font-semibold text-[11px] text-emerald-800 mb-1">
                        Executive Response:
                      </p>
                      <p>{t.adminReply}</p>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1 border-t border-slate-200">
                    <span className="capitalize">Category: {t.category}</span>
                    <span>{formatDate(t.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
