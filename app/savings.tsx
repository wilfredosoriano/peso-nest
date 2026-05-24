import React, { useMemo, useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Modal, TextInput, Alert,
  ImageBackground, Image, StatusBar, Animated, PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { rs } from '../src/utils/responsive';
import { Svg, Circle } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAppStore } from '../src/store';
import { Colors } from '../src/constants/Colors';
import { formatCurrency } from '../src/utils/formatters';
import { SavingsGoal } from '../src/types';
import { MiniCard } from '../src/components/ui/MiniCard';
import { showToast } from '../src/store/toastStore';

const SAVINGS_BG = require('../assets/images/backgrounds/savings-header-bg.webp');
const COIN_JAR = require('../assets/images/savings/coin-jar.webp');
const generateId = () => `sav_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

const SAVINGS_IMAGES: Record<string, any> = {
  house:     require('../assets/images/savings/house-savings.webp'),
  car:       require('../assets/images/savings/car-savings.webp'),
  camera:    require('../assets/images/savings/camera-savings.webp'),
  education: require('../assets/images/savings/education-savings.webp'),
  emergency: require('../assets/images/savings/emergency-savings.webp'),
  gift:      require('../assets/images/savings/gift-savings.webp'),
  laptop:    require('../assets/images/savings/laptop-savings.webp'),
  phone:     require('../assets/images/savings/phone-savings.webp'),
  travel:    require('../assets/images/savings/travel-savings.webp'),
  wallet:    require('../assets/images/savings/wallet-savings.webp'),
};

const PRESET_ICONS = Object.keys(SAVINGS_IMAGES);

const sheetOverlayStyle = { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' } as const;

const RingProgress = ({ pct, color, size = 56 }: { pct: number; color: string; size?: number }) => {
  const stroke = 5;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <Svg width={size} height={size}>
      <Circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.4)" strokeWidth={stroke} fill="none" />
      <Circle
        cx={size / 2} cy={size / 2} r={r}
        stroke={color} strokeWidth={stroke} fill="none"
        strokeDasharray={`${circ} ${circ}`}
        strokeDashoffset={offset}
        strokeLinecap="round"
        rotation="-90"
        originX={size / 2} originY={size / 2}
      />
    </Svg>
  );
};

export default function SavingsScreen() {
  const insets = useSafeAreaInsets();
  const savingsGoals = useAppStore((s) => s.savingsGoals);
  const savingsActivity = useAppStore((s) => s.savingsActivity);
  const hideBalance = useAppStore((s) => s.hideBalance);
  const addSavingsGoal = useAppStore((s) => s.addSavingsGoal);
  const updateSavingsAmount = useAppStore((s) => s.updateSavingsAmount);
  const removeSavingsGoal = useAppStore((s) => s.removeSavingsGoal);
  const cards = useAppStore((s) => s.cards);
  const updateCardBalance = useAppStore((s) => s.updateCardBalance);
  const user = useAppStore((s) => s.user);

  const [showAddModal, setShowAddModal] = useState(false);
  const [goalName, setGoalName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [selIcon, setSelIcon] = useState(PRESET_ICONS[0]);
  const [saving, setSaving] = useState(false);

  const [activeGoal, setActiveGoal] = useState<SavingsGoal | null>(null);
  const [txAmount, setTxAmount] = useState('');
  const [txType, setTxType] = useState<'deposit' | 'withdraw'>('deposit');
  const [txCardId, setTxCardId] = useState<string | null>(null);

  // Goal picker
  const [pickerType, setPickerType] = useState<'deposit' | 'withdraw' | null>(null);

  // Transfer
  const [transferStep, setTransferStep] = useState<'from' | 'to' | 'amount' | null>(null);
  const [transferFrom, setTransferFrom] = useState<SavingsGoal | null>(null);
  const [transferTo, setTransferTo] = useState<SavingsGoal | null>(null);
  const [transferAmt, setTransferAmt] = useState('');

  // Auto-Save
  const [showAutoSave, setShowAutoSave] = useState(false);
  const [autoGoal, setAutoGoal] = useState<SavingsGoal | null>(null);
  const [autoAmount, setAutoAmount] = useState('');
  const [autoFreq, setAutoFreq] = useState<'daily' | 'weekly' | 'monthly'>('weekly');

  // ── Animated Y refs ──────────────────────────────────────────────────────
  const transferY = useRef(new Animated.Value(800)).current;
  const autoSaveY = useRef(new Animated.Value(800)).current;
  const pickerY   = useRef(new Animated.Value(800)).current;
  const addGoalY  = useRef(new Animated.Value(800)).current;
  const activeY   = useRef(new Animated.Value(800)).current;

  // ── Overlay opacities ────────────────────────────────────────────────────
  const transferOverlay = transferY.interpolate({ inputRange: [0, 400], outputRange: [1, 0], extrapolate: 'clamp' });
  const autoSaveOverlay = autoSaveY.interpolate({ inputRange: [0, 400], outputRange: [1, 0], extrapolate: 'clamp' });
  const pickerOverlay   = pickerY.interpolate({ inputRange: [0, 400], outputRange: [1, 0], extrapolate: 'clamp' });
  const addGoalOverlay  = addGoalY.interpolate({ inputRange: [0, 400], outputRange: [1, 0], extrapolate: 'clamp' });
  const activeOverlay   = activeY.interpolate({ inputRange: [0, 400], outputRange: [1, 0], extrapolate: 'clamp' });

  // ── Slide-in effects ─────────────────────────────────────────────────────
  useEffect(() => {
    if (transferStep !== null) { transferY.setValue(800); Animated.spring(transferY, { toValue: 0, useNativeDriver: true, damping: 28, stiffness: 220 }).start(); }
  }, [transferStep]);
  useEffect(() => {
    if (showAutoSave) { autoSaveY.setValue(800); Animated.spring(autoSaveY, { toValue: 0, useNativeDriver: true, damping: 28, stiffness: 220 }).start(); }
  }, [showAutoSave]);
  useEffect(() => {
    if (pickerType !== null) { pickerY.setValue(800); Animated.spring(pickerY, { toValue: 0, useNativeDriver: true, damping: 28, stiffness: 220 }).start(); }
  }, [pickerType]);
  useEffect(() => {
    if (showAddModal) { addGoalY.setValue(800); Animated.spring(addGoalY, { toValue: 0, useNativeDriver: true, damping: 28, stiffness: 220 }).start(); }
  }, [showAddModal]);
  useEffect(() => {
    if (activeGoal !== null) { activeY.setValue(800); Animated.spring(activeY, { toValue: 0, useNativeDriver: true, damping: 28, stiffness: 220 }).start(); }
  }, [activeGoal]);

  // ── Dismiss helpers ──────────────────────────────────────────────────────
  const dismissTransfer = (dy: number, vy: number) => {
    if (dy > 100 || vy > 1.0) { Animated.timing(transferY, { toValue: 800, duration: 220, useNativeDriver: true }).start(() => setTransferStep(null)); }
    else { Animated.spring(transferY, { toValue: 0, useNativeDriver: true }).start(); }
  };
  const dismissAutoSave = (dy: number, vy: number) => {
    if (dy > 100 || vy > 1.0) { Animated.timing(autoSaveY, { toValue: 800, duration: 220, useNativeDriver: true }).start(() => setShowAutoSave(false)); }
    else { Animated.spring(autoSaveY, { toValue: 0, useNativeDriver: true }).start(); }
  };
  const dismissPicker = (dy: number, vy: number) => {
    if (dy > 100 || vy > 1.0) { Animated.timing(pickerY, { toValue: 800, duration: 220, useNativeDriver: true }).start(() => setPickerType(null)); }
    else { Animated.spring(pickerY, { toValue: 0, useNativeDriver: true }).start(); }
  };
  const dismissAddGoal = (dy: number, vy: number) => {
    if (dy > 100 || vy > 1.0) { Animated.timing(addGoalY, { toValue: 800, duration: 220, useNativeDriver: true }).start(() => setShowAddModal(false)); }
    else { Animated.spring(addGoalY, { toValue: 0, useNativeDriver: true }).start(); }
  };
  const dismissActive = (dy: number, vy: number) => {
    if (dy > 100 || vy > 1.0) { Animated.timing(activeY, { toValue: 800, duration: 220, useNativeDriver: true }).start(() => { setActiveGoal(null); setTxAmount(''); setTxCardId(null); }); }
    else { Animated.spring(activeY, { toValue: 0, useNativeDriver: true }).start(); }
  };

  // ── PanResponders ────────────────────────────────────────────────────────
  const transferPan = useRef(PanResponder.create({ onStartShouldSetPanResponder: () => true, onPanResponderMove: (_, { dy }) => { if (dy > 0) transferY.setValue(dy); }, onPanResponderRelease: (_, { dy, vy }) => dismissTransfer(dy, vy) })).current;
  const autoSavePan = useRef(PanResponder.create({ onStartShouldSetPanResponder: () => true, onPanResponderMove: (_, { dy }) => { if (dy > 0) autoSaveY.setValue(dy); }, onPanResponderRelease: (_, { dy, vy }) => dismissAutoSave(dy, vy) })).current;
  const pickerPan   = useRef(PanResponder.create({ onStartShouldSetPanResponder: () => true, onPanResponderMove: (_, { dy }) => { if (dy > 0) pickerY.setValue(dy); }, onPanResponderRelease: (_, { dy, vy }) => dismissPicker(dy, vy) })).current;
  const addGoalPan  = useRef(PanResponder.create({ onStartShouldSetPanResponder: () => true, onPanResponderMove: (_, { dy }) => { if (dy > 0) addGoalY.setValue(dy); }, onPanResponderRelease: (_, { dy, vy }) => dismissAddGoal(dy, vy) })).current;
  const activePan   = useRef(PanResponder.create({ onStartShouldSetPanResponder: () => true, onPanResponderMove: (_, { dy }) => { if (dy > 0) activeY.setValue(dy); }, onPanResponderRelease: (_, { dy, vy }) => dismissActive(dy, vy) })).current;

  const totalSaved = useMemo(() => savingsGoals.reduce((s, g) => s + g.currentAmount, 0), [savingsGoals]);
  const totalTarget = useMemo(() => savingsGoals.reduce((s, g) => s + g.targetAmount, 0), [savingsGoals]);

  const openAddModal = () => {
    setGoalName(''); setTargetAmount('');
    setSelIcon(PRESET_ICONS[0]);
    setShowAddModal(true);
  };

  const handleAddGoalPress = () => {
    if (!user?.isPremium) {
      Alert.alert(
        'Premium Feature',
        'Savings Goals are available for Premium members only.',
        [
          { text: 'Not Now', style: 'cancel' },
          { text: 'Upgrade — ₱299', onPress: () => router.push('/premium') },
        ]
      );
      return;
    }
    openAddModal();
  };

  const handleSaveGoal = async () => {
    const parsed = parseFloat(targetAmount.replace(/,/g, ''));
    if (!goalName.trim() || !parsed || parsed <= 0) return;
    setSaving(true);
    await addSavingsGoal({ id: generateId(), name: goalName.trim(), targetAmount: parsed, currentAmount: 0, color: Colors.primary, icon: selIcon, createdAt: Date.now() });
    setSaving(false);
    setShowAddModal(false);
  };

  const openTxModal = (goal: SavingsGoal, type: 'deposit' | 'withdraw') => {
    setPickerType(null);
    setActiveGoal(goal); setTxType(type); setTxAmount(''); setTxCardId(null);
  };

  const handleQuickAction = (type: 'deposit' | 'withdraw') => {
    if (savingsGoals.length === 0) { Alert.alert('No Goals', 'Create a savings goal first.'); return; }
    if (savingsGoals.length === 1) { openTxModal(savingsGoals[0], type); return; }
    setPickerType(type);
  };

  const handleTransaction = async () => {
    if (!activeGoal) return;
    const parsed = parseFloat(txAmount.replace(/,/g, ''));
    if (!parsed || parsed <= 0) return;
    const delta = txType === 'deposit' ? parsed : -parsed;
    await updateSavingsAmount(activeGoal.id, delta);
    // If a card was selected, update its balance to keep net worth accurate
    if (txCardId) {
      await updateCardBalance(txCardId, txType === 'deposit' ? -parsed : parsed);
    }
    // Check if goal is now complete
    const newAmount = activeGoal.currentAmount + delta;
    if (txType === 'deposit' && newAmount >= activeGoal.targetAmount) {
      showToast(`🎉 Goal complete!`, {
        subtitle: `"${activeGoal.name}" — you reached your target!`,
        type: 'success',
        duration: 4500,
      });
    }
    setTxCardId(null);
    setActiveGoal(null);
  };

  const handleDelete = (goal: SavingsGoal) => {
    Alert.alert('Delete Goal', `Delete "${goal.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => removeSavingsGoal(goal.id) },
    ]);
  };

  const openTransfer = () => {
    if (savingsGoals.length < 2) { Alert.alert('Need More Goals', 'You need at least 2 savings goals to transfer between them.'); return; }
    setTransferFrom(null); setTransferTo(null); setTransferAmt('');
    setTransferStep('from');
  };

  const handleTransferConfirm = async () => {
    if (!transferFrom || !transferTo) return;
    const parsed = parseFloat(transferAmt.replace(/,/g, ''));
    if (!parsed || parsed <= 0) return;
    if (parsed > transferFrom.currentAmount) {
      Alert.alert('Insufficient Balance', `"${transferFrom.name}" only has ${formatCurrency(transferFrom.currentAmount)}.`);
      return;
    }
    await updateSavingsAmount(transferFrom.id, -parsed);
    await updateSavingsAmount(transferTo.id, parsed);
    setTransferStep(null);
    Alert.alert('Transfer Complete', `${formatCurrency(parsed)} moved from "${transferFrom.name}" to "${transferTo.name}".`);
  };

  const handleAutoSaveSave = async () => {
    if (!autoGoal) { Alert.alert('Select a Goal', 'Please choose a savings goal.'); return; }
    const parsed = parseFloat(autoAmount.replace(/,/g, ''));
    if (!parsed || parsed <= 0) { Alert.alert('Invalid Amount', 'Enter a valid amount.'); return; }

    try {
      const N = (() => { try { return require('expo-notifications') as typeof import('expo-notifications'); } catch { return null; } })();
      if (N) {
        const { status } = await N.requestPermissionsAsync();
        if (status === 'granted') {
          const intervals: Record<string, number> = { daily: 86400, weekly: 604800, monthly: 2592000 };
          await N.scheduleNotificationAsync({
            identifier: `autosave_${autoGoal.id}_${autoFreq}`,
            content: {
              title: '💰 Time to Save!',
              body: `Auto-save ₱${parsed.toLocaleString('en-PH', { minimumFractionDigits: 2 })} into your "${autoGoal.name}" goal.`,
              data: { goalId: autoGoal.id },
            },
            trigger: { type: N.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: intervals[autoFreq], repeats: true },
          });
        }
      }
    } catch {}

    setShowAutoSave(false);
    setAutoGoal(null); setAutoAmount('');
    Alert.alert('Auto-Save Scheduled', `You'll get a ${autoFreq} reminder to save ${formatCurrency(parsed)} into "${autoGoal.name}".`);
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>

      {/* Hero — inside ScrollView so it scrolls with content */}
      <ImageBackground
        source={SAVINGS_BG}
        style={[styles.hero, { paddingTop: insets.top + 8 }]}
        resizeMode="cover"
      >
        <View style={styles.heroNav}>
          <TouchableOpacity onPress={() => router.back()} style={styles.navBtn}>
            <Ionicons name="arrow-back" size={rs(20)} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleAddGoalPress} style={styles.newGoalBtn}>
            <Ionicons name="add" size={rs(18)} color="#fff" />
            <Text style={styles.newGoalText}>New Goal</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.heroTitle}>Savings</Text>
        <Text style={styles.heroQuote}>"Small steps today, big dreams tomorrow."</Text>
      </ImageBackground>

      {/* Total Savings card */}
      <View style={styles.totalCard}>
        {/* Left: text + progress bar */}
        <View style={styles.totalLeft}>
          <Text style={styles.totalLabel}>Overall Progress</Text>
          <Text style={styles.totalAmount}>{hideBalance ? '₱ ••••••' : formatCurrency(totalSaved)}</Text>
          <Text style={styles.totalSub}>
            {hideBalance ? 'saved of ••••••' : `saved of ${formatCurrency(totalTarget)}`}
          </Text>
          <View style={styles.totalProgressTrack}>
            <View style={[styles.totalProgressBar, { width: `${totalTarget > 0 ? Math.min((totalSaved / totalTarget) * 100, 100) : 0}%` }]} />
          </View>
        </View>

        {/* Center: coin jar */}
        <Image source={COIN_JAR} style={styles.coinJarImage} resizeMode="contain" />

        {/* Right: ring progress */}
        <View style={styles.totalRing}>
          <RingProgress
            pct={totalTarget > 0 ? Math.min((totalSaved / totalTarget) * 100, 100) : 0}
            color={Colors.primary}
            size={rs(80)}
          />
          <View style={styles.totalRingCenter}>
            <Text style={styles.totalRingPct}>
              {totalTarget > 0 ? `${Math.round((totalSaved / totalTarget) * 100)}%` : '—'}
            </Text>
          </View>
        </View>
      </View>

      {/* My Goals */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>My Goals</Text>
        <Text style={styles.goalCount}>{savingsGoals.length} goal{savingsGoals.length !== 1 ? 's' : ''}</Text>
      </View>

      {savingsGoals.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={{ fontSize: rs(40) }}>🏦</Text>
          <Text style={styles.emptyTitle}>No savings goals yet</Text>
          <Text style={styles.emptySub}>Tap "New Goal" to get started.</Text>
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.goalsRow} style={styles.goalsScroll}>
          {savingsGoals.map((goal) => {
            const pct = goal.targetAmount > 0 ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100) : 0;
            const imgSrc = SAVINGS_IMAGES[goal.icon] ?? SAVINGS_IMAGES.wallet;
            return (
              <TouchableOpacity key={goal.id} style={styles.goalCard} activeOpacity={0.85} onLongPress={() => handleDelete(goal)} delayLongPress={500}>
                {/* Image + ring overlay */}
                <View style={styles.goalImageWrap}>
                  <Image source={imgSrc} style={styles.goalImage} resizeMode="cover" />
                  <View style={styles.ringOverlay}>
                    <RingProgress pct={pct} color={goal.color} size={rs(46)} />
                    <View style={styles.ringOverlayCenter}>
                      <Text style={[styles.ringPct, { color: goal.color }]}>{Math.round(pct)}%</Text>
                    </View>
                  </View>
                </View>

                {/* Info */}
                <View style={styles.goalBody}>
                  <Text style={styles.goalName} numberOfLines={1}>{goal.name}</Text>
                  <Text style={styles.goalAmounts}>
                    <Text style={styles.goalCurrent}>{hideBalance ? '••••••' : formatCurrency(goal.currentAmount)}</Text>
                    <Text style={styles.goalTarget}> / {hideBalance ? '••••••' : formatCurrency(goal.targetAmount)}</Text>
                  </Text>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressBar, { width: `${pct}%`, backgroundColor: goal.color }]} />
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Quick Actions */}
      <Text style={[styles.sectionTitle, { marginHorizontal: 20, marginTop: 24, marginBottom: 12 }]}>Quick Actions</Text>
      <View style={styles.actionsRow}>
        {[
          { icon: 'arrow-down-circle', label: 'Add Money', color: Colors.primary, onPress: () => handleQuickAction('deposit') },
          { icon: 'arrow-up-circle', label: 'Withdraw', color: '#E84040', onPress: () => handleQuickAction('withdraw') },
          { icon: 'repeat', label: 'Transfer', color: '#2196F3', onPress: openTransfer },
          { icon: 'alarm', label: 'Auto-Save', color: '#9C27B0', onPress: () => { if (savingsGoals.length === 0) { Alert.alert('No Goals', 'Create a savings goal first.'); return; } setAutoGoal(savingsGoals[0]); setAutoAmount(''); setAutoFreq('weekly'); setShowAutoSave(true); } },
        ].map((a) => (
          <TouchableOpacity key={a.label} style={styles.actionBtn} onPress={a.onPress} activeOpacity={0.75}>
            <View style={[styles.actionIcon, { backgroundColor: a.color + '18' }]}>
              <Ionicons name={a.icon as any} size={rs(22)} color={a.color} />
            </View>
            <Text style={styles.actionLabel}>{a.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Recent Activity */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
      </View>
      {savingsActivity.length === 0 ? (
        <View style={styles.activityEmpty}>
          <Text style={styles.activityEmptyText}>No activity yet. Start saving!</Text>
        </View>
      ) : (
        <View style={styles.activityList}>
          {savingsActivity.map((item) => {
            const isDeposit = item.type === 'deposit';
            const date = new Date(item.createdAt);
            const label = date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
            const time = date.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });
            return (
              <View key={item.id} style={styles.activityRow}>
                <View style={[styles.activityIcon, { backgroundColor: isDeposit ? Colors.primary + '18' : '#FEE2E2' }]}>
                  <Ionicons name={isDeposit ? 'arrow-down-circle' : 'arrow-up-circle'} size={rs(22)} color={isDeposit ? Colors.primary : '#E84040'} />
                </View>
                <View style={styles.activityInfo}>
                  <Text style={styles.activityGoal} numberOfLines={1}>{item.goalName}</Text>
                  <Text style={styles.activityMeta}>{isDeposit ? 'Deposit' : 'Withdraw'} · {label} {time}</Text>
                </View>
                <Text style={[styles.activityAmount, { color: isDeposit ? '#4CAF50' : '#E84040' }]}>
                  {hideBalance ? '••••••' : `${isDeposit ? '+' : '-'}${formatCurrency(item.amount)}`}
                </Text>
              </View>
            );
          })}
        </View>
      )}

      </ScrollView>

      {/* Transfer Modal */}
      <Modal visible={transferStep !== null} animationType="none" transparent statusBarTranslucent onRequestClose={() => { transferY.setValue(800); setTransferStep(null); }}>
        <StatusBar translucent backgroundColor="transparent" />
        <Animated.View style={[sheetOverlayStyle, { opacity: transferOverlay }]} pointerEvents="none" />
        <Animated.View style={{ flex: 1, marginTop: 60, transform: [{ translateY: transferY }] }}>
          <View style={styles.modal}>
            <View {...transferPan.panHandlers} style={styles.sheetHandle}>
              <View style={styles.sheetHandlePill} />
            </View>
            <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => transferStep === 'to' ? setTransferStep('from') : transferStep === 'amount' ? setTransferStep('to') : setTransferStep(null)}>
              <Ionicons name={transferStep === 'from' ? 'close' : 'arrow-back'} size={rs(24)} color={Colors.textMedium} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {transferStep === 'from' ? 'Transfer From' : transferStep === 'to' ? 'Transfer To' : 'Transfer Amount'}
            </Text>
            {transferStep === 'amount' ? (
              <TouchableOpacity onPress={handleTransferConfirm}>
                <Text style={styles.saveBtn}>Done</Text>
              </TouchableOpacity>
            ) : <View style={{ width: 40 }} />}
          </View>

          {/* Step indicator */}
          <View style={styles.transferSteps}>
            {(['from', 'to', 'amount'] as const).map((s, i) => (
              <React.Fragment key={s}>
                <View style={[styles.stepDot, (transferStep === s || (i === 0 && transferStep !== 'from') || (i === 1 && transferStep === 'amount')) && styles.stepDotActive]}>
                  <Text style={styles.stepDotText}>{i + 1}</Text>
                </View>
                {i < 2 && <View style={[styles.stepLine, ((i === 0 && transferStep !== 'from') || (i === 1 && transferStep === 'amount')) && styles.stepLineActive]} />}
              </React.Fragment>
            ))}
          </View>

          {(transferStep === 'from' || transferStep === 'to') && (
            <ScrollView contentContainerStyle={{ padding: 20, gap: 10 }} showsVerticalScrollIndicator={false}>
              {savingsGoals
                .filter((g) => transferStep === 'to' ? g.id !== transferFrom?.id : true)
                .map((goal) => {
                  const pct = goal.targetAmount > 0 ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100) : 0;
                  const imgSrc = SAVINGS_IMAGES[goal.icon] ?? SAVINGS_IMAGES.wallet;
                  return (
                    <TouchableOpacity key={goal.id} style={styles.pickerRow} activeOpacity={0.75}
                      onPress={() => {
                        if (transferStep === 'from') { setTransferFrom(goal); setTransferStep('to'); }
                        else { setTransferTo(goal); setTransferStep('amount'); }
                      }}>
                      <Image source={imgSrc} style={styles.pickerImg} resizeMode="cover" />
                      <View style={styles.pickerInfo}>
                        <Text style={styles.pickerName}>{goal.name}</Text>
                        <Text style={styles.pickerAmt}>{formatCurrency(goal.currentAmount)} <Text style={{ color: Colors.textLight }}>/ {formatCurrency(goal.targetAmount)}</Text></Text>
                        <View style={styles.progressTrack}>
                          <View style={[styles.progressBar, { width: `${pct}%`, backgroundColor: goal.color }]} />
                        </View>
                      </View>
                      <Ionicons name="chevron-forward" size={rs(18)} color={Colors.textLight} />
                    </TouchableOpacity>
                  );
                })}
            </ScrollView>
          )}

          {transferStep === 'amount' && (
            <View style={{ flex: 1 }}>
              <View style={styles.transferSummary}>
                <View style={styles.transferGoalChip}>
                  <Image source={SAVINGS_IMAGES[transferFrom?.icon ?? 'wallet']} style={styles.transferChipImg} resizeMode="cover" />
                  <Text style={styles.transferChipName} numberOfLines={1}>{transferFrom?.name}</Text>
                </View>
                <Ionicons name="arrow-forward" size={rs(20)} color={Colors.textMedium} />
                <View style={styles.transferGoalChip}>
                  <Image source={SAVINGS_IMAGES[transferTo?.icon ?? 'wallet']} style={styles.transferChipImg} resizeMode="cover" />
                  <Text style={styles.transferChipName} numberOfLines={1}>{transferTo?.name}</Text>
                </View>
              </View>
              <View style={styles.amountWrap}>
                <Text style={styles.currencySymbol}>₱</Text>
                <TextInput style={styles.amountInput} value={transferAmt} onChangeText={setTransferAmt} placeholder="0.00" placeholderTextColor={Colors.textLight} keyboardType="decimal-pad" autoFocus />
              </View>
              <Text style={styles.transferHint}>Available: {formatCurrency(transferFrom?.currentAmount ?? 0)}</Text>
            </View>
          )}
          </View>
        </Animated.View>
      </Modal>

      {/* Auto-Save Modal */}
      <Modal visible={showAutoSave} animationType="none" transparent statusBarTranslucent onRequestClose={() => { autoSaveY.setValue(800); setShowAutoSave(false); }}>
        <StatusBar translucent backgroundColor="transparent" />
        <Animated.View style={[sheetOverlayStyle, { opacity: autoSaveOverlay }]} pointerEvents="none" />
        <Animated.View style={{ flex: 1, marginTop: 60, transform: [{ translateY: autoSaveY }] }}>
          <View style={styles.modal}>
            <View {...autoSavePan.panHandlers} style={styles.sheetHandle}>
              <View style={styles.sheetHandlePill} />
            </View>
            <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAutoSave(false)}>
              <Ionicons name="close" size={rs(24)} color={Colors.textMedium} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Auto-Save</Text>
            <TouchableOpacity onPress={handleAutoSaveSave}>
              <Text style={styles.saveBtn}>Set</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
            <Text style={styles.fieldLabel}>Save to Goal</Text>
            <View style={{ gap: 8, marginBottom: 20 }}>
              {savingsGoals.map((goal) => {
                const selected = autoGoal?.id === goal.id;
                const imgSrc = SAVINGS_IMAGES[goal.icon] ?? SAVINGS_IMAGES.wallet;
                return (
                  <TouchableOpacity key={goal.id} style={[styles.pickerRow, selected && { borderWidth: 2, borderColor: Colors.primary }]} onPress={() => setAutoGoal(goal)} activeOpacity={0.75}>
                    <Image source={imgSrc} style={styles.pickerImg} resizeMode="cover" />
                    <View style={styles.pickerInfo}>
                      <Text style={styles.pickerName}>{goal.name}</Text>
                      <Text style={styles.pickerAmt}>{formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}</Text>
                    </View>
                    {selected && <Ionicons name="checkmark-circle" size={rs(22)} color={Colors.primary} />}
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={styles.fieldLabel}>Amount per reminder</Text>
            <View style={styles.amountWrap}>
              <Text style={styles.currencySymbol}>₱</Text>
              <TextInput style={styles.amountInput} value={autoAmount} onChangeText={setAutoAmount} placeholder="0.00" placeholderTextColor={Colors.textLight} keyboardType="decimal-pad" />
            </View>
            <Text style={[styles.fieldLabel, { marginBottom: 12 }]}>Frequency</Text>
            <View style={styles.freqRow}>
              {(['daily', 'weekly', 'monthly'] as const).map((f) => (
                <TouchableOpacity key={f} style={[styles.freqBtn, autoFreq === f && styles.freqBtnActive]} onPress={() => setAutoFreq(f)}>
                  <Text style={[styles.freqBtnText, autoFreq === f && styles.freqBtnTextActive]}>{f.charAt(0).toUpperCase() + f.slice(1)}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.autoSaveNote}>
              <Ionicons name="information-circle-outline" size={rs(16)} color={Colors.textLight} />
              <Text style={styles.autoSaveNoteText}>You'll receive a push notification reminder. Tap it to open the app and confirm your savings.</Text>
            </View>
            <View style={{ height: insets.bottom + 20 }} />
          </ScrollView>
        </View>
        </Animated.View>
      </Modal>

      {/* Goal Picker Modal */}
      <Modal visible={pickerType !== null} animationType="none" transparent statusBarTranslucent onRequestClose={() => { pickerY.setValue(800); setPickerType(null); }}>
        <StatusBar translucent backgroundColor="transparent" />
        <Animated.View style={[sheetOverlayStyle, { opacity: pickerOverlay }]} pointerEvents="none" />
        <Animated.View style={{ flex: 1, marginTop: 60, transform: [{ translateY: pickerY }] }}>
          <View style={styles.modal}>
            <View {...pickerPan.panHandlers} style={styles.sheetHandle}>
              <View style={styles.sheetHandlePill} />
            </View>
            <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setPickerType(null)}>
              <Ionicons name="close" size={rs(24)} color={Colors.textMedium} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{pickerType === 'deposit' ? 'Add Money To' : 'Withdraw From'}</Text>
            <View style={{ width: 24 }} />
          </View>
          <ScrollView contentContainerStyle={{ padding: 20, gap: 10 }} showsVerticalScrollIndicator={false}>
            {savingsGoals.map((goal) => {
              const pct = goal.targetAmount > 0 ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100) : 0;
              const imgSrc = SAVINGS_IMAGES[goal.icon] ?? SAVINGS_IMAGES.wallet;
              return (
                <TouchableOpacity key={goal.id} style={styles.pickerRow} onPress={() => openTxModal(goal, pickerType!)} activeOpacity={0.75}>
                  <Image source={imgSrc} style={styles.pickerImg} resizeMode="cover" />
                  <View style={styles.pickerInfo}>
                    <Text style={styles.pickerName}>{goal.name}</Text>
                    <Text style={styles.pickerAmt}>{formatCurrency(goal.currentAmount)} <Text style={{ color: Colors.textLight }}>/ {formatCurrency(goal.targetAmount)}</Text></Text>
                    <View style={styles.progressTrack}>
                      <View style={[styles.progressBar, { width: `${pct}%`, backgroundColor: goal.color }]} />
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={rs(18)} color={Colors.textLight} />
                </TouchableOpacity>
              );
            })}
            <View style={{ height: insets.bottom }} />
          </ScrollView>
        </View>
        </Animated.View>
      </Modal>

      {/* Add Goal Modal */}
      <Modal visible={showAddModal} animationType="none" transparent statusBarTranslucent onRequestClose={() => { addGoalY.setValue(800); setShowAddModal(false); }}>
        <StatusBar translucent backgroundColor="transparent" />
        <Animated.View style={[sheetOverlayStyle, { opacity: addGoalOverlay }]} pointerEvents="none" />
        <Animated.View style={{ flex: 1, marginTop: 60, transform: [{ translateY: addGoalY }] }}>
          <View style={styles.modal}>
            <View {...addGoalPan.panHandlers} style={styles.sheetHandle}>
              <View style={styles.sheetHandlePill} />
            </View>
            <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Ionicons name="close" size={rs(24)} color={Colors.textMedium} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>New Savings Goal</Text>
            <TouchableOpacity onPress={handleSaveGoal} disabled={saving}>
              <Text style={[styles.saveBtn, saving && { opacity: 0.4 }]}>Save</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Goal Name</Text>
              <TextInput style={styles.fieldInput} value={goalName} onChangeText={setGoalName} placeholder="e.g. Dream Home, Vacation..." placeholderTextColor={Colors.textLight} />
            </View>
            <View style={styles.amountWrap}>
              <Text style={styles.currencySymbol}>₱</Text>
              <TextInput style={styles.amountInput} value={targetAmount} onChangeText={setTargetAmount} placeholder="0.00" placeholderTextColor={Colors.textLight} keyboardType="decimal-pad" />
            </View>
            <Text style={styles.fieldLabel}>Category Image</Text>
            <View style={styles.iconGrid}>
              {PRESET_ICONS.map((key) => (
                <TouchableOpacity
                  key={key}
                  style={styles.iconItem}
                  onPress={() => setSelIcon(key)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.iconImageWrap, selIcon === key && styles.iconItemSelected]}>
                    <Image source={SAVINGS_IMAGES[key]} style={styles.iconPreview} resizeMode="cover" />
                    {selIcon === key && (
                      <View style={styles.iconCheck}>
                        <Ionicons name="checkmark" size={rs(10)} color="#fff" />
                      </View>
                    )}
                  </View>
                  <Text style={[styles.iconLabel, selIcon === key && { color: Colors.primary, fontFamily: 'Cause-Bold' }]} numberOfLines={1}>
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={{ height: insets.bottom + 20 }} />
          </ScrollView>
        </View>
        </Animated.View>
      </Modal>

      {/* Deposit / Withdraw Modal */}
      <Modal visible={activeGoal !== null} animationType="none" transparent statusBarTranslucent onRequestClose={() => { activeY.setValue(800); setActiveGoal(null); setTxAmount(''); setTxCardId(null); }}>
        <StatusBar translucent backgroundColor="transparent" />
        <Animated.View style={[sheetOverlayStyle, { opacity: activeOverlay }]} pointerEvents="none" />
        <Animated.View style={{ flex: 1, marginTop: 60, transform: [{ translateY: activeY }] }}>
          <View style={styles.modal}>
            <View {...activePan.panHandlers} style={styles.sheetHandle}>
              <View style={styles.sheetHandlePill} />
            </View>
            <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => { setActiveGoal(null); setTxAmount(''); setTxCardId(null); }}>
              <Ionicons name="close" size={rs(24)} color={Colors.textMedium} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{txType === 'deposit' ? 'Add Money' : 'Withdraw'}</Text>
            <TouchableOpacity onPress={handleTransaction}>
              <Text style={styles.saveBtn}>Done</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
            {activeGoal && <Text style={styles.txGoalName}>{activeGoal.name}</Text>}
            <View style={styles.txToggleRow}>
              {(['deposit', 'withdraw'] as const).map((t) => (
                <TouchableOpacity key={t} style={[styles.txBtn, txType === t && styles.txBtnActive]} onPress={() => setTxType(t)}>
                  <Text style={[styles.txBtnText, txType === t && styles.txBtnTextActive]}>{t.charAt(0).toUpperCase() + t.slice(1)}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.amountWrap}>
              <Text style={styles.currencySymbol}>₱</Text>
              <TextInput style={styles.amountInput} value={txAmount} onChangeText={setTxAmount} placeholder="0.00" placeholderTextColor={Colors.textLight} keyboardType="decimal-pad" />
            </View>

            {/* Optional card picker — so net worth stays accurate */}
            {cards.length > 0 && (
              <View style={{ marginTop: 4 }}>
                <Text style={styles.fieldLabel}>
                  {txType === 'deposit' ? 'Deduct from Card' : 'Return to Card'}
                  <Text style={styles.fieldOptional}> (optional)</Text>
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardPickerContent}>
                  {cards.map((card) => (
                    <MiniCard
                      key={card.id}
                      card={card}
                      selected={txCardId === card.id}
                      onPress={() => setTxCardId(txCardId === card.id ? null : card.id)}
                    />
                  ))}
                </ScrollView>
              </View>
            )}
            <View style={{ height: insets.bottom + 20 }} />
          </ScrollView>
        </View>
        </Animated.View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDF1E7' },

  // Hero
  hero: { paddingHorizontal: 20, paddingBottom: 48 },
  heroNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  navBtn: { width: rs(36), height: rs(36), borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.25)', alignItems: 'center', justifyContent: 'center' },
  newGoalBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)' },
  newGoalText: { fontSize: rs(13), fontFamily: 'Cause-Bold', color: '#fff' },
  heroTitle: { fontSize: rs(36), fontFamily: 'Cause-ExtraBold', color: '#fff', marginBottom: 4, textShadowColor: 'rgba(0,0,0,0.25)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  heroQuote: { fontSize: rs(13), fontFamily: 'Cause-Medium', color: 'rgba(255,255,255,0.9)', fontStyle: 'italic' },

  // Total card
  totalCard: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginTop: -28, backgroundColor: '#fff', borderRadius: 20, paddingLeft: 16, paddingRight: 12, paddingVertical: 14, shadowColor: 'rgba(233,123,59,0.15)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 12, elevation: 8, zIndex: 10 },
  totalLeft: { flex: 1, justifyContent: 'center' },
  totalLabel: { fontSize: rs(12), fontFamily: 'Cause-SemiBold', color: Colors.textMedium, marginBottom: 4 },
  totalAmount: { fontSize: rs(24), fontFamily: 'Cause-ExtraBold', color: Colors.primary, marginBottom: 2 },
  totalSub: { fontSize: rs(11), color: Colors.textLight, fontFamily: 'Cause-Regular', marginBottom: 8 },
  totalProgressTrack: { height: 6, backgroundColor: '#F0DCC8', borderRadius: 3, overflow: 'hidden' },
  totalProgressBar: { height: '100%', backgroundColor: Colors.primary, borderRadius: 3 },
  coinJarImage: { width: rs(110), height: rs(100), marginHorizontal: 4 },
  totalRing: { alignItems: 'center', justifyContent: 'center' },
  totalRingCenter: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  totalRingPct: { fontSize: rs(16), fontFamily: 'Cause-ExtraBold', color: Colors.primary },

  // Section
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 20, marginTop: 24, marginBottom: 12 },
  sectionTitle: { fontSize: rs(16), fontFamily: 'Cause-ExtraBold', color: '#1A0E00' },
  goalCount: { fontSize: rs(12), fontFamily: 'Cause-SemiBold', color: Colors.textLight },

  // Goal cards (horizontal image cards)
  goalsScroll: { flexGrow: 0 },
  goalsRow: { paddingHorizontal: 20, gap: 14, paddingBottom: 4, alignItems: 'flex-start' },
  goalCard: { width: 148, backgroundColor: '#fff', borderRadius: 18, overflow: 'hidden', shadowColor: 'rgba(233,123,59,0.12)', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 1, shadowRadius: 8, elevation: 3 },
  goalImageWrap: { width: '100%', height: 90, position: 'relative' },
  goalImage: { width: '100%', height: '100%' },
  ringOverlay: { position: 'absolute', bottom: 6, right: 6, width: 46, height: 46, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: 23 },
  ringOverlayCenter: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  ringPct: { fontSize: rs(11), fontFamily: 'Cause-ExtraBold' },
  goalBody: { paddingHorizontal: 10, paddingVertical: 8, gap: 4 },
  goalName: { fontSize: rs(13), fontFamily: 'Cause-Bold', color: '#1A0E00' },
  goalAmounts: { fontSize: rs(11) },
  goalCurrent: { fontFamily: 'Cause-SemiBold', color: '#1A0E00' },
  goalTarget: { color: Colors.textLight, fontFamily: 'Cause-Regular' },
  progressTrack: { height: 5, backgroundColor: '#F0DCC8', borderRadius: 3, overflow: 'hidden' },
  progressBar: { height: '100%', borderRadius: 3 },

  // Quick actions
  actionsRow: { flexDirection: 'row', marginHorizontal: 20, gap: 10 },
  actionBtn: { flex: 1, alignItems: 'center', gap: 6 },
  actionIcon: { width: rs(54), height: rs(54), borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontSize: rs(11), fontFamily: 'Cause-SemiBold', color: Colors.textMedium, textAlign: 'center' },

  // Empty
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyTitle: { fontSize: rs(15), fontFamily: 'Cause-Bold', color: '#8B6F47', marginTop: 10 },
  emptySub: { fontSize: rs(12), color: '#C4A882', marginTop: 4 },

  // Goal picker
  pickerRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 12, gap: 12, shadowColor: 'rgba(233,123,59,0.08)', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 6, elevation: 2 },
  pickerImg: { width: rs(52), height: rs(52), borderRadius: 10 },
  pickerInfo: { flex: 1, gap: 3 },
  pickerName: { fontSize: rs(14), fontFamily: 'Cause-Bold', color: '#1A0E00' },
  pickerAmt: { fontSize: rs(12), fontFamily: 'Cause-SemiBold', color: '#1A0E00' },

  // Recent Activity
  activityList: { marginHorizontal: 20, backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', shadowColor: 'rgba(233,123,59,0.08)', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 6, elevation: 2 },
  activityRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 12, borderBottomWidth: 1, borderBottomColor: '#F5EAE0' },
  activityIcon: { width: rs(40), height: rs(40), borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  activityInfo: { flex: 1 },
  activityGoal: { fontSize: rs(13), fontFamily: 'Cause-Bold', color: '#1A0E00' },
  activityMeta: { fontSize: rs(11), color: Colors.textLight, marginTop: 1 },
  activityAmount: { fontSize: rs(13), fontFamily: 'Cause-ExtraBold', flexShrink: 0 },
  activityEmpty: { marginHorizontal: 20, paddingVertical: 20, alignItems: 'center' },
  activityEmptyText: { fontSize: rs(13), color: Colors.textLight, fontFamily: 'Cause-Regular' },

  // Modals
  modal: { flex: 1, backgroundColor: Colors.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, paddingTop: 24 },
  modalTitle: { fontSize: rs(17), fontFamily: 'Cause-Bold', color: Colors.textDark },
  saveBtn: { fontSize: rs(16), fontFamily: 'Cause-Bold', color: Colors.primary },
  field: { marginBottom: 16 },
  fieldLabel: { fontSize: rs(13), fontFamily: 'Cause-SemiBold', color: Colors.textMedium, marginBottom: 8 },
  fieldInput: { backgroundColor: Colors.card, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: rs(15), color: Colors.textDark, borderWidth: 1, borderColor: Colors.border },
  amountWrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 20 },
  currencySymbol: { fontSize: rs(32), fontFamily: 'Cause-Bold', color: Colors.textMedium, marginRight: 4 },
  amountInput: { fontSize: rs(48), fontFamily: 'Cause-Bold', color: Colors.textDark, minWidth: 120, textAlign: 'center' },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  iconItem: { width: '18%', alignItems: 'center', gap: 4 },
  iconImageWrap: { width: '100%', aspectRatio: 1, borderRadius: 12, overflow: 'hidden', borderWidth: 2, borderColor: Colors.border, position: 'relative' },
  iconItemSelected: { borderColor: Colors.primary, borderWidth: 2.5 },
  iconPreview: { width: '100%', height: '100%' },
  iconCheck: { position: 'absolute', top: 4, right: 4, width: rs(18), height: rs(18), borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primary },
  iconLabel: { fontSize: rs(10), fontFamily: 'Cause-Regular', color: Colors.textMedium, textAlign: 'center' },
  txGoalName: { fontSize: rs(16), fontFamily: 'Cause-Bold', color: Colors.textDark, textAlign: 'center', marginBottom: 16 },
  txToggleRow: { flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: 12, padding: 4, marginBottom: 4 },
  txBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
  txBtnActive: { backgroundColor: Colors.primary },
  txBtnText: { fontSize: rs(14), fontFamily: 'Cause-SemiBold', color: Colors.textMedium },
  txBtnTextActive: { color: '#fff' },

  // Transfer step indicator
  transferSteps: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, paddingBottom: 16 },
  stepDot: { width: rs(28), height: rs(28), borderRadius: 14, backgroundColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  stepDotActive: { backgroundColor: Colors.primary },
  stepDotText: { fontSize: rs(12), fontFamily: 'Cause-Bold', color: '#fff' },
  stepLine: { flex: 1, height: 2, backgroundColor: Colors.border, marginHorizontal: 4 },
  stepLineActive: { backgroundColor: Colors.primary },

  // Transfer amount step
  transferSummary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 20 },
  transferGoalChip: { flex: 1, alignItems: 'center', gap: 6 },
  transferChipImg: { width: rs(56), height: rs(56), borderRadius: 14 },
  transferChipName: { fontSize: rs(12), fontFamily: 'Cause-SemiBold', color: Colors.textDark, textAlign: 'center' },
  transferHint: { textAlign: 'center', fontSize: rs(12), color: Colors.textLight, fontFamily: 'Cause-Regular', marginTop: 4 },

  // Auto-Save frequency
  freqRow: { flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: 12, padding: 4, marginBottom: 20, gap: 4 },
  freqBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
  freqBtnActive: { backgroundColor: Colors.primary },
  freqBtnText: { fontSize: rs(13), fontFamily: 'Cause-SemiBold', color: Colors.textMedium },
  freqBtnTextActive: { color: '#fff' },

  // Auto-Save info note
  autoSaveNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: Colors.surface, borderRadius: 12, padding: 12 },
  autoSaveNoteText: { flex: 1, fontSize: rs(12), color: Colors.textLight, fontFamily: 'Cause-Regular', lineHeight: 18 },

  // Drag-down handle
  sheetHandle:     { width: '100%', alignItems: 'center', paddingTop: 14, paddingBottom: 10 },
  sheetHandlePill: { width: 36, height: 4, backgroundColor: '#D0C0B0', borderRadius: 2 },

  // Card picker (inside deposit/withdraw modal)
  fieldOptional: { fontSize: rs(12), fontFamily: 'Cause-Regular', color: Colors.textLight },
  cardPickerContent: { gap: 14, paddingVertical: 8 },
});
