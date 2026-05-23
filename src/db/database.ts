import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;
let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export const getDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  if (db) return db;
  if (dbPromise) return dbPromise;
  dbPromise = SQLite.openDatabaseAsync('pesonest.db').then(async (opened) => {
    await initializeDatabase(opened);
    db = opened;
    return db;
  });
  return dbPromise;
};

const initializeDatabase = async (database: SQLite.SQLiteDatabase): Promise<void> => {
  await database.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      avatar_color TEXT DEFAULT '#E97B3B',
      currency TEXT DEFAULT 'PHP',
      monthly_budget REAL DEFAULT 10000,
      is_premium INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      date TEXT NOT NULL,
      card_id TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS cards (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      bank TEXT NOT NULL,
      type TEXT NOT NULL,
      last_four TEXT NOT NULL,
      expiry TEXT NOT NULL,
      card_holder TEXT NOT NULL,
      limit_amount REAL DEFAULT 0,
      balance REAL DEFAULT 0,
      color_start TEXT DEFAULT '#E97B3B',
      color_end TEXT DEFAULT '#C9621E',
      network TEXT DEFAULT 'visa',
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS loans (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      loan_type TEXT NOT NULL,
      total_amount REAL NOT NULL,
      outstanding_amount REAL NOT NULL,
      interest_rate REAL NOT NULL,
      emi_amount REAL NOT NULL,
      next_due_date TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS budget_goals (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      limit_amount REAL NOT NULL,
      period TEXT DEFAULT 'monthly',
      created_at INTEGER NOT NULL
    );
  `);

  // Seed default user if none — INSERT OR IGNORE guards against any duplicate attempts
  await database.runAsync(
    'INSERT OR IGNORE INTO users (id, name, avatar_color, currency, monthly_budget, is_premium, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    ['user_1', 'Hana', '#E97B3B', 'PHP', 10000, 0, Date.now()]
  );
  const txCount = await database.getFirstAsync<{ n: number }>('SELECT COUNT(*) as n FROM transactions');
  if (!txCount || txCount.n === 0) {
    await seedSampleData(database);
  }
};

const seedSampleData = async (database: SQLite.SQLiteDatabase): Promise<void> => {
  const today = new Date();
  const fmt = (d: Date) => d.toISOString().split('T')[0];
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  const twoDaysAgo = new Date(today); twoDaysAgo.setDate(today.getDate() - 2);

  const txns = [
    ['tx_1', 'income', 28000, 'salary', 'Salary', fmt(today), null, Date.now() - 7000],
    ['tx_2', 'expense', 125, 'food_dining', 'Lunch', fmt(today), null, Date.now() - 6000],
    ['tx_3', 'expense', 27.5, 'transport', 'Transport', fmt(today), null, Date.now() - 5000],
    ['tx_4', 'expense', 249, 'education', 'Book Store', fmt(yesterday), null, Date.now() - 4000],
    ['tx_5', 'expense', 682, 'groceries', 'Groceries', fmt(yesterday), null, Date.now() - 3000],
    ['tx_6', 'expense', 453, 'shopping', 'Online Shopping', fmt(twoDaysAgo), null, Date.now() - 2000],
    ['tx_7', 'expense', 45, 'coffee', 'Coffee Shop', fmt(twoDaysAgo), null, Date.now() - 1000],
  ];

  for (const tx of txns) {
    await database.runAsync(
      'INSERT OR IGNORE INTO transactions (id, type, amount, category, description, date, card_id, created_at) VALUES (?,?,?,?,?,?,?,?)',
      tx as any
    );
  }

  await database.runAsync(
    'INSERT OR IGNORE INTO cards (id, name, bank, type, last_four, expiry, card_holder, limit_amount, balance, color_start, color_end, network, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',
    ['card_1', 'Sunshine Bank Debit Card', 'Sunshine Bank', 'debit', '5678', '08/27', 'HANA Y.', 50000, 24507.5, '#E97B3B', '#C9621E', 'mastercard', Date.now()]
  );
  await database.runAsync(
    'INSERT OR IGNORE INTO cards (id, name, bank, type, last_four, expiry, card_holder, limit_amount, balance, color_start, color_end, network, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',
    ['card_2', 'Sunshine Bank Credit Card', 'Sunshine Bank', 'credit', '9876', '11/28', 'HANA Y.', 50000, 15605, '#4ECDC4', '#44A8C8', 'visa', Date.now()]
  );

  await database.runAsync(
    'INSERT OR IGNORE INTO loans (id, title, loan_type, total_amount, outstanding_amount, interest_rate, emi_amount, next_due_date, status, created_at) VALUES (?,?,?,?,?,?,?,?,?,?)',
    ['loan_1', 'Personal Loan', 'personal', 60000, 42500, 8.5, 2100, '2025-05-10', 'active', Date.now()]
  );
};
