export type TransactionType = 'income' | 'expense';
export type CardType = 'debit' | 'credit';
export type LoanStatus = 'active' | 'paid';
export type PeriodFilter = 'weekly' | 'monthly' | 'yearly';

export interface User {
  id: string;
  name: string;
  avatarColor: string;
  avatarStyle?: string;
  currency: string;
  monthlyBudget: number;
  isPremium: boolean;
  notificationsEnabled: boolean;
  notificationsDaysBefore: number;
  createdAt: number;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  description: string;
  date: string;
  cardId?: string;
  createdAt: number;
}

export interface Card {
  id: string;
  name: string;
  bank: string;
  type: CardType;
  lastFour: string;
  expiry: string;
  cardHolder: string;
  limitAmount: number;
  balance: number;
  colorStart: string;
  colorEnd: string;
  network: 'visa' | 'mastercard' | 'other';
  createdAt: number;
}

export type PaymentFrequency = 'monthly' | 'one-time';

export interface LoanParticipant {
  name: string;
  avatarStyle?: string;
}

export interface Loan {
  id: string;
  title: string;
  bank: string;
  loanType: string;
  paymentType: PaymentFrequency;
  totalAmount: number;
  outstandingAmount: number;
  interestRate: number;
  emiAmount: number;
  nextDueDate: string;
  status: LoanStatus;
  createdAt: number;
  shareCode?: string;
  participants?: LoanParticipant[];
}

export interface BudgetGoal {
  id: string;
  category: string;
  limitAmount: number;
  period: 'monthly' | 'weekly';
  createdAt: number;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  color: string;
  icon: string;
  createdAt: number;
}

export interface SavingsActivity {
  id: string;
  goalId: string;
  goalName: string;
  type: 'deposit' | 'withdraw';
  amount: number;
  createdAt: number;
}

export interface SpendingByCategory {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}
