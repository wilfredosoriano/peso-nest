import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { rs } from '../../src/utils/responsive';
import { useAppStore } from '../../src/store';
import { DonutChart } from '../../src/components/charts/DonutChart';
import { SpendingTrendChart } from '../../src/components/charts/SpendingTrendChart';
import { Colors } from '../../src/constants/Colors';
import { getCategoryById } from '../../src/constants/Categories';
import { formatCurrency } from '../../src/utils/formatters';
import { SpendingByCategory } from '../../src/types';

const { width } = Dimensions.get('window');
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function ChartsScreen() {
  const insets = useSafeAreaInsets();
  const transactions = useAppStore((s) => s.transactions);

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

  const thisMonthTxns = useMemo(() =>
    transactions.filter((t) => {
      const d = new Date(t.date);
      return d.getMonth() === selMonth && d.getFullYear() === selYear;
    }), [transactions, selMonth, selYear]);

  const expenses = useMemo(() => thisMonthTxns.filter((t) => t.type === 'expense'), [thisMonthTxns]);
  const totalSpent = useMemo(() => expenses.reduce((s, t) => s + t.amount, 0), [expenses]);

  const spendingByCategory = useMemo((): SpendingByCategory[] => {
    const map = new Map<string, number>();
    for (const tx of expenses) {
      map.set(tx.category, (map.get(tx.category) ?? 0) + tx.amount);
    }
    const chartColors = Colors.chartColors;
    let i = 0;
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: totalSpent > 0 ? (amount / totalSpent) * 100 : 0,
        color: getCategoryById(category).color ?? chartColors[i++ % chartColors.length],
      }));
  }, [expenses, totalSpent]);

  // Last 7 days (or last 7 days of selected month) trend data
  const trendData = useMemo(() => {
    const days: { label: string; value: number }[] = [];
    const lastDay = isCurrentMonth
      ? now.getDate()
      : new Date(selYear, selMonth + 1, 0).getDate();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(selYear, selMonth, lastDay - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayTotal = expenses
        .filter((t) => t.date === dateStr)
        .reduce((s, t) => s + t.amount, 0);
      days.push({
        label: d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }).replace(' ', '\n'),
        value: dayTotal,
      });
    }
    return days;
  }, [expenses, selYear, selMonth, isCurrentMonth]);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.title}>Charts</Text>
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={goPrev} style={styles.monthArrow}>
            <Ionicons name="chevron-back" size={rs(16)} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={styles.monthLabel}>{monthLabel}</Text>
          <TouchableOpacity onPress={goNext} style={[styles.monthArrow, isCurrentMonth && styles.monthArrowDisabled]}>
            <Ionicons name="chevron-forward" size={rs(16)} color={isCurrentMonth ? Colors.border : Colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 90 + insets.bottom }} showsVerticalScrollIndicator={false}>
        {/* Spending Breakdown */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Spending Breakdown</Text>
          {spendingByCategory.length === 0 ? (
            <View style={styles.emptyChart}>
              <Ionicons name="pie-chart-outline" size={rs(48)} color={Colors.textLight} />
              <Text style={styles.emptyText}>No expenses this month</Text>
            </View>
          ) : (
            <View style={styles.donutRow}>
              <DonutChart
                data={spendingByCategory}
                totalSpent={totalSpent}
                size={190}
                strokeWidth={30}
              />
              <View style={styles.legend}>
                {spendingByCategory.slice(0, 6).map((item, idx) => {
                  const cat = getCategoryById(item.category);
                  return (
                    <View key={`${item.category}-${idx}`} style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                      <View style={styles.legendInfo}>
                        <Text style={styles.legendName} numberOfLines={1}>{cat.name}</Text>
                        <Text style={styles.legendAmount}>{formatCurrency(item.amount)}</Text>
                        <Text style={styles.legendPct}>({item.percentage.toFixed(0)}%)</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}
        </View>

        {/* Spending Trend */}
        <View style={[styles.card, { marginTop: 16 }]}>
          <Text style={styles.cardTitle}>Spending Trend</Text>
          <Text style={styles.cardSubtitle}>{isCurrentMonth ? 'Last 7 days' : `Last 7 days of ${monthLabel}`}</Text>
          {trendData.every((d) => d.value === 0) ? (
            <View style={styles.emptyChart}>
              <Ionicons name="trending-up-outline" size={rs(48)} color={Colors.textLight} />
              <Text style={styles.emptyText}>No spending data</Text>
            </View>
          ) : (
            <View style={{ marginTop: 12 }}>
              <SpendingTrendChart data={trendData} width={width - 64} height={100} />
            </View>
          )}
        </View>

        {/* Summary stats */}
        <View style={[styles.card, { marginTop: 16 }]}>
          <Text style={styles.cardTitle}>Monthly Summary</Text>
          <View style={styles.statsGrid}>
            {[
              { label: 'Total Spent', value: formatCurrency(totalSpent), icon: 'trending-down', color: Colors.expense },
              { label: 'Total Income', value: formatCurrency(thisMonthTxns.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0)), icon: 'trending-up', color: Colors.income },
              { label: 'Transactions', value: String(thisMonthTxns.length), icon: 'receipt', color: Colors.primary },
              { label: 'Top Category', value: spendingByCategory[0] ? getCategoryById(spendingByCategory[0].category).name : 'N/A', icon: 'star', color: '#F1C40F' },
            ].map((stat) => (
              <View key={stat.label} style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: stat.color + '20' }]}>
                  <Ionicons name={stat.icon as any} size={rs(18)} color={stat.color} />
                </View>
                <Text style={styles.statValue} numberOfLines={1}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDF1E7' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  title: { fontSize: rs(24), fontFamily: 'Cause-ExtraBold', color: '#1A0E00' },
  monthNav: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFF8F1', borderRadius: 10, borderWidth: 1, borderColor: '#F0DCC8', paddingHorizontal: 4, paddingVertical: 2 },
  monthArrow: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  monthArrowDisabled: { opacity: 0.3 },
  monthLabel: { fontSize: rs(13), fontFamily: 'Cause-SemiBold', color: '#8B6F47', minWidth: 72, textAlign: 'center' },
  card: {
    marginHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: 'rgba(233,123,59,0.12)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: { fontSize: rs(16), fontFamily: 'Cause-Bold', color: '#1A0E00', marginBottom: 4 },
  cardSubtitle: { fontSize: rs(12), color: '#C4A882' },
  donutRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 12 },
  legend: { flex: 1, gap: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginTop: 3 },
  legendInfo: { flex: 1 },
  legendName: { fontSize: rs(11), fontFamily: 'Cause-SemiBold', color: '#1A0E00' },
  legendAmount: { fontSize: rs(11), color: '#8B6F47' },
  legendPct: { fontSize: rs(10), color: '#C4A882' },
  emptyChart: { alignItems: 'center', paddingVertical: 32 },
  emptyText: { color: '#C4A882', marginTop: 8, fontSize: rs(13) },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12 },
  statCard: {
    flex: 1,
    minWidth: '44%',
    backgroundColor: '#FFF8F1',
    borderRadius: 14,
    padding: 14,
    alignItems: 'flex-start',
  },
  statIcon: { width: rs(36), height: rs(36), borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  statValue: { fontSize: rs(16), fontFamily: 'Cause-ExtraBold', color: '#1A0E00', marginBottom: 2 },
  statLabel: { fontSize: rs(11), color: '#C4A882' },
});
