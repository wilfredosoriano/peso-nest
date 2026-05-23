export type CategoryType = 'income' | 'expense';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: CategoryType | 'both';
}

export const CATEGORIES: Category[] = [
  { id: 'salary', name: 'Salary', icon: 'briefcase', color: '#4CAF50', type: 'income' },
  { id: 'freelance', name: 'Freelance', icon: 'laptop', color: '#2196F3', type: 'income' },
  { id: 'investment', name: 'Investment', icon: 'trending-up', color: '#9C27B0', type: 'income' },
  { id: 'transfer_in', name: 'Transfer In', icon: 'arrow-down-circle', color: '#00BCD4', type: 'income' },
  { id: 'food_dining', name: 'Food & Dining', icon: 'restaurant', color: '#E97B3B', type: 'expense' },
  { id: 'shopping', name: 'Shopping', icon: 'cart', color: '#E84040', type: 'expense' },
  { id: 'transport', name: 'Transport', icon: 'car', color: '#2196F3', type: 'expense' },
  { id: 'bills', name: 'Bills & Utilities', icon: 'flash', color: '#FF9800', type: 'expense' },
  { id: 'entertainment', name: 'Entertainment', icon: 'game-controller', color: '#9C27B0', type: 'expense' },
  { id: 'health', name: 'Health', icon: 'heart', color: '#E84040', type: 'expense' },
  { id: 'education', name: 'Education', icon: 'book', color: '#3F51B5', type: 'expense' },
  { id: 'groceries', name: 'Groceries', icon: 'basket', color: '#4CAF50', type: 'expense' },
  { id: 'coffee', name: 'Coffee & Cafe', icon: 'cafe', color: '#795548', type: 'expense' },
  { id: 'others', name: 'Others', icon: 'ellipsis-horizontal', color: '#607D8B', type: 'both' },
];

export const getCategoryById = (id: string): Category =>
  CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1];
