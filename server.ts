import express, { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import type {
  User,
  UserBalances,
  Transaction,
  BonusRecord,
  CashbackRecord,
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
  SupportTicket,
  TransactionType,
  TransactionStatus,
  PayoutMethod
} from './src/types/index.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// -------------------------------------------------------------
// In-Memory Database with Seed Data
// -------------------------------------------------------------

function hashPassword(password: string, salt: string = 'rupee_rewards_salt_2026'): string {
  return crypto.createHmac('sha256', salt).update(password).digest('hex');
}

// Configurable Rules
let bonusRule: BonusRuleConfig = {
  id: 'bonus_rule_default',
  name: 'Standard Deposit Bonus',
  bonusAmount: 50,
  depositThreshold: 500,
  maxDepositLimit: 20000,
  minDepositRequired: 500,
  isActive: true,
  description: 'Credit ₹50 promotional bonus for every ₹500 deposited, up to lifetime limit of ₹20,000.',
  updatedAt: new Date().toISOString(),
  updatedBy: 'system@rupeerewards.in'
};

let cashbackRule: CashbackRuleConfig = {
  id: 'cashback_rule_default',
  cashbackPercentage: 5,
  maxCashbackPerTx: 200,
  expiryDays: 30,
  minSpendAmount: 200,
  isActive: true,
  updatedAt: new Date().toISOString(),
  updatedBy: 'system@rupeerewards.in'
};

let withdrawalRule: WithdrawalRuleConfig = {
  id: 'withdrawal_rule_default',
  maxWithdrawalsPerDay: 1, // Strictly 1 withdrawal per calendar day
  maxDailyAmount: 10000,   // Strictly ₹10,000 maximum daily limit
  minWithdrawalAmount: 200, // ₹200 minimum
  kycRequired: true,       // KYC mandatory
  upiFee: 0,               // ₹0 for UPI
  impsFee: 10,             // ₹10 for IMPS
  isActive: true,
  updatedAt: new Date().toISOString(),
  updatedBy: 'system@rupeerewards.in'
};

// Users Store
interface StoredUser extends User {
  passwordHash: string;
  twoFactorSecret?: string;
}

const users: Map<string, StoredUser> = new Map();
const sessions: Map<string, { userId: string; role: string; expiresAt: number }> = new Map();
const twoFactorTempTokens: Map<string, { userId: string; otpCode: string; expiresAt: number }> = new Map();

// Seeded Users
const defaultCustomer: StoredUser = {
  id: 'usr_customer_01',
  name: 'Rahul Sharma',
  email: 'rahul.sharma@example.com',
  phone: '+91 98765 43210',
  role: 'customer',
  isSuspended: false,
  twoFactorEnabled: false,
  kycStatus: 'approved',
  kycRemarks: 'Identity verified with Government PAN & Aadhaar.',
  createdAt: '2026-09-01T10:00:00Z',
  lastLoginAt: new Date().toISOString(),
  passwordHash: hashPassword('Password123!')
};

const defaultCustomer2: StoredUser = {
  id: 'usr_customer_02',
  name: 'Priya Patel',
  email: 'priya.patel@example.com',
  phone: '+91 98123 45678',
  role: 'customer',
  isSuspended: false,
  twoFactorEnabled: false,
  kycStatus: 'pending',
  kycRemarks: 'Documents submitted. Pending administrative review.',
  createdAt: '2026-10-01T14:30:00Z',
  lastLoginAt: new Date().toISOString(),
  passwordHash: hashPassword('Password123!')
};

const defaultAdmin: StoredUser = {
  id: 'usr_admin_01',
  name: 'Ananya Deshmukh',
  email: 'admin@rupeerewards.in',
  phone: '+91 99000 11222',
  role: 'admin',
  isSuspended: false,
  twoFactorEnabled: false,
  kycStatus: 'approved',
  createdAt: '2026-08-15T09:00:00Z',
  lastLoginAt: new Date().toISOString(),
  passwordHash: hashPassword('AdminSecret2026!')
};

users.set(defaultCustomer.id, defaultCustomer);
users.set(defaultCustomer2.id, defaultCustomer2);
users.set(defaultAdmin.id, defaultAdmin);

// Data Stores
const transactions: Transaction[] = [];
const bonusRecords: BonusRecord[] = [];
const cashbackRecords: CashbackRecord[] = [];
const withdrawalRequests: WithdrawalRequest[] = [];
const moneyTransfers: MoneyTransfer[] = [];
const bankAccounts: Map<string, BankAccount[]> = new Map();
const bankTransfers: BankTransfer[] = [];
const kycStore: Map<string, KycDetails> = new Map();
const auditLogs: AuditLog[] = [];
const systemNotifications: SystemNotification[] = [];
const supportTickets: SupportTicket[] = [];
const processedIdempotencyKeys: Set<string> = new Set();

// Seed Bank Accounts
bankAccounts.set('usr_customer_01', [
  {
    id: 'ba_01',
    userId: 'usr_customer_01',
    accountHolderName: 'Rahul Sharma',
    accountNumber: '5010049281920',
    ifscCode: 'HDFC0001234',
    bankName: 'HDFC Bank',
    isVerified: true,
    isPrimary: true,
    createdAt: '2026-09-02T10:00:00Z'
  },
  {
    id: 'ba_02',
    userId: 'usr_customer_01',
    accountHolderName: 'Rahul Sharma',
    accountNumber: '203918274619',
    ifscCode: 'SBIN0000691',
    bankName: 'State Bank of India',
    isVerified: true,
    isPrimary: false,
    createdAt: '2026-09-15T11:30:00Z'
  }
]);

// Seed initial transactions for Rahul Sharma (usr_customer_01)
// Deposit 1: ₹1,500 (Earned 3 x ₹50 = ₹150 bonus)
transactions.push({
  id: 'tx_dep_01',
  userId: 'usr_customer_01',
  userName: 'Rahul Sharma',
  userEmail: 'rahul.sharma@example.com',
  type: 'deposit',
  amount: 1500,
  status: 'completed',
  title: 'UPI Wallet Deposit',
  description: 'Deposit via UPI ID rahul@okhdfcbank',
  referenceId: 'UPI-261014-984321',
  paymentMethod: 'UPI - Google Pay',
  fee: 0,
  netAmount: 1500,
  createdAt: '2026-09-02T11:20:00Z',
  updatedAt: '2026-09-02T11:20:00Z'
});

bonusRecords.push({
  id: 'bn_01',
  userId: 'usr_customer_01',
  depositTransactionId: 'tx_dep_01',
  depositAmount: 1500,
  bonusAmount: 150,
  ruleApplied: '₹50 bonus per ₹500 deposit block (3 blocks)',
  status: 'credited',
  expiryDate: '2026-12-31T23:59:59Z',
  createdAt: '2026-09-02T11:20:01Z'
});

transactions.push({
  id: 'tx_bon_01',
  userId: 'usr_customer_01',
  userName: 'Rahul Sharma',
  userEmail: 'rahul.sharma@example.com',
  type: 'bonus',
  amount: 150,
  status: 'completed',
  title: 'Deposit Reward Bonus',
  description: 'Promotional bonus on ₹1,500 deposit (₹50 x 3 blocks)',
  referenceId: 'BON-01-984321',
  fee: 0,
  netAmount: 150,
  createdAt: '2026-09-02T11:20:01Z',
  updatedAt: '2026-09-02T11:20:01Z'
});

// Deposit 2: ₹1,000 (Earned 2 x ₹50 = ₹100 bonus)
transactions.push({
  id: 'tx_dep_02',
  userId: 'usr_customer_01',
  userName: 'Rahul Sharma',
  userEmail: 'rahul.sharma@example.com',
  type: 'deposit',
  amount: 1000,
  status: 'completed',
  title: 'NetBanking Deposit',
  description: 'Deposit via HDFC NetBanking Gateway',
  referenceId: 'NETB-261014-441290',
  paymentMethod: 'NetBanking - HDFC Bank',
  fee: 0,
  netAmount: 1000,
  createdAt: '2026-09-18T16:45:00Z',
  updatedAt: '2026-09-18T16:45:00Z'
});

bonusRecords.push({
  id: 'bn_02',
  userId: 'usr_customer_01',
  depositTransactionId: 'tx_dep_02',
  depositAmount: 1000,
  bonusAmount: 100,
  ruleApplied: '₹50 bonus per ₹500 deposit block (2 blocks)',
  status: 'credited',
  expiryDate: '2026-12-31T23:59:59Z',
  createdAt: '2026-09-18T16:45:01Z'
});

transactions.push({
  id: 'tx_bon_02',
  userId: 'usr_customer_01',
  userName: 'Rahul Sharma',
  userEmail: 'rahul.sharma@example.com',
  type: 'bonus',
  amount: 100,
  status: 'completed',
  title: 'Deposit Reward Bonus',
  description: 'Promotional bonus on ₹1,000 deposit (₹50 x 2 blocks)',
  referenceId: 'BON-02-441290',
  fee: 0,
  netAmount: 100,
  createdAt: '2026-09-18T16:45:01Z',
  updatedAt: '2026-09-18T16:45:01Z'
});

// Seed Cashbacks for Rahul
cashbackRecords.push({
  id: 'cb_01',
  userId: 'usr_customer_01',
  title: 'Welcome Partner Cashback',
  amount: 100,
  status: 'available',
  expiryDate: '2026-11-30T23:59:59Z',
  earnedFrom: 'First Transaction Booster',
  eligibilityRule: '5% bonus cashback credited on onboarding completion',
  createdAt: '2026-09-02T11:21:00Z'
});

cashbackRecords.push({
  id: 'cb_02',
  userId: 'usr_customer_01',
  title: 'Weekend Cashback Voucher',
  amount: 50,
  status: 'available',
  expiryDate: '2026-11-15T23:59:59Z',
  earnedFrom: 'Weekend Spend Program',
  eligibilityRule: 'Minimum spend of ₹200 across partner stores',
  createdAt: '2026-09-20T10:15:00Z'
});

cashbackRecords.push({
  id: 'cb_03',
  userId: 'usr_customer_01',
  title: 'Summer Cashback Pass',
  amount: 40,
  status: 'used',
  expiryDate: '2026-09-15T23:59:59Z',
  earnedFrom: 'Summer Special Offer',
  eligibilityRule: 'Instant offset applied on bill payment',
  createdAt: '2026-08-20T12:00:00Z',
  usedAt: '2026-09-05T14:30:00Z'
});

cashbackRecords.push({
  id: 'cb_04',
  userId: 'usr_customer_01',
  title: 'Early Bird Promotional Perk',
  amount: 25,
  status: 'expired',
  expiryDate: '2026-09-01T23:59:59Z',
  earnedFrom: 'Registration Beta Incentive',
  eligibilityRule: 'Valid within 7 days of onboarding',
  createdAt: '2026-08-24T09:00:00Z'
});

transactions.push({
  id: 'tx_cb_01',
  userId: 'usr_customer_01',
  userName: 'Rahul Sharma',
  userEmail: 'rahul.sharma@example.com',
  type: 'cashback',
  amount: 100,
  status: 'completed',
  title: 'Welcome Partner Cashback',
  description: 'First Transaction Booster cashback voucher',
  referenceId: 'CB-01-WELCOME',
  fee: 0,
  netAmount: 100,
  createdAt: '2026-09-02T11:21:00Z',
  updatedAt: '2026-09-02T11:21:00Z'
});

// Seed sample KYC
kycStore.set('usr_customer_01', {
  userId: 'usr_customer_01',
  fullName: 'Rahul Sharma',
  panNumber: 'ABCPS1234F',
  idType: 'aadhaar',
  idNumberLast4: '8842',
  dob: '1993-04-12',
  address: 'Flat 402, Green Valley Enclave, Sector 14, Gurugram, Haryana - 122001',
  submittedAt: '2026-09-01T11:00:00Z',
  verifiedAt: '2026-09-01T15:20:00Z',
  status: 'approved'
});

kycStore.set('usr_customer_02', {
  userId: 'usr_customer_02',
  fullName: 'Priya Patel',
  panNumber: 'BPQPP8871K',
  idType: 'passport',
  idNumberLast4: '3921',
  dob: '1996-08-22',
  address: 'Plot 18, Sunrise Heights, Bodakdev, Ahmedabad, Gujarat - 380054',
  submittedAt: '2026-10-02T10:15:00Z',
  status: 'pending'
});

// Seed sample notifications
systemNotifications.push({
  id: 'notif_01',
  title: 'Deposit Bonus Active: ₹50 for every ₹500',
  message: 'Earn an instant ₹50 promotional bonus credit on every ₹500 deposited into your rewards wallet. Maximum cumulative deposit limit is ₹20,000.',
  category: 'promo',
  targetRole: 'all',
  createdAt: '2026-10-01T08:00:00Z'
});

systemNotifications.push({
  id: 'notif_02',
  title: 'KYC Compliance Verification Advisory',
  message: 'In compliance with RBI digital wallet guidelines, submit your PAN and Government ID to enable unlimited fast withdrawals and money transfers.',
  category: 'compliance',
  targetRole: 'customer',
  createdAt: '2026-10-05T12:00:00Z'
});

systemNotifications.push({
  id: 'notif_03',
  title: 'Instant Payout Rails: UPI & IMPS 24x7',
  message: 'Withdrawals requested to verified UPI IDs are processed with zero fees in under 15 minutes. Daily limit: ₹10,000 (1 request per day).',
  category: 'system',
  targetRole: 'customer',
  createdAt: '2026-10-10T09:30:00Z'
});

// Seed sample audit logs
auditLogs.push({
  id: 'aud_01',
  action: 'BONUS_RULE_INITIALIZED',
  adminEmail: 'system@rupeerewards.in',
  targetType: 'bonus_rule',
  targetId: 'bonus_rule_default',
  details: 'Default bonus rule configured: ₹50 bonus for every ₹500 deposit block, max deposit limit ₹20,000.',
  newValue: { bonusAmount: 50, depositThreshold: 500, maxDepositLimit: 20000 },
  ipAddress: '127.0.0.1',
  timestamp: '2026-08-15T09:00:00Z'
});

auditLogs.push({
  id: 'aud_02',
  action: 'WITHDRAWAL_RULE_INITIALIZED',
  adminEmail: 'system@rupeerewards.in',
  targetType: 'withdrawal_rule',
  targetId: 'withdrawal_rule_default',
  details: 'Withdrawal rule enforced: strictly 1 withdrawal per day, max daily limit ₹10,000, min amount ₹200.',
  newValue: { maxWithdrawalsPerDay: 1, maxDailyAmount: 10000, minWithdrawalAmount: 200 },
  ipAddress: '127.0.0.1',
  timestamp: '2026-08-15T09:05:00Z'
});

auditLogs.push({
  id: 'aud_03',
  action: 'KYC_APPROVED',
  adminEmail: 'admin@rupeerewards.in',
  targetType: 'kyc',
  targetId: 'usr_customer_01',
  details: 'KYC verified for Rahul Sharma. PAN and Aadhaar records match NSDL registry.',
  ipAddress: '192.168.1.10',
  timestamp: '2026-09-01T15:20:00Z'
});

// -------------------------------------------------------------
// Calculation Helper: Atomic Server-side User Balances & Daily Limits
// -------------------------------------------------------------

function calculateUserBalances(userId: string): UserBalances {
  const user = users.get(userId);
  if (!user) {
    return {
      depositBalance: 0,
      promotionalBonus: 0,
      cashbackBalance: 0,
      totalAvailable: 0,
      totalDepositedLifetime: 0,
      maxDepositLimit: bonusRule.maxDepositLimit,
      remainingDepositRoom: bonusRule.maxDepositLimit,
      withdrawableBalance: 0,
      todayWithdrawalCount: 0,
      todayWithdrawnAmount: 0,
      remainingDailyWithdrawalLimit: withdrawalRule.maxDailyAmount,
      canWithdrawToday: false
    };
  }

  // 1. Total lifetime deposits & incoming funds
  let totalDepositedLifetime = 0;
  let grossDeposits = 0;

  for (const tx of transactions) {
    if (tx.userId === userId && tx.status === 'completed') {
      if (tx.type === 'deposit') {
        totalDepositedLifetime += tx.amount;
        grossDeposits += tx.amount;
      } else if (tx.type === 'money_transfer' && tx.metadata?.direction === 'in') {
        grossDeposits += tx.amount;
      }
    }
  }

  // 2. Active withdrawals & outgoing money/bank transfers
  let totalWithdrawnOrLocked = 0;
  for (const w of withdrawalRequests) {
    if (w.userId === userId && ['pending', 'approved', 'processing', 'completed'].includes(w.status)) {
      totalWithdrawnOrLocked += w.amount;
    }
  }

  for (const bt of bankTransfers) {
    if (bt.userId === userId && ['pending', 'approved', 'processing', 'completed'].includes(bt.status)) {
      totalWithdrawnOrLocked += bt.amount;
    }
  }

  for (const mt of moneyTransfers) {
    if (mt.senderId === userId && ['pending', 'approved', 'processing', 'completed'].includes(mt.status)) {
      totalWithdrawnOrLocked += mt.amount;
    }
  }

  const depositBalance = Math.max(0, grossDeposits - totalWithdrawnOrLocked);

  // 3. Promotional bonus
  let promotionalBonus = 0;
  const now = new Date();
  for (const b of bonusRecords) {
    if (b.userId === userId && b.status === 'credited') {
      const exp = new Date(b.expiryDate);
      if (exp > now) {
        promotionalBonus += b.bonusAmount;
      }
    }
  }

  // 4. Cashback balance
  let cashbackBalance = 0;
  for (const cb of cashbackRecords) {
    if (cb.userId === userId && cb.status === 'available') {
      const exp = new Date(cb.expiryDate);
      if (exp > now) {
        cashbackBalance += cb.amount;
      }
    }
  }

  // 5. Daily withdrawal limits calculation (checking today's UTC calendar date)
  const todayStr = new Date().toISOString().slice(0, 10);
  let todayWithdrawalCount = 0;
  let todayWithdrawnAmount = 0;

  for (const w of withdrawalRequests) {
    if (w.userId === userId && ['pending', 'approved', 'processing', 'completed'].includes(w.status)) {
      const reqDateStr = new Date(w.createdAt).toISOString().slice(0, 10);
      if (reqDateStr === todayStr) {
        todayWithdrawalCount += 1;
        todayWithdrawnAmount += w.amount;
      }
    }
  }

  const maxDepositLimit = bonusRule.maxDepositLimit;
  const remainingDepositRoom = Math.max(0, maxDepositLimit - totalDepositedLifetime);
  const totalAvailable = depositBalance + promotionalBonus + cashbackBalance;
  const withdrawableBalance = depositBalance;
  const remainingDailyWithdrawalLimit = Math.max(0, withdrawalRule.maxDailyAmount - todayWithdrawnAmount);
  const canWithdrawToday = todayWithdrawalCount < withdrawalRule.maxWithdrawalsPerDay &&
                           remainingDailyWithdrawalLimit >= withdrawalRule.minWithdrawalAmount &&
                           depositBalance >= withdrawalRule.minWithdrawalAmount &&
                           user.kycStatus === 'approved';

  return {
    depositBalance,
    promotionalBonus,
    cashbackBalance,
    totalAvailable,
    totalDepositedLifetime,
    maxDepositLimit,
    remainingDepositRoom,
    withdrawableBalance,
    todayWithdrawalCount,
    todayWithdrawnAmount,
    remainingDailyWithdrawalLimit,
    canWithdrawToday
  };
}

// -------------------------------------------------------------
// Authentication & Authorization Middleware
// -------------------------------------------------------------

function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. No session token provided.' });
  }

  const token = authHeader.substring(7);
  const session = sessions.get(token);

  if (!session) {
    return res.status(401).json({ error: 'Session expired or invalid token.' });
  }

  if (Date.now() > session.expiresAt) {
    sessions.delete(token);
    return res.status(401).json({ error: 'Session expired. Please log in again.' });
  }

  const user = users.get(session.userId);
  if (!user) {
    return res.status(401).json({ error: 'User account not found.' });
  }

  if (user.isSuspended) {
    return res.status(403).json({ error: 'Your account has been temporarily suspended. Please contact compliance support.' });
  }

  (req as any).user = user;
  (req as any).token = token;
  next();
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user as StoredUser;
  if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
    return res.status(403).json({ error: 'Access denied: Administrative privileges required.' });
  }
  next();
}

// -------------------------------------------------------------
// Auth Routes
// -------------------------------------------------------------

app.post('/api/auth/register', (req: Request, res: Response) => {
  const { name, email, phone, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  }

  const normalizedEmail = email.toLowerCase().trim();

  for (const u of users.values()) {
    if (u.email.toLowerCase() === normalizedEmail) {
      return res.status(400).json({ error: 'An account with this email address already exists.' });
    }
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
  }

  const userId = 'usr_' + crypto.randomUUID().slice(0, 8);
  const newUser: StoredUser = {
    id: userId,
    name: name.trim(),
    email: normalizedEmail,
    phone: phone ? phone.trim() : '+91 98000 00000',
    role: 'customer',
    isSuspended: false,
    twoFactorEnabled: false,
    kycStatus: 'not_submitted',
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
    passwordHash: hashPassword(password)
  };

  users.set(userId, newUser);

  // Generate session token
  const token = 'tok_' + crypto.randomBytes(32).toString('hex');
  sessions.set(token, {
    userId,
    role: newUser.role,
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000
  });

  // Credit onboarding welcome cashback voucher (₹50)
  const cbId = 'cb_' + crypto.randomUUID().slice(0, 8);
  cashbackRecords.push({
    id: cbId,
    userId,
    title: 'Registration Welcome Cashback',
    amount: 50,
    status: 'available',
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    earnedFrom: 'Onboarding Gift',
    eligibilityRule: 'Instant welcome credit on new account creation',
    createdAt: new Date().toISOString()
  });

  const { passwordHash, ...safeUser } = newUser;
  const balances = calculateUserBalances(userId);

  return res.json({
    user: safeUser,
    token,
    balances
  });
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password, otpCode, tempToken } = req.body;

  // Handle 2FA verification step
  if (tempToken && otpCode) {
    const pending2FA = twoFactorTempTokens.get(tempToken);
    if (!pending2FA) {
      return res.status(400).json({ error: 'Two-factor session expired or invalid. Please sign in again.' });
    }
    if (Date.now() > pending2FA.expiresAt) {
      twoFactorTempTokens.delete(tempToken);
      return res.status(400).json({ error: 'Two-factor code expired. Please sign in again.' });
    }
    if (otpCode.trim() !== pending2FA.otpCode && otpCode.trim() !== '123456') {
      return res.status(400).json({ error: 'Invalid 6-digit verification code. Please check your authenticator code.' });
    }

    twoFactorTempTokens.delete(tempToken);
    const user = users.get(pending2FA.userId);
    if (!user) {
      return res.status(400).json({ error: 'User not found.' });
    }

    const token = 'tok_' + crypto.randomBytes(32).toString('hex');
    sessions.set(token, {
      userId: user.id,
      role: user.role,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000
    });

    user.lastLoginAt = new Date().toISOString();
    const { passwordHash, ...safeUser } = user;
    const balances = calculateUserBalances(user.id);

    return res.json({
      user: safeUser,
      token,
      balances
    });
  }

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const normalizedEmail = email.toLowerCase().trim();
  let foundUser: StoredUser | null = null;

  for (const u of users.values()) {
    if (u.email.toLowerCase() === normalizedEmail) {
      foundUser = u;
      break;
    }
  }

  if (!foundUser) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const expectedHash = hashPassword(password);
  if (foundUser.passwordHash !== expectedHash) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  if (foundUser.isSuspended) {
    return res.status(403).json({ error: 'Account suspended. Please contact compliance support.' });
  }

  // If 2FA enabled, issue temporary token
  if (foundUser.twoFactorEnabled) {
    const tempTokenId = 'temp_' + crypto.randomBytes(24).toString('hex');
    const demoOtp = '123456';
    twoFactorTempTokens.set(tempTokenId, {
      userId: foundUser.id,
      otpCode: demoOtp,
      expiresAt: Date.now() + 5 * 60 * 1000
    });

    return res.json({
      requiresTwoFactor: true,
      tempToken: tempTokenId,
      message: 'Two-factor authentication code required (Demo code: 123456).'
    });
  }

  const token = 'tok_' + crypto.randomBytes(32).toString('hex');
  sessions.set(token, {
    userId: foundUser.id,
    role: foundUser.role,
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000
  });

  foundUser.lastLoginAt = new Date().toISOString();
  const { passwordHash, ...safeUser } = foundUser;
  const balances = calculateUserBalances(foundUser.id);

  return res.json({
    user: safeUser,
    token,
    balances
  });
});

// Demo Fast Switch Endpoint
app.post('/api/auth/demo-switch', (req: Request, res: Response) => {
  const { role } = req.body;
  let targetUser = users.get('usr_customer_01') || defaultCustomer;
  if (role === 'customer2') targetUser = users.get('usr_customer_02') || defaultCustomer2;
  if (role === 'admin') targetUser = users.get('usr_admin_01') || defaultAdmin;

  targetUser.isSuspended = false;

  const token = 'tok_' + crypto.randomBytes(32).toString('hex');
  sessions.set(token, {
    userId: targetUser.id,
    role: targetUser.role,
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000
  });

  const { passwordHash, ...safeUser } = targetUser;
  const balances = calculateUserBalances(targetUser.id);
  const kyc = kycStore.get(targetUser.id) || null;

  return res.json({
    user: safeUser,
    token,
    balances,
    kyc
  });
});

app.post('/api/auth/logout', authenticateToken, (req: Request, res: Response) => {
  const token = (req as any).token;
  sessions.delete(token);
  return res.json({ success: true, message: 'Logged out successfully.' });
});

app.get('/api/auth/me', authenticateToken, (req: Request, res: Response) => {
  const user = (req as any).user as StoredUser;
  const { passwordHash, ...safeUser } = user;
  const balances = calculateUserBalances(user.id);
  const kyc = kycStore.get(user.id) || null;

  return res.json({
    user: safeUser,
    balances,
    kyc
  });
});

// Update Profile & Security
app.patch('/api/user/profile', authenticateToken, (req: Request, res: Response) => {
  const user = (req as any).user as StoredUser;
  const { name, phone } = req.body;

  if (name) user.name = name.trim();
  if (phone) user.phone = phone.trim();

  users.set(user.id, user);
  const { passwordHash, ...safeUser } = user;
  return res.json({ user: safeUser, message: 'Profile updated successfully.' });
});

app.post('/api/user/change-password', authenticateToken, (req: Request, res: Response) => {
  const user = (req as any).user as StoredUser;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current password and new password are required.' });
  }

  if (user.passwordHash !== hashPassword(currentPassword)) {
    return res.status(400).json({ error: 'Current password is incorrect.' });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters long.' });
  }

  user.passwordHash = hashPassword(newPassword);
  users.set(user.id, user);

  auditLogs.push({
    id: 'aud_' + crypto.randomUUID().slice(0, 8),
    action: 'PASSWORD_CHANGED',
    adminEmail: user.email,
    targetType: 'user',
    targetId: user.id,
    details: 'User updated their account password.',
    ipAddress: req.ip || '127.0.0.1',
    timestamp: new Date().toISOString()
  });

  return res.json({ success: true, message: 'Password updated successfully.' });
});

app.post('/api/user/toggle-2fa', authenticateToken, (req: Request, res: Response) => {
  const user = (req as any).user as StoredUser;
  const { enabled, otpCode } = req.body;

  if (enabled) {
    if (!otpCode || (otpCode !== '123456' && otpCode.length !== 6)) {
      return res.status(400).json({ error: 'Please enter the 6-digit confirmation code (Demo code: 123456).' });
    }
    user.twoFactorEnabled = true;
  } else {
    user.twoFactorEnabled = false;
  }

  users.set(user.id, user);

  auditLogs.push({
    id: 'aud_' + crypto.randomUUID().slice(0, 8),
    action: user.twoFactorEnabled ? '2FA_ENABLED' : '2FA_DISABLED',
    adminEmail: user.email,
    targetType: 'user',
    targetId: user.id,
    details: `Two-factor verification status updated to ${user.twoFactorEnabled}.`,
    ipAddress: req.ip || '127.0.0.1',
    timestamp: new Date().toISOString()
  });

  const { passwordHash, ...safeUser } = user;
  return res.json({
    user: safeUser,
    message: user.twoFactorEnabled ? 'Two-Factor Authentication is now active.' : 'Two-Factor Authentication disabled.'
  });
});

// -------------------------------------------------------------
// KYC Management
// -------------------------------------------------------------

app.get('/api/kyc', authenticateToken, (req: Request, res: Response) => {
  const user = (req as any).user as StoredUser;
  const kyc = kycStore.get(user.id) || null;
  return res.json({ kycStatus: user.kycStatus, kycRemarks: user.kycRemarks, kyc });
});

app.post('/api/kyc/submit', authenticateToken, (req: Request, res: Response) => {
  const user = (req as any).user as StoredUser;
  const { fullName, panNumber, idType, idNumberLast4, dob, address, documentPreviewUrl } = req.body;

  if (!fullName || !panNumber || !idType || !idNumberLast4 || !dob || !address) {
    return res.status(400).json({ error: 'All identity details (Full Name, PAN, ID Type, Last 4 digits, Date of Birth, Address) are required.' });
  }

  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  const cleanPan = panNumber.toUpperCase().trim();
  if (!panRegex.test(cleanPan)) {
    return res.status(400).json({ error: 'Invalid PAN format. Standard format is 5 letters, 4 digits, 1 letter (e.g., ABCDE1234F).' });
  }

  const kycRecord: KycDetails = {
    userId: user.id,
    fullName: fullName.trim(),
    panNumber: cleanPan,
    idType,
    idNumberLast4: idNumberLast4.trim(),
    dob,
    address: address.trim(),
    documentPreviewUrl: documentPreviewUrl || '',
    submittedAt: new Date().toISOString(),
    status: 'pending'
  };

  kycStore.set(user.id, kycRecord);
  user.kycStatus = 'pending';
  user.kycRemarks = 'Documents submitted for compliance verification.';
  users.set(user.id, user);

  auditLogs.push({
    id: 'aud_' + crypto.randomUUID().slice(0, 8),
    action: 'KYC_SUBMITTED',
    adminEmail: user.email,
    targetType: 'kyc',
    targetId: user.id,
    details: `User submitted KYC for verification with PAN ${cleanPan}.`,
    ipAddress: req.ip || '127.0.0.1',
    timestamp: new Date().toISOString()
  });

  return res.json({
    success: true,
    message: 'KYC documents submitted successfully. Verification usually completes within 1-2 hours.',
    kyc: kycRecord
  });
});

// -------------------------------------------------------------
// Deposit Engine (Server-side Calculation & Invariants)
// -------------------------------------------------------------

app.post('/api/wallet/deposit', authenticateToken, (req: Request, res: Response) => {
  const user = (req as any).user as StoredUser;
  const { amount, paymentMethod, idempotencyKey } = req.body;

  const depositAmount = parseFloat(amount);
  if (isNaN(depositAmount) || depositAmount <= 0) {
    return res.status(400).json({ error: 'Please enter a valid positive deposit amount.' });
  }

  if (depositAmount < 100) {
    return res.status(400).json({ error: 'Minimum deposit amount is ₹100.' });
  }

  // Idempotency / Duplicate Prevention
  if (idempotencyKey) {
    if (processedIdempotencyKeys.has(idempotencyKey)) {
      return res.status(409).json({ error: 'Duplicate transaction detected. This request has already been processed.' });
    }
    processedIdempotencyKeys.add(idempotencyKey);
  }

  // Calculate current balances and check the ₹20,000 maximum deposit limit
  const currentBalances = calculateUserBalances(user.id);
  const maxLimit = bonusRule.maxDepositLimit; // Default ₹20,000
  const remainingAllowance = maxLimit - currentBalances.totalDepositedLifetime;

  if (currentBalances.totalDepositedLifetime >= maxLimit) {
    return res.status(400).json({
      error: `Maximum total deposit limit of ₹${maxLimit.toLocaleString('en-IN')} reached. Further deposits are disabled for your account.`,
      code: 'LIMIT_REACHED',
      maxLimit,
      totalDepositedLifetime: currentBalances.totalDepositedLifetime
    });
  }

  if (currentBalances.totalDepositedLifetime + depositAmount > maxLimit) {
    return res.status(400).json({
      error: `Deposit exceeds your remaining deposit limit. You can only deposit up to ₹${remainingAllowance.toLocaleString('en-IN')}.`,
      code: 'EXCEEDS_REMAINING_LIMIT',
      maxLimit,
      remainingAllowance
    });
  }

  // Create deposit transaction
  const depositTxId = 'tx_dep_' + crypto.randomUUID().slice(0, 8);
  const refId = 'DEP-' + Math.floor(100000 + Math.random() * 900000);

  const depositTx: Transaction = {
    id: depositTxId,
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    type: 'deposit',
    amount: depositAmount,
    status: 'completed',
    title: 'Wallet Deposit',
    description: `Funds added via ${paymentMethod || 'UPI Payment'}`,
    referenceId: refId,
    paymentMethod: paymentMethod || 'UPI',
    fee: 0,
    netAmount: depositAmount,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  transactions.unshift(depositTx);

  // Promotional Bonus Calculation: ₹50 bonus for every ₹500 deposit
  let bonusCredited = 0;
  let bonusRecord: BonusRecord | null = null;

  if (bonusRule.isActive && depositAmount >= bonusRule.minDepositRequired) {
    const blocks = Math.floor(depositAmount / bonusRule.depositThreshold);
    if (blocks > 0) {
      bonusCredited = blocks * bonusRule.bonusAmount;

      const bonusRecordId = 'bn_' + crypto.randomUUID().slice(0, 8);
      const bonusTxId = 'tx_bon_' + crypto.randomUUID().slice(0, 8);

      bonusRecord = {
        id: bonusRecordId,
        userId: user.id,
        depositTransactionId: depositTxId,
        depositAmount: depositAmount,
        bonusAmount: bonusCredited,
        ruleApplied: `₹${bonusRule.bonusAmount} bonus per ₹${bonusRule.depositThreshold} deposit (${blocks} blocks)`,
        status: 'credited',
        expiryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString()
      };

      bonusRecords.unshift(bonusRecord);

      transactions.unshift({
        id: bonusTxId,
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        type: 'bonus',
        amount: bonusCredited,
        status: 'completed',
        title: 'Promotional Deposit Bonus',
        description: `₹${bonusRule.bonusAmount} bonus per ₹${bonusRule.depositThreshold} on ₹${depositAmount.toLocaleString('en-IN')} deposit`,
        referenceId: 'BON-' + Math.floor(100000 + Math.random() * 900000),
        fee: 0,
        netAmount: bonusCredited,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
  }

  const updatedBalances = calculateUserBalances(user.id);

  return res.json({
    success: true,
    message: bonusCredited > 0
      ? `Deposit of ₹${depositAmount.toLocaleString('en-IN')} successful! ₹${bonusCredited.toLocaleString('en-IN')} promotional bonus credited.`
      : `Deposit of ₹${depositAmount.toLocaleString('en-IN')} successful.`,
    transaction: depositTx,
    bonusCredited,
    bonusRecord,
    balances: updatedBalances
  });
});

// -------------------------------------------------------------
// Withdrawal Engine (Max 1/day, Max ₹10k/day, KYC Gating, Server Limits)
// -------------------------------------------------------------

app.get('/api/wallet/withdrawal-eligibility', authenticateToken, (req: Request, res: Response) => {
  const user = (req as any).user as StoredUser;
  const balances = calculateUserBalances(user.id);

  const feeStructure = {
    upi: { name: 'UPI Transfer', feePercentage: 0, flatFee: withdrawalRule.upiFee, processingTime: 'Instant (10-20 mins)' },
    bank_transfer: { name: 'IMPS Bank Transfer', feePercentage: 0, flatFee: withdrawalRule.impsFee, processingTime: '15-45 mins' },
    net_banking: { name: 'Direct NetBanking Payout', feePercentage: 0, flatFee: 5, processingTime: '30-60 mins' }
  };

  return res.json({
    withdrawableBalance: balances.withdrawableBalance,
    totalAvailable: balances.totalAvailable,
    promotionalBonus: balances.promotionalBonus,
    cashbackBalance: balances.cashbackBalance,
    isKycApproved: user.kycStatus === 'approved',
    kycStatus: user.kycStatus,
    minWithdrawal: withdrawalRule.minWithdrawalAmount,
    maxDailyAmount: withdrawalRule.maxDailyAmount,
    maxWithdrawalsPerDay: withdrawalRule.maxWithdrawalsPerDay,
    todayWithdrawalCount: balances.todayWithdrawalCount,
    todayWithdrawnAmount: balances.todayWithdrawnAmount,
    remainingDailyWithdrawalLimit: balances.remainingDailyWithdrawalLimit,
    canWithdrawToday: balances.canWithdrawToday,
    allowedMethods: ['upi', 'bank_transfer', 'net_banking'],
    feeStructure,
    termsNote: 'Promotional bonuses and cashbacks are non-withdrawable reward credits. Only deposited funds can be withdrawn to bank accounts or UPI VPAs.'
  });
});

app.post('/api/wallet/withdraw', authenticateToken, (req: Request, res: Response) => {
  const user = (req as any).user as StoredUser;
  const { amount, method, payoutDetails, idempotencyKey } = req.body;

  const withdrawAmount = parseFloat(amount);
  if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
    return res.status(400).json({ error: 'Please enter a valid withdrawal amount.' });
  }

  // 1. Strict KYC Check
  if (withdrawalRule.kycRequired && user.kycStatus !== 'approved') {
    return res.status(403).json({
      error: 'KYC Verification Required: You must complete and have an approved identity verification before withdrawing funds.',
      code: 'KYC_REQUIRED',
      kycStatus: user.kycStatus
    });
  }

  const balances = calculateUserBalances(user.id);

  // 2. Strict One Withdrawal Per Day Check
  if (balances.todayWithdrawalCount >= withdrawalRule.maxWithdrawalsPerDay) {
    return res.status(400).json({
      error: `Daily limit reached: Maximum ${withdrawalRule.maxWithdrawalsPerDay} withdrawal permitted per calendar day. You have already initiated a withdrawal today. Next withdrawal will be available tomorrow.`,
      code: 'MAX_DAILY_COUNT_REACHED',
      todayWithdrawalCount: balances.todayWithdrawalCount,
      maxAllowed: withdrawalRule.maxWithdrawalsPerDay
    });
  }

  // 3. Minimum amount check
  if (withdrawAmount < withdrawalRule.minWithdrawalAmount) {
    return res.status(400).json({ error: `Minimum withdrawal amount is ₹${withdrawalRule.minWithdrawalAmount}.` });
  }

  // 4. Maximum daily amount check (Max ₹10,000)
  if (withdrawAmount > balances.remainingDailyWithdrawalLimit) {
    return res.status(400).json({
      error: `Withdrawal amount exceeds your remaining daily limit of ₹${balances.remainingDailyWithdrawalLimit.toLocaleString('en-IN')}. Maximum daily withdrawal limit is ₹${withdrawalRule.maxDailyAmount.toLocaleString('en-IN')}.`,
      code: 'DAILY_LIMIT_EXCEEDED',
      remainingDailyLimit: balances.remainingDailyWithdrawalLimit,
      maxDailyAmount: withdrawalRule.maxDailyAmount
    });
  }

  // 5. Prevent Negative Balances
  if (withdrawAmount > balances.withdrawableBalance) {
    return res.status(400).json({
      error: `Insufficient withdrawable balance. Your available withdrawable balance is ₹${balances.withdrawableBalance.toLocaleString('en-IN')}. Promotional bonus and cashback balances cannot be withdrawn to external bank accounts.`,
      withdrawableBalance: balances.withdrawableBalance
    });
  }

  // 6. Idempotency Check
  if (idempotencyKey) {
    if (processedIdempotencyKeys.has(idempotencyKey)) {
      return res.status(409).json({ error: 'Duplicate withdrawal request detected.' });
    }
    processedIdempotencyKeys.add(idempotencyKey);
  }

  // 7. Method Details Validation
  if (!['upi', 'bank_transfer', 'net_banking'].includes(method)) {
    return res.status(400).json({ error: 'Invalid payout method selected.' });
  }

  if (method === 'upi' && (!payoutDetails?.upiId || !payoutDetails.upiId.includes('@'))) {
    return res.status(400).json({ error: 'Please provide a valid UPI ID (e.g., name@okaxis).' });
  }

  if (method === 'bank_transfer' || method === 'net_banking') {
    if (!payoutDetails?.accountNumber || !payoutDetails?.ifscCode || !payoutDetails?.accountHolderName) {
      return res.status(400).json({ error: 'Bank Account Number, IFSC code, and Account Holder Name are required.' });
    }
  }

  // 8. Calculate fee & net settlement
  let fee = 0;
  if (method === 'bank_transfer') fee = withdrawalRule.impsFee;
  if (method === 'net_banking') fee = 5;

  const netPayout = Math.max(0, withdrawAmount - fee);
  const withdrawalId = 'wd_' + crypto.randomUUID().slice(0, 8);
  const txId = 'tx_wd_' + crypto.randomUUID().slice(0, 8);

  const request: WithdrawalRequest = {
    id: withdrawalId,
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    amount: withdrawAmount,
    fee,
    netPayout,
    method: method as PayoutMethod,
    payoutDetails: payoutDetails || {},
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  withdrawalRequests.unshift(request);

  transactions.unshift({
    id: txId,
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    type: 'withdrawal',
    amount: withdrawAmount,
    status: 'pending',
    title: 'Withdrawal to ' + (method === 'upi' ? 'UPI' : 'Bank Account'),
    description: `Withdrawal request of ₹${withdrawAmount.toLocaleString('en-IN')} (Net Payout: ₹${netPayout.toLocaleString('en-IN')})`,
    referenceId: 'WDR-' + Math.floor(100000 + Math.random() * 900000),
    paymentMethod: method.toUpperCase(),
    fee,
    netAmount: netPayout,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    metadata: { withdrawalId }
  });

  const updatedBalances = calculateUserBalances(user.id);

  return res.json({
    success: true,
    message: `Withdrawal request of ₹${withdrawAmount.toLocaleString('en-IN')} submitted. Status: Pending administrative review.`,
    withdrawal: request,
    balances: updatedBalances
  });
});

// -------------------------------------------------------------
// MONEY TRANSFER ENGINE (P2P Wallet Transfers)
// -------------------------------------------------------------

app.post('/api/transfers/money/recipient-lookup', authenticateToken, (req: Request, res: Response) => {
  const user = (req as any).user as StoredUser;
  const { query } = req.body;
  if (!query) return res.status(400).json({ error: 'Please enter recipient email, phone, or Wallet ID.' });

  const q = query.trim().toLowerCase();
  let recipient: StoredUser | null = null;
  for (const u of users.values()) {
    if (
      u.id.toLowerCase() === q ||
      u.email.toLowerCase() === q ||
      u.phone.replace(/[^0-9]/g, '').includes(q.replace(/[^0-9]/g, ''))
    ) {
      recipient = u;
      break;
    }
  }

  if (!recipient) {
    return res.status(404).json({ error: 'Recipient wallet account not found. Please verify details.' });
  }

  if (recipient.id === user.id) {
    return res.status(400).json({ error: 'Cannot transfer funds to your own wallet account.' });
  }

  return res.json({
    recipient: {
      id: recipient.id,
      name: recipient.name,
      email: recipient.email,
      phone: recipient.phone,
      kycStatus: recipient.kycStatus
    }
  });
});

app.post('/api/transfers/money/send', authenticateToken, (req: Request, res: Response) => {
  const user = (req as any).user as StoredUser;
  const { recipientId, amount, note, verificationOtp, idempotencyKey } = req.body;

  const transferAmount = parseFloat(amount);
  if (isNaN(transferAmount) || transferAmount <= 0) {
    return res.status(400).json({ error: 'Please enter a valid transfer amount.' });
  }

  if (transferAmount < 50) {
    return res.status(400).json({ error: 'Minimum transfer amount is ₹50.' });
  }

  if (transferAmount > 10000) {
    return res.status(400).json({ error: 'Maximum peer-to-peer transfer limit is ₹10,000 per transaction.' });
  }

  if (user.kycStatus !== 'approved') {
    return res.status(403).json({ error: 'KYC identity verification required before sending money transfers.' });
  }

  if (verificationOtp && verificationOtp !== '123456' && verificationOtp.length !== 6) {
    return res.status(400).json({ error: 'Invalid 6-digit verification code. (Demo code: 123456).' });
  }

  const balances = calculateUserBalances(user.id);
  if (transferAmount > balances.withdrawableBalance) {
    return res.status(400).json({
      error: `Insufficient withdrawable balance. Available: ₹${balances.withdrawableBalance.toLocaleString('en-IN')}. Promotional bonuses cannot be transferred.`,
      withdrawableBalance: balances.withdrawableBalance
    });
  }

  const recipient = users.get(recipientId);
  if (!recipient) {
    return res.status(404).json({ error: 'Recipient account not found.' });
  }

  if (recipient.id === user.id) {
    return res.status(400).json({ error: 'Cannot transfer to yourself.' });
  }

  if (idempotencyKey) {
    if (processedIdempotencyKeys.has(idempotencyKey)) {
      return res.status(409).json({ error: 'Duplicate transfer detected.' });
    }
    processedIdempotencyKeys.add(idempotencyKey);
  }

  const transferId = 'mt_' + crypto.randomUUID().slice(0, 8);
  const refId = 'TRF-' + Math.floor(100000 + Math.random() * 900000);

  const transferRecord: MoneyTransfer = {
    id: transferId,
    senderId: user.id,
    senderName: user.name,
    senderEmail: user.email,
    recipientId: recipient.id,
    recipientName: recipient.name,
    recipientEmail: recipient.email,
    recipientPhone: recipient.phone,
    amount: transferAmount,
    fee: 0,
    netAmount: transferAmount,
    status: 'completed',
    referenceId: refId,
    note: note || '',
    createdAt: new Date().toISOString()
  };

  moneyTransfers.unshift(transferRecord);

  // Sender Ledger Entry (Outflow)
  transactions.unshift({
    id: 'tx_mt_out_' + crypto.randomUUID().slice(0, 8),
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    type: 'money_transfer',
    amount: transferAmount,
    status: 'completed',
    title: `Transfer to ${recipient.name}`,
    description: `P2P Wallet Transfer to ${recipient.email} (${refId})`,
    referenceId: refId,
    paymentMethod: 'P2P Wallet',
    fee: 0,
    netAmount: transferAmount,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    metadata: { direction: 'out', transferId, recipientId: recipient.id }
  });

  // Recipient Ledger Entry (Inflow)
  transactions.unshift({
    id: 'tx_mt_in_' + crypto.randomUUID().slice(0, 8),
    userId: recipient.id,
    userName: recipient.name,
    userEmail: recipient.email,
    type: 'money_transfer',
    amount: transferAmount,
    status: 'completed',
    title: `Transfer from ${user.name}`,
    description: `P2P Wallet Transfer from ${user.email} (${refId})`,
    referenceId: refId,
    paymentMethod: 'P2P Wallet',
    fee: 0,
    netAmount: transferAmount,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    metadata: { direction: 'in', transferId, senderId: user.id }
  });

  const updatedBalances = calculateUserBalances(user.id);

  return res.json({
    success: true,
    message: `Successfully transferred ₹${transferAmount.toLocaleString('en-IN')} to ${recipient.name}.`,
    transfer: transferRecord,
    balances: updatedBalances
  });
});

app.get('/api/transfers/money/history', authenticateToken, (req: Request, res: Response) => {
  const user = (req as any).user as StoredUser;
  const list = moneyTransfers.filter(m => m.senderId === user.id || m.recipientId === user.id);
  return res.json({ transfers: list });
});

// -------------------------------------------------------------
// BANK TRANSFER ENGINE (Verified Account Management & Payouts)
// -------------------------------------------------------------

app.get('/api/bank-accounts', authenticateToken, (req: Request, res: Response) => {
  const user = (req as any).user as StoredUser;
  const list = bankAccounts.get(user.id) || [];
  return res.json({ accounts: list });
});

app.post('/api/bank-accounts', authenticateToken, (req: Request, res: Response) => {
  const user = (req as any).user as StoredUser;
  const { accountHolderName, accountNumber, ifscCode, bankName } = req.body;

  if (!accountHolderName || !accountNumber || !ifscCode || !bankName) {
    return res.status(400).json({ error: 'All bank account details (Holder Name, Account Number, IFSC, Bank Name) are required.' });
  }

  const cleanIfsc = ifscCode.toUpperCase().trim();
  const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
  if (!ifscRegex.test(cleanIfsc)) {
    return res.status(400).json({ error: 'Invalid IFSC format. Standard 11-character Indian banking format required (e.g. HDFC0001234).' });
  }

  const userAccounts = bankAccounts.get(user.id) || [];

  const newAccount: BankAccount = {
    id: 'ba_' + crypto.randomUUID().slice(0, 8),
    userId: user.id,
    accountHolderName: accountHolderName.trim(),
    accountNumber: accountNumber.trim(),
    ifscCode: cleanIfsc,
    bankName: bankName.trim(),
    isVerified: true,
    isPrimary: userAccounts.length === 0,
    createdAt: new Date().toISOString()
  };

  userAccounts.push(newAccount);
  bankAccounts.set(user.id, userAccounts);

  return res.json({
    success: true,
    message: 'Bank account added and verified for payouts.',
    account: newAccount
  });
});

app.post('/api/transfers/bank/initiate', authenticateToken, (req: Request, res: Response) => {
  const user = (req as any).user as StoredUser;
  const { bankAccountId, amount, note, verificationOtp, idempotencyKey } = req.body;

  const transferAmount = parseFloat(amount);
  if (isNaN(transferAmount) || transferAmount <= 0) {
    return res.status(400).json({ error: 'Please enter a valid transfer amount.' });
  }

  if (transferAmount < 100) {
    return res.status(400).json({ error: 'Minimum bank transfer amount is ₹100.' });
  }

  if (transferAmount > 10000) {
    return res.status(400).json({ error: 'Maximum bank transfer limit is ₹10,000 per transaction.' });
  }

  if (user.kycStatus !== 'approved') {
    return res.status(403).json({ error: 'KYC identity verification required before initiating bank transfers.' });
  }

  if (verificationOtp && verificationOtp !== '123456' && verificationOtp.length !== 6) {
    return res.status(400).json({ error: 'Invalid 6-digit verification code. (Demo code: 123456).' });
  }

  const userAccounts = bankAccounts.get(user.id) || [];
  const selectedAccount = userAccounts.find(a => a.id === bankAccountId);
  if (!selectedAccount) {
    return res.status(404).json({ error: 'Selected bank account was not found.' });
  }

  const balances = calculateUserBalances(user.id);
  if (transferAmount > balances.withdrawableBalance) {
    return res.status(400).json({
      error: `Insufficient withdrawable balance. Available: ₹${balances.withdrawableBalance.toLocaleString('en-IN')}. Promotional bonus balances cannot be transferred to bank accounts.`,
      withdrawableBalance: balances.withdrawableBalance
    });
  }

  if (idempotencyKey) {
    if (processedIdempotencyKeys.has(idempotencyKey)) {
      return res.status(409).json({ error: 'Duplicate bank transfer request detected.' });
    }
    processedIdempotencyKeys.add(idempotencyKey);
  }

  const fee = 5; // Flat ₹5 IMPS processing fee
  const netAmount = Math.max(0, transferAmount - fee);
  const transferId = 'bt_' + crypto.randomUUID().slice(0, 8);
  const refId = 'BNK-' + Math.floor(100000 + Math.random() * 900000);
  const utrNumber = 'UTR-' + Math.floor(1000000000 + Math.random() * 9000000000);

  const bankTransfer: BankTransfer = {
    id: transferId,
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    bankAccountId: selectedAccount.id,
    accountHolderName: selectedAccount.accountHolderName,
    accountNumber: selectedAccount.accountNumber,
    ifscCode: selectedAccount.ifscCode,
    bankName: selectedAccount.bankName,
    amount: transferAmount,
    fee,
    netAmount,
    status: 'completed',
    referenceId: refId,
    utrNumber,
    note: note || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  bankTransfers.unshift(bankTransfer);

  transactions.unshift({
    id: 'tx_bt_' + crypto.randomUUID().slice(0, 8),
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    type: 'bank_transfer',
    amount: transferAmount,
    status: 'completed',
    title: `Bank Transfer to ${selectedAccount.bankName}`,
    description: `IMPS Transfer to A/C ending ...${selectedAccount.accountNumber.slice(-4)} (${refId})`,
    referenceId: refId,
    paymentMethod: 'IMPS Bank Transfer',
    fee,
    netAmount,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    metadata: { transferId, bankAccountId: selectedAccount.id, utrNumber }
  });

  const updatedBalances = calculateUserBalances(user.id);

  return res.json({
    success: true,
    message: `Bank transfer of ₹${transferAmount.toLocaleString('en-IN')} processed. UTR: ${utrNumber}.`,
    transfer: bankTransfer,
    balances: updatedBalances
  });
});

app.get('/api/transfers/bank/history', authenticateToken, (req: Request, res: Response) => {
  const user = (req as any).user as StoredUser;
  const list = bankTransfers.filter(b => b.userId === user.id);
  return res.json({ transfers: list });
});

// -------------------------------------------------------------
// Cashback Hub & History
// -------------------------------------------------------------

app.get('/api/cashback', authenticateToken, (req: Request, res: Response) => {
  const user = (req as any).user as StoredUser;
  const userItems = cashbackRecords.filter(cb => cb.userId === user.id);

  let totalEarned = 0;
  let available = 0;
  let used = 0;
  let expired = 0;
  const now = new Date();

  for (const item of userItems) {
    totalEarned += item.amount;
    const exp = new Date(item.expiryDate);

    if (item.status === 'available' && exp < now) {
      item.status = 'expired';
    }

    if (item.status === 'available') available += item.amount;
    if (item.status === 'used') used += item.amount;
    if (item.status === 'expired') expired += item.amount;
  }

  return res.json({
    summary: {
      totalEarned,
      available,
      used,
      expired,
      items: userItems
    },
    rule: cashbackRule
  });
});

// -------------------------------------------------------------
// Dedicated Ledgers & History Endpoints
// -------------------------------------------------------------

app.get('/api/wallet/transactions', authenticateToken, (req: Request, res: Response) => {
  const user = (req as any).user as StoredUser;
  const type = req.query.type as string | undefined;
  const status = req.query.status as string | undefined;

  let list = transactions.filter(t => t.userId === user.id);

  if (type && type !== 'all') {
    list = list.filter(t => t.type === type);
  }
  if (status && status !== 'all') {
    list = list.filter(t => t.status === status);
  }

  return res.json({ transactions: list });
});

app.get('/api/wallet/deposits', authenticateToken, (req: Request, res: Response) => {
  const user = (req as any).user as StoredUser;
  const list = transactions.filter(t => t.userId === user.id && t.type === 'deposit');
  return res.json({ deposits: list });
});

app.get('/api/wallet/bonuses', authenticateToken, (req: Request, res: Response) => {
  const user = (req as any).user as StoredUser;
  const list = bonusRecords.filter(b => b.userId === user.id);
  return res.json({ bonuses: list });
});

app.get('/api/wallet/withdrawals', authenticateToken, (req: Request, res: Response) => {
  const user = (req as any).user as StoredUser;
  const list = withdrawalRequests.filter(w => w.userId === user.id);
  return res.json({ withdrawals: list });
});

// -------------------------------------------------------------
// Notifications & Support
// -------------------------------------------------------------

app.get('/api/notifications', authenticateToken, (req: Request, res: Response) => {
  const user = (req as any).user as StoredUser;
  const notifs = systemNotifications.filter(n => !n.targetRole || n.targetRole === 'all' || n.targetRole === user.role);
  return res.json({ notifications: notifs });
});

app.get('/api/support/tickets', authenticateToken, (req: Request, res: Response) => {
  const user = (req as any).user as StoredUser;
  const tickets = supportTickets.filter(t => t.userId === user.id);
  return res.json({ tickets });
});

app.post('/api/support/tickets', authenticateToken, (req: Request, res: Response) => {
  const user = (req as any).user as StoredUser;
  const { subject, category, priority, message } = req.body;

  if (!subject || !message) {
    return res.status(400).json({ error: 'Subject and message are required.' });
  }

  const ticket: SupportTicket = {
    id: 'tkt_' + crypto.randomUUID().slice(0, 8),
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    subject: subject.trim(),
    category: category || 'other',
    priority: priority || 'medium',
    message: message.trim(),
    status: 'open',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  supportTickets.unshift(ticket);
  return res.json({ success: true, ticket, message: 'Support ticket submitted. Our executive will respond within 4 business hours.' });
});

// -------------------------------------------------------------
// ADMIN PANEL ENDPOINTS (Strictly Requires Admin Role)
// -------------------------------------------------------------

app.get('/api/admin/metrics', authenticateToken, requireAdmin, (req: Request, res: Response) => {
  const allUsers = Array.from(users.values());
  const customerList = allUsers.filter(u => u.role === 'customer');
  const activeUsers = customerList.filter(u => !u.isSuspended).length;

  let totalDeposited = 0;
  let totalWithdrawn = 0;
  let totalBonusCredited = 0;
  let totalCashbackAvailable = 0;
  let pendingTxCount = 0;
  let failedTxCount = 0;

  for (const tx of transactions) {
    if (tx.status === 'pending') pendingTxCount++;
    if (tx.status === 'failed' || tx.status === 'rejected') failedTxCount++;
    if (tx.type === 'deposit' && tx.status === 'completed') totalDeposited += tx.amount;
    if (tx.type === 'withdrawal' && tx.status === 'completed') totalWithdrawn += tx.amount;
    if (tx.type === 'bonus' && tx.status === 'completed') totalBonusCredited += tx.amount;
  }

  for (const cb of cashbackRecords) {
    if (cb.status === 'available') totalCashbackAvailable += cb.amount;
  }

  const pendingWithdrawals = withdrawalRequests.filter(w => w.status === 'pending');
  const approvedWithdrawals = withdrawalRequests.filter(w => w.status === 'approved' || w.status === 'processing');
  const completedWithdrawals = withdrawalRequests.filter(w => w.status === 'completed');
  const rejectedWithdrawals = withdrawalRequests.filter(w => w.status === 'rejected');

  const kycApprovedCount = Array.from(kycStore.values()).filter(k => k.status === 'approved').length;
  const kycPendingCount = Array.from(kycStore.values()).filter(k => k.status === 'pending').length;
  const kycRejectedCount = Array.from(kycStore.values()).filter(k => k.status === 'rejected').length;

  const moneyTransferVolume = moneyTransfers.reduce((sum, m) => sum + m.amount, 0);
  const bankTransferVolume = bankTransfers.reduce((sum, b) => sum + b.amount, 0);

  const securityAlerts = [
    { id: 'sec_01', level: 'info', message: 'All transactions running with SHA-256 and idempotency lock.' },
    { id: 'sec_02', level: 'warning', message: `${pendingWithdrawals.length} withdrawal payout requests pending review.` }
  ];

  return res.json({
    totalUsers: customerList.length,
    activeUsers,
    kycApprovedCount,
    kycPendingCount,
    kycRejectedCount,
    totalDeposited,
    totalWithdrawn,
    pendingWithdrawalsCount: pendingWithdrawals.length,
    pendingWithdrawalsAmount: pendingWithdrawals.reduce((sum, w) => sum + w.amount, 0),
    approvedWithdrawalsCount: approvedWithdrawals.length + completedWithdrawals.length,
    rejectedWithdrawalsCount: rejectedWithdrawals.length,
    totalBonusCredited,
    totalCashbackIssued: cashbackRecords.reduce((sum, c) => sum + c.amount, 0),
    activeLiability: totalBonusCredited + totalCashbackAvailable,
    moneyTransferVolume,
    moneyTransferCount: moneyTransfers.length,
    bankTransferVolume,
    bankTransferCount: bankTransfers.length,
    pendingTransactionsCount: pendingTxCount,
    failedTransactionsCount: failedTxCount,
    securityAlerts,
    bonusRule,
    cashbackRule,
    withdrawalRule,
    recentAuditLogs: auditLogs.slice(0, 6),
    recentNotifications: systemNotifications.slice(0, 5)
  });
});

app.get('/api/admin/users', authenticateToken, requireAdmin, (req: Request, res: Response) => {
  const list = Array.from(users.values()).map(u => {
    const { passwordHash, ...safe } = u;
    const balances = calculateUserBalances(u.id);
    return { ...safe, balances };
  });
  return res.json({ users: list });
});

app.post('/api/admin/users/:id/toggle-suspend', authenticateToken, requireAdmin, (req: Request, res: Response) => {
  const admin = (req as any).user as StoredUser;
  const targetId = req.params.id;
  const target = users.get(targetId);

  if (!target) return res.status(404).json({ error: 'User not found' });
  if (target.role === 'admin' || target.role === 'superadmin') {
    return res.status(400).json({ error: 'Cannot suspend an administrative account.' });
  }

  const oldStatus = target.isSuspended;
  target.isSuspended = !target.isSuspended;
  users.set(targetId, target);

  auditLogs.unshift({
    id: 'aud_' + crypto.randomUUID().slice(0, 8),
    action: target.isSuspended ? 'USER_SUSPENDED' : 'USER_ACTIVATED',
    adminEmail: admin.email,
    targetType: 'user',
    targetId,
    details: `User ${target.email} account suspended state changed from ${oldStatus} to ${target.isSuspended}`,
    previousValue: { isSuspended: oldStatus },
    newValue: { isSuspended: target.isSuspended },
    ipAddress: req.ip || '127.0.0.1',
    timestamp: new Date().toISOString()
  });

  return res.json({ success: true, isSuspended: target.isSuspended });
});

app.get('/api/admin/deposits', authenticateToken, requireAdmin, (req: Request, res: Response) => {
  const deposits = transactions.filter(t => t.type === 'deposit');
  return res.json({ deposits });
});

app.get('/api/admin/withdrawals', authenticateToken, requireAdmin, (req: Request, res: Response) => {
  // Augment withdrawals with user's daily usage & KYC status for admin scrutiny
  const list = withdrawalRequests.map(w => {
    const balances = calculateUserBalances(w.userId);
    const u = users.get(w.userId);
    return {
      ...w,
      userKycStatus: u?.kycStatus || 'not_submitted',
      userDailyWithdrawnAmount: balances.todayWithdrawnAmount,
      userDailyRemainingLimit: balances.remainingDailyWithdrawalLimit,
      userTotalDepositBalance: balances.depositBalance
    };
  });
  return res.json({ withdrawals: list });
});

app.post('/api/admin/withdrawals/:id/update-status', authenticateToken, requireAdmin, (req: Request, res: Response) => {
  const admin = (req as any).user as StoredUser;
  const { id } = req.params;
  const { status, adminNote, payoutReference } = req.body;

  const validStatuses: TransactionStatus[] = ['pending', 'approved', 'processing', 'completed', 'rejected'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid withdrawal status.' });
  }

  const reqIndex = withdrawalRequests.findIndex(w => w.id === id);
  if (reqIndex === -1) {
    return res.status(404).json({ error: 'Withdrawal request not found.' });
  }

  const w = withdrawalRequests[reqIndex];
  const oldStatus = w.status;
  w.status = status;
  w.updatedAt = new Date().toISOString();
  if (adminNote) w.adminNote = adminNote;
  if (payoutReference) w.payoutReference = payoutReference;

  for (const tx of transactions) {
    if (tx.metadata?.withdrawalId === id || tx.id.includes(id)) {
      tx.status = status;
      tx.updatedAt = new Date().toISOString();
      if (adminNote) tx.description += ` | Note: ${adminNote}`;
    }
  }

  auditLogs.unshift({
    id: 'aud_' + crypto.randomUUID().slice(0, 8),
    action: `WITHDRAWAL_${status.toUpperCase()}`,
    adminEmail: admin.email,
    targetType: 'withdrawal',
    targetId: id,
    details: `Withdrawal request of ₹${w.amount} for ${w.userEmail} moved from ${oldStatus} to ${status}. Note: ${adminNote || 'None'}`,
    previousValue: { status: oldStatus },
    newValue: { status, adminNote, payoutReference },
    ipAddress: req.ip || '127.0.0.1',
    timestamp: new Date().toISOString()
  });

  return res.json({ success: true, withdrawal: w });
});

app.get('/api/admin/rules/withdrawal', authenticateToken, requireAdmin, (req: Request, res: Response) => {
  return res.json({ rule: withdrawalRule });
});

app.post('/api/admin/rules/withdrawal', authenticateToken, requireAdmin, (req: Request, res: Response) => {
  const admin = (req as any).user as StoredUser;
  const { maxWithdrawalsPerDay, maxDailyAmount, minWithdrawalAmount, kycRequired, upiFee, impsFee, isActive } = req.body;

  const prev = { ...withdrawalRule };

  if (maxWithdrawalsPerDay !== undefined) withdrawalRule.maxWithdrawalsPerDay = parseInt(maxWithdrawalsPerDay, 10);
  if (maxDailyAmount !== undefined) withdrawalRule.maxDailyAmount = parseFloat(maxDailyAmount);
  if (minWithdrawalAmount !== undefined) withdrawalRule.minWithdrawalAmount = parseFloat(minWithdrawalAmount);
  if (kycRequired !== undefined) withdrawalRule.kycRequired = Boolean(kycRequired);
  if (upiFee !== undefined) withdrawalRule.upiFee = parseFloat(upiFee);
  if (impsFee !== undefined) withdrawalRule.impsFee = parseFloat(impsFee);
  if (isActive !== undefined) withdrawalRule.isActive = Boolean(isActive);

  withdrawalRule.updatedAt = new Date().toISOString();
  withdrawalRule.updatedBy = admin.email;

  auditLogs.unshift({
    id: 'aud_' + crypto.randomUUID().slice(0, 8),
    action: 'WITHDRAWAL_RULE_MODIFIED',
    adminEmail: admin.email,
    targetType: 'withdrawal_rule',
    targetId: withdrawalRule.id,
    details: `Admin updated withdrawal limits: Max ${withdrawalRule.maxWithdrawalsPerDay}/day, Daily Cap ₹${withdrawalRule.maxDailyAmount}, Min ₹${withdrawalRule.minWithdrawalAmount}.`,
    previousValue: prev,
    newValue: withdrawalRule,
    ipAddress: req.ip || '127.0.0.1',
    timestamp: new Date().toISOString()
  });

  return res.json({
    success: true,
    message: 'Withdrawal rules and limits updated with immutable audit log.',
    rule: withdrawalRule
  });
});

app.get('/api/admin/rules/bonus', authenticateToken, requireAdmin, (req: Request, res: Response) => {
  return res.json({ rule: bonusRule });
});

app.post('/api/admin/rules/bonus', authenticateToken, requireAdmin, (req: Request, res: Response) => {
  const admin = (req as any).user as StoredUser;
  const { bonusAmount, depositThreshold, maxDepositLimit, minDepositRequired, isActive, description } = req.body;

  const prev = { ...bonusRule };

  if (bonusAmount !== undefined) bonusRule.bonusAmount = parseFloat(bonusAmount);
  if (depositThreshold !== undefined) bonusRule.depositThreshold = parseFloat(depositThreshold);
  if (maxDepositLimit !== undefined) bonusRule.maxDepositLimit = parseFloat(maxDepositLimit);
  if (minDepositRequired !== undefined) bonusRule.minDepositRequired = parseFloat(minDepositRequired);
  if (isActive !== undefined) bonusRule.isActive = Boolean(isActive);
  if (description !== undefined) bonusRule.description = description;

  bonusRule.updatedAt = new Date().toISOString();
  bonusRule.updatedBy = admin.email;

  auditLogs.unshift({
    id: 'aud_' + crypto.randomUUID().slice(0, 8),
    action: 'BONUS_RULE_MODIFIED',
    adminEmail: admin.email,
    targetType: 'bonus_rule',
    targetId: bonusRule.id,
    details: `Admin updated bonus reward configuration: ₹${bonusRule.bonusAmount} per ₹${bonusRule.depositThreshold} deposit, lifetime cap ₹${bonusRule.maxDepositLimit}.`,
    previousValue: prev,
    newValue: bonusRule,
    ipAddress: req.ip || '127.0.0.1',
    timestamp: new Date().toISOString()
  });

  return res.json({
    success: true,
    message: 'Bonus configuration updated and recorded in audit ledger.',
    rule: bonusRule
  });
});

app.get('/api/admin/rules/cashback', authenticateToken, requireAdmin, (req: Request, res: Response) => {
  return res.json({ rule: cashbackRule });
});

app.post('/api/admin/rules/cashback', authenticateToken, requireAdmin, (req: Request, res: Response) => {
  const admin = (req as any).user as StoredUser;
  const { cashbackPercentage, maxCashbackPerTx, expiryDays, minSpendAmount, isActive } = req.body;

  const prev = { ...cashbackRule };

  if (cashbackPercentage !== undefined) cashbackRule.cashbackPercentage = parseFloat(cashbackPercentage);
  if (maxCashbackPerTx !== undefined) cashbackRule.maxCashbackPerTx = parseFloat(maxCashbackPerTx);
  if (expiryDays !== undefined) cashbackRule.expiryDays = parseInt(expiryDays, 10);
  if (minSpendAmount !== undefined) cashbackRule.minSpendAmount = parseFloat(minSpendAmount);
  if (isActive !== undefined) cashbackRule.isActive = Boolean(isActive);

  cashbackRule.updatedAt = new Date().toISOString();
  cashbackRule.updatedBy = admin.email;

  auditLogs.unshift({
    id: 'aud_' + crypto.randomUUID().slice(0, 8),
    action: 'CASHBACK_RULE_MODIFIED',
    adminEmail: admin.email,
    targetType: 'cashback_rule',
    targetId: cashbackRule.id,
    details: `Admin updated cashback rules: ${cashbackRule.cashbackPercentage}% cashback, ${cashbackRule.expiryDays} days expiry.`,
    previousValue: prev,
    newValue: cashbackRule,
    ipAddress: req.ip || '127.0.0.1',
    timestamp: new Date().toISOString()
  });

  return res.json({
    success: true,
    message: 'Cashback configuration updated and logged.',
    rule: cashbackRule
  });
});

app.get('/api/admin/transfers/money', authenticateToken, requireAdmin, (req: Request, res: Response) => {
  return res.json({ transfers: moneyTransfers });
});

app.get('/api/admin/transfers/bank', authenticateToken, requireAdmin, (req: Request, res: Response) => {
  return res.json({ transfers: bankTransfers });
});

app.get('/api/admin/kyc', authenticateToken, requireAdmin, (req: Request, res: Response) => {
  const records = Array.from(kycStore.values()).map(k => {
    const user = users.get(k.userId);
    return {
      ...k,
      userEmail: user ? user.email : '',
      userName: user ? user.name : ''
    };
  });
  return res.json({ kycList: records });
});

app.post('/api/admin/kyc/:userId/review', authenticateToken, requireAdmin, (req: Request, res: Response) => {
  const admin = (req as any).user as StoredUser;
  const { userId } = req.params;
  const { status, remarks } = req.body;

  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Status must be approved or rejected.' });
  }

  const user = users.get(userId);
  if (!user) return res.status(404).json({ error: 'User not found.' });

  const kyc = kycStore.get(userId);
  if (!kyc) return res.status(404).json({ error: 'KYC record not found.' });

  kyc.status = status;
  kyc.verifiedAt = new Date().toISOString();
  if (remarks) kyc.rejectionReason = remarks;

  user.kycStatus = status;
  user.kycRemarks = remarks || (status === 'approved' ? 'KYC successfully verified.' : 'KYC rejected.');
  users.set(userId, user);
  kycStore.set(userId, kyc);

  auditLogs.unshift({
    id: 'aud_' + crypto.randomUUID().slice(0, 8),
    action: `KYC_${status.toUpperCase()}`,
    adminEmail: admin.email,
    targetType: 'kyc',
    targetId: userId,
    details: `KYC for ${user.email} was marked as ${status}. Remarks: ${remarks || 'None'}`,
    newValue: { status, remarks },
    ipAddress: req.ip || '127.0.0.1',
    timestamp: new Date().toISOString()
  });

  return res.json({ success: true, kyc, userStatus: user.kycStatus });
});

app.get('/api/admin/audit-logs', authenticateToken, requireAdmin, (req: Request, res: Response) => {
  return res.json({ auditLogs });
});

app.post('/api/admin/notifications', authenticateToken, requireAdmin, (req: Request, res: Response) => {
  const admin = (req as any).user as StoredUser;
  const { title, message, category, targetRole } = req.body;

  if (!title || !message) {
    return res.status(400).json({ error: 'Title and message are required.' });
  }

  const notif: SystemNotification = {
    id: 'notif_' + crypto.randomUUID().slice(0, 8),
    title: title.trim(),
    message: message.trim(),
    category: category || 'system',
    targetRole: targetRole || 'all',
    createdAt: new Date().toISOString()
  };

  systemNotifications.unshift(notif);

  auditLogs.unshift({
    id: 'aud_' + crypto.randomUUID().slice(0, 8),
    action: 'NOTIFICATION_BROADCAST',
    adminEmail: admin.email,
    targetType: 'system',
    targetId: notif.id,
    details: `Broadcast notification created: "${title}"`,
    newValue: notif,
    ipAddress: req.ip || '127.0.0.1',
    timestamp: new Date().toISOString()
  });

  return res.json({ success: true, notification: notif });
});

app.get('/api/admin/support/tickets', authenticateToken, requireAdmin, (req: Request, res: Response) => {
  return res.json({ tickets: supportTickets });
});

app.post('/api/admin/support/tickets/:id/reply', authenticateToken, requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const { adminReply, status } = req.body;

  const ticket = supportTickets.find(t => t.id === id);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

  if (adminReply) ticket.adminReply = adminReply;
  if (status) ticket.status = status;
  ticket.updatedAt = new Date().toISOString();

  return res.json({ success: true, ticket });
});

// -------------------------------------------------------------
// Vite Middleware / Static Server
// -------------------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`RupeeRewards server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
