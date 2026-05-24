// Each budget allocation ID matches a transaction category ID exactly (1:1).
export const CATEGORY_MAP: Record<string, string[]> = {
  food_dining:   ['food_dining'],
  groceries:     ['groceries'],
  bills:         ['bills'],
  transport:     ['transport'],
  entertainment: ['entertainment'],
  shopping:      ['shopping'],
  health:        ['health'],
  education:     ['education'],
  coffee:        ['coffee'],
  others:        ['others'],
};

export const ALLOC_NAMES: Record<string, string> = {
  food_dining:   'Food & Dining',
  groceries:     'Groceries',
  bills:         'Bills & Utilities',
  transport:     'Transport',
  entertainment: 'Entertainment',
  shopping:      'Shopping',
  health:        'Health',
  education:     'Education',
  coffee:        'Coffee & Cafe',
  others:        'Others',
};

export const DEFAULT_ALLOC_PCTS: Record<string, number> = {
  food_dining:   18,
  groceries:     15,
  bills:         20,
  transport:     12,
  entertainment:  8,
  shopping:       8,
  health:         7,
  education:      5,
  coffee:         4,
  others:         3,
};
