export const formatCurrency = (amount: number): string =>
  `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const formatDate = (dateStr: string): string => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const groupTransactionsByDate = <T extends { date: string }>(items: T[]): { date: string; label: string; items: T[] }[] => {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const existing = map.get(item.date) ?? [];
    map.set(item.date, [...existing, item]);
  }
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  return Array.from(map.entries()).map(([date, items]) => ({
    date,
    label: date === today ? 'Today' : date === yesterday ? 'Yesterday' : formatDate(date),
    items,
  }));
};

export const getCurrentMonthRange = (): { year: number; month: number; label: string } => {
  const now = new Date();
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    label: now.toLocaleDateString('en-PH', { month: 'long', year: 'numeric' }),
  };
};
