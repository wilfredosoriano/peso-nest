import React, { useMemo, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, ImageBackground,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const HEADER_BG = require('../../assets/images/backgrounds/dashboard-header-bg.webp');
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAppStore } from '../../src/store';
import { TransactionItem } from '../../src/components/ui/TransactionItem';
import { AddTransactionModal } from '../../src/components/ui/AddTransactionModal';
import { Colors } from '../../src/constants/Colors';
import { formatCurrency } from '../../src/utils/formatters';
import { UserAvatar } from '../../src/components/ui/UserAvatar';
import { rs } from '../../src/utils/responsive';
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// 0 = Sunday … 6 = Saturday
const DAILY_MESSAGES = [
  "Rest up and review your\nweekly spending today! 🌿",       // Sunday
  "New week, fresh start.\nLet's crush those money goals! 💪", // Monday
  "Stay consistent — small\nsavings add up fast! 🐷",          // Tuesday
  "Halfway there! Check if\nyou're on budget today. 📊",       // Wednesday
  "Almost Friday! Avoid\nimpulse buys and stay strong. 🎯",    // Thursday
  "It's payday energy —\nbudget first, treat after! 🎉",       // Friday
  "Weekend mode on!\nSpend wisely and enjoy. ☀️",              // Saturday
];

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const user = useAppStore((s) => s.user);
  const transactions = useAppStore((s) => s.transactions);
  const cards = useAppStore((s) => s.cards);
  const loans = useAppStore((s) => s.loans);
  const hideBalance = useAppStore((s) => s.hideBalance);
  const toggleHideBalance = useAppStore((s) => s.toggleHideBalance);
  const [showAdd, setShowAdd] = useState(false);

  const now = new Date();
  const [selYear, setSelYear] = useState(now.getFullYear());
  const [selMonth, setSelMonth] = useState(now.getMonth());

  const isCurrentMonth = selYear === now.getFullYear() && selMonth === now.getMonth();
  const monthLabel = `${MONTHS[selMonth]} ${selYear}`;

  const goPrev = () => {
    if (selMonth === 0) { setSelYear((y) => y - 1); setSelMonth(11); }
    else setSelMonth((m) => m - 1);
  };
  const goNext = () => {
    if (isCurrentMonth) return;
    if (selMonth === 11) { setSelYear((y) => y + 1); setSelMonth(0); }
    else setSelMonth((m) => m + 1);
  };

  const monthTxns = useMemo(() =>
    transactions.filter((t) => {
      const d = new Date(t.date);
      return d.getMonth() === selMonth && d.getFullYear() === selYear;
    }), [transactions, selMonth, selYear]);

  const totalIncome = useMemo(() => monthTxns.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0), [monthTxns]);
  const totalExpense = useMemo(() => monthTxns.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0), [monthTxns]);
  const cardNetBalance = cards.reduce((s, c) => c.type === 'debit' ? s + c.balance : s - c.balance, 0);
  // Net worth = what you actually have (savings + card balances).
  // Loans are shown separately on the Loans screen — not deducted here
  // so users who carry debt still see a meaningful positive figure.
  const netWorth = cardNetBalance;
  const budgetUsedPct = user ? Math.min((totalExpense / user.monthlyBudget) * 100, 100) : 0;
  const recentTxns = useMemo(() => monthTxns.slice(0, 5), [monthTxns]);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 90 + insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <ImageBackground
          source={HEADER_BG}
          resizeMode="cover"
          style={[styles.headerGradient, { paddingTop: insets.top + 16 }]}
        >
          {/* subtle dark scrim so white text stays readable */}
          <LinearGradient
            colors={['rgba(0,0,0,0.18)', 'rgba(0,0,0,0.08)']}
            style={StyleSheet.absoluteFill}
          />

          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>Hi, {user?.name ?? 'there'}!</Text>
              <Text style={styles.greetingSub}>{DAILY_MESSAGES[now.getDay()]}</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/profile')} style={styles.avatarBtn}>
              <UserAvatar avatarStyle={user?.avatarStyle} name={user?.name} size={44} />
            </TouchableOpacity>
          </View>
        </ImageBackground>

        <View style={styles.body}>
          {/* Balance card — floats over the bottom edge of the header image */}
          <View style={styles.balanceCard}>
            <View style={styles.balanceRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.balanceLabel}>Net Worth</Text>
                {netWorth < 0 && !hideBalance && (
                  <View style={styles.negBadge}>
                    <Ionicons name="warning" size={rs(10)} color={Colors.expense} />
                    <Text style={styles.negBadgeText}>Credit exceeds funds</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity onPress={toggleHideBalance}>
                <Ionicons name={hideBalance ? 'eye-off-outline' : 'eye-outline'} size={rs(18)} color={Colors.textMedium} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.balanceAmount, !hideBalance && netWorth < 0 && { color: Colors.expense }]}>
              {hideBalance ? '₱ ••••••' : formatCurrency(netWorth)}
            </Text>
            <View style={styles.incExpRow}>
              <View style={styles.incExpItem}>
                <View style={[styles.incExpIcon, { backgroundColor: Colors.incomeLight }]}>
                  <Ionicons name="arrow-down-circle" size={rs(20)} color={Colors.income} />
                </View>
                <View>
                  <Text style={styles.incExpLabel}>Income</Text>
                  <Text style={[styles.incExpAmount, { color: Colors.income }]}>
                    {hideBalance ? '₱ ••••' : formatCurrency(totalIncome)}
                  </Text>
                </View>
              </View>
              <View style={styles.divider} />
              <View style={styles.incExpItem}>
                <View style={[styles.incExpIcon, { backgroundColor: Colors.expenseLight }]}>
                  <Ionicons name="arrow-up-circle" size={rs(20)} color={Colors.expense} />
                </View>
                <View>
                  <Text style={styles.incExpLabel}>Expense</Text>
                  <Text style={[styles.incExpAmount, { color: Colors.expense }]}>
                    {hideBalance ? '₱ ••••' : formatCurrency(totalExpense)}
                  </Text>
                </View>
              </View>
            </View>
          </View>
          {/* Budget Overview */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Budget Overview</Text>
              <View style={styles.monthNav}>
                <TouchableOpacity onPress={goPrev} style={styles.monthArrow}>
                  <Ionicons name="chevron-back" size={rs(14)} color={Colors.primary} />
                </TouchableOpacity>
                <Text style={styles.monthLabel}>{monthLabel}</Text>
                <TouchableOpacity onPress={goNext} style={[styles.monthArrow, isCurrentMonth && { opacity: 0.3 }]}>
                  <Ionicons name="chevron-forward" size={rs(14)} color={isCurrentMonth ? Colors.border : Colors.primary} />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.budgetCard}>
              <View style={styles.budgetRingWrap}>
                <View style={styles.budgetOuter}>
                  <View style={styles.budgetInner}>
                    <Text style={styles.budgetPct}>{Math.round(budgetUsedPct)}%</Text>
                    <Text style={styles.budgetPctSub}>of budget used</Text>
                  </View>
                </View>
              </View>
              <View style={styles.budgetDetails}>
                <View style={styles.budgetRow}>
                  <Text style={styles.budgetRowLabel}>Spent</Text>
                  <Text style={styles.budgetRowValue}>{formatCurrency(totalExpense)}</Text>
                </View>
                <View style={[styles.budgetRow, { marginTop: 8 }]}>
                  <Text style={styles.budgetRowLabel}>Budget</Text>
                  <Text style={styles.budgetRowValue}>{formatCurrency(user?.monthlyBudget ?? 10000)}</Text>
                </View>
                <View style={styles.budgetProgressTrack}>
                  <View style={[styles.budgetProgressBar, { width: `${budgetUsedPct}%` }]} />
                </View>
              </View>
            </View>
          </View>

          {/* Recent Transactions */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Transactions</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/transactions')}>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>
            {recentTxns.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="receipt-outline" size={rs(40)} color={Colors.textLight} />
                <Text style={styles.emptyText}>No transactions yet</Text>
              </View>
            ) : (
              recentTxns.map((tx) => (
                <TransactionItem key={tx.id} transaction={tx} hideBalance={hideBalance} />
              ))
            )}
          </View>
        </View>
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={[styles.fab, { bottom: 76 + insets.bottom }]} onPress={() => setShowAdd(true)}>
        <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.fabGradient}>
          <Ionicons name="add" size={rs(28)} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>

      <AddTransactionModal visible={showAdd} onClose={() => setShowAdd(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerGradient: {
    paddingHorizontal: 20,
    paddingBottom: 80,
    minHeight: 300,
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  greeting: {
    fontSize: rs(22),
    fontFamily: 'Cause-ExtraBold',
    color: '#fff',
  },
  greetingSub: {
    fontSize: rs(13),
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
    lineHeight: 18,
  },
  avatarBtn: {
    borderRadius: 26,
    borderWidth: 2.5,
    borderColor: Colors.primary,
    padding: 2,
    backgroundColor: Colors.primary,
  },
  balanceCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: 'rgba(0,0,0,0.12)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 8,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  balanceLabel: {
    fontSize: rs(13),
    color: Colors.textMedium,
    fontFamily: 'Cause-Medium',
  },
  negBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.expenseLight,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  negBadgeText: {
    fontSize: rs(10),
    fontFamily: 'Cause-SemiBold',
    color: Colors.expense,
  },
  balanceAmount: {
    fontSize: rs(32),
    fontFamily: 'Cause-ExtraBold',
    color: Colors.textDark,
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  incExpRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  incExpItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  incExpIcon: {
    width: rs(34),
    height: rs(34),
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  incExpLabel: {
    fontSize: rs(12),
    color: Colors.textLight,
  },
  incExpAmount: {
    fontSize: rs(14),
    fontFamily: 'Cause-Bold',
    marginTop: 1,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border,
    marginHorizontal: 12,
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 0,
    marginTop: -64,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: rs(16),
    fontFamily: 'Cause-Bold',
    color: Colors.textDark,
  },
  monthNav: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  monthArrow: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  monthLabel: { fontSize: rs(12), fontFamily: 'Cause-SemiBold', color: Colors.textMedium, minWidth: 64, textAlign: 'center' },
  seeAll: {
    fontSize: rs(13),
    color: Colors.primary,
    fontFamily: 'Cause-SemiBold',
  },
  budgetCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  budgetRingWrap: {
    width: 110,
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
  },
  budgetOuter: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 12,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  budgetInner: {
    alignItems: 'center',
  },
  budgetPct: {
    fontSize: rs(22),
    fontFamily: 'Cause-ExtraBold',
    color: Colors.textDark,
  },
  budgetPctSub: {
    fontSize: rs(9),
    color: Colors.textLight,
    textAlign: 'center',
  },
  budgetDetails: {
    flex: 1,
  },
  budgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  budgetRowLabel: {
    fontSize: rs(13),
    color: Colors.textLight,
  },
  budgetRowValue: {
    fontSize: rs(13),
    fontFamily: 'Cause-Bold',
    color: Colors.textDark,
  },
  budgetProgressTrack: {
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 4,
    marginTop: 14,
    overflow: 'hidden',
  },
  budgetProgressBar: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    color: Colors.textLight,
    marginTop: 8,
    fontSize: rs(14),
  },
  fab: {
    position: 'absolute',
    right: 24,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  fabGradient: {
    width: rs(56),
    height: rs(56),
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
