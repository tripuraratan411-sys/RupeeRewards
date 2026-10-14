export type UserRole = 'customer' | 'admin' | 'superadmin';

export type KycStatus = 'not_submitted' | 'pending' | 'approved' | 'rejected';

export type TransactionType =
  | 'deposit'
  | 'withdrawal'
  | 'bonus'
  | 'cashback'
  | 'money_transfer'
  | 'bank_transfer';

export type TransactionStatus =
  | 'pending'
  | 'approved'
  | 'processing'
  | 'completed'
  | 'rejected'
  | 'failed';

export type PayoutMethod = 'upi' | 'bank_transfer' | 'net_banking';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  isSuspended: boolean;
  twoFactorEnabled: boolean;
  kycStatus: KycStatus;
  kycRemarks?: string;
  createdAt: string;
  lastLoginAt: string;
}

export interface UserBalances {
  depositBalance: number;         // Principal deposited cash (withdrawable/transferable)
  promotionalBonus: number;       // Bonus earned from deposit reward rules
  cashbackBalance: number;        // Active cashback balance
  totalAvailable: number;         // Total spendable/available balance
  totalDepositedLifetime: number; // Cumulative deposits against ₹20,000 cap
  maxDepositLimit: number;        // Currently configured limit (e.g. ₹20,000)
  remainingDepositRoom: number;   // maxDepositLimit - totalDepositedLifetime
  withdrawableBalance: number;    // Legitimate withdrawable balance (deposit balance subject to policy)
  todayWithdrawalCount: number;   // Count of withdrawals requested today (max 1/day)
  todayWithdrawnAmount: number;   // Amount withdrawn today
  remainingDailyWithdrawalLimit: number; // max ₹10,000 - todayWithdrawnAmount
  canWithdrawToday: boolean;      // true if count < maxWithdrawalsPerDay && kyc approved
}

export interface Transaction {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
  title: string;
  description: string;
  referenceId: string;
  paymentMethod?: string;
  fee: number;
  netAmount: number;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
}

export interface BonusRecord {
  id: string;
  userId: string;
  depositTransactionId: string;
  depositAmount: number;
  bonusAmount: number;
  ruleApplied: string;
  status: 'credited' | 'expired' | 'revoked';
  expiryDate: string;
  createdAt: string;
}

export interface CashbackRecord {
  id: string;
  userId: string;
  title: string;
  amount: number;
  status: 'available' | 'used' | 'expired';
  expiryDate: string;
  earnedFrom: string;
  eligibilityRule: string;
  createdAt: string;
  usedAt?: string;
}

export interface CashbackSummary {
  totalEarned: number;
  available: number;
  used: number;
  expired: number;
  items: CashbackRecord[];
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  amount: number;
  fee: number;
  netPayout: number;
  method: PayoutMethod;
  payoutDetails: {
    upiId?: string;
    accountNumber?: string;
    ifscCode?: string;
    bankName?: string;
    accountHolderName?: string;
  };
  status: TransactionStatus;
  payoutReference?: string;
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MoneyTransfer {
  id: string;
  senderId: string;
  senderName: string;
  senderEmail: string;
  recipientId: string;
  recipientName: string;
  recipientEmail: string;
  recipientPhone?: string;
  amount: number;
  fee: number;
  netAmount: number;
  status: TransactionStatus;
  referenceId: string;
  note?: string;
  createdAt: string;
}

export interface BankAccount {
  id: string;
  userId: string;
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  isVerified: boolean;
  isPrimary: boolean;
  createdAt: string;
}

export interface BankTransfer {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  bankAccountId: string;
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  amount: number;
  fee: number;
  netAmount: number;
  status: TransactionStatus;
  referenceId: string;
  utrNumber?: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface KycDetails {
  userId: string;
  fullName: string;
  panNumber: string;
  idType: 'aadhaar' | 'passport' | 'voter_id' | 'driving_license';
  idNumberLast4: string;
  dob: string;
  address: string;
  documentPreviewUrl?: string;
  submittedAt: string;
  verifiedAt?: string;
  status: KycStatus;
  rejectionReason?: string;
}

export interface BonusRuleConfig {
  id: string;
  name: string;
  bonusAmount: number;         // e.g. ₹50
  depositThreshold: number;    // e.g. ₹500
  maxDepositLimit: number;     // e.g. ₹20,000 lifetime cap
  minDepositRequired: number;  // e.g. ₹500
  isActive: boolean;
  description: string;
  updatedAt: string;
  updatedBy: string;
}

export interface CashbackRuleConfig {
  id: string;
  cashbackPercentage: number;  // e.g. 5%
  maxCashbackPerTx: number;    // e.g. ₹250
  expiryDays: number;          // e.g. 45 days
  minSpendAmount: number;      // e.g. ₹100
  isActive: boolean;
  updatedAt: string;
  updatedBy: string;
}

export interface WithdrawalRuleConfig {
  id: string;
  maxWithdrawalsPerDay: number; // strictly 1 withdrawal per day
  maxDailyAmount: number;       // strictly ₹10,000
  minWithdrawalAmount: number;  // ₹200
  kycRequired: boolean;         // true
  upiFee: number;               // ₹0
  impsFee: number;              // ₹10
  isActive: boolean;
  updatedAt: string;
  updatedBy: string;
}

export interface AuditLog {
  id: string;
  action: string;
  adminEmail: string;
  targetType: 'user' | 'bonus_rule' | 'cashback_rule' | 'withdrawal_rule' | 'withdrawal' | 'kyc' | 'system' | 'money_transfer' | 'bank_transfer';
  targetId: string;
  details: string;
  previousValue?: any;
  newValue?: any;
  ipAddress: string;
  timestamp: string;
}

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  category: 'promo' | 'security' | 'system' | 'compliance' | 'transfer';
  targetRole?: 'all' | 'customer' | 'admin';
  createdAt: string;
  isRead?: boolean;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  subject: string;
  category: 'deposit' | 'withdrawal' | 'bonus' | 'cashback' | 'money_transfer' | 'bank_transfer' | 'kyc' | 'security' | 'other';
  priority: 'low' | 'medium' | 'high';
  message: string;
  status: 'open' | 'in_progress' | 'resolved';
  adminReply?: string;
  createdAt: string;
  updatedAt: string;
}
