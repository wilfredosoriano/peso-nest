import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAppStore } from '../src/store';
import { Colors } from '../src/constants/Colors';

const FEATURES = [
  { icon: 'flag', text: 'Unlimited Budget Goals' },
  { icon: 'bar-chart', text: 'Advanced Reports & Insights' },
  { icon: 'shield-checkmark', text: 'No Ads Experience' },
  { icon: 'flash', text: 'Priority Support' },
  { icon: 'sync', text: 'Cloud Sync & Backup' },
  { icon: 'people', text: 'Joint Loans via QR Sharing' },
];

export default function PremiumScreen() {
  const insets = useSafeAreaInsets();
  const updateUser = useAppStore((s) => s.updateUser);
  const user = useAppStore((s) => s.user);

  return (
    <View style={styles.container}>
      <TouchableOpacity style={[styles.backBtn, { top: insets.top + 12 }]} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={22} color={Colors.textDark} />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <LinearGradient
          colors={['#C8E8F5', '#D4EED8', '#F5E8C0']}
          style={[styles.hero, { paddingTop: insets.top + 56 }]}
        >
          <View style={styles.heroCircle1} />
          <View style={styles.heroCircle2} />
          <Text style={styles.crownEmoji}>👑</Text>
          {/* Character */}
          <View style={styles.character}>
            <View style={styles.charHead} />
            <View style={styles.charBody} />
          </View>
          <View style={styles.sparkle1}><Text style={{ fontSize: 16 }}>✨</Text></View>
          <View style={styles.sparkle2}><Text style={{ fontSize: 12 }}>⭐</Text></View>
        </LinearGradient>

        <View style={styles.content}>
          <Text style={styles.headline}>Go Premium</Text>
          <Text style={styles.subline}>
            Unlock Premium Features{'\n'}
            <Text style={styles.sublineLight}>Take control of your finances with{'\n'}advanced tools and insights.</Text>
          </Text>

          {/* Features */}
          <View style={styles.featuresCard}>
            {FEATURES.map((f) => (
              <View key={f.text} style={styles.featureItem}>
                <View style={styles.featureCheck}>
                  <Ionicons name={f.icon as any} size={16} color={Colors.primary} />
                </View>
                <Text style={styles.featureText}>{f.text}</Text>
              </View>
            ))}
          </View>

          {/* CTA */}
          <TouchableOpacity
            onPress={() => { updateUser({ isPremium: true }); router.back(); }}
            style={styles.ctaWrap}
            activeOpacity={0.9}
          >
            <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.ctaBtn}>
              <Text style={styles.ctaText}>Try Premium for ₱249 / month</Text>
            </LinearGradient>
          </TouchableOpacity>
          <Text style={styles.trialNote}>7-day free trial • Cancel anytime</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDF1E7' },
  backBtn: { position: 'absolute', left: 20, zIndex: 10, width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.7)', alignItems: 'center', justifyContent: 'center' },
  hero: { height: 280, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  heroCircle1: { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(255,255,255,0.15)', top: -40, right: -50 },
  heroCircle2: { position: 'absolute', width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.1)', bottom: -20, left: 10 },
  crownEmoji: { fontSize: 48, marginBottom: 8 },
  character: { alignItems: 'center' },
  charHead: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(220,160,100,0.9)' },
  charBody: { width: 40, height: 52, borderRadius: 6, backgroundColor: 'rgba(200,80,40,0.85)', marginTop: 2 },
  sparkle1: { position: 'absolute', top: 60, right: 60 },
  sparkle2: { position: 'absolute', top: 80, left: 50 },
  content: { paddingHorizontal: 24, paddingTop: 24 },
  headline: { fontSize: 28, fontWeight: '800', color: '#1A0E00', textAlign: 'center' },
  subline: { fontSize: 16, fontWeight: '700', color: '#1A0E00', textAlign: 'center', marginTop: 8, marginBottom: 20 },
  sublineLight: { fontWeight: '400', color: '#8B6F47', fontSize: 14 },
  featuresCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, gap: 14, shadowColor: 'rgba(233,123,59,0.1)', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 1, shadowRadius: 10, elevation: 4, marginBottom: 24 },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  featureCheck: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#E97B3B20', alignItems: 'center', justifyContent: 'center' },
  featureText: { fontSize: 14, fontWeight: '500', color: '#1A0E00', flex: 1 },
  ctaWrap: { borderRadius: 16, overflow: 'hidden', shadowColor: '#E97B3B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 8 },
  ctaBtn: { paddingVertical: 16, alignItems: 'center' },
  ctaText: { fontSize: 16, fontWeight: '800', color: '#fff' },
  trialNote: { textAlign: 'center', fontSize: 12, color: '#C4A882', marginTop: 10 },
});
