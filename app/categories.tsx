import React, { useMemo, useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal, StatusBar,
  Animated, PanResponder, Dimensions,
} from 'react-native';

const WINDOW_H = Dimensions.get('window').height;
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAppStore } from '../src/store';
import { CATEGORIES } from '../src/constants/Categories';
import { Colors } from '../src/constants/Colors';
import { formatCurrency } from '../src/utils/formatters';
import { rs } from '../src/utils/responsive';
import { TransactionItem } from '../src/components/ui/TransactionItem';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function CategoriesScreen() {
  const insets      = useSafeAreaInsets();
  const transactions = useAppStore((s) => s.transactions);
  const hideBalance  = useAppStore((s) => s.hideBalance);

  const now = new Date();
  const [selYear,  setSelYear]  = useState(now.getFullYear());
  const [selMonth, setSelMonth] = useState(now.getMonth());
  const [selectedCat, setSelectedCat] = useState<string | null>(null);

  const catY = useRef(new Animated.Value(800)).current;
  const catOverlay = catY.interpolate({ inputRange: [0, 400], outputRange: [1, 0], extrapolate: 'clamp' });
  useEffect(() => {
    if (selectedCat) { catY.setValue(800); Animated.spring(catY, { toValue: 0, useNativeDriver: true, damping: 28, stiffness: 220 }).start(); }
  }, [selectedCat]);
  const dismissCat = (dy: number, vy: number) => {
    if (dy > 100 || vy > 1.0) { Animated.timing(catY, { toValue: 800, duration: 220, useNativeDriver: true }).start(() => setSelectedCat(null)); }
    else { Animated.spring(catY, { toValue: 0, useNativeDriver: true }).start(); }
  };
  const catPan = useRef(PanResponder.create({ onStartShouldSetPanResponder: () => true, onPanResponderMove: (_, { dy }) => { if (dy > 0) catY.setValue(dy); }, onPanResponderRelease: (_, { dy, vy }) => dismissCat(dy, vy) })).current;

  const isCurrentMo = selYear === now.getFullYear() && selMonth === now.getMonth();
  const monthLabel  = `${MONTHS[selMonth]} ${selYear}`;

  const goPrev = () => {
    if (selMonth === 0) { setSelYear((y) => y - 1); setSelMonth(11); }
    else setSelMonth((m) => m - 1);
  };
  const goNext = () => {
    if (isCurrentMo) return;
    if (selMonth === 11) { setSelYear((y) => y + 1); setSelMonth(0); }
    else setSelMonth((m) => m + 1);
  };

  const monthTxns = useMemo(() =>
    transactions.filter((t) => {
      const d = new Date(t.date);
      return d.getMonth() === selMonth && d.getFullYear() === selYear;
    }), [transactions, selMonth, selYear]);

  const expenseTxns = useMemo(() => monthTxns.filter((t) => t.type === 'expense'), [monthTxns]);
  const incomeTxns  = useMemo(() => monthTxns.filter((t) => t.type === 'income'),  [monthTxns]);
  const totalExpense = useMemo(() => expenseTxns.reduce((s, t) => s + t.amount, 0), [expenseTxns]);
  const totalIncome  = useMemo(() => incomeTxns.reduce((s, t) => s + t.amount, 0),  [incomeTxns]);

  const expenseCategories = useMemo(() => {
    return CATEGORIES
      .filter((c) => c.type === 'expense' || c.type === 'both')
      .map((cat) => {
        const txns = expenseTxns.filter((t) => t.category === cat.id);
        return { ...cat, total: txns.reduce((s, t) => s + t.amount, 0), count: txns.length };
      })
      .filter((c) => c.count > 0)
      .sort((a, b) => b.total - a.total);
  }, [expenseTxns]);

  const incomeCategories = useMemo(() => {
    return CATEGORIES
      .filter((c) => c.type === 'income' || c.type === 'both')
      .map((cat) => {
        const txns = incomeTxns.filter((t) => t.category === cat.id);
        return { ...cat, total: txns.reduce((s, t) => s + t.amount, 0), count: txns.length };
      })
      .filter((c) => c.count > 0)
      .sort((a, b) => b.total - a.total);
  }, [incomeTxns]);

  const selectedCatData  = selectedCat ? CATEGORIES.find((c) => c.id === selectedCat) : null;
  const selectedCatTxns  = useMemo(() =>
    selectedCat ? monthTxns.filter((t) => t.category === selectedCat) : [],
  [monthTxns, selectedCat]);
  const selectedCatTotal = selectedCatTxns.reduce((s, t) => s + t.amount, 0);

  const renderCatRow = (cat: typeof expenseCategories[0], total: number) => {
    const pct = total > 0 ? Math.min((cat.total / total) * 100, 100) : 0;
    return (
      <TouchableOpacity key={cat.id} style={styles.catRow} onPress={() => setSelectedCat(cat.id)} activeOpacity={0.75}>
        <View style={[styles.catIcon, { backgroundColor: cat.color + '20' }]}>
          <Ionicons name={cat.icon as any} size={rs(20)} color={cat.color} />
        </View>
        <View style={styles.catBody}>
          <View style={styles.catTopRow}>
            <Text style={styles.catName}>{cat.name}</Text>
            <Text style={styles.catAmount}>{hideBalance ? '₱ ••••' : formatCurrency(cat.total)}</Text>
          </View>
          <View style={styles.catMeta}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: cat.color }]} />
            </View>
            <Text style={styles.catCount}>{cat.count} txn{cat.count !== 1 ? 's' : ''}</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={rs(15)} color={Colors.border} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={rs(22)} color={Colors.textDark} />
        </TouchableOpacity>
        <Text style={styles.title}>Categories</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Month nav */}
      <View style={styles.monthNav}>
        <TouchableOpacity onPress={goPrev} style={styles.monthArrow}>
          <Ionicons name="chevron-back" size={rs(18)} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.monthLabel}>{monthLabel}</Text>
        <TouchableOpacity onPress={goNext} style={[styles.monthArrow, isCurrentMo && { opacity: 0.3 }]}>
          <Ionicons name="chevron-forward" size={rs(18)} color={isCurrentMo ? Colors.border : Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Summary row */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Spent</Text>
          <Text style={[styles.summaryAmount, { color: Colors.expense }]}>
            {hideBalance ? '₱ ••••' : formatCurrency(totalExpense)}
          </Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Income</Text>
          <Text style={[styles.summaryAmount, { color: Colors.income }]}>
            {hideBalance ? '₱ ••••' : formatCurrency(totalIncome)}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

        {/* Expense breakdown */}
        {expenseCategories.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Expenses</Text>
            <View style={styles.card}>
              {expenseCategories.map((cat, i) => (
                <View key={cat.id}>
                  {i > 0 && <View style={styles.divider} />}
                  {renderCatRow(cat, totalExpense)}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Income breakdown */}
        {incomeCategories.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Income</Text>
            <View style={styles.card}>
              {incomeCategories.map((cat, i) => (
                <View key={cat.id}>
                  {i > 0 && <View style={styles.divider} />}
                  {renderCatRow(cat, totalIncome)}
                </View>
              ))}
            </View>
          </View>
        )}

        {expenseCategories.length === 0 && incomeCategories.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={rs(48)} color={Colors.textLight} />
            <Text style={styles.emptyText}>No transactions in {monthLabel}</Text>
          </View>
        )}
      </ScrollView>

      {/* Category drill-down modal */}
      <Modal visible={!!selectedCat} animationType="none" transparent statusBarTranslucent onRequestClose={() => setSelectedCat(null)}>
        <StatusBar translucent backgroundColor="transparent" />
        <Animated.View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)', opacity: catOverlay }} pointerEvents="none" />
        <View style={styles.modalWrap}>
          <Animated.View style={{ transform: [{ translateY: catY }] }}>
          <View style={[styles.modalSheet, { maxHeight: WINDOW_H * 0.75, paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.modalHandle} {...catPan.panHandlers}>
            <View style={styles.sheetHandlePill} />
          </View>

          {selectedCatData && (
            <>
              <View style={styles.modalHeader}>
                <View style={[styles.modalCatIcon, { backgroundColor: selectedCatData.color + '20' }]}>
                  <Ionicons name={selectedCatData.icon as any} size={rs(22)} color={selectedCatData.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalCatName}>{selectedCatData.name}</Text>
                  <Text style={styles.modalCatSub}>{selectedCatTxns.length} transaction{selectedCatTxns.length !== 1 ? 's' : ''} · {monthLabel}</Text>
                </View>
                <Text style={[styles.modalCatTotal, { color: selectedCatData.color }]}>
                  {hideBalance ? '₱ ••••' : formatCurrency(selectedCatTotal)}
                </Text>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={{ flexShrink: 1 }}>
                {selectedCatTxns.map((tx) => (
                  <TransactionItem key={tx.id} transaction={tx} hideBalance={hideBalance} />
                ))}
              </ScrollView>
            </>
          )}
          </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDF1E7' },

  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 12, gap: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: 'rgba(0,0,0,0.06)', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 1, shadowRadius: 4, elevation: 2 },
  title: { flex: 1, fontSize: rs(22), fontFamily: 'Cause-ExtraBold', color: '#1A0E00', textAlign: 'center' },

  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingBottom: 12 },
  monthArrow: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  monthLabel: { fontSize: rs(15), fontFamily: 'Cause-ExtraBold', color: Colors.primary, minWidth: 90, textAlign: 'center' },

  summaryRow: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 16, backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: 'rgba(233,123,59,0.08)', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 8, elevation: 2 },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryLabel: { fontSize: rs(11), color: Colors.textLight, fontFamily: 'Cause-Medium', marginBottom: 4 },
  summaryAmount: { fontSize: rs(18), fontFamily: 'Cause-ExtraBold' },
  summaryDivider: { width: 1, backgroundColor: Colors.border, marginHorizontal: 12 },

  section: { marginBottom: 20 },
  sectionLabel: { fontSize: rs(12), fontFamily: 'Cause-Bold', color: '#C4A882', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginLeft: 4 },
  card: { backgroundColor: '#fff', borderRadius: 18, paddingVertical: 4, shadowColor: 'rgba(233,123,59,0.08)', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 8, elevation: 2 },
  divider: { height: 1, backgroundColor: '#F5EDE0', marginHorizontal: 16 },

  catRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  catIcon: { width: rs(40), height: rs(40), borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  catBody: { flex: 1 },
  catTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  catName: { fontSize: rs(14), fontFamily: 'Cause-SemiBold', color: '#1A0E00' },
  catAmount: { fontSize: rs(14), fontFamily: 'Cause-ExtraBold', color: '#1A0E00' },
  catMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressTrack: { flex: 1, height: 4, backgroundColor: '#F0DCC8', borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
  catCount: { fontSize: rs(10), color: Colors.textLight, fontFamily: 'Cause-Medium', flexShrink: 0 },

  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: rs(14), color: Colors.textLight, marginTop: 12, fontFamily: 'Cause-Medium' },

  // Drill-down modal
  modalWrap:       { flex: 1, justifyContent: 'flex-end' },
  modalOverlay:    { backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet:      { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 16, paddingTop: 0 },
  modalHandle:     { width: '100%', alignItems: 'center', paddingTop: 14, paddingBottom: 10 },
  sheetHandlePill: { width: 36, height: 4, backgroundColor: '#D0C0B0', borderRadius: 2 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  modalCatIcon: { width: rs(44), height: rs(44), borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  modalCatName: { fontSize: rs(16), fontFamily: 'Cause-ExtraBold', color: '#1A0E00' },
  modalCatSub: { fontSize: rs(11), color: Colors.textLight, marginTop: 2 },
  modalCatTotal: { fontSize: rs(18), fontFamily: 'Cause-ExtraBold' },
});
