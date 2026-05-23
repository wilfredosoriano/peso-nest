import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Modal,
  TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAppStore } from '../../src/store';
import { BankCard } from '../../src/components/ui/BankCard';
import { Colors } from '../../src/constants/Colors';
import { formatCurrency } from '../../src/utils/formatters';
import { Card } from '../../src/types';

const generateId = () => `card_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export default function CardsScreen() {
  const insets = useSafeAreaInsets();
  const cards = useAppStore((s) => s.cards);
  const addCard = useAppStore((s) => s.addCard);
  const removeCard = useAppStore((s) => s.removeCard);
  const [showAdd, setShowAdd] = useState(false);
  const [bank, setBank] = useState('');
  const [lastFour, setLastFour] = useState('');
  const [expiry, setExpiry] = useState('');
  const [holder, setHolder] = useState('');
  const [cardType, setCardType] = useState<'debit' | 'credit'>('debit');
  const [limit, setLimit] = useState('');
  const [balance, setBalance] = useState('');
  const [network, setNetwork] = useState<'visa' | 'mastercard'>('visa');
  const [saving, setSaving] = useState(false);

  const totalLimit = cards.reduce((s, c) => s + c.limitAmount, 0);
  const totalUsed = cards.reduce((s, c) => s + (c.type === 'credit' ? c.balance : 0), 0);
  const pct = totalLimit > 0 ? Math.min((totalUsed / totalLimit) * 100, 100) : 0;

  const handleSave = async () => {
    if (!bank.trim() || !lastFour.trim() || !expiry.trim() || !holder.trim()) return;
    setSaving(true);
    const colorStart = cardType === 'debit' ? '#E97B3B' : '#4ECDC4';
    const colorEnd = cardType === 'debit' ? '#C9621E' : '#44A8C8';
    const card: Card = {
      id: generateId(),
      name: `${bank} ${cardType === 'debit' ? 'Debit' : 'Credit'} Card`,
      bank: bank.trim(),
      type: cardType,
      lastFour: lastFour.trim().slice(-4),
      expiry: expiry.trim(),
      cardHolder: holder.trim().toUpperCase(),
      limitAmount: parseFloat(limit) || 0,
      balance: parseFloat(balance) || 0,
      colorStart,
      colorEnd,
      network,
      createdAt: Date.now(),
    };
    await addCard(card);
    setSaving(false);
    setBank(''); setLastFour(''); setExpiry(''); setHolder(''); setLimit(''); setBalance('');
    setShowAdd(false);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.title}>My Cards</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAdd(true)}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 90 + insets.bottom }} showsVerticalScrollIndicator={false}>
        {/* Cards */}
        <View style={styles.cardsStack}>
          {cards.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="card-outline" size={48} color={Colors.textLight} />
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
                <BankCard card={card} />
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
              <Text style={styles.summaryValue}>{formatCurrency(totalLimit)}</Text>
            </View>
            <View>
              <Text style={styles.summaryLabel}>Total Used</Text>
              <Text style={styles.summaryValue}>{formatCurrency(totalUsed)}</Text>
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
            <Ionicons name="cash-outline" size={22} color={Colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.loansTitle}>My Loans</Text>
            <Text style={styles.loansSubtitle}>View and manage your loans</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.textLight} />
        </TouchableOpacity>
      </ScrollView>

      {/* Add Card Modal */}
      <Modal visible={showAdd} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowAdd(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modal}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAdd(false)}>
              <Ionicons name="close" size={24} color={Colors.textMedium} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Card</Text>
            <TouchableOpacity onPress={handleSave} disabled={saving}>
              <Text style={[styles.saveBtn, saving && { opacity: 0.4 }]}>Save</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
            {/* Type toggle */}
            <View style={styles.typeToggle}>
              {(['debit', 'credit'] as const).map((t) => (
                <TouchableOpacity key={t} style={[styles.typeBtn, cardType === t && styles.typeBtnActive]} onPress={() => setCardType(t)}>
                  <Text style={[styles.typeBtnText, cardType === t && styles.typeBtnTextActive]}>{t.charAt(0).toUpperCase() + t.slice(1)}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {[
              { label: 'Bank Name', value: bank, onChange: setBank, placeholder: 'e.g. BDO, BPI, UnionBank' },
              { label: 'Last 4 Digits', value: lastFour, onChange: setLastFour, placeholder: '1234', keyboardType: 'number-pad' as const },
              { label: 'Expiry (MM/YY)', value: expiry, onChange: setExpiry, placeholder: '12/28' },
              { label: 'Card Holder Name', value: holder, onChange: setHolder, placeholder: 'Your Name' },
              { label: cardType === 'credit' ? 'Credit Limit' : 'Balance', value: cardType === 'credit' ? limit : balance, onChange: cardType === 'credit' ? setLimit : setBalance, placeholder: '50000', keyboardType: 'decimal-pad' as const },
            ].map((f) => (
              <View key={f.label} style={styles.field}>
                <Text style={styles.fieldLabel}>{f.label}</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={f.value}
                  onChangeText={f.onChange}
                  placeholder={f.placeholder}
                  placeholderTextColor={Colors.textLight}
                  keyboardType={f.keyboardType}
                />
              </View>
            ))}
            {/* Network */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Network</Text>
              <View style={styles.typeToggle}>
                {(['visa', 'mastercard'] as const).map((n) => (
                  <TouchableOpacity key={n} style={[styles.typeBtn, network === n && styles.typeBtnActive]} onPress={() => setNetwork(n)}>
                    <Text style={[styles.typeBtnText, network === n && styles.typeBtnTextActive]}>{n.charAt(0).toUpperCase() + n.slice(1)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDF1E7' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 12 },
  title: { fontSize: 24, fontWeight: '800', color: '#1A0E00' },
  addBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#E97B3B', alignItems: 'center', justifyContent: 'center' },
  cardsStack: { paddingHorizontal: 24, gap: 16, paddingBottom: 8, paddingTop: 4 },
  cardWrap: {},
  emptyCard: { alignItems: 'center', paddingVertical: 48, backgroundColor: '#FFFFFF', marginHorizontal: 0, borderRadius: 20 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#8B6F47', marginTop: 12 },
  emptySubtitle: { fontSize: 13, color: '#C4A882', marginTop: 4 },
  summaryCard: { marginHorizontal: 20, marginTop: 8, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, shadowColor: 'rgba(233,123,59,0.12)', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 8, elevation: 3 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1A0E00', marginBottom: 14 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  summaryLabel: { fontSize: 12, color: '#C4A882', marginBottom: 2 },
  summaryValue: { fontSize: 18, fontWeight: '700', color: '#1A0E00' },
  progressTrack: { height: 8, backgroundColor: '#F0DCC8', borderRadius: 4, overflow: 'hidden' },
  progressBar: { height: '100%', backgroundColor: '#E97B3B', borderRadius: 4 },
  pctText: { fontSize: 11, color: '#C4A882', marginTop: 6, textAlign: 'right' },
  loansShortcut: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginTop: 12, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, gap: 12, shadowColor: 'rgba(233,123,59,0.08)', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 6, elevation: 2 },
  loansIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  loansTitle: { fontSize: 14, fontWeight: '700', color: '#1A0E00' },
  loansSubtitle: { fontSize: 12, color: '#C4A882', marginTop: 1 },
  modal: { flex: 1, backgroundColor: '#FDF1E7' },
  modalHandle: { width: 36, height: 4, backgroundColor: '#F0DCC8', borderRadius: 2, alignSelf: 'center', marginTop: 12 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#1A0E00' },
  saveBtn: { fontSize: 16, fontWeight: '700', color: '#E97B3B' },
  modalForm: { flex: 1 },
  typeToggle: { flexDirection: 'row', marginHorizontal: 20, backgroundColor: '#FFF8F1', borderRadius: 12, padding: 4, marginBottom: 16, gap: 4 },
  typeBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
  typeBtnActive: { backgroundColor: '#E97B3B' },
  typeBtnText: { fontSize: 14, fontWeight: '600', color: '#8B6F47' },
  typeBtnTextActive: { color: '#fff' },
  field: { marginHorizontal: 20, marginBottom: 14 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#8B6F47', marginBottom: 6 },
  fieldInput: { backgroundColor: '#FFFFFF', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: '#1A0E00', borderWidth: 1, borderColor: '#F0DCC8' },
});
