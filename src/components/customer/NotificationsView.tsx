import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import { formatDate } from '../../utils/formatters.ts';
import { Bell, Sparkles, ShieldCheck, Info, CheckCircle2 } from 'lucide-react';
import type { SystemNotification } from '../../types/index.ts';

export const NotificationsView: React.FC = () => {
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.getNotifications()
      .then(res => setNotifications(res.notifications))
      .catch(err => console.error(err))
      .finally(() => setIsLoading(false));
  }, []);

  const getIcon = (category: string) => {
    switch (category) {
      case 'promo':
        return <Sparkles className="w-5 h-5 text-emerald-600" />;
      case 'security':
      case 'compliance':
        return <ShieldCheck className="w-5 h-5 text-indigo-600" />;
      default:
        return <Info className="w-5 h-5 text-slate-600" />;
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Notifications &amp; Advisories</h2>
        <p className="text-sm text-slate-500 mt-1">
          System updates, promotional reward events, and compliance notices.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm divide-y divide-slate-100 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading notices...</div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">No new notices at this time.</div>
        ) : (
          notifications.map(n => (
            <div key={n.id} className="p-5 hover:bg-slate-50/70 transition-colors flex items-start gap-4">
              <div className="p-2 bg-slate-100 rounded-xl shrink-0 mt-0.5">
                {getIcon(n.category)}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-bold text-sm text-slate-900">{n.title}</h4>
                  <span className="text-[11px] text-slate-400 whitespace-nowrap">
                    {formatDate(n.createdAt)}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Category: {n.category}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
