import { create } from 'zustand';
import { User, Transaction, Card, Loan, BudgetGoal, SavingsGoal, SavingsActivity } from '../types';
import { DEFAULT_ALLOC_PCTS } from '../constants/Budget';
import * as queries from '../db/queries';
import {
  scheduleLoanNotification,
  cancelLoanNotification,
  scheduleAllLoanNotifications,
  cancelAllLoanNotifications,
} from '../utils/notifications';
import { publishLoanPaid, syncLoanUpdate } from '../utils/sync';
import { markLoanPendingSync } from '../db/queries';

interface AppState {
  // User
  user: User | null;
  loadUser: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;

  // Transactions
  transactions: Transaction[];
  loadTransactions: () => Promise<void>;
  addTransaction: (tx: Transaction) => Promise<void>;
  removeTransaction: (id: string) => Promise<void>;

  // Cards
  cards: Card[];
  loadCards: () => Promise<void>;
  addCard: (card: Card) => Promise<void>;
  removeCard: (id: string) => Promise<void>;
  updateCardBalance: (id: string, delta: number) => Promise<void>;

  // Loans
  loans: Loan[];
  loadLoans: () => Promise<void>;
  addLoan: (loan: Loan) => Promise<void>;
  updateLoan: (loan: Loan) => Promise<void>;
  applyRemoteLoan: (loan: Loan) => Promise<void>;
  deleteLoan: (id: string) => Promise<void>;
  payLoan: (id: string, amount: number) => Promise<void>;

  // Budget
  budgetGoals: BudgetGoal[];
  loadBudgetGoals: () => Promise<void>;
  addBudgetGoal: (goal: BudgetGoal) => Promise<void>;
  removeBudgetGoal: (id: string) => Promise<void>;

  // Savings
  savingsGoals: SavingsGoal[];
  loadSavingsGoals: () => Promise<void>;
  addSavingsGoal: (goal: SavingsGoal) => Promise<void>;
  updateSavingsAmount: (id: string, delta: number) => Promise<void>;
  removeSavingsGoal: (id: string) => Promise<void>;

  // Savings activity
  savingsActivity: SavingsActivity[];
  loadSavingsActivity: () => Promise<void>;

  // Data management
  deleteAllData: () => Promise<void>;
  exportAllData: () => ReturnType<typeof queries.exportAllData>;
  importAllData: (data: Parameters<typeof queries.importAllData>[0]) => Promise<void>;

  // Budget allocations (in-memory, persists across screens)
  budgetAllocations: Record<string, number>;
  setBudgetAllocations: (allocs: Record<string, number>) => void;

  // UI
  isLoading: boolean;
  setLoading: (v: boolean) => void;
  hideBalance: boolean;
  toggleHideBalance: () => void;

}

export const useAppStore = create<AppState>((set, get) => ({
  user: null,
  transactions: [],
  cards: [],
  loans: [],
  budgetGoals: [],
  savingsGoals: [],
  savingsActivity: [],
  isLoading: false,
  hideBalance: false,
  budgetAllocations: { ...DEFAULT_ALLOC_PCTS } as Record<string, number>,

  setLoading: (v) => set({ isLoading: v }),
  toggleHideBalance: () => set((s) => ({ hideBalance: !s.hideBalance })),
  setBudgetAllocations: (budgetAllocations) => set({ budgetAllocations }),

  loadUser: async () => {
    const user = await queries.getUser();
    set({ user });
  },

  updateUser: async (updates) => {
    await queries.updateUser(updates);
    const user = await queries.getUser();
    set({ user });
  },

  loadTransactions: async () => {
    const transactions = await queries.getTransactions(200);
    set({ transactions });
  },

  addTransaction: async (tx) => {
    await queries.insertTransaction(tx);
    await get().loadTransactions();
  },

  removeTransaction: async (id) => {
    await queries.deleteTransaction(id);
    set((s) => ({ transactions: s.transactions.filter((t) => t.id !== id) }));
  },

  loadCards: async () => {
    const cards = await queries.getCards();
    set({ cards });
  },

  addCard: async (card) => {
    await queries.insertCard(card);
    await get().loadCards();
  },

  removeCard: async (id) => {
    await queries.deleteCard(id);
    set((s) => ({ cards: s.cards.filter((c) => c.id !== id) }));
  },

  updateCardBalance: async (id, delta) => {
    await queries.updateCardBalance(id, delta);
    await get().loadCards();
  },

  loadLoans: async () => {
    const loans = await queries.getLoans();
    set({ loans });
  },

  addLoan: async (loan) => {
    await queries.insertLoan(loan);
    await get().loadLoans();
    const { user } = get();
    if (user?.notificationsEnabled) {
      await scheduleLoanNotification(loan, user.notificationsDaysBefore);
    }
  },

  updateLoan: async (loan) => {
    await cancelLoanNotification(loan.id);
    await queries.updateLoan(loan);
    if (loan.shareCode) {
      try {
        await syncLoanUpdate(loan.shareCode, loan);
      } catch {
        await markLoanPendingSync(loan.id);
      }
    }
    await get().loadLoans();
    const { user } = get();
    if (user?.notificationsEnabled) {
      await scheduleLoanNotification(loan, user.notificationsDaysBefore);
    }
  },

  applyRemoteLoan: async (loan) => {
    await queries.updateLoan(loan);
    await get().loadLoans();
  },

  deleteLoan: async (id) => {
    await cancelLoanNotification(id);
    await queries.deleteLoan(id);
    set((s) => ({ loans: s.loans.filter((l) => l.id !== id) }));
  },

  payLoan: async (id, amount) => {
    const loan = get().loans.find((l) => l.id === id);
    if (!loan) return;
    const newOutstanding = Math.max(0, loan.outstandingAmount - amount);
    const newStatus = newOutstanding === 0 ? 'paid' : 'active';
    await cancelLoanNotification(id);
    await queries.updateLoanPayment(id, newOutstanding, newStatus);
    if (loan.shareCode) {
      try {
        if (newStatus === 'paid') {
          await publishLoanPaid(loan.shareCode);
        } else {
          const updated = { ...loan, outstandingAmount: newOutstanding, status: newStatus };
          await syncLoanUpdate(loan.shareCode, updated);
        }
      } catch {
        await markLoanPendingSync(id);
      }
    }
    await get().loadLoans();
    const { user } = get();
    if (newStatus === 'active' && user?.notificationsEnabled) {
      const updated = get().loans.find((l) => l.id === id);
      if (updated) await scheduleLoanNotification(updated, user.notificationsDaysBefore);
    }
  },

  loadBudgetGoals: async () => {
    const budgetGoals = await queries.getBudgetGoals();
    set({ budgetGoals });
  },

  addBudgetGoal: async (goal) => {
    await queries.insertBudgetGoal(goal);
    await get().loadBudgetGoals();
  },

  removeBudgetGoal: async (id) => {
    await queries.deleteBudgetGoal(id);
    set((s) => ({ budgetGoals: s.budgetGoals.filter((g) => g.id !== id) }));
  },

  loadSavingsGoals: async () => {
    const savingsGoals = await queries.getSavingsGoals();
    set({ savingsGoals });
  },

  addSavingsGoal: async (goal) => {
    await queries.insertSavingsGoal(goal);
    await get().loadSavingsGoals();
  },

  updateSavingsAmount: async (id, delta) => {
    const goal = get().savingsGoals.find((g) => g.id === id);
    await queries.updateSavingsAmount(id, delta);
    if (goal) {
      const activity: SavingsActivity = {
        id: `sa_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        goalId: id,
        goalName: goal.name,
        type: delta >= 0 ? 'deposit' : 'withdraw',
        amount: Math.abs(delta),
        createdAt: Date.now(),
      };
      await queries.insertSavingsActivity(activity);
      await get().loadSavingsActivity();
    }
    await get().loadSavingsGoals();
  },

  removeSavingsGoal: async (id) => {
    await queries.deleteSavingsGoal(id);
    set((s) => ({ savingsGoals: s.savingsGoals.filter((g) => g.id !== id) }));
  },

  loadSavingsActivity: async () => {
    const savingsActivity = await queries.getSavingsActivity(50);
    set({ savingsActivity });
  },

  deleteAllData: async () => {
    await cancelAllLoanNotifications(get().loans);
    await queries.deleteAllData();
    set({ transactions: [], cards: [], loans: [], budgetGoals: [], savingsGoals: [], savingsActivity: [] });
  },

  exportAllData: () => queries.exportAllData(),

  importAllData: async (data) => {
    await queries.importAllData(data);
    await Promise.all([
      get().loadUser(),
      get().loadTransactions(),
      get().loadCards(),
      get().loadLoans(),
      get().loadBudgetGoals(),
      get().loadSavingsGoals(),
      get().loadSavingsActivity(),
    ]);
  },

}));
