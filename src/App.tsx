import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Navbar } from './components/Navbar.tsx';

// Customer Views
import { CustomerDashboard } from './components/customer/CustomerDashboard.tsx';
import { MoneyTransferView } from './components/customer/MoneyTransferView.tsx';
import { BankTransferView } from './components/customer/BankTransferView.tsx';
import { CashbackHub } from './components/customer/CashbackHub.tsx';
import { TransactionsView } from './components/customer/TransactionsView.tsx';
import { KycView } from './components/customer/KycView.tsx';
import { SecurityView } from './components/customer/SecurityView.tsx';
import { SupportView } from './components/customer/SupportView.tsx';
import { TermsPoliciesView } from './components/customer/TermsPoliciesView.tsx';
import { NotificationsView } from './components/customer/NotificationsView.tsx';

// Admin Views
import { AdminDashboard } from './components/admin/AdminDashboard.tsx';
import { AdminUsers } from './components/admin/AdminUsers.tsx';
import { AdminWithdrawals } from './components/admin/AdminWithdrawals.tsx';
import { AdminRules } from './components/admin/AdminRules.tsx';
import { AdminKyc } from './components/admin/AdminKyc.tsx';
import { AdminAuditLogs } from './components/admin/AdminAuditLogs.tsx';
import { AdminDeposits } from './components/admin/AdminDeposits.tsx';
import { AdminNotifications } from './components/admin/AdminNotifications.tsx';

// Auth View
import { AuthView } from './components/auth/AuthView.tsx';

const MainLayout: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [currentView, setCurrentView] = useState<string>('dashboard');

  useEffect(() => {
    if (user) {
      if (user.role === 'admin' || user.role === 'superadmin') {
        if (!currentView.startsWith('admin-')) {
          setCurrentView('admin-dashboard');
        }
      } else {
        if (currentView.startsWith('admin-')) {
          setCurrentView('dashboard');
        }
      }
    } else {
      setCurrentView('auth');
    }
  }, [user?.id, user?.role]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-xl animate-pulse">
            ₹
          </div>
          <p className="text-xs font-semibold text-slate-500">Loading RupeeRewards Engine...</p>
        </div>
      </div>
    );
  }

  const renderView = () => {
    if (!user) {
      return (
        <AuthView
          onSuccess={(targetRole) => {
            setCurrentView(targetRole === 'admin' ? 'admin-dashboard' : 'dashboard');
          }}
        />
      );
    }

    switch (currentView) {
      // Customer Views
      case 'dashboard':
        return <CustomerDashboard onNavigate={(v) => setCurrentView(v)} />;
      case 'money-transfer':
        return <MoneyTransferView />;
      case 'bank-transfer':
        return <BankTransferView />;
      case 'cashback':
        return <CashbackHub />;
      case 'transactions':
        return <TransactionsView />;
      case 'kyc':
        return <KycView />;
      case 'security':
      case 'profile':
        return <SecurityView />;
      case 'support':
        return <SupportView />;
      case 'terms':
        return <TermsPoliciesView />;
      case 'notifications':
        return <NotificationsView />;

      // Admin Views
      case 'admin-dashboard':
        return <AdminDashboard onNavigate={(v) => setCurrentView(v)} />;
      case 'admin-users':
        return <AdminUsers onNavigateToKyc={() => setCurrentView('admin-kyc')} />;
      case 'admin-withdrawals':
        return <AdminWithdrawals />;
      case 'admin-deposits':
        return <AdminDeposits />;
      case 'admin-rules':
        return <AdminRules />;
      case 'admin-kyc':
        return <AdminKyc />;
      case 'admin-audit':
        return <AdminAuditLogs />;
      case 'admin-notifications':
        return <AdminNotifications />;

      default:
        return user.role === 'admin' || user.role === 'superadmin' ? (
          <AdminDashboard onNavigate={(v) => setCurrentView(v)} />
        ) : (
          <CustomerDashboard onNavigate={(v) => setCurrentView(v)} />
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans">
      <Navbar
        currentView={currentView}
        onNavigate={(v) => setCurrentView(v)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderView()}
      </main>

      {/* Clean Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900">RupeeRewards</span>
            <span>·</span>
            <span>Licensed Digital Rewards &amp; Wallet Architecture</span>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium">
            <button
              onClick={() => setCurrentView('terms')}
              className="hover:text-slate-900 transition-colors"
            >
              Reward Terms (₹50 / ₹500)
            </button>
            <button
              onClick={() => setCurrentView('terms')}
              className="hover:text-slate-900 transition-colors"
            >
              Deposit Limit (₹20,000)
            </button>
            <button
              onClick={() => setCurrentView('terms')}
              className="hover:text-slate-900 transition-colors"
            >
              Withdrawal Policy &amp; Fees
            </button>
            <button
              onClick={() => setCurrentView('terms')}
              className="hover:text-slate-900 transition-colors"
            >
              Privacy Policy
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
