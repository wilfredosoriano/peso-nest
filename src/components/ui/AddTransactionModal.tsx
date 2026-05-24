import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Modal,
  PanResponder, Animated, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { CATEGORIES } from '../../constants/Categories';
import { Transaction, TransactionType } from '../../types';
import { useAppStore } from '../../store';
import { checkAndNotifyOverBudget } from '../../utils/notifications';
import { MiniCard } from './MiniCard';

interface AddTransactionModalProps {
  visible: boolean;
  onClose: () => void;
}

const generateId = () => `tx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({ visible, onClose }) => {
  const insets = useSafeAreaInsets();
  const addTransaction = useAppStore((s) => s.addTransaction);
  const translateY = useRef(new Animated.Value(800)).current;

  // Overlay fades out as the sheet slides down
  const overlayOpacity = translateY.interpolate({
    inputRange: [0, 400],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  // Slide in when modal becomes visible
  useEffect(() => {
    if (visible) {
      translateY.setValue(800);
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 28,
        stiffness: 220,
      }).start();
    }
  }, [visible]);

  const dismiss = (dy: number, vy: number) => {
    if (dy > 100 || vy > 1.0) {
      Animated.timing(translateY, { toValue: 800, duration: 220, useNativeDriver: true }).start(() => {
        onClose();
      });
    } else {
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true }).start();
    }
  };

  // Dedicated handle PanResponder — claims the touch immediately so dragging always works
  const handlePan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, { dy }) => { if (dy > 0) translateY.setValue(dy); },
      onPanResponderRelease: (_, { dy, vy }) => dismiss(dy, vy),
    })
  ).current;

  const updateCardBalance   = useAppStore((s) => s.updateCardBalance);
  const cards               = useAppStore((s) => s.cards);
  const user                = useAppStore((s) => s.user);

  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('food_dining');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
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
      cardId: selectedCardId ?? undefined,
      createdAt: Date.now(),
    };
    await addTransaction(tx);
    if (selectedCardId) {
      const delta = type === 'expense' ? -parsed : parsed;
      await updateCardBalance(selectedCardId, delta);
    }
    // Check over-budget after transaction is persisted and store is refreshed
    if (tx.type === 'expense' && user?.notificationsEnabled) {
      const state = useAppStore.getState();
      await checkAndNotifyOverBudget(tx, state.transactions, state.budgetAllocations, state.user?.monthlyBudget ?? 0);
    }
    setSaving(false);
    setAmount('');
    setDescription('');
    setCategory('food_dining');
    setSelectedCardId(null);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="none" transparent statusBarTranslucent onRequestClose={onClose}>
      {/* Make status bar / notch area part of the overlay */}
      <StatusBar translucent backgroundColor="transparent" />
      {/* Dim overlay — see-through as sheet slides down, covers full screen incl. notch */}
      <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]} pointerEvents="none" />

      <View style={styles.sheetWrapper} pointerEvents="box-none">
        <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
          {/* Handle pill — dedicated drag zone, claims touch immediately */}
          <View {...handlePan.panHandlers} style={styles.handleWrap}>
            <View style={styles.handle} />
          </View>

          {/* Header row — separate so buttons still work */}
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

          <ScrollView style={styles.form} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
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

            {/* Card picker */}
            {cards.length > 0 && (
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>
                  {type === 'expense' ? 'Deduct from Card' : 'Add to Card'}
                  <Text style={styles.fieldOptional}> (optional)</Text>
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardPickerContent}>
                  {cards.map((card) => (
                    <MiniCard
                      key={card.id}
                      card={card}
                      selected={selectedCardId === card.id}
                      onPress={() => setSelectedCardId(selectedCardId === card.id ? null : card.id)}
                    />
                  ))}
                </ScrollView>
              </View>
            )}

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
                  <Text style={[styles.catName, category === cat.id && { color: cat.color, fontFamily: 'Cause-SemiBold' }]}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={{ height: insets.bottom + 20 }} />
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>

  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheetWrapper: {
    flex: 1,
  },
  sheet: {
    flex: 1,
    marginTop: 60,
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  handleWrap: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 14,
    paddingBottom: 10,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
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
    fontFamily: 'Cause-Bold',
    color: Colors.textDark,
  },
  saveBtn: {
    fontSize: 16,
    fontFamily: 'Cause-Bold',
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
    fontFamily: 'Cause-SemiBold',
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
    fontFamily: 'Cause-Bold',
    color: Colors.textMedium,
    marginRight: 4,
  },
  amountInput: {
    fontSize: 48,
    fontFamily: 'Cause-Bold',
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
    fontFamily: 'Cause-SemiBold',
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
  fieldOptional: { fontSize: 12, fontFamily: 'Cause-Regular', color: Colors.textLight },
  cardPickerContent: { gap: 14, paddingVertical: 8 },
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
