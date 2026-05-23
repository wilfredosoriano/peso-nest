import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../../src/store';
import { DonutChart } from '../../src/components/charts/DonutChart';
import { SpendingTrendChart } from '../../src/components/charts/SpendingTrendChart';
import { Colors } from '../../src/constants/Colors';
import { getCategoryById } from '../../src/constants/Categories';
import { formatCurrency } from '../../src/utils/formatters';
import { SpendingByCategory } from '../../src/types';

const { width } = Dimensions.get('window');

export default function ChartsScreen() {
  const insets = useSafeAreaInsets();
  const transactions = useAppStore((s) => s.transactions);

  const now = new Date();
  const thisMonthTxns = useMemo(() =>
    transactions.filter((t) => {
      const d = new Date(t.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }), [transactions]);

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

  // Last 7 days trend data
  const trendData = useMemo(() => {
    const days: { label: string; value: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
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
  }, [expenses]);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.title}>Charts</Text>
        <TouchableOpacity style={styles.periodBtn}>
          <Text style={styles.periodText}>This Month</Text>
          <Ionicons name="chevron-down" size={14} color={Colors.textMedium} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 90 + insets.bottom }} showsVerticalScrollIndicator={false}>
        {/* Spending Breakdown */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Spending Breakdown</Text>
          {spendingByCategory.length === 0 ? (
            <View style={styles.emptyChart}>
              <Ionicons name="pie-chart-outline" size={48} color={Colors.textLight} />
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
                {spendingByCategory.slice(0, 6).map((item) => {
                  const cat = getCategoryById(item.category);
                  return (
                    <View key={item.category} style={styles.legendItem}>
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
          <Text style={styles.cardSubtitle}>Last 7 days</Text>
          {trendData.every((d) => d.value === 0) ? (
            <View style={styles.emptyChart}>
              <Ionicons name="trending-up-outline" size={48} color={Colors.textLight} />
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
                  <Ionicons name={stat.icon as any} size={18} color={stat.color} />
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
  title: { fontSize: 24, fontWeight: '800', color: '#1A0E00' },
  periodBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FFF8F1',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F0DCC8',
  },
  periodText: { fontSize: 13, color: '#8B6F47', fontWeight: '500' },
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
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1A0E00', marginBottom: 4 },
  cardSubtitle: { fontSize: 12, color: '#C4A882' },
  donutRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 12 },
  legend: { flex: 1, gap: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginTop: 3 },
  legendInfo: { flex: 1 },
  legendName: { fontSize: 11, fontWeight: '600', color: '#1A0E00' },
  legendAmount: { fontSize: 11, color: '#8B6F47' },
  legendPct: { fontSize: 10, color: '#C4A882' },
  emptyChart: { alignItems: 'center', paddingVertical: 32 },
  emptyText: { color: '#C4A882', marginTop: 8, fontSize: 13 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12 },
  statCard: {
    flex: 1,
    minWidth: '44%',
    backgroundColor: '#FFF8F1',
    borderRadius: 14,
    padding: 14,
    alignItems: 'flex-start',
  },
  statIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  statValue: { fontSize: 16, fontWeight: '800', color: '#1A0E00', marginBottom: 2 },
  statLabel: { fontSize: 11, color: '#C4A882' },
});
