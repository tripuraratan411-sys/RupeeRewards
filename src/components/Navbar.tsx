import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  Wallet,
  ShieldCheck,
  User,
  LogOut,
  ChevronDown,
  Bell,
  Sparkles,
  ArrowRightLeft,
  Send,
  Building2,
  FileText,
  HelpCircle,
  Clock,
  Layers,
  Menu,
  X,
  CreditCard
} from 'lucide-react';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  unreadCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate, unreadCount = 0 }) => {
  const { user, logout, quickDemoLogin } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [demoMenuOpen, setDemoMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  const handleRoleSwitch = async (role: 'customer' | 'customer2' | 'admin') => {
    setIsSwitching(true);
    setDemoMenuOpen(false);
    setMobileMenuOpen(false);
    try {
      await quickDemoLogin(role);
      if (role === 'admin') {
        onNavigate('admin-dashboard');
      } else {
        onNavigate('dashboard');
      }
    } catch (err) {
      console.error('Failed to switch demo account:', err);
    } finally {
      setIsSwitching(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 h-16">
          {/* Zone 1: Wordmark & Role Badge */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate(isAdmin ? 'admin-dashboard' : 'dashboard')}
              className="flex items-center gap-2.5 text-left focus:outline-none"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                ₹
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap">
                  RupeeRewards
                </span>
                {isAdmin ? (
                  <span className="ml-2 text-[10px] font-bold tracking-wider uppercase text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Admin Console
                  </span>
                ) : (
                  <span className="ml-2 text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded hidden sm:inline-block">
                    Wallet
                  </span>
                )}
              </div>
            </button>
          </div>

          {/* Zone 2: Navigation Links (Desktop) */}
          <nav className="hidden xl:flex items-center gap-4 text-xs font-semibold text-slate-600 overflow-x-auto py-1">
            {!isAdmin ? (
              <>
                <button
                  onClick={() => onNavigate('dashboard')}
                  className={`px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                    currentView === 'dashboard' ? 'text-emerald-700 bg-emerald-50 font-bold' : 'hover:text-slate-900'
                  }`}
                >
                  Wallet Overview
                </button>
                <button
                  onClick={() => onNavigate('money-transfer')}
                  className={`px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                    currentView === 'money-transfer' ? 'text-emerald-700 bg-emerald-50 font-bold' : 'hover:text-slate-900'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Money</span>
                </button>
                <button
                  onClick={() => onNavigate('bank-transfer')}
                  className={`px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                    currentView === 'bank-transfer' ? 'text-emerald-700 bg-emerald-50 font-bold' : 'hover:text-slate-900'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Bank Transfer</span>
                </button>
                <button
                  onClick={() => onNavigate('cashback')}
                  className={`px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                    currentView === 'cashback' ? 'text-emerald-700 bg-emerald-50 font-bold' : 'hover:text-slate-900'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Cashback Hub</span>
                </button>
                <button
                  onClick={() => onNavigate('transactions')}
                  className={`px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                    currentView === 'transactions' ? 'text-emerald-700 bg-emerald-50 font-bold' : 'hover:text-slate-900'
                  }`}
                >
                  Ledger &amp; History
                </button>
                <button
                  onClick={() => onNavigate('kyc')}
                  className={`px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                    currentView === 'kyc' ? 'text-emerald-700 bg-emerald-50 font-bold' : 'hover:text-slate-900'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>KYC Status</span>
                </button>
                <button
                  onClick={() => onNavigate('support')}
                  className={`px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                    currentView === 'support' ? 'text-emerald-700 bg-emerald-50 font-bold' : 'hover:text-slate-900'
                  }`}
                >
                  Help &amp; Support
                </button>
                <button
                  onClick={() => onNavigate('terms')}
                  className={`px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                    currentView === 'terms' ? 'text-emerald-700 bg-emerald-50 font-bold' : 'hover:text-slate-900'
                  }`}
                >
                  Policies
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => onNavigate('admin-dashboard')}
                  className={`px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                    currentView === 'admin-dashboard' ? 'text-emerald-700 bg-emerald-50 font-bold' : 'hover:text-slate-900'
                  }`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => onNavigate('admin-withdrawals')}
                  className={`px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                    currentView === 'admin-withdrawals' ? 'text-emerald-700 bg-emerald-50 font-bold' : 'hover:text-slate-900'
                  }`}
                >
                  Withdrawal Desk
                </button>
                <button
                  onClick={() => onNavigate('admin-deposits')}
                  className={`px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                    currentView === 'admin-deposits' ? 'text-emerald-700 bg-emerald-50 font-bold' : 'hover:text-slate-900'
                  }`}
                >
                  Deposit Ledger
                </button>
                <button
                  onClick={() => onNavigate('admin-users')}
                  className={`px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                    currentView === 'admin-users' ? 'text-emerald-700 bg-emerald-50 font-bold' : 'hover:text-slate-900'
                  }`}
                >
                  Users
                </button>
                <button
                  onClick={() => onNavigate('admin-rules')}
                  className={`px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                    currentView === 'admin-rules' ? 'text-emerald-700 bg-emerald-50 font-bold' : 'hover:text-slate-900'
                  }`}
                >
                  Reward Rules
                </button>
                <button
                  onClick={() => onNavigate('admin-kyc')}
                  className={`px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                    currentView === 'admin-kyc' ? 'text-emerald-700 bg-emerald-50 font-bold' : 'hover:text-slate-900'
                  }`}
                >
                  KYC Reviews
                </button>
                <button
                  onClick={() => onNavigate('admin-audit')}
                  className={`px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                    currentView === 'admin-audit' ? 'text-emerald-700 bg-emerald-50 font-bold' : 'hover:text-slate-900'
                  }`}
                >
                  Audit Trail
                </button>
                <button
                  onClick={() => onNavigate('admin-notifications')}
                  className={`px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                    currentView === 'admin-notifications' ? 'text-emerald-700 bg-emerald-50 font-bold' : 'hover:text-slate-900'
                  }`}
                >
                  Communications
                </button>
              </>
            )}
          </nav>

          {/* Zone 3: Actions & Demo Switch */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Quick Demo Switcher */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setDemoMenuOpen(!demoMenuOpen)}
                disabled={isSwitching}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                title="Switch between customer and admin roles"
              >
                <ArrowRightLeft className="w-3.5 h-3.5 text-slate-600" />
                <span>{isSwitching ? 'Switching...' : 'Switch Role'}</span>
                <ChevronDown className="w-3 h-3 text-slate-500" />
              </button>

              {demoMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl p-2 z-50 text-xs">
                  <div className="px-2 py-1 text-slate-400 font-semibold border-b border-slate-100 mb-1">
                    Instant Demo Switcher
                  </div>
                  <button
                    onClick={() => handleRoleSwitch('customer')}
                    className="w-full text-left px-2.5 py-2 hover:bg-slate-50 rounded-lg transition-colors flex flex-col"
                  >
                    <span className="font-bold text-slate-900">Rahul Sharma (Customer)</span>
                    <span className="text-slate-500 text-[11px]">KYC Approved · ₹2,500 Deposits</span>
                  </button>
                  <button
                    onClick={() => handleRoleSwitch('customer2')}
                    className="w-full text-left px-2.5 py-2 hover:bg-slate-50 rounded-lg transition-colors flex flex-col"
                  >
                    <span className="font-bold text-slate-900">Priya Patel (Customer 2)</span>
                    <span className="text-slate-500 text-[11px]">KYC Pending · New Account</span>
                  </button>
                  <button
                    onClick={() => handleRoleSwitch('admin')}
                    className="w-full text-left px-2.5 py-2 hover:bg-emerald-50 rounded-lg transition-colors flex flex-col border-t border-slate-100 mt-1"
                  >
                    <span className="font-bold text-emerald-800">Ananya Deshmukh (Admin Console)</span>
                    <span className="text-emerald-700 text-[11px]">Withdrawals · Rules · Audits · Ledgers</span>
                  </button>
                </div>
              )}
            </div>

            {/* Notification icon */}
            <button
              onClick={() => onNavigate(isAdmin ? 'admin-notifications' : 'notifications')}
              className="relative p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-600 ring-2 ring-white" />
              )}
            </button>

            {/* User Dropdown */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 p-1 pl-2 text-xs font-semibold text-slate-700 hover:text-slate-900 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs uppercase">
                    {user.name.charAt(0)}
                  </div>
                  <span className="hidden md:inline-block max-w-[100px] truncate">
                    {user.name}
                  </span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg p-2 z-50 text-xs">
                    <div className="px-3 py-2 border-b border-slate-100">
                      <p className="font-bold text-slate-900 truncate">{user.name}</p>
                      <p className="text-slate-500 text-[11px] truncate">{user.email}</p>
                      <span className="mt-1 inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                        {user.role}
                      </span>
                    </div>

                    {!isAdmin && (
                      <>
                        <button
                          onClick={() => {
                            setDropdownOpen(false);
                            onNavigate('profile');
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-2 text-slate-700"
                        >
                          <User className="w-3.5 h-3.5" />
                          <span>Profile &amp; Security</span>
                        </button>
                        <button
                          onClick={() => {
                            setDropdownOpen(false);
                            onNavigate('kyc');
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-2 text-slate-700"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>KYC Status ({user.kycStatus})</span>
                        </button>
                      </>
                    )}

                    <button
                      onClick={async () => {
                        setDropdownOpen(false);
                        await logout();
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors flex items-center gap-2 mt-1 border-t border-slate-100"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign out</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
              title="Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="xl:hidden border-t border-slate-200 py-3 px-2 space-y-1 text-xs font-semibold">
            {!isAdmin ? (
              <>
                <button
                  onClick={() => { setMobileMenuOpen(false); onNavigate('dashboard'); }}
                  className={`w-full text-left px-3 py-2 rounded-lg ${currentView === 'dashboard' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700'}`}
                >
                  Wallet Overview
                </button>
                <button
                  onClick={() => { setMobileMenuOpen(false); onNavigate('money-transfer'); }}
                  className={`w-full text-left px-3 py-2 rounded-lg ${currentView === 'money-transfer' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700'}`}
                >
                  Send Money (P2P)
                </button>
                <button
                  onClick={() => { setMobileMenuOpen(false); onNavigate('bank-transfer'); }}
                  className={`w-full text-left px-3 py-2 rounded-lg ${currentView === 'bank-transfer' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700'}`}
                >
                  Bank Transfer (IMPS)
                </button>
                <button
                  onClick={() => { setMobileMenuOpen(false); onNavigate('cashback'); }}
                  className={`w-full text-left px-3 py-2 rounded-lg ${currentView === 'cashback' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700'}`}
                >
                  Cashback Hub
                </button>
                <button
                  onClick={() => { setMobileMenuOpen(false); onNavigate('transactions'); }}
                  className={`w-full text-left px-3 py-2 rounded-lg ${currentView === 'transactions' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700'}`}
                >
                  Ledger &amp; History
                </button>
                <button
                  onClick={() => { setMobileMenuOpen(false); onNavigate('kyc'); }}
                  className={`w-full text-left px-3 py-2 rounded-lg ${currentView === 'kyc' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700'}`}
                >
                  KYC Verification
                </button>
                <button
                  onClick={() => { setMobileMenuOpen(false); onNavigate('support'); }}
                  className={`w-full text-left px-3 py-2 rounded-lg ${currentView === 'support' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700'}`}
                >
                  Help &amp; Support
                </button>
                <button
                  onClick={() => { setMobileMenuOpen(false); onNavigate('terms'); }}
                  className={`w-full text-left px-3 py-2 rounded-lg ${currentView === 'terms' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700'}`}
                >
                  Policies &amp; Terms
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => { setMobileMenuOpen(false); onNavigate('admin-dashboard'); }}
                  className={`w-full text-left px-3 py-2 rounded-lg ${currentView === 'admin-dashboard' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700'}`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => { setMobileMenuOpen(false); onNavigate('admin-withdrawals'); }}
                  className={`w-full text-left px-3 py-2 rounded-lg ${currentView === 'admin-withdrawals' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700'}`}
                >
                  Withdrawal Desk
                </button>
                <button
                  onClick={() => { setMobileMenuOpen(false); onNavigate('admin-deposits'); }}
                  className={`w-full text-left px-3 py-2 rounded-lg ${currentView === 'admin-deposits' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700'}`}
                >
                  Deposit Ledger
                </button>
                <button
                  onClick={() => { setMobileMenuOpen(false); onNavigate('admin-users'); }}
                  className={`w-full text-left px-3 py-2 rounded-lg ${currentView === 'admin-users' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700'}`}
                >
                  Users
                </button>
                <button
                  onClick={() => { setMobileMenuOpen(false); onNavigate('admin-rules'); }}
                  className={`w-full text-left px-3 py-2 rounded-lg ${currentView === 'admin-rules' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700'}`}
                >
                  Reward Rules
                </button>
                <button
                  onClick={() => { setMobileMenuOpen(false); onNavigate('admin-kyc'); }}
                  className={`w-full text-left px-3 py-2 rounded-lg ${currentView === 'admin-kyc' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700'}`}
                >
                  KYC Reviews
                </button>
                <button
                  onClick={() => { setMobileMenuOpen(false); onNavigate('admin-audit'); }}
                  className={`w-full text-left px-3 py-2 rounded-lg ${currentView === 'admin-audit' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700'}`}
                >
                  Audit Trail
                </button>
                <button
                  onClick={() => { setMobileMenuOpen(false); onNavigate('admin-notifications'); }}
                  className={`w-full text-left px-3 py-2 rounded-lg ${currentView === 'admin-notifications' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700'}`}
                >
                  Communications
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
