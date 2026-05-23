import React from 'react';
import { View, Text, StyleSheet, Dimensions, ImageBackground } from 'react-native';
import { Card } from '../../types';

const CARD_BG = require('../../../assets/images/backgrounds/card-bg.webp');

const CARD_WIDTH = Dimensions.get('window').width - 48;
const CARD_HEIGHT = CARD_WIDTH * 0.56;

interface BankCardProps {
  card: Card;
}

export const BankCard: React.FC<BankCardProps> = ({ card }) => {
  return (
    <ImageBackground
      source={CARD_BG}
      resizeMode="cover"
      style={styles.card}
      imageStyle={styles.cardImage}
    >
      {/* Top row */}
      <View style={styles.topRow}>
        <View>
          <Text style={styles.bankName}>{card.bank}</Text>
          <Text style={styles.cardName}>{card.name}</Text>
        </View>
        <View style={styles.chipWrap}>
          <View style={styles.chip} />
        </View>
      </View>

      {/* Card number */}
      <View style={styles.numberRow}>
        <Text style={styles.cardNumber}>**** **** **** {card.lastFour}</Text>
      </View>

      {/* Bottom row */}
      <View style={styles.bottomRow}>
        <View>
          <Text style={styles.labelSmall}>CARD HOLDER</Text>
          <Text style={styles.valueText}>{card.cardHolder}</Text>
        </View>
        <View>
          <Text style={styles.labelSmall}>EXPIRES</Text>
          <Text style={styles.valueText}>{card.expiry}</Text>
        </View>
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
    </ImageBackground>
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
  cardImage: {
    borderRadius: 20,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  bankName: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  cardName: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  chipWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  chip: {
    width: 34,
    height: 26,
    borderRadius: 5,
    backgroundColor: 'rgba(255,220,120,0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255,200,80,0.6)',
  },
  numberRow: {
    alignItems: 'center',
  },
  cardNumber: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 3,
    fontVariant: ['tabular-nums'],
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  labelSmall: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 9,
    letterSpacing: 1,
    marginBottom: 2,
  },
  valueText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
  },
  networkBadge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  visaText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: 1,
  },
  mastercard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mcCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    opacity: 0.95,
  },
});
