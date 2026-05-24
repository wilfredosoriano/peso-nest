import { getDatabase } from './database';
import { Transaction, Card, Loan, BudgetGoal, SavingsGoal, SavingsActivity, User } from '../types';

// --- USERS ---
export const getUser = async (): Promise<User | null> => {
  const db = await getDatabase();
  const row = await db.getFirstAsync<any>('SELECT * FROM users LIMIT 1');
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    avatarColor: row.avatar_color,
    avatarStyle: row.avatar_style ?? undefined,
    currency: row.currency,
    monthlyBudget: row.monthly_budget,
    isPremium: row.is_premium === 1,
    notificationsEnabled: row.notifications_enabled === 1,
    notificationsDaysBefore: row.notifications_days_before ?? 1,
    createdAt: row.created_at,
  };
};

export const updateUser = async (updates: Partial<User>): Promise<void> => {
  const db = await getDatabase();
  const fields: string[] = [];
  const values: any[] = [];
  if (updates.name !== undefined) { fields.push('name = ?'); values.push(updates.name); }
  if (updates.avatarColor !== undefined) { fields.push('avatar_color = ?'); values.push(updates.avatarColor); }
  if (updates.avatarStyle !== undefined) { fields.push('avatar_style = ?'); values.push(updates.avatarStyle); }
  if (updates.monthlyBudget !== undefined) { fields.push('monthly_budget = ?'); values.push(updates.monthlyBudget); }
  if (updates.isPremium !== undefined) { fields.push('is_premium = ?'); values.push(updates.isPremium ? 1 : 0); }
  if (updates.notificationsEnabled !== undefined) { fields.push('notifications_enabled = ?'); values.push(updates.notificationsEnabled ? 1 : 0); }
  if (updates.notificationsDaysBefore !== undefined) { fields.push('notifications_days_before = ?'); values.push(updates.notificationsDaysBefore); }
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

export const updateCardBalance = async (id: string, delta: number): Promise<void> => {
  const db = await getDatabase();
  await db.runAsync('UPDATE cards SET balance = balance + ? WHERE id = ?', [delta, id]);
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

export const updateLoanPayment = async (id: string, outstandingAmount: number, status: string): Promise<void> => {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE loans SET outstanding_amount = ?, status = ? WHERE id = ?',
    [outstandingAmount, status, id]
  );
};

export const updateLoan = async (loan: Loan): Promise<void> => {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE loans SET title=?, bank=?, payment_type=?, total_amount=?, outstanding_amount=?, interest_rate=?, emi_amount=?, next_due_date=?, status=?, share_code=?, participants=? WHERE id=?',
    [loan.title, loan.bank, loan.paymentType, loan.totalAmount, loan.outstandingAmount, loan.interestRate, loan.emiAmount, loan.nextDueDate, loan.status, loan.shareCode ?? null, loan.participants ? JSON.stringify(loan.participants) : null, loan.id]
  );
};

export const deleteLoan = async (id: string): Promise<void> => {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM loans WHERE id = ?', [id]);
};

export const insertLoan = async (loan: Loan): Promise<void> => {
  const db = await getDatabase();
  await db.runAsync(
    'INSERT INTO loans (id, title, bank, loan_type, payment_type, total_amount, outstanding_amount, interest_rate, emi_amount, next_due_date, status, created_at, share_code, participants) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
    [loan.id, loan.title, loan.bank, loan.loanType, loan.paymentType, loan.totalAmount, loan.outstandingAmount, loan.interestRate, loan.emiAmount, loan.nextDueDate, loan.status, loan.createdAt, loan.shareCode ?? null, loan.participants ? JSON.stringify(loan.participants) : null]
  );
};

const rowToLoan = (row: any): Loan => ({
  id: row.id,
  title: row.title,
  bank: row.bank ?? '',
  loanType: row.loan_type,
  paymentType: row.payment_type ?? 'monthly',
  totalAmount: row.total_amount,
  outstandingAmount: row.outstanding_amount,
  interestRate: row.interest_rate,
  emiAmount: row.emi_amount,
  nextDueDate: row.next_due_date,
  status: row.status,
  createdAt: row.created_at,
  shareCode: row.share_code ?? undefined,
  participants: row.participants ? JSON.parse(row.participants) : undefined,
});

export const markLoanPendingSync = async (id: string): Promise<void> => {
  const db = await getDatabase();
  await db.runAsync('UPDATE loans SET pending_sync = 1 WHERE id = ?', [id]);
};

export const clearLoanPendingSync = async (id: string): Promise<void> => {
  const db = await getDatabase();
  await db.runAsync('UPDATE loans SET pending_sync = 0 WHERE id = ?', [id]);
};

export const getPendingSyncLoans = async (): Promise<Loan[]> => {
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>(
    'SELECT * FROM loans WHERE pending_sync = 1 AND share_code IS NOT NULL'
  );
  return rows.map(rowToLoan);
};

// --- BUDGET GOALS ---
export const insertBudgetGoal = async (goal: BudgetGoal): Promise<void> => {
  const db = await getDatabase();
  await db.runAsync(
    'INSERT INTO budget_goals (id, category, limit_amount, period, created_at) VALUES (?, ?, ?, ?, ?)',
    [goal.id, goal.category, goal.limitAmount, goal.period, goal.createdAt]
  );
};

export const deleteBudgetGoal = async (id: string): Promise<void> => {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM budget_goals WHERE id = ?', [id]);
};

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

// --- SAVINGS GOALS ---
const rowToSavingsGoal = (row: any): SavingsGoal => ({
  id: row.id,
  name: row.name,
  targetAmount: row.target_amount,
  currentAmount: row.current_amount,
  color: row.color,
  icon: row.icon,
  createdAt: row.created_at,
});

export const getSavingsGoals = async (): Promise<SavingsGoal[]> => {
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>('SELECT * FROM savings_goals ORDER BY created_at DESC');
  return rows.map(rowToSavingsGoal);
};

export const insertSavingsGoal = async (goal: SavingsGoal): Promise<void> => {
  const db = await getDatabase();
  await db.runAsync(
    'INSERT INTO savings_goals (id, name, target_amount, current_amount, color, icon, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [goal.id, goal.name, goal.targetAmount, goal.currentAmount, goal.color, goal.icon, goal.createdAt]
  );
};

export const updateSavingsAmount = async (id: string, delta: number): Promise<void> => {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE savings_goals SET current_amount = MAX(0, current_amount + ?) WHERE id = ?',
    [delta, id]
  );
};

export const deleteSavingsGoal = async (id: string): Promise<void> => {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM savings_goals WHERE id = ?', [id]);
};

// --- SAVINGS ACTIVITY ---
export const getSavingsActivity = async (limit = 50): Promise<SavingsActivity[]> => {
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>(
    'SELECT * FROM savings_activity ORDER BY created_at DESC LIMIT ?', [limit]
  );
  return rows.map((r) => ({
    id: r.id,
    goalId: r.goal_id,
    goalName: r.goal_name,
    type: r.type,
    amount: r.amount,
    createdAt: r.created_at,
  }));
};

export const insertSavingsActivity = async (a: SavingsActivity): Promise<void> => {
  const db = await getDatabase();
  await db.runAsync(
    'INSERT INTO savings_activity (id, goal_id, goal_name, type, amount, created_at) VALUES (?,?,?,?,?,?)',
    [a.id, a.goalId, a.goalName, a.type, a.amount, a.createdAt]
  );
};

// --- DATA MANAGEMENT ---
export const deleteAllData = async (): Promise<void> => {
  const db = await getDatabase();
  await db.execAsync('DELETE FROM transactions; DELETE FROM cards; DELETE FROM loans; DELETE FROM budget_goals; DELETE FROM savings_goals; DELETE FROM savings_activity;');
};

export const importAllData = async (data: {
  user?: Partial<User>;
  transactions?: Transaction[];
  cards?: Card[];
  loans?: Loan[];
  budgetGoals?: BudgetGoal[];
  savingsGoals?: SavingsGoal[];
  savingsActivity?: SavingsActivity[];
}): Promise<void> => {
  const db = await getDatabase();
  await db.execAsync('DELETE FROM transactions; DELETE FROM cards; DELETE FROM loans; DELETE FROM budget_goals; DELETE FROM savings_goals; DELETE FROM savings_activity;');

  // Restore user profile (name, avatar, budget — but not premium status for security)
  if (data.user) {
    const u = data.user;
    await db.runAsync(
      `UPDATE users SET name = ?, avatar_color = ?, avatar_style = ?, monthly_budget = ? WHERE id = 'user_1'`,
      [u.name ?? '', u.avatarColor ?? '#E97B3B', u.avatarStyle ?? null, u.monthlyBudget ?? 10000]
    );
  }

  for (const t of data.transactions ?? []) {
    await db.runAsync(
      'INSERT OR REPLACE INTO transactions (id, type, amount, category, description, date, card_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [t.id, t.type, t.amount, t.category, t.description, t.date, t.cardId ?? null, t.createdAt]
    );
  }
  for (const c of data.cards ?? []) {
    await db.runAsync(
      'INSERT OR REPLACE INTO cards (id, name, bank, type, last_four, expiry, card_holder, limit_amount, balance, color_start, color_end, network, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [c.id, c.name, c.bank, c.type, c.lastFour, c.expiry, c.cardHolder, c.limitAmount, c.balance, c.colorStart, c.colorEnd, c.network, c.createdAt]
    );
  }
  for (const l of data.loans ?? []) {
    await db.runAsync(
      'INSERT OR REPLACE INTO loans (id, title, bank, loan_type, payment_type, total_amount, outstanding_amount, interest_rate, emi_amount, next_due_date, status, created_at, share_code, participants) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [l.id, l.title, l.bank, l.loanType, l.paymentType, l.totalAmount, l.outstandingAmount, l.interestRate, l.emiAmount, l.nextDueDate, l.status, l.createdAt, l.shareCode ?? null, l.participants ? JSON.stringify(l.participants) : null]
    );
  }
  for (const g of data.budgetGoals ?? []) {
    await db.runAsync(
      'INSERT OR REPLACE INTO budget_goals (id, category, limit_amount, period, created_at) VALUES (?, ?, ?, ?, ?)',
      [g.id, g.category, g.limitAmount, g.period, g.createdAt]
    );
  }
  for (const s of data.savingsGoals ?? []) {
    await db.runAsync(
      'INSERT OR REPLACE INTO savings_goals (id, name, target_amount, current_amount, color, icon, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [s.id, s.name, s.targetAmount, s.currentAmount, s.color, s.icon, s.createdAt]
    );
  }
  for (const a of data.savingsActivity ?? []) {
    await db.runAsync(
      'INSERT OR REPLACE INTO savings_activity (id, goal_id, goal_name, type, amount, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [a.id, a.goalId, a.goalName, a.type, a.amount, a.createdAt]
    );
  }
};

export const exportAllData = async (): Promise<{
  user: Partial<User> | null;
  transactions: Transaction[];
  cards: Card[];
  loans: Loan[];
  budgetGoals: BudgetGoal[];
  savingsGoals: SavingsGoal[];
  savingsActivity: SavingsActivity[];
  exportedAt: string;
}> => {
  const db = await getDatabase();
  const userRow = await db.getFirstAsync<any>('SELECT * FROM users LIMIT 1');
  const txRows = await db.getAllAsync<any>('SELECT * FROM transactions ORDER BY date DESC');
  const cardRows = await db.getAllAsync<any>('SELECT * FROM cards ORDER BY created_at DESC');
  const loanRows = await db.getAllAsync<any>('SELECT * FROM loans ORDER BY created_at DESC');
  const goalRows = await db.getAllAsync<any>('SELECT * FROM budget_goals ORDER BY created_at DESC');
  const savingsRows = await db.getAllAsync<any>('SELECT * FROM savings_goals ORDER BY created_at DESC');
  const activityRows = await db.getAllAsync<any>('SELECT * FROM savings_activity ORDER BY created_at DESC');
  return {
    user: userRow ? {
      name: userRow.name,
      avatarColor: userRow.avatar_color,
      avatarStyle: userRow.avatar_style ?? undefined,
      currency: userRow.currency,
      monthlyBudget: userRow.monthly_budget,
    } : null,
    transactions: txRows.map(rowToTransaction),
    cards: cardRows.map(rowToCard),
    loans: loanRows.map(rowToLoan),
    budgetGoals: goalRows.map((row: any) => ({
      id: row.id,
      category: row.category,
      limitAmount: row.limit_amount,
      period: row.period,
      createdAt: row.created_at,
    })),
    savingsGoals: savingsRows.map(rowToSavingsGoal),
    savingsActivity: activityRows.map((r: any) => ({
      id: r.id,
      goalId: r.goal_id,
      goalName: r.goal_name,
      type: r.type,
      amount: r.amount,
      createdAt: r.created_at,
    })),
    exportedAt: new Date().toISOString(),
  };
};
