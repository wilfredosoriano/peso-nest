import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../types';
import { Colors } from '../../constants/Colors';
import { rs } from '../../utils/responsive';

const CARD_W = 148;
const CARD_H = Math.round(CARD_W * 0.58);

interface MiniCardProps {
  card: Card;
  selected?: boolean;
  onPress?: () => void;
}

export const MiniCard: React.FC<MiniCardProps> = ({ card, selected = false, onPress }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.wrap, selected && styles.wrapSelected]}
    >
      <LinearGradient
        colors={[card.colorStart, card.colorEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        {/* Top: bank name */}
        <View style={styles.topRow}>
          <Text style={styles.bankName} numberOfLines={1}>{card.bank}</Text>
        </View>

        {/* Balance */}
        <Text style={styles.balance} numberOfLines={1}>
          ₱{card.balance.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Text>

        {/* Bottom: card type + network */}
        <View style={styles.bottomRow}>
          <Text style={styles.cardType}>{card.type === 'debit' ? 'Debit' : 'Credit'}</Text>
          {card.network === 'visa' ? (
            <Text style={styles.visaText}>VISA</Text>
          ) : (
            <View style={styles.mastercard}>
              <View style={[styles.mcCircle, { backgroundColor: '#EB001B', marginRight: -5 }]} />
              <View style={[styles.mcCircle, { backgroundColor: '#F79E1B' }]} />
            </View>
          )}
        </View>
      </LinearGradient>

      {/* Solid badge — only shown when selected, overflows the top-right corner */}
      {selected && (
        <View style={styles.checkBadge}>
          <Ionicons name="checkmark" size={rs(11)} color="#fff" />
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  wrap: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: 16,
    borderWidth: 2.5,
    borderColor: 'transparent',
    overflow: 'visible',
  },
  wrapSelected: {
    borderColor: Colors.primary,
  },
  card: {
    width: '100%',
    height: '100%',
    borderRadius: 13,   // slightly less than wrap so border shows cleanly
    padding: 11,
    overflow: 'hidden',
    justifyContent: 'space-between',
    shadowColor: 'rgba(0,0,0,0.18)',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 4,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  bankName: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: rs(9),
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  balance: {
    color: '#fff',
    fontSize: rs(14),
    fontFamily: 'Cause-ExtraBold',
    letterSpacing: -0.3,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  cardType: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: rs(9),
    fontFamily: 'Cause-SemiBold',
    letterSpacing: 0.3,
  },
  visaText: {
    color: '#fff',
    fontSize: rs(12),
    fontFamily: 'Cause-ExtraBold',
    fontStyle: 'italic',
    letterSpacing: 0.5,
  },
  mastercard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mcCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    opacity: 0.95,
  },
  // Solid filled badge, overflows the top-right corner of the card
  checkBadge: {
    position: 'absolute',
    top: -9,
    right: -9,
    width: rs(22),
    height: rs(22),
    borderRadius: rs(11),
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    zIndex: 10,
  },
});
