import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Transaction } from '../../types';
import { getCategoryById } from '../../constants/Categories';
import { Colors } from '../../constants/Colors';

interface TransactionItemProps {
  transaction: Transaction;
  onPress?: () => void;
  onLongPress?: () => void;
  hideBalance?: boolean;
}

export const TransactionItem: React.FC<TransactionItemProps> = ({ transaction, onPress, onLongPress, hideBalance }) => {
  const category = getCategoryById(transaction.category);
  const isIncome = transaction.type === 'income';
  const amountColor = isIncome ? Colors.income : Colors.expense;
  const amountPrefix = isIncome ? '+' : '-';

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} onLongPress={onLongPress} activeOpacity={0.7}>
      <View style={[styles.iconWrap, { backgroundColor: category.color + '20' }]}>
        <Ionicons name={category.icon as any} size={20} color={category.color} />
      </View>
      <View style={styles.info}>
        <Text style={styles.description} numberOfLines={1}>{transaction.description}</Text>
        <Text style={styles.date}>{formatDate(transaction.date)}</Text>
      </View>
      <Text style={[styles.amount, { color: amountColor }]}>
        {hideBalance ? '••••••' : `${amountPrefix}₱${transaction.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.card,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  description: {
    fontSize: 14,
    fontFamily: 'Cause-SemiBold',
    color: Colors.textDark,
    marginBottom: 2,
  },
  date: {
    fontSize: 12,
    color: Colors.textLight,
  },
  amount: {
    fontSize: 14,
    fontFamily: 'Cause-Bold',
  },
});
