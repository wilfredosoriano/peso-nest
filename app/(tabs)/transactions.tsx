import React, { useMemo, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../../src/store';
import { TransactionItem } from '../../src/components/ui/TransactionItem';
import { AddTransactionModal } from '../../src/components/ui/AddTransactionModal';
import { Colors } from '../../src/constants/Colors';
import { groupTransactionsByDate } from '../../src/utils/formatters';
import { TransactionType } from '../../src/types';
import { rs } from '../../src/utils/responsive';

type Filter = 'all' | TransactionType;

export default function TransactionsScreen() {
  const insets = useSafeAreaInsets();
  const transactions = useAppStore((s) => s.transactions);
  const removeTransaction = useAppStore((s) => s.removeTransaction);
  const hideBalance = useAppStore((s) => s.hideBalance);
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  const filtered = useMemo(() => {
    let list = transactions;
    if (filter !== 'all') list = list.filter((t) => t.type === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((t) => t.description.toLowerCase().includes(q) || t.category.includes(q));
    }
    return list;
  }, [transactions, filter, search]);

  const grouped = useMemo(() => groupTransactionsByDate(filtered), [filtered]);

  const handleLongPress = (id: string) => {
    Alert.alert('Delete Transaction', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => removeTransaction(id) },
    ]);
  };

  return (
    <View style={[styles.container]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.title}>Transactions</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[styles.iconBtn, showSearch && styles.iconBtnActive]}
            onPress={() => { setShowSearch((v) => !v); if (showSearch) setSearch(''); }}
          >
            <Ionicons name={showSearch ? 'close' : 'search-outline'} size={rs(22)} color={showSearch ? '#fff' : Colors.textDark} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search bar */}
      {showSearch && (
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={rs(16)} color={Colors.textLight} />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search transactions…"
            placeholderTextColor={Colors.textLight}
            autoFocus
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={rs(16)} color={Colors.textLight} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {(['all', 'income', 'expense'] as Filter[]).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, filter === f && styles.filterTabActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterTabText, filter === f && styles.filterTabTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 90 + insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        {grouped.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={rs(56)} color={Colors.textLight} />
            <Text style={styles.emptyTitle}>No transactions found</Text>
            <Text style={styles.emptySubtitle}>Tap + to add your first transaction</Text>
          </View>
        ) : (
          grouped.map((group) => (
            <View key={group.date} style={styles.group}>
              <Text style={styles.groupLabel}>{group.label}</Text>
              {group.items.map((tx) => (
                <TransactionItem
                  key={tx.id}
                  transaction={tx}
                  onLongPress={() => handleLongPress(tx.id)}
                  hideBalance={hideBalance}
                />
              ))}
            </View>
          ))
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { bottom: 76 + insets.bottom }]}
        onPress={() => setShowAdd(true)}
      >
        <View style={styles.fabInner}>
          <Ionicons name="add" size={rs(28)} color="#fff" />
        </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  title: {
    fontSize: rs(24),
    fontFamily: 'Cause-ExtraBold',
    color: Colors.textDark,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  iconBtn: {
    width: rs(38),
    height: rs(38),
    borderRadius: 12,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  iconBtnActive: {
    backgroundColor: Colors.primary,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: Colors.card,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: rs(14),
    color: Colors.textDark,
  },
  filterRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  filterTabText: {
    fontSize: rs(13),
    fontFamily: 'Cause-SemiBold',
    color: Colors.textMedium,
  },
  filterTabTextActive: {
    color: '#fff',
  },
  group: {
    marginBottom: 8,
  },
  groupLabel: {
    fontSize: rs(13),
    fontFamily: 'Cause-Bold',
    color: Colors.textMedium,
    marginBottom: 8,
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: rs(16),
    fontFamily: 'Cause-Bold',
    color: Colors.textMedium,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: rs(13),
    color: Colors.textLight,
    marginTop: 4,
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
  fabInner: {
    width: rs(56),
    height: rs(56),
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
