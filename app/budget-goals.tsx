import React, { useRef, useState, useMemo, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Alert, PanResponder, ImageBackground, Image, Modal, StatusBar,
  Animated, KeyboardAvoidingView, Dimensions,
} from 'react-native';

const FREE_ALLOC_LIMIT = 3;

const WINDOW_H = Dimensions.get('window').height;

import { rs } from '../src/utils/responsive';

import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAppStore } from '../src/store';
import { Colors } from '../src/constants/Colors';
import { formatCurrency } from '../src/utils/formatters';

import { DEFAULT_ALLOC_PCTS } from '../src/constants/Budget';
import { CATEGORIES } from '../src/constants/Categories';

const BUDGET_BG  = require('../assets/images/backgrounds/budget-header-bg.webp');
const CALENDAR   = require('../assets/images/budgets/calendar.webp');
const COIN_JAR_V2 = require('../assets/images/budgets/coin-jarv2.webp');

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
type Period = 'monthly' | 'weekly' | 'yearly';

type Allocation = { id: string; name: string; icon: string; color: string; pct: number };

// Derive allocations directly from expense transaction categories — same IDs, no separate mapping needed.
const DEFAULT_ALLOCATIONS: Allocation[] = CATEGORIES
  .filter((c) => (c.type === 'expense' || c.type === 'both') && DEFAULT_ALLOC_PCTS[c.id] !== undefined)
  .map((c) => ({ id: c.id, name: c.name, icon: c.icon, color: c.color, pct: DEFAULT_ALLOC_PCTS[c.id] }));

// ─── Custom Slider ────────────────────────────────────────────────────────────
// Only the thumb circle is draggable — tapping the track line does nothing.
const BudgetSlider: React.FC<{ value: number; onChange: (v: number) => void; color: string }> = ({ value, onChange, color }) => {
  const trackRef = useRef<View>(null);
  const metrics  = useRef({ x: 0, w: 0 });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder:  () => true,
      onPanResponderGrant: () => {
        // Measure track so moves can calculate position — but do NOT set value on tap.
        trackRef.current?.measure((_x, _y, w, _h, pageX) => {
          metrics.current = { x: pageX, w };
        });
      },
      onPanResponderMove: (e) => {
        const { x, w } = metrics.current;
        if (!w) return;
        const pct = Math.max(1, Math.min(99, Math.round(((e.nativeEvent.pageX - x) / w) * 100)));
        onChange(pct);
      },
    })
  ).current;

  const pct = Math.max(0, Math.min(100, value));

  return (
    <View ref={trackRef} style={sliderStyle.track}>
      {/* Track — no touch handlers so scroll still works */}
      <View style={sliderStyle.bg}>
        <View style={[sliderStyle.fill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      {/* Larger hit area around the thumb for easy grabbing */}
      <View
        {...panResponder.panHandlers}
        style={[sliderStyle.thumbHit, { left: `${pct}%`, transform: [{ translateX: -20 }] }]}
      >
        <View style={[sliderStyle.thumb, { backgroundColor: color }]} />
      </View>
    </View>
  );
};

const sliderStyle = StyleSheet.create({
  track:    { height: 36, justifyContent: 'center' },
  bg:       { height: 6, backgroundColor: '#F0DCC8', borderRadius: 3 },
  fill:     { height: '100%', borderRadius: 3 },
  thumbHit: { position: 'absolute', width: 40, height: 36, alignItems: 'center', justifyContent: 'center' },
  thumb: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 3, borderColor: '#fff',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18, shadowRadius: 4, elevation: 4,
  },
});
// ─────────────────────────────────────────────────────────────────────────────

export default function BudgetGoalsScreen() {
  const insets              = useSafeAreaInsets();
  const user                = useAppStore((s) => s.user);
  const updateUser          = useAppStore((s) => s.updateUser);
  const transactions        = useAppStore((s) => s.transactions);
  const setBudgetAllocations = useAppStore((s) => s.setBudgetAllocations);

  const now = new Date();
  const [period,   setPeriod]   = useState<Period>('monthly');
  const [selYear,  setSelYear]  = useState(now.getFullYear());
  const [selMonth, setSelMonth] = useState(now.getMonth());

  const [periodMenuOpen, setPeriodMenuOpen] = useState(false);
  const [periodBtnLayout, setPeriodBtnLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const periodBtnRef = useRef<View>(null);

  const openPeriodMenu = () => {
    periodBtnRef.current?.measureInWindow((x, y, width, height) => {
      setPeriodBtnLayout({ x, y, width, height });
      setPeriodMenuOpen(true);
    });
  };

  const [budgetStr,     setBudgetStr]     = useState(String(user?.monthlyBudget ?? 10000));
  const [editingBudget, setEditingBudget] = useState(false);
  const [allocations,   setAllocations]  = useState<Allocation[]>(DEFAULT_ALLOCATIONS);
  const [saving,        setSaving]        = useState(false);
  const [showReport,    setShowReport]    = useState(false);

  const reportY = useRef(new Animated.Value(800)).current;
  const reportOverlayOpacity = reportY.interpolate({ inputRange: [0, 400], outputRange: [1, 0], extrapolate: 'clamp' });
  useEffect(() => {
    if (showReport) { reportY.setValue(800); Animated.spring(reportY, { toValue: 0, useNativeDriver: true, damping: 28, stiffness: 220 }).start(); }
  }, [showReport]);
  const dismissReport = (dy: number, vy: number) => {
    if (dy > 100 || vy > 1.0) { Animated.timing(reportY, { toValue: 800, duration: 220, useNativeDriver: true }).start(() => setShowReport(false)); }
    else { Animated.spring(reportY, { toValue: 0, useNativeDriver: true }).start(); }
  };
  const reportPan = useRef(PanResponder.create({ onStartShouldSetPanResponder: () => true, onPanResponderMove: (_, { dy }) => { if (dy > 0) reportY.setValue(dy); }, onPanResponderRelease: (_, { dy, vy }) => dismissReport(dy, vy) })).current;

  const budgetVal    = parseFloat(budgetStr.replace(/,/g, '')) || 0;
  const totalPct     = allocations.reduce((s, a) => s + a.pct, 0);
  const isCurrentMo  = selYear === now.getFullYear() && selMonth === now.getMonth();

  const periodTxns = useMemo(() => {
    return transactions.filter((t) => {
      if (t.type !== 'expense') return false;
      const d = new Date(t.date);
      if (period === 'monthly') return d.getMonth() === selMonth && d.getFullYear() === selYear;
      if (period === 'yearly')  return d.getFullYear() === selYear;
      // weekly — last 7 days
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return d >= weekAgo;
    });
  }, [transactions, period, selMonth, selYear]);

  const spendingByAlloc = useMemo(() => {
    const map: Record<string, number> = {};
    for (const alloc of allocations) {
      map[alloc.id] = periodTxns
        .filter((t) => t.category === alloc.id)
        .reduce((s, t) => s + t.amount, 0);
    }
    return map;
  }, [periodTxns, allocations]);

  const overBudgetCount = useMemo(() =>
    allocations.filter((a) => {
      const allocated = (a.pct / 100) * budgetVal;
      return allocated > 0 && (spendingByAlloc[a.id] ?? 0) > allocated;
    }).length,
  [allocations, spendingByAlloc, budgetVal]);

  const monthLabel   = `${MONTHS[selMonth]} ${selYear}`;

  const goPrev = () => {
    if (selMonth === 0) { setSelYear((y) => y - 1); setSelMonth(11); }
    else setSelMonth((m) => m - 1);
  };
  const goNext = () => {
    if (isCurrentMo) return;
    if (selMonth === 11) { setSelYear((y) => y + 1); setSelMonth(0); }
    else setSelMonth((m) => m + 1);
  };

  const updateAllocation = (id: string, newPct: number) => {
    setAllocations((prev) => {
      const others         = prev.filter((a) => a.id !== id);
      const othersTotal    = 100 - newPct;
      const curOthersTotal = others.reduce((s, a) => s + a.pct, 0);
      return prev.map((a) => {
        if (a.id === id) return { ...a, pct: newPct };
        if (curOthersTotal === 0) return { ...a, pct: Math.round(othersTotal / others.length) };
        return { ...a, pct: Math.max(1, Math.round((a.pct / curOthersTotal) * othersTotal)) };
      });
    });
  };

  const autoAllocate = () => setAllocations(DEFAULT_ALLOCATIONS.map((d) => ({ ...d })));

  const commitSave = async () => {
    setSaving(true);
    await updateUser({ monthlyBudget: budgetVal });
    const record: Record<string, number> = {};
    allocations.forEach((a) => { record[a.id] = a.pct; });
    setBudgetAllocations(record);
    setSaving(false);
    Alert.alert('Budget Saved! 🎉', `Your ${period} budget of ${formatCurrency(budgetVal)} has been set.`);
  };

  const handleSave = async () => {
    if (budgetVal <= 0) { Alert.alert('Invalid Budget', 'Please enter a valid budget amount.'); return; }

    const overBudget = allocations.filter((a) => {
      const allocated = (a.pct / 100) * budgetVal;
      const spent = spendingByAlloc[a.id] ?? 0;
      return spent > allocated && allocated > 0;
    });

    if (overBudget.length > 0) {
      const names = overBudget.map((a) => a.name).join(', ');
      Alert.alert(
        'Over Budget Warning ⚠️',
        `You've exceeded your allocation for: ${names}. Consider adjusting your budget or spending.`,
        [
          { text: 'Review', style: 'cancel' },
          { text: 'Save Anyway', onPress: commitSave },
        ]
      );
      return;
    }

    await commitSave();
  };

  return (
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 + insets.bottom }} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>

        {/* Hero */}
        <ImageBackground
          source={BUDGET_BG}
          style={[styles.hero, { paddingTop: insets.top + 8 }]}
          resizeMode="cover"
        >
          <LinearGradient colors={['rgba(0,0,0,0.18)', 'rgba(0,0,0,0.06)']} style={StyleSheet.absoluteFill} />
          <View style={styles.heroNav}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={rs(20)} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.analyticsBtn} onPress={() => setShowReport(true)}>
              <Ionicons name="analytics-outline" size={rs(22)} color="#fff" />
              {overBudgetCount > 0 && (
                <View style={styles.analyticsBadge}>
                  <Text style={styles.analyticsBadgeText}>{overBudgetCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
          <View style={styles.heroText}>
            <Text style={styles.heroTitle}>Set Budget</Text>
            <Text style={styles.heroSub}>Plan your money, prioritize what matters. ♡</Text>
          </View>
        </ImageBackground>

        <View style={styles.body}>

          {/* ── Step 1: Budget Period ── */}
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.stepTitle}>1. Choose Budget Period</Text>
                {/* Dropdown trigger */}
                <TouchableOpacity
                  ref={periodBtnRef}
                  style={styles.periodDropBtn}
                  onPress={openPeriodMenu}
                  activeOpacity={0.8}
                >
                  <Ionicons name="calendar-outline" size={rs(14)} color={Colors.primary} />
                  <Text style={styles.periodDropText}>
                    {period.charAt(0).toUpperCase() + period.slice(1)}
                  </Text>
                  <Ionicons name={periodMenuOpen ? 'chevron-up' : 'chevron-down'} size={rs(14)} color={Colors.primary} />
                </TouchableOpacity>
                {period === 'monthly' && (
                  <View style={styles.monthNav}>
                    <Text style={styles.monthNavFor}>For</Text>
                    <TouchableOpacity onPress={goPrev} style={styles.monthArrow}>
                      <Ionicons name="chevron-back" size={rs(16)} color={Colors.primary} />
                    </TouchableOpacity>
                    <Text style={styles.monthLabel}>{monthLabel}</Text>
                    <TouchableOpacity onPress={goNext} style={[styles.monthArrow, isCurrentMo && { opacity: 0.3 }]}>
                      <Ionicons name="chevron-forward" size={rs(16)} color={isCurrentMo ? Colors.border : Colors.primary} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
              <Image source={CALENDAR} style={styles.cardIllustration} resizeMode="contain" />
            </View>
          </View>

          {/* ── Step 2: Total Budget ── */}
          <View style={styles.card}>
            <View style={styles.step2Row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.stepTitle}>2. Set Your Total Budget</Text>
                <Text style={styles.stepSub}>This is the total amount you plan to spend this {period}.</Text>
                {editingBudget ? (
                  <View style={styles.budgetEditWrap}>
                    <Text style={styles.budgetEditCurrency}>₱</Text>
                    <TextInput
                      style={styles.budgetEditInput}
                      value={budgetStr}
                      onChangeText={setBudgetStr}
                      keyboardType="decimal-pad"
                      autoFocus
                      onBlur={() => setEditingBudget(false)}
                      onSubmitEditing={() => setEditingBudget(false)}
                    />
                  </View>
                ) : (
                  <TouchableOpacity style={styles.budgetDisplay} onPress={() => setEditingBudget(true)} activeOpacity={0.8}>
                    <Text style={styles.budgetAmount}>
                      ₱ {budgetVal.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                    </Text>
                    <Ionicons name="pencil-outline" size={rs(18)} color={Colors.textLight} />
                  </TouchableOpacity>
                )}
              </View>
              <Image source={COIN_JAR_V2} style={styles.step2Jar} resizeMode="contain" />
            </View>
          </View>

          {/* ── Step 3: Allocate to Categories ── */}
          <View style={styles.card}>
            <View style={styles.step3Header}>
              <View style={{ flex: 1 }}>
                <Text style={styles.stepTitle}>3. Allocate to Categories</Text>
                <Text style={styles.stepSub}>Decide how much to spend in each category.</Text>
              </View>
              <TouchableOpacity style={styles.autoAllocBtn} onPress={autoAllocate}>
                <Ionicons name="refresh" size={rs(13)} color={Colors.primary} />
                <Text style={styles.autoAllocText}>Auto Allocate</Text>
              </TouchableOpacity>
            </View>

            {allocations.map((alloc, index) => {
              const amount = budgetVal > 0 ? (alloc.pct / 100) * budgetVal : 0;
              const isLocked = !user?.isPremium && index >= FREE_ALLOC_LIMIT;
              return (
                <View key={alloc.id} style={[styles.allocRow, { position: 'relative' }]}>
                  <View style={[styles.allocIcon, { backgroundColor: alloc.color + '20' }]}>
                    <Ionicons name={alloc.icon as any} size={rs(18)} color={alloc.color} />
                  </View>
                  <View style={styles.allocBody}>
                    <View style={styles.allocTopRow}>
                      <Text style={styles.allocName}>{alloc.name}</Text>
                      <View style={[styles.allocPctBadge, { backgroundColor: alloc.color + '20' }]}>
                        <Text style={[styles.allocPct, { color: alloc.color }]}>{alloc.pct}%</Text>
                      </View>
                      <Text style={styles.allocAmount}>{formatCurrency(amount)}</Text>
                    </View>
                    <BudgetSlider value={alloc.pct} onChange={(v) => updateAllocation(alloc.id, v)} color={alloc.color} />
                  </View>
                  {isLocked && (
                    <TouchableOpacity
                      style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(253,241,231,0.85)', borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 }}
                      activeOpacity={0.9}
                      onPress={() => Alert.alert('Premium Feature', 'Unlock all budget categories with Premium.', [{ text: 'Not Now', style: 'cancel' }, { text: 'Upgrade — ₱299', onPress: () => router.push('/premium') }])}
                    >
                      <Ionicons name="lock-closed" size={rs(14)} color={Colors.primary} />
                      <Text style={{ fontSize: rs(12), fontFamily: 'Cause-SemiBold', color: Colors.primary }}>Premium</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}

            {/* Total row */}
            <View style={styles.allocTotalRow}>
              <Text style={styles.allocTotalLabel}>Total</Text>
              <Text style={[styles.allocTotalPct, { color: totalPct === 100 ? Colors.primary : Colors.expense }]}>
                {totalPct}%
              </Text>
              <Text style={[styles.allocTotalAmt, { color: totalPct === 100 ? Colors.primary : Colors.expense }]}>
                {formatCurrency(budgetVal)}
              </Text>
            </View>
          </View>

        </View>
      </ScrollView>

      {/* ── Spending Report Modal ── */}
      <Modal visible={showReport} animationType="none" transparent statusBarTranslucent onRequestClose={() => setShowReport(false)}>
        <StatusBar translucent backgroundColor="transparent" />
        <Animated.View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)', opacity: reportOverlayOpacity }} pointerEvents="none" />
        <View style={styles.reportModalWrap}>
          <Animated.View style={{ transform: [{ translateY: reportY }] }}>
          <View style={[styles.reportSheet, { maxHeight: WINDOW_H * 0.75, paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.reportHandle} {...reportPan.panHandlers}>
            <View style={styles.sheetHandlePill} />
          </View>
          <View style={styles.reportHeader}>
            <Text style={styles.reportTitle}>Spending Report</Text>
            <TouchableOpacity onPress={() => setShowReport(false)}>
              <Ionicons name="close" size={rs(22)} color={Colors.textMedium} />
            </TouchableOpacity>
          </View>
          {overBudgetCount > 0 ? (
            <View style={styles.reportWarningBanner}>
              <Ionicons name="warning" size={rs(15)} color={Colors.expense} />
              <Text style={styles.reportWarningText}>{overBudgetCount} {overBudgetCount === 1 ? 'category' : 'categories'} over budget</Text>
            </View>
          ) : (
            <View style={[styles.reportWarningBanner, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="checkmark-circle" size={rs(15)} color="#4CAF50" />
              <Text style={[styles.reportWarningText, { color: '#2E7D32' }]}>All categories within budget</Text>
            </View>
          )}
          <ScrollView showsVerticalScrollIndicator={false} style={{ flexShrink: 1 }}>
            {allocations.map((alloc) => {
              const allocated = budgetVal > 0 ? (alloc.pct / 100) * budgetVal : 0;
              const spent     = spendingByAlloc[alloc.id] ?? 0;
              const isOver    = allocated > 0 && spent > allocated;
              const fillPct   = allocated > 0 ? Math.min((spent / allocated) * 100, 100) : 0;
              return (
                <View key={alloc.id} style={styles.reportRow}>
                  <View style={[styles.reportIcon, { backgroundColor: isOver ? Colors.expenseLight : alloc.color + '18' }]}>
                    <Ionicons name={alloc.icon as any} size={rs(17)} color={isOver ? Colors.expense : alloc.color} />
                  </View>
                  <View style={styles.reportBody}>
                    <View style={styles.reportRowTop}>
                      <Text style={styles.reportCatName}>{alloc.name}</Text>
                      <Text style={[styles.reportAmt, isOver && { color: Colors.expense }]}>
                        {formatCurrency(spent)} / {formatCurrency(allocated)}
                      </Text>
                    </View>
                    <View style={styles.reportTrack}>
                      <View style={[styles.reportFill, {
                        width: `${fillPct}%`,
                        backgroundColor: isOver ? Colors.expense : '#4CAF50',
                      }]} />
                    </View>
                    {isOver && (
                      <Text style={styles.reportOverLabel}>
                        ₱{(spent - allocated).toLocaleString('en-PH', { minimumFractionDigits: 2 })} over
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </ScrollView>
          </View>
          </Animated.View>
        </View>
      </Modal>

      {/* ── Period floating dropdown ── */}
      <Modal visible={periodMenuOpen} transparent animationType="none" onRequestClose={() => setPeriodMenuOpen(false)}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={() => setPeriodMenuOpen(false)} />
        <View style={[styles.periodDropMenu, { top: periodBtnLayout.y + periodBtnLayout.height + 4, left: periodBtnLayout.x, width: periodBtnLayout.width }]}>
          {(['monthly', 'weekly', 'yearly'] as Period[]).map((p, i, arr) => (
            <TouchableOpacity
              key={p}
              style={[styles.periodDropItem, i < arr.length - 1 && styles.periodDropDivider]}
              onPress={() => { setPeriod(p); setPeriodMenuOpen(false); }}
            >
              <Ionicons name="calendar-outline" size={rs(13)} color={period === p ? Colors.primary : Colors.textMedium} />
              <Text style={[styles.periodDropItemText, period === p && styles.periodDropItemActive]}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </Text>
              {period === p && <Ionicons name="checkmark" size={rs(14)} color={Colors.primary} />}
            </TouchableOpacity>
          ))}
        </View>
      </Modal>

      {/* ── Step 4: Review & Save (pinned footer) ── */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <View>
          <Text style={styles.footerTitle}>4. Review & Save</Text>
          <Text style={styles.footerSub}>Review your budget details and save.</Text>
        </View>
        <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving} activeOpacity={0.85}>
          <Text style={styles.saveBtnText}>Review Budget</Text>
          <Ionicons name="arrow-forward" size={rs(18)} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDF1E7' },

  // Hero
  hero:     { paddingHorizontal: 20, paddingBottom: 44 },
  heroNav:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  backBtn:  { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.25)', alignItems: 'center', justifyContent: 'center' },
  analyticsBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.25)', alignItems: 'center', justifyContent: 'center' },
  analyticsBadge: {
    position: 'absolute', top: -4, right: -4,
    minWidth: 16, height: 16, borderRadius: 8,
    backgroundColor: Colors.expense, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3, borderWidth: 1.5, borderColor: '#fff',
  },
  analyticsBadgeText: { fontSize: rs(9), fontFamily: 'Cause-ExtraBold', color: '#fff' },
  heroText: { alignItems: 'center', paddingBottom: 8 },
  heroTitle: {
    fontSize: rs(42), fontFamily: 'Cause-ExtraBold', color: '#fff', textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.25)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 6,
  },
  heroSub: { fontSize: rs(14), color: 'rgba(255,255,255,0.88)', fontStyle: 'italic', textAlign: 'center', marginTop: 6 },

  // Body
  body: { paddingHorizontal: 16, marginTop: -24, gap: 14 },

  // Card base
  card: {
    backgroundColor: '#fff', borderRadius: 20, padding: 18,
    shadowColor: 'rgba(233,123,59,0.10)', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 8, elevation: 3,
  },
  stepTitle: { fontSize: rs(15), fontFamily: 'Cause-ExtraBold', color: '#1A0E00', marginBottom: 4 },
  stepSub:   { fontSize: rs(12), color: Colors.textLight, marginBottom: 14, lineHeight: 17 },

  // Card with illustration
  cardRow:          { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardIllustration: { width: rs(90), height: rs(90) },

  // Step 1 — period dropdown
  periodDropBtn:      { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFF8F1', borderWidth: 1.5, borderColor: Colors.border, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 8, marginTop: 8, marginBottom: 10 },
  periodDropText:     { flex: 1, fontSize: rs(13), fontFamily: 'Cause-SemiBold', color: Colors.primary },
  periodDropMenu:     { position: 'absolute', minWidth: 160, backgroundColor: '#fff', borderRadius: 20, borderWidth: 1.5, borderColor: Colors.border, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 8 },
  periodDropItem:     { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 11 },
  periodDropDivider:  { borderBottomWidth: 1, borderBottomColor: '#F0DCC8' },
  periodDropItemText: { flex: 1, fontSize: rs(13), fontFamily: 'Cause-SemiBold', color: Colors.textMedium },
  periodDropItemActive: { color: Colors.primary },
  monthNav:    { flexDirection: 'row', alignItems: 'center', gap: 2 },
  monthNavFor: { fontSize: rs(13), color: Colors.textMedium, marginRight: 6, fontFamily: 'Cause-Medium' },
  monthArrow:  { width: rs(28), height: rs(28), alignItems: 'center', justifyContent: 'center' },
  monthLabel:  { fontSize: rs(14), fontFamily: 'Cause-ExtraBold', color: Colors.primary, minWidth: 84, textAlign: 'center' },

  // Step 2 — total budget
  step2Row:        { flexDirection: 'row', alignItems: 'center', gap: 4 },
  step2Jar:        { width: rs(90), height: rs(82) },
  budgetDisplay:   { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF8F1', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1.5, borderColor: '#F0DCC8', gap: 10, marginTop: 2 },
  budgetAmount:    { flex: 1, fontSize: rs(18), fontFamily: 'Cause-ExtraBold', color: Colors.primary },
  budgetEditWrap:  { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF8F1', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 0, borderWidth: 1.5, borderColor: Colors.primary, marginTop: 2, height: rs(48) },
  budgetEditCurrency: { fontSize: rs(18), fontFamily: 'Cause-Bold', color: Colors.textMedium, marginRight: 4 },
  budgetEditInput: { flex: 1, fontSize: rs(18), fontFamily: 'Cause-ExtraBold', color: Colors.primary, height: rs(48) },

  // Step 3 — allocations
  step3Header:  { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 },
  autoAllocBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1.5, borderColor: Colors.primary, marginTop: 2, flexShrink: 0 },
  autoAllocText:{ fontSize: rs(11), fontFamily: 'Cause-Bold', color: Colors.primary },
  allocRow:     { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  allocIcon:    { width: rs(40), height: rs(40), borderRadius: rs(12), alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  allocBody:    { flex: 1 },
  allocTopRow:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  allocName:    { flex: 1, fontSize: rs(13), fontFamily: 'Cause-SemiBold', color: '#1A0E00' },
  allocPctBadge:{ borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  allocPct:     { fontSize: rs(11), fontFamily: 'Cause-Bold' },
  allocAmount:  { fontSize: rs(12), fontFamily: 'Cause-Bold', color: '#1A0E00' },
  // Report modal
  reportModalWrap:   { flex: 1, justifyContent: 'flex-end' },
  reportSheet:       { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 0 },
  reportHandle:      { width: '100%', alignItems: 'center', paddingTop: 14, paddingBottom: 10 },
  sheetHandlePill:   { width: 36, height: 4, backgroundColor: '#D0C0B0', borderRadius: 2 },
  reportHeader:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  reportTitle:       { fontSize: rs(18), fontFamily: 'Cause-ExtraBold', color: '#1A0E00' },
  reportWarningBanner: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFF0F0', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 14 },
  reportWarningText: { fontSize: rs(13), fontFamily: 'Cause-SemiBold', color: Colors.expense },
  reportRow:         { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 14 },
  reportIcon:        { width: rs(36), height: rs(36), borderRadius: rs(10), alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 },
  reportBody:        { flex: 1 },
  reportRowTop:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  reportCatName:     { fontSize: rs(13), fontFamily: 'Cause-SemiBold', color: '#1A0E00' },
  reportAmt:         { fontSize: rs(12), fontFamily: 'Cause-Bold', color: Colors.textMedium },
  reportTrack:       { height: 6, backgroundColor: '#F0DCC8', borderRadius: 3, overflow: 'hidden' },
  reportFill:        { height: '100%', borderRadius: 3 },
  reportOverLabel:   { fontSize: rs(11), fontFamily: 'Cause-Bold', color: Colors.expense, marginTop: 4 },

  allocTotalRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, marginTop: 4, borderTopWidth: 1, borderTopColor: '#F0DCC8' },
  allocTotalLabel:{ flex: 1, fontSize: rs(14), fontFamily: 'Cause-ExtraBold', color: '#1A0E00' },
  allocTotalPct:  { fontSize: rs(14), fontFamily: 'Cause-ExtraBold' },
  allocTotalAmt:  { fontSize: rs(14), fontFamily: 'Cause-ExtraBold', marginLeft: 12 },

  // Footer
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingHorizontal: 20, paddingTop: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    shadowColor: 'rgba(0,0,0,0.08)', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 1, shadowRadius: 12, elevation: 10,
  },
  footerTitle: { fontSize: rs(13), fontFamily: 'Cause-ExtraBold', color: '#1A0E00' },
  footerSub:   { fontSize: rs(10), color: Colors.textLight, marginTop: 2 },
  saveBtn:     { flexDirection: 'row', alignItems: 'center', gap: rs(6), backgroundColor: Colors.primary, paddingHorizontal: rs(16), paddingVertical: rs(12), borderRadius: 14 },
  saveBtnText: { fontSize: rs(13), fontFamily: 'Cause-ExtraBold', color: '#fff' },
});
