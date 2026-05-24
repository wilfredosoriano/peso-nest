import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ImageBackground, Dimensions, Alert, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAppStore } from '../src/store';
import { Colors } from '../src/constants/Colors';
import { rs } from '../src/utils/responsive';
import { purchasePremium, restorePurchases } from '../src/utils/purchases';
import { showToast } from '../src/store/toastStore';

const PREMIUM_BG = require('../assets/images/backgrounds/premium-header-bg.webp');
const { width: SW } = Dimensions.get('window');

const HIGHLIGHTS = [
  { icon: 'wallet',    title: 'Savings Goals',    desc: 'Unlock & track\nunlimited goals' },
  { icon: 'cash',      title: 'Track Loans',      desc: 'Unlimited loan\ntracking & reminders' },
  { icon: 'qr-code',   title: 'QR Loan Sharing',  desc: 'Joint loans with\nQR code sharing' },
  { icon: 'download',  title: 'Export Data',      desc: 'Export to CSV\nor PDF anytime' },
];

type CompareValue = string | boolean;
const COMPARE_ROWS: { icon: string; label: string; free: CompareValue; premium: CompareValue }[] = [
  { icon: 'wallet',    label: 'Savings Goals',          free: false,      premium: true },
  { icon: 'cash',      label: 'Track Loans',            free: 'Up to 3',  premium: 'Unlimited' },
  { icon: 'qr-code',   label: 'Joint Loans (QR Share)', free: false,      premium: true },
  { icon: 'flag',      label: 'Budget Goals',           free: '3',        premium: 'Unlimited' },
  { icon: 'download',  label: 'Export Data (CSV/JSON)', free: false,      premium: true },
  { icon: 'cloud',     label: 'Cloud Backup & Sync',    free: false,      premium: true },
  { icon: 'headset',   label: 'Priority Support',       free: 'FAQ Only', premium: 'Email' },
];


export default function PremiumScreen() {
  const insets     = useSafeAreaInsets();
  const updateUser = useAppStore((s) => s.updateUser);
  const [purchasing, setPurchasing] = useState(false);
  const [restoring,  setRestoring]  = useState(false);

  const handleSubscribe = async () => {
    setPurchasing(true);
    try {
      const result = await purchasePremium();
      if (result.success) {
        await updateUser({ isPremium: true });
        showToast('Welcome to Premium! 🎉', { subtitle: 'All features are now unlocked.', type: 'success', duration: 4000 });
        router.back();
      } else if (result.cancelled) {
        // user cancelled — do nothing
      } else {
        Alert.alert('Purchase Failed', result.error ?? 'Something went wrong. Please try again.');
      }
    } catch (e: any) {
      Alert.alert('Purchase Failed', e?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    try {
      const restored = await restorePurchases();
      if (restored) {
        await updateUser({ isPremium: true });
        showToast('Purchase Restored! ✨', { subtitle: 'Your Premium access has been restored.', type: 'success', duration: 4000 });
        router.back();
      } else {
        Alert.alert('No Purchase Found', 'We could not find a previous Premium purchase linked to your account.');
      }
    } catch {
      Alert.alert('Restore Failed', 'Could not restore purchases. Please try again.');
    } finally {
      setRestoring(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

        {/* ── Hero ── */}
        <ImageBackground
          source={PREMIUM_BG}
          resizeMode="cover"
          style={[styles.hero, { paddingTop: insets.top }]}
        >
          <View style={styles.heroNav}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={rs(20)} color="#fff" />
            </TouchableOpacity>
          </View>
          <View style={styles.heroTextWrap}>
            <Text style={styles.heroTitle}>PesoNest Premium ✦</Text>
            <Text style={styles.heroSub}>
              {'Unlock all features and\ntake control of your future. ♡'}
            </Text>
          </View>
        </ImageBackground>

        <View style={styles.body}>

          {/* ── Feature Highlights ── */}
          <View style={styles.highlightsCard}>
            {HIGHLIGHTS.map((h, i) => (
              <View key={h.title} style={[styles.highlightItem, i < HIGHLIGHTS.length - 1 && styles.highlightBorder]}>
                <View style={styles.highlightIconWrap}>
                  <Ionicons name={h.icon as any} size={rs(22)} color={Colors.primary} />
                </View>
                <Text style={styles.highlightTitle}>{h.title}</Text>
                <Text style={styles.highlightDesc}>{h.desc}</Text>
              </View>
            ))}
          </View>

          {/* ── Compare Plans ── */}
          <View style={styles.compareCard}>
            <View style={styles.compareHeader}>
              <Text style={styles.compareTitle}>Compare Plans</Text>
              <Text style={styles.compareFreeLabel}>Free</Text>
              <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.comparePremiumBadge}>
                <Ionicons name={"crown" as any} size={rs(12)} color="#fff" />
                <Text style={styles.comparePremiumText}>Premium</Text>
              </LinearGradient>
            </View>

            {COMPARE_ROWS.map((row, i) => (
              <View key={row.label} style={[styles.compareRow, i > 0 && styles.compareRowBorder]}>
                <View style={styles.compareLeft}>
                  <Ionicons name={row.icon as any} size={rs(15)} color={Colors.primary} />
                  <Text style={styles.compareLabel}>{row.label}</Text>
                </View>
                <View style={styles.compareFreeCol}>
                  {row.free === false
                    ? <Text style={styles.compareDash}>—</Text>
                    : <Text style={styles.compareFreeVal}>{row.free as string}</Text>
                  }
                </View>
                <View style={styles.comparePremiumCol}>
                  {row.premium === true
                    ? <Ionicons name="checkmark-circle" size={rs(18)} color={Colors.primary} />
                    : <Text style={styles.comparePremiumVal}>{row.premium as string}</Text>
                  }
                </View>
              </View>
            ))}
          </View>

          {/* ── Pricing ── */}
          <View style={styles.priceCard}>
            <View style={styles.priceBadge}>
              <Text style={styles.priceBadgeText}>One-Time Payment</Text>
            </View>
            <Text style={styles.priceAmount}>₱299</Text>
            <Text style={styles.priceNote}>Lifetime access • No subscription • No renewals</Text>
          </View>

          {/* ── CTA ── */}
          <TouchableOpacity onPress={handleSubscribe} activeOpacity={0.9} style={styles.ctaWrap} disabled={purchasing}>
            <LinearGradient colors={purchasing ? ['#ccc','#aaa'] : [Colors.primary, Colors.primaryDark]} style={styles.ctaBtn}>
              {purchasing ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name={"crown" as any} size={rs(18)} color="#fff" />}
              <Text style={styles.ctaText}>{purchasing ? 'Processing...' : 'Get Lifetime Access — ₱299'}</Text>
            </LinearGradient>
          </TouchableOpacity>
          <View style={styles.ctaNote}>
            <Ionicons name="shield-checkmark-outline" size={rs(13)} color={Colors.textLight} />
            <Text style={styles.ctaNoteText}>Cancel anytime. No hidden fees.</Text>
          </View>
          <TouchableOpacity onPress={handleRestore} disabled={restoring} style={styles.restoreBtn}>
            {restoring
              ? <ActivityIndicator size="small" color={Colors.textLight} />
              : <Text style={styles.restoreBtnText}>Restore Purchase</Text>
            }
          </TouchableOpacity>

        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDF1E7' },

  // Hero
  hero: { width: SW, height: rs(SW * 0.72), justifyContent: 'space-between' },
  heroNav: { paddingHorizontal: 20, paddingVertical: 12 },
  backBtn: { width: rs(36), height: rs(36), borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.25)', alignItems: 'center', justifyContent: 'center' },
  heroTextWrap: { paddingHorizontal: 20, paddingBottom: 24 },
  heroTitle: {
    fontSize: rs(34), fontFamily: 'Cause-ExtraBold', color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 8,
  },
  heroSub: {
    fontSize: rs(15), fontFamily: 'Cause-Medium', color: 'rgba(255,255,255,0.9)', marginTop: 6, lineHeight: 22,
    textShadowColor: 'rgba(0,0,0,0.2)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4,
  },

  // Body
  body: { paddingHorizontal: 16, paddingTop: 16, gap: 14 },

  // Feature highlights
  highlightsCard: {
    flexDirection: 'row', backgroundColor: '#fff', borderRadius: 20, padding: 16,
    shadowColor: 'rgba(233,123,59,0.1)', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 8, elevation: 3,
  },
  highlightItem: { flex: 1, alignItems: 'center', paddingHorizontal: 4 },
  highlightBorder: { borderRightWidth: 1, borderRightColor: '#F0DCC8' },
  highlightIconWrap: { width: rs(44), height: rs(44), borderRadius: 22, backgroundColor: Colors.primary + '18', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  highlightTitle: { fontSize: rs(11), fontFamily: 'Cause-ExtraBold', color: '#1A0E00', textAlign: 'center', marginBottom: 4 },
  highlightDesc: { fontSize: rs(10), color: Colors.textLight, textAlign: 'center', lineHeight: 14 },

  // Compare plans
  compareCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 16,
    shadowColor: 'rgba(233,123,59,0.1)', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 8, elevation: 3,
  },
  compareHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  compareTitle: { flex: 1, fontSize: rs(16), fontFamily: 'Cause-ExtraBold', color: '#1A0E00' },
  compareFreeLabel: { fontSize: rs(13), fontFamily: 'Cause-SemiBold', color: Colors.textMedium, marginRight: 12, minWidth: 44, textAlign: 'center' },
  comparePremiumBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  comparePremiumText: { fontSize: rs(13), fontFamily: 'Cause-ExtraBold', color: '#fff' },
  compareRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  compareRowBorder: { borderTopWidth: 1, borderTopColor: '#F5E9DA' },
  compareLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  compareLabel: { fontSize: rs(13), fontFamily: 'Cause-Medium', color: '#1A0E00', flex: 1 },
  compareFreeCol: { minWidth: 56, alignItems: 'center' },
  comparePremiumCol: { minWidth: 70, alignItems: 'center' },
  compareDash: { fontSize: rs(14), color: Colors.textLight, fontFamily: 'Cause-Bold' },
  compareFreeVal: { fontSize: rs(12), color: Colors.textMedium, fontFamily: 'Cause-Medium', textAlign: 'center' },
  comparePremiumVal: { fontSize: rs(12), fontFamily: 'Cause-Bold', color: Colors.primary, textAlign: 'center' },

  // Pricing
  priceCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 20, alignItems: 'center',
    borderWidth: 2, borderColor: Colors.primary + '40',
    shadowColor: 'rgba(233,123,59,0.12)', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 8, elevation: 3,
  },
  priceBadge: { backgroundColor: Colors.primary + '18', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 4, marginBottom: 10 },
  priceBadgeText: { fontSize: rs(12), fontFamily: 'Cause-Bold', color: Colors.primary },
  priceAmount: { fontSize: rs(48), fontFamily: 'Cause-ExtraBold', color: Colors.primary, lineHeight: 56 },
  priceNote: { fontSize: rs(12), color: Colors.textLight, fontFamily: 'Cause-Medium', textAlign: 'center', marginTop: 4 },

  // CTA
  ctaWrap: { borderRadius: 18, overflow: 'hidden', shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 8 },
  ctaBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 18 },
  ctaText: { fontSize: rs(17), fontFamily: 'Cause-ExtraBold', color: '#fff' },
  ctaNote: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, marginTop: 2 },
  ctaNoteText: { fontSize: rs(12), color: Colors.textLight, fontFamily: 'Cause-Medium' },
  restoreBtn: { alignItems: 'center', marginTop: 10, paddingVertical: 8 },
  restoreBtnText: { fontSize: rs(13), fontFamily: 'Cause-Medium', color: Colors.textLight, textDecorationLine: 'underline' },

});
