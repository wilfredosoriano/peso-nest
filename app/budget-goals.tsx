import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAppStore } from '../src/store';
import { Colors } from '../src/constants/Colors';
import { getCategoryById } from '../src/constants/Categories';
import { formatCurrency } from '../src/utils/formatters';

export default function BudgetGoalsScreen() {
  const insets = useSafeAreaInsets();
  const budgetGoals = useAppStore((s) => s.budgetGoals);
  const transactions = useAppStore((s) => s.transactions);

  const now = new Date();
  const thisMonthExpenses = useMemo(() =>
    transactions.filter((t) => {
      const d = new Date(t.date);
      return t.type === 'expense' && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }), [transactions]);

  const goalsWithSpending = useMemo(() =>
    budgetGoals.map((goal) => {
      const spent = thisMonthExpenses
        .filter((t) => t.category === goal.category)
        .reduce((s, t) => s + t.amount, 0);
      const pct = goal.limitAmount > 0 ? Math.min((spent / goal.limitAmount) * 100, 100) : 0;
      return { ...goal, spent, pct };
    }), [budgetGoals, thisMonthExpenses]);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.textDark} />
        </TouchableOpacity>
        <Text style={styles.title}>Budget Goals</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {goalsWithSpending.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="flag-outline" size={56} color={Colors.textLight} />
            <Text style={styles.emptyTitle}>No budget goals yet</Text>
            <Text style={styles.emptySubtitle}>Set spending limits for categories to track your budget.</Text>
          </View>
        ) : (
          goalsWithSpending.map((goal) => {
            const cat = getCategoryById(goal.category);
            const isOver = goal.pct >= 100;
            return (
              <View key={goal.id} style={styles.goalCard}>
                <View style={styles.goalHeader}>
                  <View style={[styles.goalIcon, { backgroundColor: cat.color + '20' }]}>
                    <Ionicons name={cat.icon as any} size={18} color={cat.color} />
                  </View>
                  <View style={styles.goalInfo}>
                    <Text style={styles.goalName}>{cat.name}</Text>
                    <Text style={styles.goalPeriod}>{goal.period.charAt(0).toUpperCase() + goal.period.slice(1)} limit</Text>
                  </View>
                  <View>
                    <Text style={[styles.goalSpent, { color: isOver ? Colors.expense : Colors.textDark }]}>
                      {formatCurrency(goal.spent)}
                    </Text>
                    <Text style={styles.goalLimit}>of {formatCurrency(goal.limitAmount)}</Text>
                  </View>
                </View>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressBar, { width: `${goal.pct}%`, backgroundColor: isOver ? Colors.expense : cat.color }]} />
                </View>
                <Text style={[styles.pctText, { color: isOver ? Colors.expense : Colors.textLight }]}>
                  {Math.round(goal.pct)}% {isOver ? '— Over budget!' : 'used'}
                </Text>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDF1E7' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 12, gap: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', shadowColor: 'rgba(0,0,0,0.06)', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 1, shadowRadius: 4, elevation: 2 },
  title: { flex: 1, fontSize: 22, fontWeight: '800', color: '#1A0E00' },
  emptyState: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 20 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#8B6F47', marginTop: 12 },
  emptySubtitle: { fontSize: 13, color: '#C4A882', marginTop: 6, textAlign: 'center', lineHeight: 18 },
  goalCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: 'rgba(233,123,59,0.08)', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 6, elevation: 2 },
  goalHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  goalIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  goalInfo: { flex: 1 },
  goalName: { fontSize: 14, fontWeight: '700', color: '#1A0E00' },
  goalPeriod: { fontSize: 11, color: '#C4A882', marginTop: 1 },
  goalSpent: { fontSize: 16, fontWeight: '800', textAlign: 'right' },
  goalLimit: { fontSize: 11, color: '#C4A882', textAlign: 'right' },
  progressTrack: { height: 8, backgroundColor: '#F0DCC8', borderRadius: 4, overflow: 'hidden', marginBottom: 4 },
  progressBar: { height: '100%', borderRadius: 4 },
  pctText: { fontSize: 11, textAlign: 'right' },
});
