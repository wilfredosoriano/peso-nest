import React, { useMemo, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Dimensions, ImageBackground,
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

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const user = useAppStore((s) => s.user);
  const transactions = useAppStore((s) => s.transactions);
  const [showAdd, setShowAdd] = useState(false);
  const [hideBalance, setHideBalance] = useState(false);

  const now = new Date();
  const thisMonth = useMemo(() =>
    transactions.filter((t) => {
      const d = new Date(t.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }), [transactions]);

  const totalIncome = useMemo(() => thisMonth.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0), [thisMonth]);
  const totalExpense = useMemo(() => thisMonth.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0), [thisMonth]);
  const balance = totalIncome - totalExpense;
  const budgetUsedPct = user ? Math.min((totalExpense / user.monthlyBudget) * 100, 100) : 0;
  const recentTxns = useMemo(() => transactions.slice(0, 5), [transactions]);

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
              <Text style={styles.greeting}>Hi, {user?.name ?? 'there'}! 👋</Text>
              <Text style={styles.greetingSub}>Let's have a good day{'\n'}and stick to your budget!</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/profile')} style={styles.avatarBtn}>
              <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.avatar}>
                <Text style={styles.avatarText}>{(user?.name ?? 'H')[0].toUpperCase()}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ImageBackground>

        <View style={styles.body}>
          {/* Balance card — floats over the bottom edge of the header image */}
          <View style={styles.balanceCard}>
            <View style={styles.balanceRow}>
              <Text style={styles.balanceLabel}>Total Balance</Text>
              <TouchableOpacity onPress={() => setHideBalance((v) => !v)}>
                <Ionicons name={hideBalance ? 'eye-off-outline' : 'eye-outline'} size={18} color={Colors.textMedium} />
              </TouchableOpacity>
            </View>
            <Text style={styles.balanceAmount}>
              {hideBalance ? '₱ ••••••' : formatCurrency(balance)}
            </Text>
            <View style={styles.incExpRow}>
              <View style={styles.incExpItem}>
                <View style={[styles.incExpIcon, { backgroundColor: Colors.incomeLight }]}>
                  <Ionicons name="arrow-down" size={14} color={Colors.income} />
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
                  <Ionicons name="arrow-up" size={14} color={Colors.expense} />
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
              <TouchableOpacity>
                <Text style={styles.thisMonth}>This Month ∨</Text>
              </TouchableOpacity>
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
                <Ionicons name="receipt-outline" size={40} color={Colors.textLight} />
                <Text style={styles.emptyText}>No transactions yet</Text>
              </View>
            ) : (
              recentTxns.map((tx) => (
                <TransactionItem key={tx.id} transaction={tx} />
              ))
            )}
          </View>
        </View>
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={[styles.fab, { bottom: 76 + insets.bottom }]} onPress={() => setShowAdd(true)}>
        <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.fabGradient}>
          <Ionicons name="add" size={28} color="#fff" />
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
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
  },
  greetingSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
    lineHeight: 18,
  },
  avatarBtn: {},
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
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
    fontSize: 13,
    color: Colors.textMedium,
    fontWeight: '500',
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: '800',
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
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  incExpLabel: {
    fontSize: 12,
    color: Colors.textLight,
  },
  incExpAmount: {
    fontSize: 14,
    fontWeight: '700',
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
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textDark,
  },
  thisMonth: {
    fontSize: 13,
    color: Colors.textMedium,
    fontWeight: '500',
  },
  seeAll: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '600',
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
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textDark,
  },
  budgetPctSub: {
    fontSize: 9,
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
    fontSize: 13,
    color: Colors.textLight,
  },
  budgetRowValue: {
    fontSize: 13,
    fontWeight: '700',
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
    fontSize: 14,
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
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
