export type TransactionType = 'income' | 'expense';
export type CardType = 'debit' | 'credit';
export type LoanStatus = 'active' | 'paid';
export type PeriodFilter = 'weekly' | 'monthly' | 'yearly';

export interface User {
  id: string;
  name: string;
  avatarColor: string;
  currency: string;
  monthlyBudget: number;
  isPremium: boolean;
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

export interface Loan {
  id: string;
  title: string;
  loanType: string;
  totalAmount: number;
  outstandingAmount: number;
  interestRate: number;
  emiAmount: number;
  nextDueDate: string;
  status: LoanStatus;
  createdAt: number;
}

export interface BudgetGoal {
  id: string;
  category: string;
  limitAmount: number;
  period: 'monthly' | 'weekly';
  createdAt: number;
}

export interface SpendingByCategory {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}
