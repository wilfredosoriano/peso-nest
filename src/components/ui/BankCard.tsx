import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Card } from '../../types';

const CARD_WIDTH = Dimensions.get('window').width - 48;
const CARD_HEIGHT = CARD_WIDTH * 0.56;

interface BankCardProps {
  card: Card;
  hideBalance?: boolean;
}

export const BankCard: React.FC<BankCardProps> = ({ card, hideBalance }) => {
  return (
    <LinearGradient
      colors={[card.colorStart, card.colorEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      {/* Top row: bank name */}
      <View style={styles.topRow}>
        <Text style={styles.bankName}>{card.bank}</Text>
      </View>

      {/* Balance */}
      <View style={styles.balanceWrap}>
        <Text style={styles.balanceLabel}>
          {card.type === 'credit' ? 'Outstanding Balance' : 'Balance'}
        </Text>
        <Text style={styles.balanceValue}>
          {hideBalance ? '₱ ••••••' : `₱${card.balance.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        </Text>
      </View>

      {/* Bottom row: card type + network */}
      <View style={styles.bottomRow}>
        <Text style={styles.cardTypeText}>
          {card.type === 'debit' ? 'Debit Card' : 'Credit Card'}
        </Text>
        <View style={styles.networkBadge}>
          {card.network === 'visa' ? (
            <Text style={styles.visaText}>VISA</Text>
          ) : (
            <View style={styles.mastercard}>
              <View style={[styles.mcCircle, { backgroundColor: '#EB001B', marginRight: -8 }]} />
              <View style={[styles.mcCircle, { backgroundColor: '#F79E1B' }]} />
            </View>
          )}
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 20,
    padding: 20,
    overflow: 'hidden',
    justifyContent: 'space-between',
    shadowColor: 'rgba(0,0,0,0.2)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 14,
    elevation: 8,
  },
topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  bankName: { color: 'rgba(255,255,255,0.75)', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' },
  balanceWrap: { flex: 1, justifyContent: 'center' },
  balanceLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11, letterSpacing: 0.5, marginBottom: 4 },
  balanceValue: { color: '#fff', fontSize: 26, fontFamily: 'Cause-ExtraBold', letterSpacing: -0.5 },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  cardTypeText: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontFamily: 'Cause-SemiBold', letterSpacing: 0.5 },
  networkBadge: { alignItems: 'center', justifyContent: 'center' },
  visaText: { color: '#fff', fontSize: 18, fontFamily: 'Cause-ExtraBold', fontStyle: 'italic', letterSpacing: 1 },
  mastercard: { flexDirection: 'row', alignItems: 'center' },
  mcCircle: { width: 22, height: 22, borderRadius: 11, opacity: 0.95 },
});
