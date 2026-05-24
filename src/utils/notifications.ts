import { Loan, Transaction } from '../types';
import { CATEGORY_MAP, ALLOC_NAMES } from '../constants/Budget';
import { showToast } from '../store/toastStore';

// Lazy-load expo-notifications so the app degrades gracefully in Expo Go
// (Android Expo Go SDK 53+ blocks the module at import time)
const getNotifications = () => {
  try {
    return require('expo-notifications') as typeof import('expo-notifications');
  } catch {
    return null;
  }
};

export const requestNotificationPermission = async (): Promise<boolean> => {
  const N = getNotifications();
  if (!N) return false;
  const { status: existing } = await N.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await N.requestPermissionsAsync();
  return status === 'granted';
};

function getEffectiveDueDate(loan: Loan): Date {
  const stored = new Date(loan.nextDueDate);
  if (loan.paymentType === 'one-time') return stored;
  const day = stored.getDate();
  const today = new Date();
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), day);
  if (thisMonth > today) return thisMonth;
  return new Date(today.getFullYear(), today.getMonth() + 1, day);
}

export const scheduleLoanNotification = async (loan: Loan, daysBefore: number): Promise<void> => {
  const N = getNotifications();
  if (!N || loan.status !== 'active') return;

  const dueDate = getEffectiveDueDate(loan);
  const trigger = new Date(dueDate);
  trigger.setDate(trigger.getDate() - daysBefore);
  trigger.setHours(9, 0, 0, 0);
  if (trigger <= new Date()) return;

  try {
    await N.scheduleNotificationAsync({
      identifier: `loan_due_${loan.id}`,
      content: {
        title: 'Loan Payment Due',
        body: `${loan.title}${loan.bank ? ` (${loan.bank})` : ''} — ₱${loan.emiAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })} due in ${daysBefore} day${daysBefore !== 1 ? 's' : ''}`,
        data: { loanId: loan.id },
      },
      trigger: { type: N.SchedulableTriggerInputTypes.DATE, date: trigger },
    });
  } catch {}
};

export const cancelLoanNotification = async (loanId: string): Promise<void> => {
  const N = getNotifications();
  if (!N) return;
  await N.cancelScheduledNotificationAsync(`loan_due_${loanId}`).catch(() => {});
};

export const scheduleAllLoanNotifications = async (loans: Loan[], daysBefore: number): Promise<void> => {
  await Promise.all(loans.filter((l) => l.status === 'active').map((l) => scheduleLoanNotification(l, daysBefore)));
};

export const cancelAllLoanNotifications = async (loans: Loan[]): Promise<void> => {
  await Promise.all(loans.map((l) => cancelLoanNotification(l.id)));
};

export const checkAndNotifyOverBudget = async (
  savedTx: Transaction,
  allTransactions: Transaction[],
  budgetAllocations: Record<string, number>,
  monthlyBudget: number,
): Promise<void> => {
  if (savedTx.type !== 'expense' || monthlyBudget <= 0) return;

  const now = new Date();
  const monthTxns = allTransactions.filter((t) => {
    if (t.type !== 'expense') return false;
    const d = new Date(t.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  for (const [allocId, cats] of Object.entries(CATEGORY_MAP)) {
    if (!cats.includes(savedTx.category)) continue;
    const pct = budgetAllocations[allocId] ?? 0;
    const allocated = (pct / 100) * monthlyBudget;
    if (allocated <= 0) continue;
    const spent = monthTxns
      .filter((t) => cats.includes(t.category))
      .reduce((s, t) => s + t.amount, 0);
    if (spent > allocated) {
      const categoryName = ALLOC_NAMES[allocId] ?? allocId;
      const spentFmt    = `₱${spent.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
      const allocFmt    = `₱${allocated.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;

      // In-app toast — always visible even when app is in foreground
      showToast(`Over budget on ${categoryName}!`, {
        subtitle: `${spentFmt} spent of ${allocFmt} allocated`,
        type: 'warning',
        duration: 4500,
      });

      // Push notification — for background / lock-screen visibility
      const N = getNotifications();
      if (N) {
        try {
          await N.scheduleNotificationAsync({
            content: {
              title: '⚠️ Over Budget!',
              body: `${categoryName}: ${spentFmt} spent of ${allocFmt} allocated.`,
            },
            trigger: null,
          });
        } catch {}
      }
    }
    continue;
  }
};

export const setupNotificationHandler = (): void => {
  const N = getNotifications();
  if (!N) return;
  try {
    N.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch {}
};
