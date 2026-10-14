import type {
  User,
  UserBalances,
  Transaction,
  BonusRecord,
  CashbackSummary,
  WithdrawalRequest,
  MoneyTransfer,
  BankAccount,
  BankTransfer,
  KycDetails,
  BonusRuleConfig,
  CashbackRuleConfig,
  WithdrawalRuleConfig,
  AuditLog,
  SystemNotification,
  SupportTicket
} from '../types/index.ts';

const TOKEN_KEY = 'rupee_rewards_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.error || `Request failed with status ${response.status}`;
    const error = new Error(errorMsg) as any;
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data as T;
}

export const api = {
  // Auth
  async register(data: { name: string; email: string; phone?: string; password: string }) {
    return request<{ user: User; token: string; balances: UserBalances }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async login(data: { email?: string; password?: string; otpCode?: string; tempToken?: string }) {
    return request<{
      user?: User;
      token?: string;
      balances?: UserBalances;
      requiresTwoFactor?: boolean;
      tempToken?: string;
      message?: string;
    }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async demoSwitch(role: 'customer' | 'customer2' | 'admin') {
    return request<{ user: User; token: string; balances: UserBalances; kyc: KycDetails | null }>('/api/auth/demo-switch', {
      method: 'POST',
      body: JSON.stringify({ role })
    });
  },

  async logout() {
    return request<{ success: boolean }>('/api/auth/logout', { method: 'POST' });
  },

  async getMe() {
    return request<{ user: User; balances: UserBalances; kyc: KycDetails | null }>('/api/auth/me');
  },

  async updateProfile(data: { name?: string; phone?: string }) {
    return request<{ user: User; message: string }>('/api/user/profile', {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  },

  async changePassword(data: { currentPassword: string; newPassword: string }) {
    return request<{ success: boolean; message: string }>('/api/user/change-password', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async toggle2FA(data: { enabled: boolean; otpCode?: string }) {
    return request<{ user: User; message: string }>('/api/user/toggle-2fa', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // Wallet & Ledger
  async deposit(data: { amount: number; paymentMethod: string; idempotencyKey?: string }) {
    return request<{
      success: boolean;
      message: string;
      transaction: Transaction;
      bonusCredited: number;
      bonusRecord: BonusRecord | null;
      balances: UserBalances;
    }>('/api/wallet/deposit', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async getWithdrawalEligibility() {
    return request<{
      withdrawableBalance: number;
      totalAvailable: number;
      promotionalBonus: number;
      cashbackBalance: number;
      isKycApproved: boolean;
      kycStatus: string;
      minWithdrawal: number;
      maxDailyAmount: number;
      maxWithdrawalsPerDay: number;
      todayWithdrawalCount: number;
      todayWithdrawnAmount: number;
      remainingDailyWithdrawalLimit: number;
      canWithdrawToday: boolean;
      allowedMethods: string[];
      feeStructure: Record<string, { name: string; feePercentage: number; flatFee: number; processingTime: string }>;
      termsNote: string;
    }>('/api/wallet/withdrawal-eligibility');
  },

  async withdraw(data: {
    amount: number;
    method: string;
    payoutDetails: any;
    idempotencyKey?: string;
  }) {
    return request<{
      success: boolean;
      message: string;
      withdrawal: WithdrawalRequest;
      balances: UserBalances;
    }>('/api/wallet/withdraw', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // Money Transfer (P2P Wallet)
  async lookupRecipient(query: string) {
    return request<{
      recipient: {
        id: string;
        name: string;
        email: string;
        phone: string;
        kycStatus: string;
      };
    }>('/api/transfers/money/recipient-lookup', {
      method: 'POST',
      body: JSON.stringify({ query })
    });
  },

  async sendMoneyTransfer(data: {
    recipientId: string;
    amount: number;
    note?: string;
    verificationOtp?: string;
    idempotencyKey?: string;
  }) {
    return request<{
      success: boolean;
      message: string;
      transfer: MoneyTransfer;
      balances: UserBalances;
    }>('/api/transfers/money/send', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async getMoneyTransferHistory() {
    return request<{ transfers: MoneyTransfer[] }>('/api/transfers/money/history');
  },

  // Bank Transfer (Direct IMPS to Bank Accounts)
  async getBankAccounts() {
    return request<{ accounts: BankAccount[] }>('/api/bank-accounts');
  },

  async addBankAccount(data: {
    accountHolderName: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
  }) {
    return request<{ success: boolean; message: string; account: BankAccount }>('/api/bank-accounts', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async initiateBankTransfer(data: {
    bankAccountId: string;
    amount: number;
    note?: string;
    verificationOtp?: string;
    idempotencyKey?: string;
  }) {
    return request<{
      success: boolean;
      message: string;
      transfer: BankTransfer;
      balances: UserBalances;
    }>('/api/transfers/bank/initiate', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async getBankTransferHistory() {
    return request<{ transfers: BankTransfer[] }>('/api/transfers/bank/history');
  },

  // Ledgers
  async getTransactions(params?: { type?: string; status?: string }) {
    const query = new URLSearchParams();
    if (params?.type) query.set('type', params.type);
    if (params?.status) query.set('status', params.status);
    return request<{ transactions: Transaction[] }>(`/api/wallet/transactions?${query.toString()}`);
  },

  async getDepositsHistory() {
    return request<{ deposits: Transaction[] }>('/api/wallet/deposits');
  },

  async getBonusesHistory() {
    return request<{ bonuses: BonusRecord[] }>('/api/wallet/bonuses');
  },

  async getWithdrawalsHistory() {
    return request<{ withdrawals: WithdrawalRequest[] }>('/api/wallet/withdrawals');
  },

  async getCashback() {
    return request<{ summary: CashbackSummary; rule: CashbackRuleConfig }>('/api/cashback');
  },

  // KYC
  async getKyc() {
    return request<{ kycStatus: string; kycRemarks?: string; kyc: KycDetails | null }>('/api/kyc');
  },

  async submitKyc(data: {
    fullName: string;
    panNumber: string;
    idType: string;
    idNumberLast4: string;
    dob: string;
    address: string;
    documentPreviewUrl?: string;
  }) {
    return request<{ success: boolean; message: string; kyc: KycDetails }>('/api/kyc/submit', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // Notifications
  async getNotifications() {
    return request<{ notifications: SystemNotification[] }>('/api/notifications');
  },

  // Support
  async getSupportTickets() {
    return request<{ tickets: SupportTicket[] }>('/api/support/tickets');
  },

  async createSupportTicket(data: {
    subject: string;
    category: string;
    priority: string;
    message: string;
  }) {
    return request<{ success: boolean; ticket: SupportTicket; message: string }>('/api/support/tickets', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // Admin Endpoints
  async getAdminMetrics() {
    return request<{
      totalUsers: number;
      activeUsers: number;
      kycApprovedCount: number;
      kycPendingCount: number;
      kycRejectedCount: number;
      totalDeposits: number;
      totalWithdrawn: number;
      pendingWithdrawalsCount: number;
      pendingWithdrawalsAmount: number;
      approvedWithdrawalsCount: number;
      rejectedWithdrawalsCount: number;
      totalBonusCredited: number;
      totalCashbackIssued: number;
      activeLiability: number;
      moneyTransferVolume: number;
      moneyTransferCount: number;
      bankTransferVolume: number;
      bankTransferCount: number;
      pendingTransactionsCount: number;
      failedTransactionsCount: number;
      securityAlerts: { id: string; level: string; message: string }[];
      bonusRule: BonusRuleConfig;
      cashbackRule: CashbackRuleConfig;
      withdrawalRule: WithdrawalRuleConfig;
      recentAuditLogs?: AuditLog[];
      recentNotifications?: SystemNotification[];
    }>('/api/admin/metrics');
  },

  async getAdminUsers() {
    return request<{ users: (User & { balances: UserBalances })[] }>('/api/admin/users');
  },

  async toggleUserSuspension(userId: string) {
    return request<{ success: boolean; isSuspended: boolean }>(`/api/admin/users/${userId}/toggle-suspend`, {
      method: 'POST'
    });
  },

  async getAdminDeposits() {
    return request<{ deposits: Transaction[] }>('/api/admin/deposits');
  },

  async getAdminWithdrawals() {
    return request<{
      withdrawals: (WithdrawalRequest & {
        userKycStatus: string;
        userDailyWithdrawnAmount: number;
        userDailyRemainingLimit: number;
        userTotalDepositBalance: number;
      })[];
    }>('/api/admin/withdrawals');
  },

  async updateWithdrawalStatus(
    id: string,
    data: { status: string; adminNote?: string; payoutReference?: string }
  ) {
    return request<{ success: boolean; withdrawal: WithdrawalRequest }>(`/api/admin/withdrawals/${id}/update-status`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async getWithdrawalRule() {
    return request<{ rule: WithdrawalRuleConfig }>('/api/admin/rules/withdrawal');
  },

  async updateWithdrawalRule(data: Partial<WithdrawalRuleConfig>) {
    return request<{ success: boolean; message: string; rule: WithdrawalRuleConfig }>('/api/admin/rules/withdrawal', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async getBonusRule() {
    return request<{ rule: BonusRuleConfig }>('/api/admin/rules/bonus');
  },

  async updateBonusRule(data: Partial<BonusRuleConfig>) {
    return request<{ success: boolean; message: string; rule: BonusRuleConfig }>('/api/admin/rules/bonus', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async getCashbackRule() {
    return request<{ rule: CashbackRuleConfig }>('/api/admin/rules/cashback');
  },

  async updateCashbackRule(data: Partial<CashbackRuleConfig>) {
    return request<{ success: boolean; message: string; rule: CashbackRuleConfig }>('/api/admin/rules/cashback', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async getAdminMoneyTransfers() {
    return request<{ transfers: MoneyTransfer[] }>('/api/admin/transfers/money');
  },

  async getAdminBankTransfers() {
    return request<{ transfers: BankTransfer[] }>('/api/admin/transfers/bank');
  },

  async getAdminKycList() {
    return request<{ kycList: (KycDetails & { userEmail: string; userName: string })[] }>('/api/admin/kyc');
  },

  async reviewKyc(userId: string, data: { status: 'approved' | 'rejected'; remarks?: string }) {
    return request<{ success: boolean; kyc: KycDetails; userStatus: string }>(`/api/admin/kyc/${userId}/review`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async getAdminAuditLogs() {
    return request<{ auditLogs: AuditLog[] }>('/api/admin/audit-logs');
  },

  async broadcastNotification(data: {
    title: string;
    message: string;
    category: string;
    targetRole?: string;
  }) {
    return request<{ success: boolean; notification: SystemNotification }>('/api/admin/notifications', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async getAdminSupportTickets() {
    return request<{ tickets: SupportTicket[] }>('/api/admin/support/tickets');
  },

  async replyAdminSupportTicket(id: string, data: { adminReply: string; status?: string }) {
    return request<{ success: boolean; ticket: SupportTicket }>(`/api/admin/support/tickets/${id}/reply`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
};
