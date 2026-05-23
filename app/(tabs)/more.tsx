import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAppStore } from '../../src/store';
import { Colors } from '../../src/constants/Colors';

const MENU_ITEMS = [
  { label: 'Profile', icon: 'person-outline', route: '/profile' },
  { label: 'Budget Goals', icon: 'flag-outline', route: '/budget-goals' },
  { label: 'Categories', icon: 'grid-outline', route: '/categories' },
  { label: 'Payment Methods', icon: 'wallet-outline', route: '/loans' },
  { label: 'Settings', icon: 'settings-outline', route: '/settings' },
  { label: 'Help & Support', icon: 'help-circle-outline', route: null },
  { label: 'About Us', icon: 'information-circle-outline', route: null },
];

export default function MoreScreen() {
  const insets = useSafeAreaInsets();
  const user = useAppStore((s) => s.user);

  return (
    <View style={styles.container}>
      {/* Hero illustration */}
      <LinearGradient
        colors={['#C8E8F5', '#D4EED8', '#F0E8C8']}
        style={[styles.hero, { paddingTop: insets.top }]}
      >
        <View style={styles.heroCircle1} />
        <View style={styles.heroCircle2} />
        {/* Illustrated house + scenery */}
        <View style={styles.heroScene}>
          <View style={styles.heroHouse}>
            <View style={styles.heroRoof} />
            <View style={styles.heroWindow} />
          </View>
          <View style={styles.heroTree}>
            <View style={styles.heroTreeTop} />
            <View style={styles.heroTreeTrunk} />
          </View>
          <View style={styles.heroGround} />
        </View>
        <Text style={styles.moreTitle}>More</Text>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 90 + insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        {/* User card */}
        <View style={styles.userCard}>
          <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.userAvatar}>
            <Text style={styles.userAvatarText}>{(user?.name ?? 'U')[0].toUpperCase()}</Text>
          </LinearGradient>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name ?? 'User'}</Text>
            <Text style={styles.userPlan}>{user?.isPremium ? '✨ Premium Member' : 'Free Plan'}</Text>
          </View>
          {!user?.isPremium && (
            <TouchableOpacity style={styles.upgradeBtn} onPress={() => router.push('/premium')}>
              <Text style={styles.upgradeBtnText}>Upgrade</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Menu */}
        <View style={styles.menuCard}>
          {MENU_ITEMS.map((item, index) => (
            <React.Fragment key={item.label}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => item.route && router.push(item.route as any)}
                activeOpacity={0.7}
              >
                <View style={[styles.menuIcon, { backgroundColor: Colors.primary + '18' }]}>
                  <Ionicons name={item.icon as any} size={20} color={Colors.primary} />
                </View>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={16} color={Colors.textLight} />
              </TouchableOpacity>
              {index < MENU_ITEMS.length - 1 && <View style={styles.menuDivider} />}
            </React.Fragment>
          ))}
        </View>

        {/* Premium CTA if not premium */}
        {!user?.isPremium && (
          <TouchableOpacity onPress={() => router.push('/premium')} activeOpacity={0.9}>
            <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.premiumBanner}>
              <View>
                <Text style={styles.premiumBannerTitle}>🌟 Go Premium</Text>
                <Text style={styles.premiumBannerSub}>Unlock advanced insights and tools</Text>
              </View>
              <Ionicons name="arrow-forward-circle" size={32} color="rgba(255,255,255,0.8)" />
            </LinearGradient>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDF1E7' },
  hero: { height: 180, position: 'relative', overflow: 'hidden', justifyContent: 'flex-end', paddingHorizontal: 20, paddingBottom: 16 },
  heroCircle1: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.15)', top: -60, right: -40 },
  heroCircle2: { position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.1)', bottom: -30, left: 20 },
  heroScene: { position: 'absolute', bottom: 20, right: 30, flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  heroHouse: { width: 60, height: 50, backgroundColor: 'rgba(200,150,90,0.7)', borderRadius: 4, overflow: 'visible', alignItems: 'center' },
  heroRoof: { position: 'absolute', top: -18, width: 0, height: 0, borderLeftWidth: 34, borderRightWidth: 34, borderBottomWidth: 22, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: 'rgba(160,100,50,0.75)' },
  heroWindow: { width: 16, height: 16, backgroundColor: 'rgba(255,230,150,0.8)', borderRadius: 3, marginTop: 16 },
  heroTree: { alignItems: 'center' },
  heroTreeTop: { width: 30, height: 44, borderRadius: 15, backgroundColor: 'rgba(70,130,60,0.75)' },
  heroTreeTrunk: { width: 8, height: 14, backgroundColor: 'rgba(120,70,30,0.6)' },
  heroGround: { position: 'absolute', bottom: 0, left: -20, right: -20, height: 20, backgroundColor: 'rgba(100,160,80,0.3)', borderRadius: 50 },
  moreTitle: { fontSize: 26, fontWeight: '800', color: '#1A0E00' },
  userCard: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginTop: 16, marginBottom: 12, backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, gap: 12, shadowColor: 'rgba(233,123,59,0.12)', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 8, elevation: 3 },
  userAvatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  userAvatarText: { fontSize: 22, fontWeight: '800', color: '#fff' },
  userInfo: { flex: 1 },
  userName: { fontSize: 16, fontWeight: '700', color: '#1A0E00' },
  userPlan: { fontSize: 12, color: '#8B6F47', marginTop: 2 },
  upgradeBtn: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#E97B3B', borderRadius: 10 },
  upgradeBtnText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  menuCard: { marginHorizontal: 20, backgroundColor: '#FFFFFF', borderRadius: 18, overflow: 'hidden', shadowColor: 'rgba(233,123,59,0.08)', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 8, elevation: 3 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  menuIcon: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { flex: 1, fontSize: 14, fontWeight: '500', color: '#1A0E00' },
  menuDivider: { height: 1, backgroundColor: '#F0DCC8', marginLeft: 66 },
  premiumBanner: { marginHorizontal: 20, marginTop: 12, borderRadius: 18, padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  premiumBannerTitle: { fontSize: 16, fontWeight: '800', color: '#fff' },
  premiumBannerSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
});
