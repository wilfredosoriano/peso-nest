import { create } from 'zustand';
import { User, Transaction, Card, Loan, BudgetGoal } from '../types';
import * as queries from '../db/queries';

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

  // Loans
  loans: Loan[];
  loadLoans: () => Promise<void>;
  addLoan: (loan: Loan) => Promise<void>;

  // Budget
  budgetGoals: BudgetGoal[];
  loadBudgetGoals: () => Promise<void>;

  // UI
  isLoading: boolean;
  setLoading: (v: boolean) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  user: null,
  transactions: [],
  cards: [],
  loans: [],
  budgetGoals: [],
  isLoading: false,

  setLoading: (v) => set({ isLoading: v }),

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

  loadLoans: async () => {
    const loans = await queries.getLoans();
    set({ loans });
  },

  addLoan: async (loan) => {
    await queries.insertLoan(loan);
    await get().loadLoans();
  },

  loadBudgetGoals: async () => {
    const budgetGoals = await queries.getBudgetGoals();
    set({ budgetGoals });
  },
}));
