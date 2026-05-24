import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal,
  TextInput, KeyboardAvoidingView, ImageBackground, Alert, ActivityIndicator, StatusBar,
  Animated, PanResponder,
} from 'react-native';
import { rs } from '../src/utils/responsive';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import QRCode from 'react-native-qrcode-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAppStore } from '../src/store';
import { Colors } from '../src/constants/Colors';
import { formatCurrency } from '../src/utils/formatters';
import { Loan, PaymentFrequency, LoanParticipant } from '../src/types';
import { UserAvatar } from '../src/components/ui/UserAvatar';
import { syncLoanUpdate } from '../src/utils/sync';
import { MiniCard } from '../src/components/ui/MiniCard';
import { showToast } from '../src/store/toastStore';
import { shareLoan, claimLoanShare, fetchLoanSyncData, flushPendingLoanSyncs } from '../src/utils/sync';
import { supabase } from '../src/lib/supabase';
import { getPendingSyncLoans } from '../src/db/queries';
import { QRScanner } from '../src/components/ui/QRScanner';
import { useCameraPermissions } from 'expo-camera';

const LOAN_BG = require('../assets/images/backgrounds/loan-header-bg.webp');

const generateId = () => `loan_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const today = new Date().toISOString().split('T')[0];

function getEffectiveDueDate(loan: Loan): string {
  if (loan.paymentType === 'one-time') return loan.nextDueDate;
  const base = new Date(loan.nextDueDate + 'T00:00:00');
  const day = base.getDate();
  const now = new Date();
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), day);
  const thisMonthStr = thisMonth.toISOString().split('T')[0];
  if (thisMonthStr >= today) return thisMonthStr;
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, day);
  return nextMonth.toISOString().split('T')[0];
}

function getNextPaymentLoan(loans: Loan[]): Loan | null {
  if (!loans.length) return null;
  return [...loans].sort((a, b) => getEffectiveDueDate(a).localeCompare(getEffectiveDueDate(b)))[0];
}

function formatDueDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function LoansScreen() {
  const insets = useSafeAreaInsets();
  const loans = useAppStore((s) => s.loans);
  const user = useAppStore((s) => s.user);
  const addLoan = useAppStore((s) => s.addLoan);
  const updateLoan = useAppStore((s) => s.updateLoan);
  const deleteLoan = useAppStore((s) => s.deleteLoan);
  const payLoan = useAppStore((s) => s.payLoan);
  const cards = useAppStore((s) => s.cards);
  const updateCardBalance = useAppStore((s) => s.updateCardBalance);
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState('');
  const [bank, setBank] = useState('');
  const [paid, setPaid] = useState('');
  const [remaining, setRemaining] = useState('');
  const [rate, setRate] = useState('');
  const [emi, setEmi] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [paymentType, setPaymentType] = useState<PaymentFrequency>('monthly');
  const [saving, setSaving] = useState(false);

  const [payTarget, setPayTarget] = useState<Loan | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payCardId, setPayCardId] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);

  const [editTarget, setEditTarget] = useState<Loan | null>(null);
  const [showManage, setShowManage] = useState(false);

  const [menuOpen, setMenuOpen] = useState(false);
  const [shareTarget, setShareTarget] = useState<Loan | null>(null);
  const [shareCode, setShareCode] = useState('');
  const [shareLoading, setShareLoading] = useState(false);
  const [claimModal, setClaimModal] = useState(false);
  const [claimCode, setClaimCode] = useState('');
  const [claimLoading, setClaimLoading] = useState(false);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [expandedParticipantsId, setExpandedParticipantsId] = useState<string | null>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  // Request camera permission BEFORE opening the scanner so the iOS system
  // dialog shows over normal app UI (not over an already-presented Modal).
  // Also slides the claim sheet away first — React Native Modal sits in a
  // separate UIViewController layer that always renders above zIndex views.
  const handleScanPress = async () => {
    if (!cameraPermission?.granted) {
      const result = await requestCameraPermission();
      if (!result?.granted) return;
    }
    // Slide the claim sheet down, close it, then reveal the scanner
    Animated.timing(claimY, { toValue: 800, duration: 200, useNativeDriver: true }).start(() => {
      setClaimModal(false);
      setScannerVisible(true);
    });
  };

  // translateY refs — one per modal
  const manageY = useRef(new Animated.Value(800)).current;
  const payY    = useRef(new Animated.Value(800)).current;
  const editY   = useRef(new Animated.Value(800)).current;
  const addY    = useRef(new Animated.Value(800)).current;
  const shareY  = useRef(new Animated.Value(800)).current;
  const claimY  = useRef(new Animated.Value(800)).current;

  // Overlay opacities
  const manageOverlay = manageY.interpolate({ inputRange: [0, 400], outputRange: [1, 0], extrapolate: 'clamp' });
  const payOverlay    = payY.interpolate({ inputRange: [0, 400], outputRange: [1, 0], extrapolate: 'clamp' });
  const editOverlay   = editY.interpolate({ inputRange: [0, 400], outputRange: [1, 0], extrapolate: 'clamp' });
  const addOverlay    = addY.interpolate({ inputRange: [0, 400], outputRange: [1, 0], extrapolate: 'clamp' });
  const shareOverlay  = shareY.interpolate({ inputRange: [0, 400], outputRange: [1, 0], extrapolate: 'clamp' });
  const claimOverlay  = claimY.interpolate({ inputRange: [0, 400], outputRange: [1, 0], extrapolate: 'clamp' });

  // Slide-in effects
  useEffect(() => { if (showManage)    { manageY.setValue(800); Animated.spring(manageY, { toValue: 0, useNativeDriver: true, damping: 28, stiffness: 220 }).start(); } }, [showManage]);
  useEffect(() => { if (!!payTarget)   { payY.setValue(800);    Animated.spring(payY,    { toValue: 0, useNativeDriver: true, damping: 28, stiffness: 220 }).start(); } }, [payTarget]);
  useEffect(() => { if (!!editTarget)  { editY.setValue(800);   Animated.spring(editY,   { toValue: 0, useNativeDriver: true, damping: 28, stiffness: 220 }).start(); } }, [editTarget]);
  useEffect(() => { if (showAdd)       { addY.setValue(800);    Animated.spring(addY,    { toValue: 0, useNativeDriver: true, damping: 28, stiffness: 220 }).start(); } }, [showAdd]);
  useEffect(() => { if (!!shareTarget) { shareY.setValue(800);  Animated.spring(shareY,  { toValue: 0, useNativeDriver: true, damping: 28, stiffness: 220 }).start(); } }, [shareTarget]);
  useEffect(() => { if (claimModal)    { claimY.setValue(800);  Animated.spring(claimY,  { toValue: 0, useNativeDriver: true, damping: 28, stiffness: 220 }).start(); } }, [claimModal]);

  // Dismiss helpers
  const mkDismiss = (anim: Animated.Value, close: () => void) => (dy: number, vy: number) => {
    if (dy > 100 || vy > 1.0) { Animated.timing(anim, { toValue: 800, duration: 220, useNativeDriver: true }).start(close); }
    else { Animated.spring(anim, { toValue: 0, useNativeDriver: true }).start(); }
  };
  const dismissManage = mkDismiss(manageY, () => setShowManage(false));
  const dismissPay    = mkDismiss(payY,    () => { setPayTarget(null); setPayAmount(''); setPayCardId(null); });
  const dismissEdit   = mkDismiss(editY,   () => { setEditTarget(null); resetForm(); });
  const dismissAdd    = mkDismiss(addY,    () => { resetForm(); setShowAdd(false); });
  const dismissShare  = mkDismiss(shareY,  () => { setShareTarget(null); setShareCode(''); });
  const dismissClaim  = mkDismiss(claimY,  () => { setClaimModal(false); setClaimCode(''); });

  // PanResponders
  const managePan = useRef(PanResponder.create({ onStartShouldSetPanResponder: () => true, onPanResponderMove: (_, { dy }) => { if (dy > 0) manageY.setValue(dy); }, onPanResponderRelease: (_, { dy, vy }) => dismissManage(dy, vy) })).current;
  const payPan    = useRef(PanResponder.create({ onStartShouldSetPanResponder: () => true, onPanResponderMove: (_, { dy }) => { if (dy > 0) payY.setValue(dy); },    onPanResponderRelease: (_, { dy, vy }) => dismissPay(dy, vy) })).current;
  const editPan   = useRef(PanResponder.create({ onStartShouldSetPanResponder: () => true, onPanResponderMove: (_, { dy }) => { if (dy > 0) editY.setValue(dy); },   onPanResponderRelease: (_, { dy, vy }) => dismissEdit(dy, vy) })).current;
  const addPan    = useRef(PanResponder.create({ onStartShouldSetPanResponder: () => true, onPanResponderMove: (_, { dy }) => { if (dy > 0) addY.setValue(dy); },    onPanResponderRelease: (_, { dy, vy }) => dismissAdd(dy, vy) })).current;
  const sharePan  = useRef(PanResponder.create({ onStartShouldSetPanResponder: () => true, onPanResponderMove: (_, { dy }) => { if (dy > 0) shareY.setValue(dy); },  onPanResponderRelease: (_, { dy, vy }) => dismissShare(dy, vy) })).current;
  const claimPan  = useRef(PanResponder.create({ onStartShouldSetPanResponder: () => true, onPanResponderMove: (_, { dy }) => { if (dy > 0) claimY.setValue(dy); },  onPanResponderRelease: (_, { dy, vy }) => dismissClaim(dy, vy) })).current;

  useFocusEffect(useCallback(() => {
    let active = true;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    // ── Shared helper used by both polling and realtime ─────────────────────
    const applyRemote = async (
      remote: { shareCode: string; isPaid: boolean; loanData: any },
      pendingIds: Set<string>
    ) => {
      const local = useAppStore.getState().loans.find((l) => l.shareCode === remote.shareCode);
      if (!local || pendingIds.has(local.id)) return;

      if (remote.isPaid && local.status === 'active') {
        await useAppStore.getState().payLoan(local.id, local.outstandingAmount);
      } else if (remote.loanData && local.status !== 'paid') {
        // Detect newly joined participants → toast
        const remoteParticipants: LoanParticipant[] = remote.loanData?.participants ?? [];
        const localParticipants: LoanParticipant[] = local.participants ?? [];
        const newOnes = remoteParticipants.filter(
          (rp) => !localParticipants.some((lp) => lp.name === rp.name)
        );
        if (active && newOnes.length > 0) {
          const names = newOnes.map((p) => p.name).join(', ');
          showToast(`${names} joined "${local.title}" 🤝`, {
            subtitle: 'Joint loan updated',
            type: 'info',
            duration: 4500,
          });
        }
        await useAppStore.getState().applyRemoteLoan({
          ...remote.loanData,
          id: local.id,
          createdAt: local.createdAt,
          shareCode: local.shareCode,
        });
      }
    };

    const getPendingIds = async () => {
      const rows = await getPendingSyncLoans().catch(() => [] as any[]);
      return new Set(rows.map((l: any) => l.id as string));
    };

    // ── Polling: immediate + every 10 s (fallback) ──────────────────────────
    const syncOnce = async () => {
      await flushPendingLoanSyncs().catch(() => {});
      const pendingIds = await getPendingIds();
      const sharedLoans = useAppStore.getState().loans.filter((l) => l.shareCode);
      if (sharedLoans.length === 0) return;
      const remoteData = await fetchLoanSyncData(sharedLoans.map((l) => l.shareCode!));
      for (const remote of remoteData) {
        if (!active) return;
        await applyRemote(remote, pendingIds);
      }
    };

    // ── Realtime: instant push from Supabase when loan_status_sync changes ──
    const setupRealtime = () => {
      const sharedLoans = useAppStore.getState().loans.filter((l) => l.shareCode);
      if (sharedLoans.length === 0) return;
      const codes = sharedLoans.map((l) => l.shareCode!);
      const filter = codes.length === 1
        ? `share_code=eq.${codes[0]}`
        : `share_code=in.(${codes.join(',')})`;

      channel = supabase
        .channel('loan-live')
        .on(
          'postgres_changes' as any,
          { event: 'UPDATE', schema: 'public', table: 'loan_status_sync', filter },
          async (payload: any) => {
            if (!active) return;
            const row = payload.new;
            const pendingIds = await getPendingIds();
            await applyRemote(
              { shareCode: row.share_code, isPaid: row.is_paid, loanData: row.loan_data },
              pendingIds
            );
          }
        )
        .subscribe();
    };

    syncOnce()
      .then(() => { if (active) setupRealtime(); })
      .catch(() => {});

    const intervalId = setInterval(() => syncOnce().catch(() => {}), 10_000);

    return () => {
      active = false;
      clearInterval(intervalId);
      if (channel) { supabase.removeChannel(channel); channel = null; }
    };
  }, []));

  const openPay = (loan: Loan) => {
    setShowManage(false);
    setPayTarget(loan);
    setPayAmount(loan.paymentType === 'monthly' ? String(loan.emiAmount) : String(loan.outstandingAmount));
    setPayCardId(null);
  };

  const handlePay = async () => {
    if (!payTarget || !payAmount) return;
    const amount = parseFloat(payAmount);
    if (!amount || amount <= 0) return;
    setPaying(true);
    const isFullPayoff = amount >= payTarget.outstandingAmount;
    await payLoan(payTarget.id, amount);
    // Deduct from the selected card if one was chosen
    if (payCardId) {
      await updateCardBalance(payCardId, -amount);
    }
    setPaying(false);
    // Toast feedback
    if (isFullPayoff) {
      showToast('Loan fully paid off! 🎉', {
        subtitle: payTarget.title + (payTarget.bank ? ` · ${payTarget.bank}` : ''),
        type: 'success',
        duration: 4500,
      });
    } else {
      showToast('Payment recorded', {
        subtitle: `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })} applied to ${payTarget.title}`,
        type: 'info',
        duration: 3000,
      });
    }
    setPayTarget(null);
    setPayAmount('');
    setPayCardId(null);
  };

  const openEdit = (loan: Loan) => {
    setShowManage(false);
    setEditTarget(loan);
    setTitle(loan.title);
    setBank(loan.bank);
    setRemaining(String(loan.outstandingAmount));
    setPaid(String(loan.totalAmount - loan.outstandingAmount));
    setRate(loan.interestRate ? String(loan.interestRate) : '');
    setEmi(String(loan.emiAmount || ''));
    setDueDate(loan.nextDueDate);
    setPaymentType(loan.paymentType);
  };

  const handleEdit = async () => {
    if (!editTarget || !title.trim() || !remaining) return;
    setSaving(true);
    const paidAmt = parseFloat(paid) || 0;
    const remainingAmt = parseFloat(remaining);
    await updateLoan({
      ...editTarget,
      title: title.trim(),
      bank: bank.trim(),
      paymentType,
      totalAmount: remainingAmt + paidAmt,
      outstandingAmount: remainingAmt,
      interestRate: parseFloat(rate) || 0,
      emiAmount: parseFloat(emi) || 0,
      nextDueDate: dueDate.trim() || today,
    });
    setSaving(false);
    setEditTarget(null);
    resetForm();
  };

  const handleDelete = (loan: Loan) => {
    Alert.alert(
      'Delete Loan',
      `Remove "${loan.title}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => { setShowManage(false); deleteLoan(loan.id); } },
      ]
    );
  };

  const totalOutstanding = loans.reduce((s, l) => s + l.outstandingAmount, 0);
  const totalAmount = loans.reduce((s, l) => s + l.totalAmount, 0);
  const totalPaid = totalAmount - totalOutstanding;
  const overallPct = totalAmount > 0 ? (totalPaid / totalAmount) * 100 : 0;
  const nextLoan = getNextPaymentLoan(loans);

  const handleShare = async (loan: Loan) => {
    if (!user?.isPremium) {
      Alert.alert(
        'Premium Feature',
        'Joint Loan QR Sharing is available for Premium members only.',
        [
          { text: 'Not Now', style: 'cancel' },
          { text: 'Upgrade — ₱299', onPress: () => router.push('/premium') },
        ]
      );
      return;
    }
    setShowManage(false);
    setShareTarget(loan);
    setShareCode('');
    setShareLoading(true);
    try {
      const me: LoanParticipant = { name: user?.name ?? 'You', avatarStyle: user?.avatarStyle };
      const loanWithParticipant: Loan = {
        ...loan,
        participants: [me, ...(loan.participants ?? []).filter((p) => p.name !== me.name)],
      };
      const code = await shareLoan(loanWithParticipant);
      setShareCode(code);
      await updateLoan({ ...loanWithParticipant, shareCode: code });
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Could not generate share code.');
      setShareTarget(null);
    } finally {
      setShareLoading(false);
    }
  };

  const handleClaim = async () => {
    if (!claimCode.trim()) {
      Alert.alert('Missing Code', 'Please enter the share code.');
      return;
    }
    setClaimLoading(true);
    try {
      const loanData = await claimLoanShare(claimCode.trim()) as Loan;
      const me: LoanParticipant = { name: user?.name ?? 'You', avatarStyle: user?.avatarStyle };
      const newLoan: Loan = {
        ...loanData,
        id: `loan_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        createdAt: Date.now(),
        status: 'active',
        shareCode: claimCode.trim().toUpperCase(),
        participants: [...(loanData.participants ?? []).filter((p) => p.name !== me.name), me],
      };
      await addLoan(newLoan);
      // Push updated participants back so the sharer can see the claimer
      syncLoanUpdate(newLoan.shareCode!, newLoan).catch(() => {});
      setClaimModal(false);
      setClaimCode('');
      Alert.alert('Loan Added', `"${newLoan.title}" has been added to your loans.`);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Could not claim loan.');
    } finally {
      setClaimLoading(false);
    }
  };

  const resetForm = () => {
    setTitle(''); setBank(''); setPaid(''); setRemaining('');
    setRate(''); setEmi(''); setDueDate(''); setPaymentType('monthly');
  };

  const handleSave = async () => {
    if (!title.trim() || !remaining) return;
    if (!user?.isPremium && loans.length >= 3) {
      Alert.alert(
        'Loan Limit Reached',
        'Free accounts can track up to 3 loans. Upgrade to Premium for unlimited loans.',
        [
          { text: 'Not Now', style: 'cancel' },
          { text: 'Upgrade — ₱299', onPress: () => { setShowAdd(false); router.push('/premium'); } },
        ]
      );
      return;
    }
    setSaving(true);
    const paidAmt = parseFloat(paid) || 0;
    const remainingAmt = parseFloat(remaining);
    const loan: Loan = {
      id: generateId(),
      title: title.trim(),
      bank: bank.trim(),
      loanType: 'personal',
      paymentType,
      totalAmount: remainingAmt + paidAmt,
      outstandingAmount: remainingAmt,
      interestRate: parseFloat(rate) || 0,
      emiAmount: parseFloat(emi) || 0,
      nextDueDate: dueDate.trim() || today,
      status: 'active',
      createdAt: Date.now(),
    };
    await addLoan(loan);
    setSaving(false);
    resetForm();
    setShowAdd(false);
  };

  return (
    <View style={styles.container}>
      {menuOpen && (
        <TouchableOpacity style={styles.menuBackdrop} activeOpacity={1} onPress={() => setMenuOpen(false)} />
      )}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={rs(22)} color={Colors.textDark} />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>My Loans</Text>

        <View style={styles.menuWrapper}>
          <TouchableOpacity
            style={[styles.menuTrigger, menuOpen && styles.menuTriggerActive]}
            onPress={() => setMenuOpen(v => !v)}
            activeOpacity={0.8}
          >
            <Ionicons name="ellipsis-horizontal" size={rs(20)} color={menuOpen ? Colors.primary : '#1A0E00'} />
          </TouchableOpacity>

          {menuOpen && (
            <View style={styles.miniMenu}>
              <View style={styles.miniMenuArrow} />

              <TouchableOpacity style={styles.miniMenuItem} onPress={() => { setMenuOpen(false); setShowAdd(true); }} activeOpacity={0.7}>
                <View style={[styles.miniMenuIconWrap, { backgroundColor: Colors.primary + '18' }]}>
                  <Ionicons name="add" size={rs(16)} color={Colors.primary} />
                </View>
                <Text style={styles.miniMenuText}>Add Loan</Text>
              </TouchableOpacity>

              <View style={styles.miniMenuDivider} />

              <TouchableOpacity style={styles.miniMenuItem} onPress={() => { setMenuOpen(false); setShowManage(true); }} activeOpacity={0.7}>
                <View style={[styles.miniMenuIconWrap, { backgroundColor: '#1A0E0012' }]}>
                  <Ionicons name="wallet-outline" size={rs(16)} color="#1A0E00" />
                </View>
                <Text style={styles.miniMenuText}>Manage Loans</Text>
              </TouchableOpacity>

              <View style={styles.miniMenuDivider} />

              <TouchableOpacity style={styles.miniMenuItem} onPress={() => { setMenuOpen(false); setClaimModal(true); }} activeOpacity={0.7}>
                <View style={[styles.miniMenuIconWrap, { backgroundColor: '#7C3AED18' }]}>
                  <Ionicons name="qr-code-outline" size={rs(16)} color="#7C3AED" />
                </View>
                <Text style={styles.miniMenuText}>Claim Shared</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

        {/* Summary card — always visible */}
        <View style={styles.loanCardWrapper}>
          <View style={styles.loanCardClip}>
            <ImageBackground source={LOAN_BG} resizeMode="cover" style={styles.loanCard} imageStyle={styles.loanCardImage}>
              <View style={styles.loanTopSection}>
                <View style={styles.loanLeftCol}>
                  <Text style={styles.loanTitle}>Total Outstanding</Text>
                  <Text style={styles.loanAmtLabel}>Remaining Balance</Text>
                  <Text style={styles.loanAmtValue}>{formatCurrency(totalOutstanding)}</Text>
                  <Text style={styles.loanOfTotal}>of {formatCurrency(totalAmount)}</Text>
                </View>
              </View>

              <View style={{ flex: 1 }} />

              <View style={styles.progressWrap}>
                <View style={styles.progressHeader}>
                  <View style={{ flex: 1 }} />
                  <View style={styles.paidBadge}>
                    <Text style={styles.paidBadgeText}>{Math.round(overallPct)}%</Text>
                  </View>
                </View>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressBar, { width: `${overallPct}%` as any }]} />
                </View>
              </View>
            </ImageBackground>

            <View style={styles.loanWhiteSection}>
              <View style={styles.loanDetailItem}>
                <Text style={styles.loanDetailLabel}>Total Loans</Text>
                <Text style={styles.loanDetailValue}>{loans.length}</Text>
              </View>
              <View style={styles.loanDetailDivider} />
              <View style={styles.loanDetailItem}>
                <Text style={styles.loanDetailLabel}>Next Payment</Text>
                {nextLoan ? (
                  <>
                    <Text style={[styles.loanDetailValue, { color: Colors.primary }]}>
                      {formatCurrency(nextLoan.emiAmount)}
                    </Text>
                    <Text style={styles.loanDueDate}>Due on {formatDueDate(nextLoan.nextDueDate)}</Text>
                  </>
                ) : (
                  <Text style={styles.loanDetailValue}>—</Text>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Loans table */}
        {loans.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="cash-outline" size={rs(56)} color={Colors.textLight} />
            <Text style={styles.emptyTitle}>No loans yet</Text>
            <Text style={styles.emptySubtitle}>Tap + to add your first loan</Text>
          </View>
        ) : (
          <View style={styles.tableCard}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Loan</Text>
              <Text style={[styles.tableHeaderCell, { flex: 2, textAlign: 'right' }]}>Remaining</Text>
              <Text style={[styles.tableHeaderCell, { flex: 2, textAlign: 'right' }]}>Due Date</Text>
            </View>

            {loans.map((loan, idx) => {
              const paidPct = loan.totalAmount > 0 ? ((loan.totalAmount - loan.outstandingAmount) / loan.totalAmount) * 100 : 0;
              return (
                <View key={loan.id}>
                  {idx > 0 && <View style={styles.tableRowDivider} />}
                  <View style={styles.tableRow}>
                    <View style={{ flex: 2 }}>
                      <Text style={styles.tableLoanName} numberOfLines={1}>{loan.title}</Text>
                      {(loan.participants?.length ?? 0) >= 2 ? (
                        <View style={styles.jointBadge}>
                          <Ionicons name="people-outline" size={rs(10)} color="#7C3AED" />
                          <Text style={styles.jointBadgeText}>Joint</Text>
                        </View>
                      ) : loan.bank ? <Text style={styles.tableBank}>{loan.bank}</Text> : null}
                    </View>
                    <View style={{ flex: 2, alignItems: 'flex-end' }}>
                      <Text style={styles.tableBalance}>{formatCurrency(loan.outstandingAmount)}</Text>
                      <View style={styles.tableProgressTrack}>
                        <View style={[styles.tableProgressBar, { width: `${paidPct}%` as any }]} />
                      </View>
                    </View>
                    <View style={{ flex: 2, alignItems: 'flex-end' }}>
                      <Text style={styles.tableDueDate}>{formatDueDate(getEffectiveDueDate(loan))}</Text>
                      {loan.paymentType === 'monthly' && loan.emiAmount > 0 ? (
                        <Text style={styles.tableEmi}>{formatCurrency(loan.emiAmount)}/mo</Text>
                      ) : (
                        <Text style={styles.tableEmi}>One-time</Text>
                      )}
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Manage loans modal */}
      <Modal visible={showManage} animationType="none" transparent statusBarTranslucent onRequestClose={() => dismissManage(101, 0)}>
        <StatusBar translucent backgroundColor="transparent" />
        <Animated.View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)', opacity: manageOverlay }} pointerEvents="none" />
        <Animated.View style={{ flex: 1, marginTop: 60, transform: [{ translateY: manageY }] }}>
        <View style={[styles.modal, { borderTopLeftRadius: 20, borderTopRightRadius: 20 }]}>
          <View {...managePan.panHandlers} style={styles.sheetHandle}>
            <View style={styles.sheetHandlePill} />
          </View>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowManage(false)}>
              <Ionicons name="close" size={rs(24)} color={Colors.textMedium} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Manage Loans</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
            {loans.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="cash-outline" size={rs(48)} color={Colors.textLight} />
                <Text style={styles.emptyTitle}>No loans yet</Text>
                <Text style={styles.emptySubtitle}>Tap + to add your first loan</Text>
              </View>
            ) : loans.map((loan) => {
              const paidPct = loan.totalAmount > 0 ? ((loan.totalAmount - loan.outstandingAmount) / loan.totalAmount) * 100 : 0;
              return (
                <View key={loan.id} style={styles.manageCard}>
                  {/* Loan info */}
                  <View style={styles.manageCardTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.manageLoanName}>{loan.title}</Text>
                      {loan.bank ? <Text style={styles.manageLoanBank}>{loan.bank}</Text> : null}
                      {(loan.participants?.length ?? 0) >= 2 && (
                        <View>
                          <TouchableOpacity
                            style={styles.jointBadgeLg}
                            onPress={() => setExpandedParticipantsId(expandedParticipantsId === loan.id ? null : loan.id)}
                            activeOpacity={0.7}
                          >
                            <Ionicons name="people-outline" size={rs(12)} color="#7C3AED" />
                            <Text style={styles.jointBadgeLgText}>Joint Loan</Text>
                            <Ionicons
                              name={expandedParticipantsId === loan.id ? 'chevron-up' : 'chevron-down'}
                              size={rs(11)}
                              color="#7C3AED"
                            />
                          </TouchableOpacity>
                          {expandedParticipantsId === loan.id && (
                            <View style={styles.participantsRow}>
                              {(loan.participants ?? []).length === 0 ? (
                                <Text style={styles.participantsEmpty}>No participants yet</Text>
                              ) : (loan.participants ?? []).map((p, i) => (
                                <View key={i} style={styles.participantChip}>
                                  <UserAvatar avatarStyle={p.avatarStyle} name={p.name} size={rs(26)} />
                                  <Text style={styles.participantName} numberOfLines={1}>{p.name}</Text>
                                </View>
                              ))}
                            </View>
                          )}
                        </View>
                      )}
                    </View>
                    {loan.status === 'paid' && (
                      <View style={styles.managePaidBadge}>
                        <Ionicons name="checkmark-circle" size={rs(12)} color="#4CAF50" />
                        <Text style={styles.managePaidText}>Paid</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.manageCardRow}>
                    <View>
                      <Text style={styles.manageLabel}>Outstanding</Text>
                      <Text style={styles.manageValue}>{formatCurrency(loan.outstandingAmount)}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.manageLabel}>Due Date</Text>
                      <Text style={styles.manageValue}>{formatDueDate(getEffectiveDueDate(loan))}</Text>
                    </View>
                  </View>

                  <View style={styles.manageProgressTrack}>
                    <View style={[styles.manageProgressBar, { width: `${paidPct}%` as any }]} />
                  </View>
                  <Text style={styles.managePct}>{Math.round(paidPct)}% paid</Text>

                  {/* Actions */}
                  <View style={styles.manageActions}>
                    {loan.status === 'active' && (
                      <TouchableOpacity style={[styles.manageBtn, styles.manageBtnPay]} onPress={() => openPay(loan)}>
                        <Ionicons name="checkmark-circle-outline" size={rs(15)} color="#fff" />
                        <Text style={styles.manageBtnText}>Pay</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity style={[styles.manageBtn, styles.manageBtnShare]} onPress={() => handleShare(loan)}>
                      <Ionicons name="qr-code-outline" size={rs(15)} color="#fff" />
                      <Text style={styles.manageBtnText}>Share</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.manageBtn, styles.manageBtnEdit]} onPress={() => openEdit(loan)}>
                      <Ionicons name="pencil-outline" size={rs(15)} color={Colors.primary} />
                      <Text style={[styles.manageBtnText, { color: Colors.primary }]}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.manageBtn, styles.manageBtnDelete]} onPress={() => handleDelete(loan)}>
                      <Ionicons name="trash-outline" size={rs(15)} color="#E53935" />
                      <Text style={[styles.manageBtnText, { color: '#E53935' }]}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </View>
        </Animated.View>
      </Modal>

      {/* Pay modal */}
      <Modal visible={!!payTarget} animationType="none" transparent statusBarTranslucent onRequestClose={() => dismissPay(101, 0)}>
        <StatusBar translucent backgroundColor="transparent" />
        <Animated.View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)', opacity: payOverlay }} pointerEvents="none" />
        <Animated.View style={{ flex: 1, marginTop: 60, transform: [{ translateY: payY }] }}>
        <View style={[styles.modal, { borderTopLeftRadius: 20, borderTopRightRadius: 20 }]}>
          <View {...payPan.panHandlers} style={styles.sheetHandle}>
            <View style={styles.sheetHandlePill} />
          </View>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => { setPayTarget(null); setPayAmount(''); setPayCardId(null); }}>
              <Ionicons name="close" size={rs(24)} color={Colors.textMedium} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Make a Payment</Text>
            <TouchableOpacity onPress={handlePay} disabled={paying}>
              <Text style={[styles.saveBtn, paying && { opacity: 0.4 }]}>Confirm</Text>
            </TouchableOpacity>
          </View>

          {payTarget && (
            <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
              <View style={styles.paySummaryCard}>
                <Text style={styles.payLoanName}>{payTarget.title}</Text>
                {payTarget.bank ? <Text style={styles.payLoanBank}>{payTarget.bank}</Text> : null}
                <View style={styles.payRow}>
                  <View>
                    <Text style={styles.payRowLabel}>Outstanding</Text>
                    <Text style={styles.payRowValue}>{formatCurrency(payTarget.outstandingAmount)}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.payRowLabel}>Due Date</Text>
                    <Text style={styles.payRowValue}>{formatDueDate(getEffectiveDueDate(payTarget))}</Text>
                  </View>
                </View>
              </View>

              <View style={[styles.field, { marginHorizontal: 0, marginTop: 24 }]}>
                <Text style={styles.fieldLabel}>Amount to Pay</Text>
                <TextInput
                  style={[styles.fieldInput, { fontSize: rs(22), fontFamily: 'Cause-Bold', color: Colors.primary }]}
                  value={payAmount}
                  onChangeText={setPayAmount}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor={Colors.textLight}
                />
              </View>

              {payTarget.paymentType === 'monthly' && payTarget.emiAmount > 0 && (
                <TouchableOpacity style={styles.payPreset} onPress={() => setPayAmount(String(payTarget!.emiAmount))}>
                  <Text style={styles.payPresetText}>Use monthly amount — {formatCurrency(payTarget.emiAmount)}</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.payPreset} onPress={() => setPayAmount(String(payTarget!.outstandingAmount))}>
                <Text style={styles.payPresetText}>Pay full balance — {formatCurrency(payTarget.outstandingAmount)}</Text>
              </TouchableOpacity>

              {/* Card picker — deduct payment from a card */}
              {cards.length > 0 && (
                <View style={{ marginTop: 20 }}>
                  <Text style={styles.fieldLabel}>
                    Pay From Card
                    <Text style={styles.fieldOptional}> (optional)</Text>
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardPickerContent}>
                    {cards.map((card) => (
                      <MiniCard
                        key={card.id}
                        card={card}
                        selected={payCardId === card.id}
                        onPress={() => setPayCardId(payCardId === card.id ? null : card.id)}
                      />
                    ))}
                  </ScrollView>
                </View>
              )}
              <View style={{ height: insets.bottom + 16 }} />
            </ScrollView>
          )}
        </View>
        </Animated.View>
      </Modal>

      {/* Edit modal */}
      <Modal visible={!!editTarget} animationType="none" transparent statusBarTranslucent onRequestClose={() => dismissEdit(101, 0)}>
        <StatusBar translucent backgroundColor="transparent" />
        <Animated.View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)', opacity: editOverlay }} pointerEvents="none" />
        <Animated.View style={{ flex: 1, marginTop: 60, transform: [{ translateY: editY }] }}>
        <KeyboardAvoidingView behavior="padding" style={[styles.modal, { borderTopLeftRadius: 20, borderTopRightRadius: 20 }]}>
          <View {...editPan.panHandlers} style={styles.sheetHandle}>
            <View style={styles.sheetHandlePill} />
          </View>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => { setEditTarget(null); resetForm(); }}>
              <Ionicons name="close" size={rs(24)} color={Colors.textMedium} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Loan</Text>
            <TouchableOpacity onPress={handleEdit} disabled={saving}>
              <Text style={[styles.saveBtn, saving && { opacity: 0.4 }]}>Save</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
            {[
              { label: 'Loan Name *', value: title, onChange: setTitle, placeholder: 'e.g. Personal Loan' },
              { label: 'Bank / Lender', value: bank, onChange: setBank, placeholder: 'e.g. BDO, BPI, SSS' },
              { label: 'Outstanding Balance *', value: remaining, onChange: setRemaining, placeholder: '42,500', keyboardType: 'decimal-pad' as const },
              { label: 'Already Paid', value: paid, onChange: setPaid, placeholder: '17,500', keyboardType: 'decimal-pad' as const },
              { label: 'Interest Rate % (optional)', value: rate, onChange: setRate, placeholder: 'e.g. 12.5', keyboardType: 'decimal-pad' as const },
            ].map((f) => (
              <View key={f.label} style={styles.field}>
                <Text style={styles.fieldLabel}>{f.label}</Text>
                <TextInput style={styles.fieldInput} value={f.value} onChangeText={f.onChange} placeholder={f.placeholder} placeholderTextColor={Colors.textLight} keyboardType={f.keyboardType} />
              </View>
            ))}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Payment Type</Text>
              <View style={styles.toggle}>
                {(['monthly', 'one-time'] as PaymentFrequency[]).map((opt) => (
                  <TouchableOpacity key={opt} style={[styles.toggleOption, paymentType === opt && styles.toggleOptionActive]} onPress={() => setPaymentType(opt)}>
                    <Text style={[styles.toggleOptionText, paymentType === opt && styles.toggleOptionTextActive]}>{opt === 'monthly' ? 'Monthly' : 'One-time'}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            {paymentType === 'monthly' && (
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Monthly Payment Amount</Text>
                <TextInput style={styles.fieldInput} value={emi} onChangeText={setEmi} placeholder="2,100" placeholderTextColor={Colors.textLight} keyboardType="decimal-pad" />
              </View>
            )}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>{paymentType === 'monthly' ? 'Monthly Due Date (YYYY-MM-DD)' : 'Due Date (YYYY-MM-DD)'}</Text>
              <TextInput style={styles.fieldInput} value={dueDate} onChangeText={setDueDate} placeholder="2025-06-10" placeholderTextColor={Colors.textLight} />
              {paymentType === 'monthly' && <Text style={styles.fieldHint}>The day of month will repeat automatically each month.</Text>}
            </View>
            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>
        </Animated.View>
      </Modal>

      <Modal visible={showAdd} animationType="none" transparent statusBarTranslucent onRequestClose={() => dismissAdd(101, 0)}>
        <StatusBar translucent backgroundColor="transparent" />
        <Animated.View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)', opacity: addOverlay }} pointerEvents="none" />
        <Animated.View style={{ flex: 1, marginTop: 60, transform: [{ translateY: addY }] }}>
        <KeyboardAvoidingView behavior="padding" style={[styles.modal, { borderTopLeftRadius: 20, borderTopRightRadius: 20 }]}>
          <View {...addPan.panHandlers} style={styles.sheetHandle}>
            <View style={styles.sheetHandlePill} />
          </View>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => { resetForm(); setShowAdd(false); }}>
              <Ionicons name="close" size={rs(24)} color={Colors.textMedium} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Loan</Text>
            <TouchableOpacity onPress={handleSave} disabled={saving}>
              <Text style={[styles.saveBtn, saving && { opacity: 0.4 }]}>Save</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
            {[
              { label: 'Loan Name *', value: title, onChange: setTitle, placeholder: 'e.g. Personal Loan' },
              { label: 'Bank / Lender', value: bank, onChange: setBank, placeholder: 'e.g. BDO, BPI, SSS' },
              { label: 'Remaining Balance *', value: remaining, onChange: setRemaining, placeholder: '42,500', keyboardType: 'decimal-pad' as const },
              { label: 'Already Paid', value: paid, onChange: setPaid, placeholder: '17,500', keyboardType: 'decimal-pad' as const },
              { label: 'Interest Rate % (optional)', value: rate, onChange: setRate, placeholder: 'e.g. 12.5', keyboardType: 'decimal-pad' as const },
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

            {/* Payment type toggle */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Payment Type</Text>
              <View style={styles.toggle}>
                {(['monthly', 'one-time'] as PaymentFrequency[]).map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.toggleOption, paymentType === opt && styles.toggleOptionActive]}
                    onPress={() => setPaymentType(opt)}
                  >
                    <Text style={[styles.toggleOptionText, paymentType === opt && styles.toggleOptionTextActive]}>
                      {opt === 'monthly' ? 'Monthly' : 'One-time'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {paymentType === 'monthly' && (
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Monthly Payment Amount</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={emi}
                  onChangeText={setEmi}
                  placeholder="2,100"
                  placeholderTextColor={Colors.textLight}
                  keyboardType="decimal-pad"
                />
              </View>
            )}

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>
                {paymentType === 'monthly' ? 'Monthly Due Date (YYYY-MM-DD)' : 'Due Date (YYYY-MM-DD)'}
              </Text>
              <TextInput
                style={styles.fieldInput}
                value={dueDate}
                onChangeText={setDueDate}
                placeholder="2025-06-10"
                placeholderTextColor={Colors.textLight}
              />
              {paymentType === 'monthly' && (
                <Text style={styles.fieldHint}>The day of month will repeat automatically each month.</Text>
              )}
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>
        </Animated.View>
      </Modal>

      {/* Share loan modal */}
      <Modal visible={!!shareTarget} animationType="none" transparent statusBarTranslucent onRequestClose={() => dismissShare(101, 0)}>
        <StatusBar translucent backgroundColor="transparent" />
        <Animated.View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)', opacity: shareOverlay }} pointerEvents="none" />
        <View style={qrStyles.shareWrap}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={() => dismissShare(101, 0)} />
          <Animated.View style={{ transform: [{ translateY: shareY }] }}>
          <View style={[qrStyles.sheet, { paddingBottom: insets.bottom + 24 }]}>
            <View {...sharePan.panHandlers} style={styles.sheetHandle}>
              <View style={styles.sheetHandlePill} />
            </View>
            <Text style={qrStyles.sheetTitle}>Share Loan</Text>
            {shareTarget && <Text style={qrStyles.loanName}>{shareTarget.title}</Text>}

            {shareLoading ? (
              <View style={qrStyles.loadingWrap}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={qrStyles.loadingText}>Generating code...</Text>
              </View>
            ) : shareCode ? (
              <>
                <View style={qrStyles.qrWrap}>
                  <QRCode value={shareCode} size={rs(180)} color="#1A0E00" backgroundColor="#fff" />
                </View>
                <View style={qrStyles.codeBlock}>
                  <Text style={qrStyles.codeLabel}>Share Code</Text>
                  <Text style={qrStyles.codeText}>{shareCode}</Text>
                </View>
                <Text style={qrStyles.hint}>Ask the other person to tap the QR icon in their Loans screen and enter this code. Expires in 7 days.</Text>
              </>
            ) : null}
          </View>
          </Animated.View>
        </View>
      </Modal>

      {/* Claim loan modal */}
      <Modal visible={claimModal} animationType="none" transparent statusBarTranslucent onRequestClose={() => dismissClaim(101, 0)}>
        <StatusBar translucent backgroundColor="transparent" />
        <Animated.View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)', opacity: claimOverlay }} pointerEvents="none" />
        <KeyboardAvoidingView behavior="padding" style={qrStyles.claimWrap}>
          <TouchableOpacity style={qrStyles.overlay} activeOpacity={1} onPress={() => dismissClaim(101, 0)} />
          <Animated.View style={{ transform: [{ translateY: claimY }] }}>
          <View style={[qrStyles.sheet, { paddingBottom: insets.bottom + 24 }]}>
            <View {...claimPan.panHandlers} style={styles.sheetHandle}>
              <View style={styles.sheetHandlePill} />
            </View>
            <Text style={qrStyles.sheetTitle}>Claim Shared Loan</Text>
            <TouchableOpacity style={qrStyles.scanBtn} onPress={handleScanPress} activeOpacity={0.8}>
              <Ionicons name="scan-outline" size={rs(20)} color="#fff" />
              <Text style={qrStyles.scanBtnText}>Scan QR Code</Text>
            </TouchableOpacity>
            <View style={qrStyles.orRow}>
              <View style={qrStyles.orLine} />
              <Text style={qrStyles.orText}>or enter code manually</Text>
              <View style={qrStyles.orLine} />
            </View>
            <TextInput
              style={[qrStyles.codeInput, { color: '#1A0E00' }]}
              placeholder="e.g. A3B7XZ"
              placeholderTextColor={Colors.textLight}
              value={claimCode}
              onChangeText={(t) => setClaimCode(t.toUpperCase())}
              autoCapitalize="characters"
              maxLength={6}
              selectionColor={Colors.primary}
            />
            <TouchableOpacity
              style={[qrStyles.claimBtn, claimLoading && { opacity: 0.6 }]}
              onPress={handleClaim}
              disabled={claimLoading}
              activeOpacity={0.85}
            >
              {claimLoading
                ? <ActivityIndicator color="#fff" />
                : <Text style={qrStyles.claimBtnText}>Add Loan</Text>
              }
            </TouchableOpacity>
          </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>

      {/* QR Scanner */}
      <QRScanner
        visible={scannerVisible}
        onScan={(code) => { setScannerVisible(false); setClaimCode(code); setClaimModal(true); }}
        onClose={() => { setScannerVisible(false); setClaimModal(true); }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDF1E7' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 12, gap: 12, zIndex: 20, overflow: 'visible' },
  backBtn: { width: rs(36), height: rs(36), borderRadius: 10, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', shadowColor: 'rgba(0,0,0,0.06)', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 1, shadowRadius: 4, elevation: 2 },
  title: { flex: 1, fontSize: rs(22), fontFamily: 'Cause-ExtraBold', color: '#1A0E00' },
  menuBackdrop: { ...StyleSheet.absoluteFillObject, zIndex: 10 },
  menuWrapper: { position: 'relative', zIndex: 30, overflow: 'visible' },
  menuTrigger: { width: rs(36), height: rs(36), borderRadius: 10, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', shadowColor: 'rgba(0,0,0,0.06)', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 1, shadowRadius: 4, elevation: 2 },
  menuTriggerActive: { backgroundColor: Colors.primary + '15' },
  miniMenu: { position: 'absolute', top: 44, right: 0, backgroundColor: '#fff', borderRadius: 16, paddingVertical: 6, minWidth: 185, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.10, shadowRadius: 20, elevation: 12, zIndex: 50 },
  miniMenuArrow: { position: 'absolute', top: -5, right: 13, width: 10, height: 10, backgroundColor: '#fff', transform: [{ rotate: '45deg' }], borderRadius: 2, shadowColor: '#000', shadowOffset: { width: -1, height: -1 }, shadowOpacity: 0.04, shadowRadius: 2 },
  miniMenuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 11 },
  miniMenuIconWrap: { width: rs(30), height: rs(30), borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  miniMenuText: { fontSize: rs(14), fontFamily: 'Cause-SemiBold', color: '#1A0E00' },
  miniMenuDivider: { height: 1, backgroundColor: '#F5EDE0', marginHorizontal: 14 },

  // Summary card
  loanCardWrapper: { marginBottom: 20, borderRadius: 20, backgroundColor: '#FFFFFF', shadowColor: 'rgba(233,123,59,0.18)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 12, elevation: 5 },
  loanCardClip: { borderRadius: 20, overflow: 'hidden' },
  loanCard: { minHeight: rs(170), flexDirection: 'column' },
  loanCardImage: { borderRadius: 0 },
  loanTopSection: { flexDirection: 'row', padding: rs(16), paddingBottom: 8 },
  loanLeftCol: { flex: 1, paddingRight: 12 },
  loanTitle: { fontSize: rs(16), fontFamily: 'Cause-Bold', color: '#1A0E00', marginBottom: 6 },
  loanAmtLabel: { fontSize: rs(11), color: '#1A0E00', marginBottom: 2 },
  loanAmtValue: { fontSize: rs(24), fontFamily: 'Cause-ExtraBold', color: Colors.primary, letterSpacing: -0.5 },
  loanOfTotal: { fontSize: rs(12), color: '#1A0E00', marginTop: 2 },
  progressWrap: { paddingHorizontal: rs(16), paddingBottom: 14, paddingTop: 8 },
  progressHeader: { flexDirection: 'row', marginBottom: 6 },
  progressTrack: { height: 7, backgroundColor: 'rgba(255,255,255,0.45)', borderRadius: 4, overflow: 'hidden' },
  progressBar: { height: '100%', backgroundColor: '#E97B3B', borderRadius: 4 },
  paidBadge: { backgroundColor: Colors.primary + '18', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  paidBadgeText: { fontSize: rs(12), fontFamily: 'Cause-Bold', color: Colors.primary },
  loanWhiteSection: { backgroundColor: '#FFFFFF', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: rs(16), paddingVertical: 14 },
  loanDetailDivider: { width: 1, height: 36, backgroundColor: '#F0DCC8' },
  loanDetailItem: {},
  loanDetailLabel: { fontSize: rs(11), color: '#C4A882', marginBottom: 4 },
  loanDetailValue: { fontSize: rs(17), fontFamily: 'Cause-ExtraBold', color: '#1A0E00' },
  loanDueDate: { fontSize: rs(11), color: '#C4A882', marginTop: 2 },

  // Empty state
  emptyState: { alignItems: 'center', paddingVertical: 48 },
  emptyTitle: { fontSize: rs(16), fontFamily: 'Cause-Bold', color: '#8B6F47', marginTop: 12 },
  emptySubtitle: { fontSize: rs(13), color: '#C4A882', marginTop: 4 },

  // Loans table
  tableCard: { backgroundColor: '#FFFFFF', borderRadius: 20, overflow: 'hidden', shadowColor: 'rgba(233,123,59,0.08)', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 8, elevation: 3 },
  tableHeader: { flexDirection: 'row', paddingHorizontal: rs(14), paddingVertical: 12, backgroundColor: '#FDF1E7' },
  tableHeaderCell: { fontSize: rs(10), fontFamily: 'Cause-Bold', color: '#C4A882', textTransform: 'uppercase', letterSpacing: 0.5 },
  tableRowDivider: { height: 1, backgroundColor: '#FDF1E7', marginHorizontal: rs(14) },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: rs(14), paddingVertical: 12 },
  tableLoanName: { fontSize: rs(13), fontFamily: 'Cause-Bold', color: '#1A0E00' },
  tableBank: { fontSize: rs(11), color: '#C4A882', marginTop: 2 },
  jointBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 3, backgroundColor: '#EDE9FE', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, alignSelf: 'flex-start' },
  jointBadgeText: { fontSize: rs(10), fontFamily: 'Cause-Bold', color: '#7C3AED' },
  jointBadgeLg: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4, backgroundColor: '#EDE9FE', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, alignSelf: 'flex-start' },
  jointBadgeLgText: { fontSize: rs(11), fontFamily: 'Cause-Bold', color: '#7C3AED' },
  participantsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#EDE9FE' },
  participantChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F5F3FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  participantName: { fontSize: rs(11), fontFamily: 'Cause-SemiBold', color: '#5B21B6', maxWidth: 80 },
  participantsEmpty: { fontSize: rs(11), color: Colors.textLight, fontFamily: 'Cause-Regular', marginTop: 4 },
  tableBalance: { fontSize: rs(13), fontFamily: 'Cause-Bold', color: Colors.primary },
  tableProgressTrack: { width: rs(56), height: 4, backgroundColor: '#F0DCC8', borderRadius: 2, overflow: 'hidden', marginTop: 4 },
  tableProgressBar: { height: '100%', backgroundColor: '#E97B3B', borderRadius: 2 },
  tableDueDate: { fontSize: rs(12), fontFamily: 'Cause-SemiBold', color: '#1A0E00' },
  tableEmi: { fontSize: rs(11), color: '#C4A882', marginTop: 2 },
  // Manage modal cards
  manageCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: 'rgba(233,123,59,0.08)', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 6, elevation: 2 },
  manageCardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  manageLoanName: { fontSize: rs(15), fontFamily: 'Cause-Bold', color: '#1A0E00' },
  manageLoanBank: { fontSize: rs(12), color: '#C4A882', marginTop: 2 },
  managePaidBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  managePaidText: { fontSize: rs(11), fontFamily: 'Cause-SemiBold', color: '#4CAF50' },
  manageCardRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  manageLabel: { fontSize: rs(11), color: '#C4A882', marginBottom: 2 },
  manageValue: { fontSize: rs(14), fontFamily: 'Cause-Bold', color: '#1A0E00' },
  manageProgressTrack: { height: 6, backgroundColor: '#F0DCC8', borderRadius: 3, overflow: 'hidden', marginBottom: 4 },
  manageProgressBar: { height: '100%', backgroundColor: Colors.primary, borderRadius: 3 },
  managePct: { fontSize: rs(11), color: '#C4A882', marginBottom: 12 },
  manageActions: { flexDirection: 'row', gap: 8 },
  manageBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 10, borderRadius: 10 },
  manageBtnText: { fontSize: rs(12), fontFamily: 'Cause-Bold', color: '#fff' },
  manageBtnPay: { backgroundColor: Colors.primary },
  manageBtnShare: { backgroundColor: '#1A0E00' },
  manageBtnEdit: { backgroundColor: Colors.primary + '14', borderWidth: 1, borderColor: Colors.primary + '30' },
  manageBtnDelete: { backgroundColor: '#FFEBEE', borderWidth: 1, borderColor: '#FFCDD2' },
  paySummaryCard: { backgroundColor: '#FDF1E7', borderRadius: 16, padding: 16 },
  payLoanName: { fontSize: rs(16), fontFamily: 'Cause-Bold', color: '#1A0E00', marginBottom: 2 },
  payLoanBank: { fontSize: rs(13), color: '#C4A882', marginBottom: 14 },
  payRow: { flexDirection: 'row', justifyContent: 'space-between' },
  payRowLabel: { fontSize: rs(11), color: '#C4A882', marginBottom: 3 },
  payRowValue: { fontSize: rs(15), fontFamily: 'Cause-Bold', color: '#1A0E00' },
  payPreset: { marginTop: 10, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: '#F0DCC8', backgroundColor: '#FFFFFF' },
  payPresetText: { fontSize: rs(14), fontFamily: 'Cause-SemiBold', color: Colors.primary, textAlign: 'center' },

  // Modal
  modal: { flex: 1, backgroundColor: '#FDF1E7' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 },
  modalTitle: { fontSize: rs(17), fontFamily: 'Cause-Bold', color: '#1A0E00' },
  saveBtn: { fontSize: rs(16), fontFamily: 'Cause-Bold', color: '#E97B3B' },
  field: { marginHorizontal: 20, marginBottom: 14 },
  fieldLabel: { fontSize: rs(13), fontFamily: 'Cause-SemiBold', color: '#8B6F47', marginBottom: 6 },
  fieldInput: { backgroundColor: '#FFFFFF', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: rs(15), color: '#1A0E00', borderWidth: 1, borderColor: '#F0DCC8' },
  fieldHint: { fontSize: rs(11), color: '#C4A882', marginTop: 4 },
  toggle: { flexDirection: 'row', backgroundColor: '#F0DCC8', borderRadius: 12, padding: 3 },
  toggleOption: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  toggleOptionActive: { backgroundColor: '#FFFFFF', shadowColor: 'rgba(0,0,0,0.08)', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 1, shadowRadius: 3, elevation: 2 },
  toggleOptionText: { fontSize: rs(14), fontFamily: 'Cause-SemiBold', color: '#C4A882' },
  toggleOptionTextActive: { color: Colors.primary },
  sheetHandle:     { width: '100%', alignItems: 'center', paddingTop: 14, paddingBottom: 10 },
  sheetHandlePill: { width: 36, height: 4, backgroundColor: '#D0C0B0', borderRadius: 2 },

  // Pay-from-card picker
  fieldOptional: { fontSize: rs(12), fontFamily: 'Cause-Regular', color: Colors.textLight },
  cardPickerContent: { gap: 14, paddingVertical: 8 },
});

const qrStyles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  shareWrap: { flex: 1, justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 12 },
  claimWrap: { flex: 1, justifyContent: 'flex-end' },
  sheetTitle: { fontSize: rs(20), fontFamily: 'Cause-ExtraBold', color: '#1A0E00', textAlign: 'center', marginBottom: 4 },
  loanName: { fontSize: rs(13), color: Colors.textLight, textAlign: 'center', marginBottom: 20 },
  loadingWrap: { alignItems: 'center', paddingVertical: 32, gap: 12 },
  loadingText: { fontSize: rs(13), color: Colors.textLight, fontFamily: 'Cause-Medium' },
  qrWrap: { alignItems: 'center', marginVertical: 16, padding: 14, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#F0DCC8', alignSelf: 'center' },
  codeBlock: { alignItems: 'center', marginBottom: 12 },
  codeLabel: { fontSize: rs(11), fontFamily: 'Cause-Bold', color: Colors.textLight, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  codeText: { fontSize: rs(32), fontFamily: 'Cause-ExtraBold', color: '#1A0E00', letterSpacing: 6 },
  hint: { fontSize: rs(12), color: Colors.textLight, textAlign: 'center', lineHeight: 18, fontFamily: 'Cause-Medium', marginBottom: 8 },
  codeInput: { backgroundColor: '#F9F3EC', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: rs(22), fontFamily: 'Cause-ExtraBold', textAlign: 'center', letterSpacing: 6, borderWidth: 1, borderColor: '#F0DCC8', marginVertical: 14 },
  scanBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#1A0E00', borderRadius: 14, paddingVertical: 14, marginBottom: 16 },
  scanBtnText: { fontSize: rs(15), fontFamily: 'Cause-ExtraBold', color: '#fff' },
  orRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  orLine: { flex: 1, height: 1, backgroundColor: '#F0DCC8' },
  orText: { fontSize: rs(11), color: Colors.textLight, fontFamily: 'Cause-Medium' },
  claimBtn: { backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 4 },
  claimBtnText: { fontSize: rs(15), fontFamily: 'Cause-ExtraBold', color: '#fff' },
});
