import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal,
  TextInput, KeyboardAvoidingView, Platform, ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAppStore } from '../src/store';
import { Colors } from '../src/constants/Colors';
import { formatCurrency } from '../src/utils/formatters';
import { Loan } from '../src/types';

const LOAN_BG = require('../assets/images/backgrounds/loan-header-bg.webp');

const generateId = () => `loan_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export default function LoansScreen() {
  const insets = useSafeAreaInsets();
  const loans = useAppStore((s) => s.loans);
  const addLoan = useAppStore((s) => s.addLoan);
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState('');
  const [total, setTotal] = useState('');
  const [outstanding, setOutstanding] = useState('');
  const [rate, setRate] = useState('');
  const [emi, setEmi] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [saving, setSaving] = useState(false);

  const totalLoans = loans.reduce((s, l) => s + l.totalAmount, 0);
  const totalOutstanding = loans.reduce((s, l) => s + l.outstandingAmount, 0);

  const handleSave = async () => {
    if (!title.trim() || !total || !outstanding) return;
    setSaving(true);
    const loan: Loan = {
      id: generateId(),
      title: title.trim(),
      loanType: 'personal',
      totalAmount: parseFloat(total),
      outstandingAmount: parseFloat(outstanding),
      interestRate: parseFloat(rate) || 0,
      emiAmount: parseFloat(emi) || 0,
      nextDueDate: dueDate.trim() || new Date().toISOString().split('T')[0],
      status: 'active',
      createdAt: Date.now(),
    };
    await addLoan(loan);
    setSaving(false);
    setTitle(''); setTotal(''); setOutstanding(''); setRate(''); setEmi(''); setDueDate('');
    setShowAdd(false);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.textDark} />
        </TouchableOpacity>
        <Text style={styles.title}>My Loans</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAdd(true)}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {loans.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="cash-outline" size={56} color={Colors.textLight} />
            <Text style={styles.emptyTitle}>No loans yet</Text>
            <Text style={styles.emptySubtitle}>Tap + to track a loan</Text>
          </View>
        ) : (
          loans.map((loan) => {
            const paidPct = loan.totalAmount > 0 ? ((loan.totalAmount - loan.outstandingAmount) / loan.totalAmount) * 100 : 0;
            return (
              <ImageBackground
                key={loan.id}
                source={LOAN_BG}
                resizeMode="cover"
                style={styles.loanCard}
                imageStyle={styles.loanCardImage}
              >
                {/* Top section: text left, image shows through on right */}
                <View style={styles.loanTopSection}>
                  <View style={styles.loanLeftCol}>
                    <Text style={styles.loanTitle}>{loan.title}</Text>
                    <Text style={styles.loanAmtLabel}>Outstanding Balance</Text>
                    <Text style={styles.loanAmtValue}>{formatCurrency(loan.outstandingAmount)}</Text>
                    <Text style={styles.loanOfTotal}>of {formatCurrency(loan.totalAmount)}</Text>
                  </View>

                  <View style={styles.loanRightCol}>
                    <View style={styles.paidBadge}>
                      <Text style={styles.paidBadgeText}>{Math.round(paidPct)}%</Text>
                    </View>
                  </View>
                </View>

                {/* Full-width progress bar below the house */}
                <View style={styles.progressWrap}>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressBar, { width: `${paidPct}%` as any }]} />
                  </View>
                </View>

                {/* Divider */}
                <View style={styles.cardDivider} />

                {/* Bottom section: interest rate + next payment */}
                <View style={styles.loanBottomSection}>
                  <View style={styles.loanDetailItem}>
                    <Text style={styles.loanDetailLabel}>Interest Rate</Text>
                    <Text style={styles.loanDetailValue}>
                      {loan.interestRate}
                      <Text style={styles.loanDetailUnit}>%</Text>
                    </Text>
                  </View>
                  <View style={styles.loanDetailItem}>
                    <Text style={styles.loanDetailLabel}>Next Payment</Text>
                    <Text style={[styles.loanDetailValue, { color: Colors.primary }]}>
                      {formatCurrency(loan.emiAmount)}
                    </Text>
                    <Text style={styles.loanDueDate}>Due on {loan.nextDueDate}</Text>
                  </View>
                </View>
              </ImageBackground>
            );
          })
        )}

        {/* Summary */}
        {loans.length > 0 && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Loan Summary</Text>
            <View style={styles.summaryRow}>
              <View>
                <Text style={styles.summaryLabel}>Total Loans</Text>
                <Text style={styles.summaryValue}>{formatCurrency(totalLoans)}</Text>
              </View>
              <View>
                <Text style={styles.summaryLabel}>Total Outstanding</Text>
                <Text style={[styles.summaryValue, { color: Colors.expense }]}>{formatCurrency(totalOutstanding)}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.viewDetailsBtn}>
              <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.viewDetailsBtnGrad}>
                <Text style={styles.viewDetailsBtnText}>View Loan Details</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <Modal visible={showAdd} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowAdd(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modal}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAdd(false)}>
              <Ionicons name="close" size={24} color={Colors.textMedium} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Loan</Text>
            <TouchableOpacity onPress={handleSave} disabled={saving}>
              <Text style={[styles.saveBtn, saving && { opacity: 0.4 }]}>Save</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            {[
              { label: 'Loan Title', value: title, onChange: setTitle, placeholder: 'e.g. Personal Loan' },
              { label: 'Total Amount', value: total, onChange: setTotal, placeholder: '60000', keyboardType: 'decimal-pad' as const },
              { label: 'Outstanding Amount', value: outstanding, onChange: setOutstanding, placeholder: '42500', keyboardType: 'decimal-pad' as const },
              { label: 'Interest Rate (%)', value: rate, onChange: setRate, placeholder: '8.5', keyboardType: 'decimal-pad' as const },
              { label: 'Monthly EMI', value: emi, onChange: setEmi, placeholder: '2100', keyboardType: 'decimal-pad' as const },
              { label: 'Next Due Date (YYYY-MM-DD)', value: dueDate, onChange: setDueDate, placeholder: '2025-06-10' },
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
            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDF1E7' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 12, gap: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', shadowColor: 'rgba(0,0,0,0.06)', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 1, shadowRadius: 4, elevation: 2 },
  title: { flex: 1, fontSize: 22, fontWeight: '800', color: '#1A0E00' },
  addBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#E97B3B', alignItems: 'center', justifyContent: 'center' },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#8B6F47', marginTop: 12 },
  emptySubtitle: { fontSize: 13, color: '#C4A882', marginTop: 4 },
  loanCard: { borderRadius: 20, marginBottom: 16, overflow: 'hidden', shadowColor: 'rgba(233,123,59,0.18)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 12, elevation: 5 },
  loanCardImage: { borderRadius: 20 },
  loanTopSection: { flexDirection: 'row', padding: 18, paddingBottom: 14 },
  loanLeftCol: { flex: 1, paddingRight: 12 },
  loanRightCol: { width: 80, alignItems: 'flex-end' },
  loanTitle: { fontSize: 16, fontWeight: '700', color: '#1A0E00', marginBottom: 6 },
  loanAmtLabel: { fontSize: 11, color: '#C4A882', marginBottom: 2 },
  loanAmtValue: { fontSize: 22, fontWeight: '800', color: '#1A0E00', letterSpacing: -0.5 },
  loanOfTotal: { fontSize: 12, color: '#C4A882', marginTop: 2, marginBottom: 10 },
  progressWrap: { paddingHorizontal: 18, paddingBottom: 14 },
  progressTrack: { height: 7, backgroundColor: 'rgba(255,255,255,0.45)', borderRadius: 4, overflow: 'hidden' },
  progressBar: { height: '100%', backgroundColor: '#E97B3B', borderRadius: 4 },
  paidBadge: { backgroundColor: Colors.primary + '18', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  paidBadgeText: { fontSize: 12, fontWeight: '700', color: Colors.primary },
  cardDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.5)', marginHorizontal: 18 },
  loanBottomSection: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, paddingTop: 14 },
  loanDetailItem: {},
  loanDetailLabel: { fontSize: 11, color: '#C4A882', marginBottom: 4 },
  loanDetailValue: { fontSize: 18, fontWeight: '800', color: '#1A0E00' },
  loanDetailUnit: { fontSize: 13, fontWeight: '600' },
  loanDueDate: { fontSize: 11, color: '#C4A882', marginTop: 2 },
  summaryCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 18, shadowColor: 'rgba(233,123,59,0.08)', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 8, elevation: 3 },
  summaryTitle: { fontSize: 16, fontWeight: '700', color: '#1A0E00', marginBottom: 14 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  summaryLabel: { fontSize: 12, color: '#C4A882', marginBottom: 2 },
  summaryValue: { fontSize: 18, fontWeight: '700', color: '#1A0E00' },
  viewDetailsBtn: { borderRadius: 14, overflow: 'hidden' },
  viewDetailsBtnGrad: { paddingVertical: 14, alignItems: 'center' },
  viewDetailsBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  modal: { flex: 1, backgroundColor: '#FDF1E7' },
  modalHandle: { width: 36, height: 4, backgroundColor: '#F0DCC8', borderRadius: 2, alignSelf: 'center', marginTop: 12 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#1A0E00' },
  saveBtn: { fontSize: 16, fontWeight: '700', color: '#E97B3B' },
  field: { marginHorizontal: 20, marginBottom: 14 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#8B6F47', marginBottom: 6 },
  fieldInput: { backgroundColor: '#FFFFFF', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: '#1A0E00', borderWidth: 1, borderColor: '#F0DCC8' },
});
