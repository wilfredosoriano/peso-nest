import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ImageBackground, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAppStore } from '../../src/store';
import { Colors } from '../../src/constants/Colors';
import { UserAvatar } from '../../src/components/ui/UserAvatar';
import { rs } from '../../src/utils/responsive';

const MORE_BG = require('../../assets/images/backgrounds/more-screen-bg.webp');
const SUPPORT_EMAIL = 'wil.soriano.jr@gmail.com';

export default function MoreScreen() {
  const insets = useSafeAreaInsets();
  const user = useAppStore((s) => s.user);

  const handlePrioritySupport = () => {
    const subject = encodeURIComponent('[PREMIUM] PesoNest Support');
    const body = encodeURIComponent(`Name: ${user?.name ?? ''}\nPlan: Premium ⚡\n\nDescribe your issue:\n`);
    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`);
  };

  const handleFeedback = () => {
    const subject = encodeURIComponent('[FEEDBACK] PesoNest');
    const body = encodeURIComponent(`Name: ${user?.name ?? ''}\nPlan: Free\n\nYour feedback or question:\n`);
    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`);
  };

  const MENU_ITEMS = [
    { label: 'Profile', icon: 'person-outline', onPress: () => router.push('/profile') },
    { label: 'Budget Goals', icon: 'flag-outline', onPress: () => router.push('/budget-goals') },
    { label: 'Savings', icon: 'save-outline', onPress: () => router.push('/savings') },
    { label: 'Categories', icon: 'grid-outline', onPress: () => router.push('/categories') },
    { label: 'Payment Methods', icon: 'wallet-outline', onPress: () => router.push('/loans') },
    { label: 'Settings', icon: 'settings-outline', onPress: () => router.push('/settings') },
    { label: 'Help & FAQ', icon: 'help-circle-outline', onPress: () => router.push('/faq') },
    user?.isPremium
      ? { label: 'Priority Support', icon: 'headset-outline', onPress: handlePrioritySupport, badge: '⚡ Premium' as string | null }
      : { label: 'Send Feedback', icon: 'chatbubble-ellipses-outline', onPress: handleFeedback, badge: null as string | null },
  ];

  return (
    <View style={styles.container}>
      {/* Hero */}
      <ImageBackground
        source={MORE_BG}
        resizeMode="cover"
        style={[styles.hero, { paddingTop: insets.top }]}
        imageStyle={styles.heroImage}
      >
        <Text style={styles.moreTitle}>More</Text>
      </ImageBackground>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 90 + insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        {/* User card */}
        <View style={styles.userCard}>
          <UserAvatar avatarStyle={user?.avatarStyle} name={user?.name} size={52} />
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
              <TouchableOpacity style={styles.menuItem} onPress={item.onPress} activeOpacity={0.7}>
                <View style={[styles.menuIcon, { backgroundColor: Colors.primary + '18' }]}>
                  <Ionicons name={item.icon as any} size={rs(20)} color={Colors.primary} />
                </View>
                <Text style={styles.menuLabel}>{item.label}</Text>
                {item.badge ? (
                  <View style={styles.menuBadge}>
                    <Text style={styles.menuBadgeText}>{item.badge}</Text>
                  </View>
                ) : (
                  <Ionicons name="chevron-forward" size={rs(16)} color={Colors.textLight} />
                )}
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
              <Ionicons name="arrow-forward-circle" size={rs(32)} color="rgba(255,255,255,0.8)" />
            </LinearGradient>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDF1E7' },
  hero: { height: 180, overflow: 'hidden', justifyContent: 'flex-end', paddingHorizontal: 20, paddingBottom: 16 },
  heroImage: { borderRadius: 0 },
  moreTitle: { fontSize: rs(26), fontFamily: 'Cause-ExtraBold', color: '#fff' },
  userCard: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginTop: 16, marginBottom: 12, backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, gap: 12, shadowColor: 'rgba(233,123,59,0.12)', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 8, elevation: 3 },
  userInfo: { flex: 1 },
  userName: { fontSize: rs(16), fontFamily: 'Cause-Bold', color: '#1A0E00' },
  userPlan: { fontSize: rs(12), color: '#8B6F47', marginTop: 2 },
  upgradeBtn: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#E97B3B', borderRadius: 10 },
  upgradeBtnText: { fontSize: rs(12), fontFamily: 'Cause-Bold', color: '#fff' },
  menuCard: { marginHorizontal: 20, backgroundColor: '#FFFFFF', borderRadius: 18, overflow: 'hidden', shadowColor: 'rgba(233,123,59,0.08)', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 8, elevation: 3 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  menuIcon: { width: rs(38), height: rs(38), borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { flex: 1, fontSize: rs(14), fontFamily: 'Cause-Medium', color: '#1A0E00' },
  menuDivider: { height: 1, backgroundColor: '#F0DCC8', marginLeft: 66 },
  menuBadge: { paddingHorizontal: 8, paddingVertical: 3, backgroundColor: Colors.primary + '18', borderRadius: 8 },
  menuBadgeText: { fontSize: rs(11), fontFamily: 'Cause-SemiBold', color: Colors.primary },
  premiumBanner: { marginHorizontal: 20, marginTop: 12, borderRadius: 18, padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  premiumBannerTitle: { fontSize: rs(16), fontFamily: 'Cause-ExtraBold', color: '#fff' },
  premiumBannerSub: { fontSize: rs(12), color: 'rgba(255,255,255,0.8)', marginTop: 2 },
});
