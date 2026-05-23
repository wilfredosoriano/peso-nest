import { getDatabase } from './database';
import { Transaction, Card, Loan, BudgetGoal, User } from '../types';

// --- USERS ---
export const getUser = async (): Promise<User | null> => {
  const db = await getDatabase();
  const row = await db.getFirstAsync<any>('SELECT * FROM users LIMIT 1');
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    avatarColor: row.avatar_color,
    currency: row.currency,
    monthlyBudget: row.monthly_budget,
    isPremium: row.is_premium === 1,
    createdAt: row.created_at,
  };
};

export const updateUser = async (updates: Partial<User>): Promise<void> => {
  const db = await getDatabase();
  const fields: string[] = [];
  const values: any[] = [];
  if (updates.name !== undefined) { fields.push('name = ?'); values.push(updates.name); }
  if (updates.avatarColor !== undefined) { fields.push('avatar_color = ?'); values.push(updates.avatarColor); }
  if (updates.monthlyBudget !== undefined) { fields.push('monthly_budget = ?'); values.push(updates.monthlyBudget); }
  if (updates.isPremium !== undefined) { fields.push('is_premium = ?'); values.push(updates.isPremium ? 1 : 0); }
  if (fields.length === 0) return;
  values.push('user_1');
  await db.runAsync(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
};

// --- TRANSACTIONS ---
export const getTransactions = async (limit = 100): Promise<Transaction[]> => {
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>(
    'SELECT * FROM transactions ORDER BY date DESC, created_at DESC LIMIT ?', [limit]
  );
  return rows.map(rowToTransaction);
};

export const getTransactionsByMonth = async (year: number, month: number): Promise<Transaction[]> => {
  const db = await getDatabase();
  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  const rows = await db.getAllAsync<any>(
    "SELECT * FROM transactions WHERE date LIKE ? ORDER BY date DESC, created_at DESC",
    [`${prefix}%`]
  );
  return rows.map(rowToTransaction);
};

export const insertTransaction = async (tx: Transaction): Promise<void> => {
  const db = await getDatabase();
  await db.runAsync(
    'INSERT INTO transactions (id, type, amount, category, description, date, card_id, created_at) VALUES (?,?,?,?,?,?,?,?)',
    [tx.id, tx.type, tx.amount, tx.category, tx.description, tx.date, tx.cardId ?? null, tx.createdAt]
  );
};

export const deleteTransaction = async (id: string): Promise<void> => {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM transactions WHERE id = ?', [id]);
};

const rowToTransaction = (row: any): Transaction => ({
  id: row.id,
  type: row.type,
  amount: row.amount,
  category: row.category,
  description: row.description,
  date: row.date,
  cardId: row.card_id ?? undefined,
  createdAt: row.created_at,
});

// --- CARDS ---
export const getCards = async (): Promise<Card[]> => {
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>('SELECT * FROM cards ORDER BY created_at ASC');
  return rows.map(rowToCard);
};

export const insertCard = async (card: Card): Promise<void> => {
  const db = await getDatabase();
  await db.runAsync(
    'INSERT INTO cards (id, name, bank, type, last_four, expiry, card_holder, limit_amount, balance, color_start, color_end, network, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',
    [card.id, card.name, card.bank, card.type, card.lastFour, card.expiry, card.cardHolder, card.limitAmount, card.balance, card.colorStart, card.colorEnd, card.network, card.createdAt]
  );
};

export const deleteCard = async (id: string): Promise<void> => {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM cards WHERE id = ?', [id]);
};

const rowToCard = (row: any): Card => ({
  id: row.id,
  name: row.name,
  bank: row.bank,
  type: row.type,
  lastFour: row.last_four,
  expiry: row.expiry,
  cardHolder: row.card_holder,
  limitAmount: row.limit_amount,
  balance: row.balance,
  colorStart: row.color_start,
  colorEnd: row.color_end,
  network: row.network,
  createdAt: row.created_at,
});

// --- LOANS ---
export const getLoans = async (): Promise<Loan[]> => {
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>('SELECT * FROM loans ORDER BY created_at DESC');
  return rows.map(rowToLoan);
};

export const insertLoan = async (loan: Loan): Promise<void> => {
  const db = await getDatabase();
  await db.runAsync(
    'INSERT INTO loans (id, title, loan_type, total_amount, outstanding_amount, interest_rate, emi_amount, next_due_date, status, created_at) VALUES (?,?,?,?,?,?,?,?,?,?)',
    [loan.id, loan.title, loan.loanType, loan.totalAmount, loan.outstandingAmount, loan.interestRate, loan.emiAmount, loan.nextDueDate, loan.status, loan.createdAt]
  );
};

const rowToLoan = (row: any): Loan => ({
  id: row.id,
  title: row.title,
  loanType: row.loan_type,
  totalAmount: row.total_amount,
  outstandingAmount: row.outstanding_amount,
  interestRate: row.interest_rate,
  emiAmount: row.emi_amount,
  nextDueDate: row.next_due_date,
  status: row.status,
  createdAt: row.created_at,
});

// --- BUDGET GOALS ---
export const getBudgetGoals = async (): Promise<BudgetGoal[]> => {
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>('SELECT * FROM budget_goals ORDER BY created_at DESC');
  return rows.map((row: any) => ({
    id: row.id,
    category: row.category,
    limitAmount: row.limit_amount,
    period: row.period,
    createdAt: row.created_at,
  }));
};
