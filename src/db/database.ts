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
      bank TEXT DEFAULT '',
      loan_type TEXT NOT NULL,
      payment_type TEXT DEFAULT 'monthly',
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

    CREATE TABLE IF NOT EXISTS savings_goals (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      target_amount REAL NOT NULL,
      current_amount REAL DEFAULT 0,
      color TEXT DEFAULT '#4CAF50',
      icon TEXT DEFAULT 'wallet',
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS savings_activity (
      id TEXT PRIMARY KEY,
      goal_id TEXT NOT NULL,
      goal_name TEXT NOT NULL,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      created_at INTEGER NOT NULL
    );
  `);

  // Migrations — .catch(() => {}) silently skips if the column already exists

  // transactions
  await database.execAsync(`ALTER TABLE transactions ADD COLUMN type TEXT DEFAULT 'expense'`).catch(() => {});
  await database.execAsync(`ALTER TABLE transactions ADD COLUMN amount REAL DEFAULT 0`).catch(() => {});
  await database.execAsync(`ALTER TABLE transactions ADD COLUMN category TEXT DEFAULT ''`).catch(() => {});
  await database.execAsync(`ALTER TABLE transactions ADD COLUMN description TEXT DEFAULT ''`).catch(() => {});
  await database.execAsync(`ALTER TABLE transactions ADD COLUMN date TEXT DEFAULT ''`).catch(() => {});
  await database.execAsync(`ALTER TABLE transactions ADD COLUMN card_id TEXT`).catch(() => {});
  await database.execAsync(`ALTER TABLE transactions ADD COLUMN created_at INTEGER DEFAULT 0`).catch(() => {});

  // cards
  await database.execAsync(`ALTER TABLE cards ADD COLUMN name TEXT DEFAULT ''`).catch(() => {});
  await database.execAsync(`ALTER TABLE cards ADD COLUMN bank TEXT DEFAULT ''`).catch(() => {});
  await database.execAsync(`ALTER TABLE cards ADD COLUMN type TEXT DEFAULT 'debit'`).catch(() => {});
  await database.execAsync(`ALTER TABLE cards ADD COLUMN last_four TEXT DEFAULT ''`).catch(() => {});
  await database.execAsync(`ALTER TABLE cards ADD COLUMN expiry TEXT DEFAULT ''`).catch(() => {});
  await database.execAsync(`ALTER TABLE cards ADD COLUMN card_holder TEXT DEFAULT ''`).catch(() => {});
  await database.execAsync(`ALTER TABLE cards ADD COLUMN limit_amount REAL DEFAULT 0`).catch(() => {});
  await database.execAsync(`ALTER TABLE cards ADD COLUMN balance REAL DEFAULT 0`).catch(() => {});
  await database.execAsync(`ALTER TABLE cards ADD COLUMN color_start TEXT DEFAULT '#E97B3B'`).catch(() => {});
  await database.execAsync(`ALTER TABLE cards ADD COLUMN color_end TEXT DEFAULT '#C9621E'`).catch(() => {});
  await database.execAsync(`ALTER TABLE cards ADD COLUMN network TEXT DEFAULT 'visa'`).catch(() => {});
  await database.execAsync(`ALTER TABLE cards ADD COLUMN created_at INTEGER DEFAULT 0`).catch(() => {});

  // loans
  await database.execAsync(`ALTER TABLE loans ADD COLUMN bank TEXT DEFAULT ''`).catch(() => {});
  await database.execAsync(`ALTER TABLE loans ADD COLUMN payment_type TEXT DEFAULT 'monthly'`).catch(() => {});
  await database.execAsync(`ALTER TABLE loans ADD COLUMN created_at INTEGER DEFAULT 0`).catch(() => {});
  await database.execAsync(`ALTER TABLE loans ADD COLUMN share_code TEXT`).catch(() => {});
  await database.execAsync(`ALTER TABLE loans ADD COLUMN pending_sync INTEGER DEFAULT 0`).catch(() => {});
  await database.execAsync(`ALTER TABLE loans ADD COLUMN participants TEXT`).catch(() => {});

  // budget_goals
  await database.execAsync(`ALTER TABLE budget_goals ADD COLUMN created_at INTEGER DEFAULT 0`).catch(() => {});

  // savings_goals — ensure table exists for users upgrading from older installs
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS savings_goals (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      target_amount REAL NOT NULL,
      current_amount REAL DEFAULT 0,
      color TEXT DEFAULT '#4CAF50',
      icon TEXT DEFAULT 'wallet',
      created_at INTEGER NOT NULL
    )
  `).catch(() => {});
  await database.execAsync(`ALTER TABLE savings_goals ADD COLUMN name TEXT DEFAULT ''`).catch(() => {});
  await database.execAsync(`ALTER TABLE savings_goals ADD COLUMN target_amount REAL DEFAULT 0`).catch(() => {});
  await database.execAsync(`ALTER TABLE savings_goals ADD COLUMN current_amount REAL DEFAULT 0`).catch(() => {});
  await database.execAsync(`ALTER TABLE savings_goals ADD COLUMN color TEXT DEFAULT '#4CAF50'`).catch(() => {});
  await database.execAsync(`ALTER TABLE savings_goals ADD COLUMN icon TEXT DEFAULT 'wallet'`).catch(() => {});
  await database.execAsync(`ALTER TABLE savings_goals ADD COLUMN created_at INTEGER DEFAULT 0`).catch(() => {});

  // savings_activity — safe create for existing installs
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS savings_activity (
      id TEXT PRIMARY KEY,
      goal_id TEXT NOT NULL,
      goal_name TEXT NOT NULL,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      created_at INTEGER NOT NULL
    )
  `).catch(() => {});

  // users
  await database.execAsync(`ALTER TABLE users ADD COLUMN avatar_color TEXT DEFAULT '#E97B3B'`).catch(() => {});
  await database.execAsync(`ALTER TABLE users ADD COLUMN currency TEXT DEFAULT 'PHP'`).catch(() => {});
  await database.execAsync(`ALTER TABLE users ADD COLUMN monthly_budget REAL DEFAULT 10000`).catch(() => {});
  await database.execAsync(`ALTER TABLE users ADD COLUMN is_premium INTEGER DEFAULT 0`).catch(() => {});
  await database.execAsync(`ALTER TABLE users ADD COLUMN created_at INTEGER DEFAULT 0`).catch(() => {});
  await database.execAsync(`ALTER TABLE users ADD COLUMN avatar_style TEXT`).catch(() => {});
  await database.execAsync(`ALTER TABLE users ADD COLUMN notifications_enabled INTEGER DEFAULT 0`).catch(() => {});
  await database.execAsync(`ALTER TABLE users ADD COLUMN notifications_days_before INTEGER DEFAULT 1`).catch(() => {});

  // Version migrations — drop & recreate tables that may have incompatible old schemas
  const versionRow = await database.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const dbVersion = versionRow?.user_version ?? 0;

  if (dbVersion < 3) {
    // Drops tables with potentially stale columns (e.g. walletId NOT NULL from old schema)
    // then recreates them with the current schema. Safe because data was already wiped in v2,
    // and any pre-v2 install hasn't entered real data yet.
    await database.execAsync(`
      DROP TABLE IF EXISTS transactions;
      DROP TABLE IF EXISTS cards;
      DROP TABLE IF EXISTS loans;

      CREATE TABLE transactions (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        amount REAL NOT NULL,
        category TEXT NOT NULL,
        description TEXT NOT NULL,
        date TEXT NOT NULL,
        card_id TEXT,
        created_at INTEGER NOT NULL
      );

      CREATE TABLE cards (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        bank TEXT NOT NULL,
        type TEXT NOT NULL,
        last_four TEXT DEFAULT '',
        expiry TEXT DEFAULT '',
        card_holder TEXT DEFAULT '',
        limit_amount REAL DEFAULT 0,
        balance REAL DEFAULT 0,
        color_start TEXT DEFAULT '#E97B3B',
        color_end TEXT DEFAULT '#C9621E',
        network TEXT DEFAULT 'visa',
        created_at INTEGER NOT NULL
      );

      CREATE TABLE loans (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        bank TEXT DEFAULT '',
        loan_type TEXT NOT NULL,
        payment_type TEXT DEFAULT 'monthly',
        total_amount REAL NOT NULL,
        outstanding_amount REAL NOT NULL,
        interest_rate REAL NOT NULL,
        emi_amount REAL NOT NULL,
        next_due_date TEXT NOT NULL,
        status TEXT DEFAULT 'active',
        created_at INTEGER NOT NULL,
        share_code TEXT
      );
    `);
    await database.execAsync('PRAGMA user_version = 3');
  }

  if (dbVersion < 4) {
    // Recreate savings_goals to fix any devices that got a stale schema
    // (e.g. 'title' column from an earlier version)
    await database.execAsync(`
      DROP TABLE IF EXISTS savings_goals;
      CREATE TABLE savings_goals (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        target_amount REAL NOT NULL,
        current_amount REAL DEFAULT 0,
        color TEXT DEFAULT '#4CAF50',
        icon TEXT DEFAULT 'wallet',
        created_at INTEGER NOT NULL
      );
    `);
    await database.execAsync('PRAGMA user_version = 4');
  }

  // Seed default user if none
  await database.runAsync(
    'INSERT OR IGNORE INTO users (id, name, avatar_color, currency, monthly_budget, is_premium, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    ['user_1', '', '#E97B3B', 'PHP', 10000, 0, Date.now()]
  );
};
