import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAppStore } from '../src/store';
import { Colors } from '../src/constants/Colors';
import { UserAvatar, AVATAR_IMAGES } from '../src/components/ui/UserAvatar';
import { rs } from '../src/utils/responsive';

const AVATAR_IDS = Object.keys(AVATAR_IMAGES);

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const user = useAppStore((s) => s.user);
  const updateUser = useAppStore((s) => s.updateUser);
  const [name, setName] = useState(user?.name ?? '');
  const [selectedAvatar, setSelectedAvatar] = useState<string | undefined>(user?.avatarStyle);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await updateUser({ name: name.trim(), avatarStyle: selectedAvatar });
    setSaving(false);
    Alert.alert('Saved', 'Profile updated!');
  };

  return (
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={rs(22)} color={Colors.textDark} />
        </TouchableOpacity>
        <Text style={styles.title}>Profile</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          <Text style={[styles.saveBtn, saving && { opacity: 0.4 }]}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
        {/* Avatar preview */}
        <View style={styles.avatarSection}>
          <UserAvatar avatarStyle={selectedAvatar} name={name} size={90} />
          <Text style={styles.avatarHint}>Choose your avatar</Text>
        </View>

        {/* Avatar grid */}
        <View style={styles.avatarGrid}>
          {AVATAR_IDS.map((id) => {
            const active = selectedAvatar === id;
            return (
              <TouchableOpacity
                key={id}
                onPress={() => setSelectedAvatar(id)}
                activeOpacity={0.8}
                style={[styles.avatarGridItem, active && styles.avatarGridItemActive]}
              >
                <Image source={AVATAR_IMAGES[id]} style={styles.avatarGridImg} resizeMode="cover" />
                {active && (
                  <View style={styles.avatarCheckBadge}>
                    <Ionicons name="checkmark" size={rs(10)} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Fields */}
        <View style={styles.card}>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Display Name</Text>
            <TextInput
              style={styles.fieldInput}
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor={Colors.textLight}
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Currency</Text>
            <View style={styles.currencyRow}>
              <Text style={styles.currencyFlag}>🇵🇭</Text>
              <Text style={styles.currencyText}>PHP — Philippine Peso</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Account Status</Text>
            <View style={styles.statusRow}>
              <View style={[styles.statusBadge, { backgroundColor: user?.isPremium ? Colors.primary + '20' : Colors.border }]}>
                <Text style={[styles.statusText, { color: user?.isPremium ? Colors.primary : Colors.textMedium }]}>
                  {user?.isPremium ? '✨ Premium' : 'Free Plan'}
                </Text>
              </View>
              {!user?.isPremium && (
                <TouchableOpacity onPress={() => router.push('/premium')}>
                  <Text style={styles.upgradeLink}>Upgrade →</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDF1E7' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 12 },
  backBtn: { width: rs(36), height: rs(36), borderRadius: 10, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', shadowColor: 'rgba(0,0,0,0.06)', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 1, shadowRadius: 4, elevation: 2 },
  title: { flex: 1, fontSize: rs(22), fontFamily: 'Cause-ExtraBold', color: '#1A0E00', textAlign: 'center' },
  saveBtn: { fontSize: rs(15), fontFamily: 'Cause-Bold', color: Colors.primary },
  avatarSection: { alignItems: 'center', marginBottom: 16 },
  avatarHint: { fontSize: rs(12), color: '#C4A882', marginTop: 10, fontFamily: 'Cause-Regular' },
  avatarGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 12,
    justifyContent: 'center', marginBottom: 24,
  },
  avatarGridItem: {
    position: 'relative',
    borderRadius: 32, borderWidth: 2.5, borderColor: 'transparent',
    padding: 2,
  },
  avatarGridItemActive: { borderColor: Colors.primary },
  avatarGridImg: { width: rs(56), height: rs(56), borderRadius: 28 },
  avatarCheckBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: rs(16), height: rs(16), borderRadius: 8,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#FDF1E7',
  },
  card: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 20, shadowColor: 'rgba(233,123,59,0.08)', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 8, elevation: 3 },
  field: { paddingVertical: 8 },
  fieldLabel: { fontSize: rs(12), fontFamily: 'Cause-Bold', color: '#C4A882', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  fieldInput: { fontSize: rs(16), fontFamily: 'Cause-SemiBold', color: '#1A0E00', borderBottomWidth: 1.5, borderBottomColor: '#F0DCC8', paddingBottom: 6 },
  divider: { height: 1, backgroundColor: '#F0DCC8', marginVertical: 8 },
  currencyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  currencyFlag: { fontSize: rs(20) },
  currencyText: { fontSize: rs(15), fontFamily: 'Cause-SemiBold', color: '#1A0E00' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10 },
  statusText: { fontSize: rs(13), fontFamily: 'Cause-Bold' },
  upgradeLink: { fontSize: rs(13), color: Colors.primary, fontFamily: 'Cause-Bold' },
});
