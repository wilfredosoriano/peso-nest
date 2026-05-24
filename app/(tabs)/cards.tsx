import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Modal,
  TextInput, KeyboardAvoidingView, StatusBar,
  Animated, PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAppStore } from '../../src/store';
import { BankCard } from '../../src/components/ui/BankCard';
import { Colors } from '../../src/constants/Colors';
import { formatCurrency } from '../../src/utils/formatters';
import { rs } from '../../src/utils/responsive';
import { Card } from '../../src/types';

const generateId = () => `card_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

// ── Bank templates ────────────────────────────────────────────────────────────
type BankTemplate = {
  id: string;
  name: string;
  short: string;
  colorStart: string;
  colorEnd: string;
  defaultNetwork: 'visa' | 'mastercard';
};

const BANK_TEMPLATES: BankTemplate[] = [
  { id: 'bdo',       name: 'BDO',          short: 'BDO',    colorStart: '#043673', colorEnd: '#021F44', defaultNetwork: 'mastercard' },
  { id: 'bpi',       name: 'BPI',          short: 'BPI',    colorStart: '#B11116', colorEnd: '#7A0B0F', defaultNetwork: 'mastercard' },
  { id: 'unionbank', name: 'UnionBank',    short: 'UB',     colorStart: '#FF8000', colorEnd: '#CC5F00', defaultNetwork: 'visa' },
  { id: 'metrobank', name: 'Metrobank',    short: 'Metro',  colorStart: '#00539F', colorEnd: '#003570', defaultNetwork: 'visa' },
  { id: 'secbank',   name: 'Security Bank',short: 'SecB',   colorStart: '#2F4157', colorEnd: '#1B2835', defaultNetwork: 'mastercard' },
  { id: 'rcbc',      name: 'RCBC',         short: 'RCBC',   colorStart: '#00CCCC', colorEnd: '#008888', defaultNetwork: 'visa' },
  { id: 'landbank',  name: 'Landbank',     short: 'LBP',    colorStart: '#58B41C', colorEnd: '#3D7E12', defaultNetwork: 'mastercard' },
  { id: 'pnb',       name: 'PNB',          short: 'PNB',    colorStart: '#FFB200', colorEnd: '#CC8E00', defaultNetwork: 'visa' },
  { id: 'eastwest',  name: 'EastWest',     short: 'EW',     colorStart: '#D5E04D', colorEnd: '#A8B325', defaultNetwork: 'mastercard' },
  { id: 'gcash',     name: 'GCash',        short: 'GCash',  colorStart: '#1972F9', colorEnd: '#0A4DB8', defaultNetwork: 'mastercard' },
  { id: 'maya',      name: 'Maya',         short: 'Maya',   colorStart: '#112432', colorEnd: '#0A1520', defaultNetwork: 'visa' },
  { id: 'chinabank', name: 'Chinabank',    short: 'CBC',    colorStart: '#EE292B', colorEnd: '#A81D1F', defaultNetwork: 'visa' },
  { id: 'psbank',    name: 'PSBank',       short: 'PSB',    colorStart: '#0855A5', colorEnd: '#053A73', defaultNetwork: 'mastercard' },
  { id: 'gotyme',    name: 'GoTyme',       short: 'GoTyme', colorStart: '#01F5FB', colorEnd: '#00B8BD', defaultNetwork: 'visa' },
  { id: 'custom',    name: 'Custom',       short: '+ Add',  colorStart: '#8B6F47', colorEnd: '#5C3D1A', defaultNetwork: 'visa' },
];

export default function CardsScreen() {
  const insets    = useSafeAreaInsets();
  const cards     = useAppStore((s) => s.cards);
  const addCard   = useAppStore((s) => s.addCard);
  const removeCard= useAppStore((s) => s.removeCard);
  const hideBalance = useAppStore((s) => s.hideBalance);

  const [showAdd, setShowAdd]     = useState(false);
  const [selTemplate, setSelTemplate] = useState<BankTemplate | null>(null);
  const [bank,    setBank]        = useState('');
  const [cardType,setCardType]    = useState<'debit' | 'credit'>('debit');
  const [limit,   setLimit]       = useState('');
  const [balance, setBalance]     = useState('');
  const [network, setNetwork]     = useState<'visa' | 'mastercard'>('visa');
  const [saving,  setSaving]      = useState(false);

  const addCardY = useRef(new Animated.Value(800)).current;
  const addCardOverlay = addCardY.interpolate({ inputRange: [0, 400], outputRange: [1, 0], extrapolate: 'clamp' });
  useEffect(() => {
    if (showAdd) { addCardY.setValue(800); Animated.spring(addCardY, { toValue: 0, useNativeDriver: true, damping: 28, stiffness: 220 }).start(); }
  }, [showAdd]);
  const dismissAddCard = (dy: number, vy: number) => {
    if (dy > 100 || vy > 1.0) { Animated.timing(addCardY, { toValue: 800, duration: 220, useNativeDriver: true }).start(() => setShowAdd(false)); }
    else { Animated.spring(addCardY, { toValue: 0, useNativeDriver: true }).start(); }
  };
  const addCardPan = useRef(PanResponder.create({ onStartShouldSetPanResponder: () => true, onPanResponderMove: (_, { dy }) => { if (dy > 0) addCardY.setValue(dy); }, onPanResponderRelease: (_, { dy, vy }) => dismissAddCard(dy, vy) })).current;

  const totalLimit = cards.reduce((s, c) => s + c.limitAmount, 0);
  const totalUsed  = cards.reduce((s, c) => s + (c.type === 'credit' ? c.balance : 0), 0);
  const pct = totalLimit > 0 ? Math.min((totalUsed / totalLimit) * 100, 100) : 0;

  const openAdd = () => {
    setSelTemplate(null);
    setBank(''); setLimit(''); setBalance('');
    setCardType('debit'); setNetwork('visa');
    setShowAdd(true);
  };

  const pickTemplate = (t: BankTemplate) => {
    setSelTemplate(t);
    if (t.id !== 'custom') setBank(t.name);
    else setBank('');
    setNetwork(t.defaultNetwork);
  };

  const handleSave = async () => {
    if (!bank.trim() || !selTemplate) return;
    setSaving(true);
    const card: Card = {
      id: generateId(),
      name: `${bank.trim()} ${cardType === 'debit' ? 'Debit' : 'Credit'} Card`,
      bank: bank.trim(),
      type: cardType,
      lastFour: '',
      expiry: '',
      cardHolder: '',
      limitAmount: parseFloat(limit) || 0,
      balance: parseFloat(balance) || 0,
      colorStart: selTemplate.colorStart,
      colorEnd:   selTemplate.colorEnd,
      network,
      createdAt: Date.now(),
    };
    await addCard(card);
    setSaving(false);
    setShowAdd(false);
  };

  // ── Preview card gradient colors ──────────────────────────────────────────
  const previewStart = selTemplate?.colorStart ?? '#C4A882';
  const previewEnd   = selTemplate?.colorEnd   ?? '#8B6F47';

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.title}>My Cards</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
          <Ionicons name="add" size={rs(22)} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 90 + insets.bottom }} showsVerticalScrollIndicator={false}>
        <View style={styles.cardsStack}>
          {cards.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="card-outline" size={rs(48)} color={Colors.textLight} />
              <Text style={styles.emptyTitle}>No cards yet</Text>
              <Text style={styles.emptySubtitle}>Tap + to add your first card</Text>
            </View>
          ) : (
            cards.map((card) => (
              <TouchableOpacity
                key={card.id}
                onLongPress={() =>
                  Alert.alert('Remove Card', `Remove ${card.name}?`, [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Remove', style: 'destructive', onPress: () => removeCard(card.id) },
                  ])
                }
                activeOpacity={0.95}
                style={styles.cardWrap}
              >
                <BankCard card={card} hideBalance={hideBalance} />
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.sectionTitle}>Card Summary</Text>
          <View style={styles.summaryRow}>
            <View>
              <Text style={styles.summaryLabel}>Total Limit</Text>
              <Text style={styles.summaryValue}>{hideBalance ? '••••••' : formatCurrency(totalLimit)}</Text>
            </View>
            <View>
              <Text style={styles.summaryLabel}>Total Used</Text>
              <Text style={styles.summaryValue}>{hideBalance ? '••••••' : formatCurrency(totalUsed)}</Text>
            </View>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressBar, { width: `${pct}%` }]} />
          </View>
          <Text style={styles.pctText}>{Math.round(pct)}% used</Text>
        </View>

        {/* Loans shortcut */}
        <TouchableOpacity style={styles.loansShortcut} onPress={() => router.push('/loans')}>
          <View style={[styles.loansIcon, { backgroundColor: Colors.primary + '20' }]}>
            <Ionicons name="cash-outline" size={rs(22)} color={Colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.loansTitle}>My Loans</Text>
            <Text style={styles.loansSubtitle}>View and manage your loans</Text>
          </View>
          <Ionicons name="chevron-forward" size={rs(18)} color={Colors.textLight} />
        </TouchableOpacity>
      </ScrollView>

      {/* ── Add Card Modal ─────────────────────────────────────────────────── */}
      <Modal visible={showAdd} animationType="none" transparent statusBarTranslucent onRequestClose={() => setShowAdd(false)}>
        <StatusBar translucent backgroundColor="transparent" />
        <Animated.View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)', opacity: addCardOverlay }} pointerEvents="none" />
        <View style={{ flex: 1 }}>
        <Animated.View style={{ flex: 1, marginTop: 60, transform: [{ translateY: addCardY }] }}>
        <KeyboardAvoidingView behavior="padding" style={[styles.modal, { flex: 1, borderTopLeftRadius: 20, borderTopRightRadius: 20 }]}>
          <View style={styles.sheetHandle} {...addCardPan.panHandlers}>
            <View style={styles.sheetHandlePill} />
          </View>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAdd(false)}>
              <Ionicons name="close" size={rs(24)} color={Colors.textMedium} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Card</Text>
            <TouchableOpacity onPress={handleSave} disabled={saving || !selTemplate || !bank.trim()}>
              <Text style={[styles.saveBtnText, (!selTemplate || !bank.trim() || saving) && { opacity: 0.35 }]}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>

            {/* ── 1. Bank template picker ────────────────────────────────── */}
            <Text style={styles.sectionLabel}>Choose Your Bank</Text>
            <View style={styles.templatesGrid}>
              {BANK_TEMPLATES.map((t) => {
                const isSelected = selTemplate?.id === t.id;
                return (
                  <TouchableOpacity key={t.id} onPress={() => pickTemplate(t)} activeOpacity={0.8} style={styles.templateWrap}>
                    <LinearGradient
                      colors={[t.colorStart, t.colorEnd]}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                      style={[styles.templateChip, isSelected && styles.templateChipSelected]}
                    >
                      {isSelected && (
                        <View style={styles.templateCheck}>
                          <Ionicons name="checkmark" size={rs(10)} color="#fff" />
                        </View>
                      )}
                      <Text style={styles.templateShort}>{t.short}</Text>
                    </LinearGradient>
                    <Text style={[styles.templateName, isSelected && { color: Colors.primary, fontFamily: 'Cause-Bold' }]} numberOfLines={1}>
                      {t.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* ── 2. Card preview ────────────────────────────────────────── */}
            {selTemplate && (
              <>
                <Text style={styles.sectionLabel}>Preview</Text>
                <View style={styles.previewWrap}>
                  <LinearGradient
                    colors={[previewStart, previewEnd]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={styles.previewCard}
                  >
                    <Text style={styles.previewBank}>{bank || selTemplate.name}</Text>
                    <Text style={styles.previewType}>{cardType.charAt(0).toUpperCase() + cardType.slice(1)} Card</Text>
                    <Text style={styles.previewNum}>•••• •••• •••• ••••</Text>
                    <Text style={styles.previewNetwork}>{network.toUpperCase()}</Text>
                  </LinearGradient>
                </View>
              </>
            )}

            {/* ── 3. Card details form ───────────────────────────────────── */}
            {selTemplate && (
              <>
                <Text style={styles.sectionLabel}>Card Details</Text>

                {/* Bank name (editable — pre-filled from template) */}
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Bank Name</Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={bank}
                    onChangeText={setBank}
                    placeholder="e.g. BDO, BPI, UnionBank"
                    placeholderTextColor={Colors.textLight}
                  />
                </View>

                {/* Card type */}
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Card Type</Text>
                  <View style={styles.typeToggle}>
                    {(['debit', 'credit'] as const).map((t) => (
                      <TouchableOpacity key={t} style={[styles.typeBtn, cardType === t && styles.typeBtnActive]} onPress={() => setCardType(t)}>
                        <Text style={[styles.typeBtnText, cardType === t && styles.typeBtnTextActive]}>
                          {t.charAt(0).toUpperCase() + t.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Amount */}
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>{cardType === 'credit' ? 'Credit Limit' : 'Current Balance'}</Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={cardType === 'credit' ? limit : balance}
                    onChangeText={cardType === 'credit' ? setLimit : setBalance}
                    placeholder="0.00"
                    placeholderTextColor={Colors.textLight}
                    keyboardType="decimal-pad"
                  />
                </View>

                {/* Network */}
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Network</Text>
                  <View style={styles.typeToggle}>
                    {(['visa', 'mastercard'] as const).map((n) => (
                      <TouchableOpacity key={n} style={[styles.typeBtn, network === n && styles.typeBtnActive]} onPress={() => setNetwork(n)}>
                        <Text style={[styles.typeBtnText, network === n && styles.typeBtnTextActive]}>
                          {n.charAt(0).toUpperCase() + n.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
        </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#FDF1E7' },
  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 12 },
  title:        { fontSize: rs(24), fontFamily: 'Cause-ExtraBold', color: '#1A0E00' },
  addBtn:       { width: rs(38), height: rs(38), borderRadius: 12, backgroundColor: '#E97B3B', alignItems: 'center', justifyContent: 'center' },
  cardsStack:   { paddingHorizontal: 24, gap: 16, paddingBottom: 8, paddingTop: 4 },
  cardWrap:     {},
  emptyCard:    { alignItems: 'center', paddingVertical: 48, backgroundColor: '#FFFFFF', borderRadius: 20 },
  emptyTitle:   { fontSize: rs(16), fontFamily: 'Cause-Bold', color: '#8B6F47', marginTop: 12 },
  emptySubtitle:{ fontSize: rs(13), color: '#C4A882', marginTop: 4 },
  summaryCard:  { marginHorizontal: 20, marginTop: 8, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, shadowColor: 'rgba(233,123,59,0.12)', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 8, elevation: 3 },
  sectionTitle: { fontSize: rs(16), fontFamily: 'Cause-Bold', color: '#1A0E00', marginBottom: 14 },
  summaryRow:   { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  summaryLabel: { fontSize: rs(12), color: '#C4A882', marginBottom: 2 },
  summaryValue: { fontSize: rs(18), fontFamily: 'Cause-Bold', color: '#1A0E00' },
  progressTrack:{ height: 8, backgroundColor: '#F0DCC8', borderRadius: 4, overflow: 'hidden' },
  progressBar:  { height: '100%', backgroundColor: '#E97B3B', borderRadius: 4 },
  pctText:      { fontSize: rs(11), color: '#C4A882', marginTop: 6, textAlign: 'right' },
  loansShortcut:{ flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginTop: 12, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, gap: 12, shadowColor: 'rgba(233,123,59,0.08)', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 6, elevation: 2 },
  loansIcon:    { width: rs(44), height: rs(44), borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  loansTitle:   { fontSize: rs(14), fontFamily: 'Cause-Bold', color: '#1A0E00' },
  loansSubtitle:{ fontSize: rs(12), color: '#C4A882', marginTop: 1 },

  // Modal
  modal:           { flex: 1, backgroundColor: '#FDF1E7' },
  sheetHandle:     { width: '100%', alignItems: 'center', paddingTop: 14, paddingBottom: 10 },
  sheetHandlePill: { width: 36, height: 4, backgroundColor: '#D0C0B0', borderRadius: 2 },
  modalHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 },
  modalTitle:   { fontSize: rs(17), fontFamily: 'Cause-Bold', color: '#1A0E00' },
  saveBtnText:  { fontSize: rs(16), fontFamily: 'Cause-Bold', color: '#E97B3B' },
  sectionLabel: { fontSize: rs(12), fontFamily: 'Cause-Bold', color: '#C4A882', textTransform: 'uppercase', letterSpacing: 0.8, marginLeft: 20, marginBottom: 12, marginTop: 16 },

  // Bank template grid
  templatesGrid:      { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12 },
  templateWrap:       { width: '25%', paddingHorizontal: 6, paddingBottom: 14, alignItems: 'center', gap: 5 },
  templateChip:       { width: '100%', aspectRatio: 1, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent' },
  templateChipSelected:{ borderColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 6, elevation: 6 },
  templateCheck:      { position: 'absolute', top: 4, right: 4, width: rs(16), height: rs(16), borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.4)', alignItems: 'center', justifyContent: 'center' },
  templateShort:      { fontSize: rs(11), fontFamily: 'Cause-Bold', color: '#fff', textAlign: 'center' },
  templateName:       { fontSize: rs(9), color: '#8B6F47', textAlign: 'center', fontFamily: 'Cause-Regular' },

  // Preview card
  previewWrap:   { paddingHorizontal: 20 },
  previewCard:   { borderRadius: 18, padding: 20, height: 110, justifyContent: 'space-between', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 8 },
  previewBank:   { fontSize: rs(16), fontFamily: 'Cause-ExtraBold', color: '#fff' },
  previewType:   { fontSize: rs(11), color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  previewNum:    { fontSize: rs(13), fontFamily: 'Cause-Medium', color: 'rgba(255,255,255,0.85)', letterSpacing: 2 },
  previewNetwork:{ fontSize: rs(11), fontFamily: 'Cause-Bold', color: 'rgba(255,255,255,0.7)', textAlign: 'right' },

  // Form
  field:          { marginHorizontal: 20, marginBottom: 14 },
  fieldLabel:     { fontSize: rs(13), fontFamily: 'Cause-SemiBold', color: '#8B6F47', marginBottom: 6 },
  fieldInput:     { backgroundColor: '#FFFFFF', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: rs(15), color: '#1A0E00', borderWidth: 1, borderColor: '#F0DCC8' },
  typeToggle:     { flexDirection: 'row', backgroundColor: '#FFF8F1', borderRadius: 12, padding: 4, gap: 4 },
  typeBtn:        { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
  typeBtnActive:  { backgroundColor: '#E97B3B' },
  typeBtnText:    { fontSize: rs(14), fontFamily: 'Cause-SemiBold', color: '#8B6F47' },
  typeBtnTextActive:{ color: '#fff' },
});
