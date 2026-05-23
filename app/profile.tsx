import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAppStore } from '../src/store';
import { Colors } from '../src/constants/Colors';

const AVATAR_COLORS = ['#E97B3B', '#4ECDC4', '#E84040', '#9B59B6', '#2196F3', '#4CAF50'];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const user = useAppStore((s) => s.user);
  const updateUser = useAppStore((s) => s.updateUser);
  const [name, setName] = useState(user?.name ?? '');
  const [selectedColor, setSelectedColor] = useState(user?.avatarColor ?? Colors.primary);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await updateUser({ name: name.trim(), avatarColor: selectedColor });
    setSaving(false);
    Alert.alert('Saved', 'Profile updated!');
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.textDark} />
        </TouchableOpacity>
        <Text style={styles.title}>Profile</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          <Text style={[styles.saveBtn, saving && { opacity: 0.4 }]}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <LinearGradient colors={[selectedColor, selectedColor + 'CC']} style={styles.avatar}>
            <Text style={styles.avatarText}>{(name || 'U')[0].toUpperCase()}</Text>
          </LinearGradient>
          <Text style={styles.avatarHint}>Choose your avatar color</Text>
          <View style={styles.colorPicker}>
            {AVATAR_COLORS.map((color) => (
              <TouchableOpacity
                key={color}
                style={[styles.colorSwatch, { backgroundColor: color }, selectedColor === color && styles.colorSwatchSelected]}
                onPress={() => setSelectedColor(color)}
              >
                {selectedColor === color && <Ionicons name="checkmark" size={16} color="#fff" />}
              </TouchableOpacity>
            ))}
          </View>
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
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDF1E7' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', shadowColor: 'rgba(0,0,0,0.06)', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 1, shadowRadius: 4, elevation: 2 },
  title: { flex: 1, fontSize: 22, fontWeight: '800', color: '#1A0E00', textAlign: 'center' },
  saveBtn: { fontSize: 15, fontWeight: '700', color: '#E97B3B' },
  avatarSection: { alignItems: 'center', marginBottom: 24 },
  avatar: { width: 90, height: 90, borderRadius: 45, alignItems: 'center', justifyContent: 'center', marginBottom: 8, shadowColor: '#E97B3B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 },
  avatarText: { fontSize: 36, fontWeight: '800', color: '#fff' },
  avatarHint: { fontSize: 12, color: '#C4A882', marginBottom: 12 },
  colorPicker: { flexDirection: 'row', gap: 10 },
  colorSwatch: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  colorSwatchSelected: { borderWidth: 3, borderColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 4 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 20, shadowColor: 'rgba(233,123,59,0.08)', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 8, elevation: 3 },
  field: { paddingVertical: 8 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: '#C4A882', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  fieldInput: { fontSize: 16, fontWeight: '600', color: '#1A0E00', borderBottomWidth: 1.5, borderBottomColor: '#F0DCC8', paddingBottom: 6 },
  divider: { height: 1, backgroundColor: '#F0DCC8', marginVertical: 8 },
  currencyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  currencyFlag: { fontSize: 20 },
  currencyText: { fontSize: 15, fontWeight: '600', color: '#1A0E00' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10 },
  statusText: { fontSize: 13, fontWeight: '700' },
  upgradeLink: { fontSize: 13, color: '#E97B3B', fontWeight: '700' },
});
