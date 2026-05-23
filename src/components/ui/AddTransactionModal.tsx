import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { CATEGORIES } from '../../constants/Categories';
import { Transaction, TransactionType } from '../../types';
import { useAppStore } from '../../store';

interface AddTransactionModalProps {
  visible: boolean;
  onClose: () => void;
}

const generateId = () => `tx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({ visible, onClose }) => {
  const insets = useSafeAreaInsets();
  const addTransaction = useAppStore((s) => s.addTransaction);

  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('food_dining');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);

  const filteredCategories = CATEGORIES.filter((c) => c.type === type || c.type === 'both');

  const handleSave = async () => {
    const parsed = parseFloat(amount.replace(/,/g, ''));
    if (!parsed || !description.trim()) return;
    setSaving(true);
    const tx: Transaction = {
      id: generateId(),
      type,
      amount: parsed,
      category,
      description: description.trim(),
      date,
      createdAt: Date.now(),
    };
    await addTransaction(tx);
    setSaving(false);
    setAmount('');
    setDescription('');
    setCategory('food_dining');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modal}>
        <View style={[styles.handle]} />
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={Colors.textMedium} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Add Transaction</Text>
          <TouchableOpacity onPress={handleSave} disabled={saving}>
            <Text style={[styles.saveBtn, saving && { opacity: 0.4 }]}>Save</Text>
          </TouchableOpacity>
        </View>

        {/* Type Toggle */}
        <View style={styles.typeToggle}>
          {(['expense', 'income'] as TransactionType[]).map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.typeBtn, type === t && styles.typeBtnActive]}
              onPress={() => { setType(t); setCategory(t === 'expense' ? 'food_dining' : 'salary'); }}
            >
              <Text style={[styles.typeBtnText, type === t && styles.typeBtnTextActive]}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
          {/* Amount */}
          <View style={styles.amountWrap}>
            <Text style={styles.currencySymbol}>₱</Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              placeholderTextColor={Colors.textLight}
              keyboardType="decimal-pad"
              autoFocus
            />
          </View>

          {/* Description */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Description</Text>
            <TextInput
              style={styles.fieldInput}
              value={description}
              onChangeText={setDescription}
              placeholder="What was this for?"
              placeholderTextColor={Colors.textLight}
            />
          </View>

          {/* Date */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Date</Text>
            <TextInput
              style={styles.fieldInput}
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={Colors.textLight}
            />
          </View>

          {/* Category */}
          <Text style={[styles.fieldLabel, { marginHorizontal: 20, marginBottom: 8 }]}>Category</Text>
          <View style={styles.categoriesGrid}>
            {filteredCategories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.catItem, category === cat.id && { borderColor: cat.color, backgroundColor: cat.color + '15' }]}
                onPress={() => setCategory(cat.id)}
              >
                <View style={[styles.catIcon, { backgroundColor: cat.color + '25' }]}>
                  <Ionicons name={cat.icon as any} size={16} color={cat.color} />
                </View>
                <Text style={[styles.catName, category === cat.id && { color: cat.color, fontWeight: '600' }]}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={{ height: insets.bottom + 20 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modal: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textDark,
  },
  saveBtn: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
  },
  typeToggle: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 4,
    marginBottom: 8,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  typeBtnActive: {
    backgroundColor: Colors.primary,
  },
  typeBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textMedium,
  },
  typeBtnTextActive: {
    color: '#fff',
  },
  form: {
    flex: 1,
  },
  amountWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  currencySymbol: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.textMedium,
    marginRight: 4,
  },
  amountInput: {
    fontSize: 48,
    fontWeight: '700',
    color: Colors.textDark,
    minWidth: 120,
    textAlign: 'center',
  },
  field: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textMedium,
    marginBottom: 6,
  },
  fieldInput: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.textDark,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 8,
  },
  catItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    gap: 6,
  },
  catIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catName: {
    fontSize: 12,
    color: Colors.textMedium,
  },
});
