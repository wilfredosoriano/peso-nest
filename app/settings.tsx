import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Switch, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAppStore } from '../src/store';
import { Colors } from '../src/constants/Colors';
import { formatCurrency } from '../src/utils/formatters';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const user = useAppStore((s) => s.user);
  const updateUser = useAppStore((s) => s.updateUser);
  const [budget, setBudget] = useState(String(user?.monthlyBudget ?? 10000));
  const [cloudSync, setCloudSync] = useState(false);

  const handleSaveBudget = async () => {
    const val = parseFloat(budget);
    if (!val || val <= 0) return;
    await updateUser({ monthlyBudget: val });
    Alert.alert('Saved', 'Monthly budget updated!');
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.textDark} />
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Budget */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Budget</Text>
          <View style={styles.card}>
            <Text style={styles.fieldLabel}>Monthly Budget</Text>
            <View style={styles.budgetRow}>
              <Text style={styles.currencySymbol}>₱</Text>
              <TextInput
                style={styles.budgetInput}
                value={budget}
                onChangeText={setBudget}
                keyboardType="decimal-pad"
                placeholder="10000"
                placeholderTextColor={Colors.textLight}
              />
              <TouchableOpacity style={styles.saveSmallBtn} onPress={handleSaveBudget}>
                <Text style={styles.saveSmallText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Cloud Sync */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Cloud Sync</Text>
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="cloud-outline" size={20} color={Colors.primary} style={{ marginRight: 10 }} />
                <View>
                  <Text style={styles.settingTitle}>Enable Cloud Sync</Text>
                  <Text style={styles.settingSubtitle}>Sync data across devices via Supabase</Text>
                </View>
              </View>
              <Switch
                value={cloudSync}
                onValueChange={(v) => {
                  if (v && !user?.isPremium) {
                    Alert.alert('Premium Required', 'Cloud Sync is a Premium feature. Upgrade to enable it.', [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Upgrade', onPress: () => router.push('/premium') },
                    ]);
                  } else {
                    setCloudSync(v);
                  }
                }}
                trackColor={{ false: Colors.border, true: Colors.primary }}
                thumbColor="#fff"
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="qr-code-outline" size={20} color={Colors.primary} style={{ marginRight: 10 }} />
                <View>
                  <Text style={styles.settingTitle}>QR Joint Loan Sharing</Text>
                  <Text style={styles.settingSubtitle}>Share loan details via QR code</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.premiumTag}
                onPress={() => !user?.isPremium && router.push('/premium')}
              >
                <Text style={styles.premiumTagText}>{user?.isPremium ? 'Active' : 'Premium'}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="phone-portrait-outline" size={20} color={Colors.primary} style={{ marginRight: 10 }} />
                <View>
                  <Text style={styles.settingTitle}>Transfer to New Device</Text>
                  <Text style={styles.settingSubtitle}>Export data for device transfer</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.premiumTag}
                onPress={() => !user?.isPremium && router.push('/premium')}
              >
                <Text style={styles.premiumTagText}>{user?.isPremium ? 'Active' : 'Premium'}</Text>
              </TouchableOpacity>
            </View>
          </View>
          {!user?.isPremium && (
            <TouchableOpacity style={styles.premiumNote} onPress={() => router.push('/premium')}>
              <Ionicons name="information-circle" size={14} color={Colors.primary} />
              <Text style={styles.premiumNoteText}>Cloud features require a Premium subscription</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Display */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Display</Text>
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="cash-outline" size={20} color={Colors.primary} style={{ marginRight: 10 }} />
                <View>
                  <Text style={styles.settingTitle}>Currency</Text>
                  <Text style={styles.settingSubtitle}>{user?.currency ?? 'PHP'} — Philippine Peso</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>About</Text>
          <View style={styles.card}>
            {[
              { label: 'Version', value: '1.0.0' },
              { label: 'Build', value: 'Expo SDK 54' },
              { label: 'Storage', value: 'SQLite (Offline First)' },
            ].map((item, i, arr) => (
              <React.Fragment key={item.label}>
                <View style={styles.aboutRow}>
                  <Text style={styles.aboutLabel}>{item.label}</Text>
                  <Text style={styles.aboutValue}>{item.value}</Text>
                </View>
                {i < arr.length - 1 && <View style={styles.divider} />}
              </React.Fragment>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDF1E7' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 12, gap: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', shadowColor: 'rgba(0,0,0,0.06)', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 1, shadowRadius: 4, elevation: 2 },
  title: { flex: 1, fontSize: 22, fontWeight: '800', color: '#1A0E00' },
  section: { marginBottom: 20 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: '#C4A882', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginLeft: 4 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, shadowColor: 'rgba(233,123,59,0.08)', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 6, elevation: 2 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#8B6F47', marginBottom: 8 },
  budgetRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  currencySymbol: { fontSize: 20, fontWeight: '700', color: '#8B6F47' },
  budgetInput: { flex: 1, fontSize: 22, fontWeight: '700', color: '#1A0E00', borderBottomWidth: 2, borderBottomColor: '#E97B3B', paddingBottom: 4 },
  saveSmallBtn: { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#E97B3B', borderRadius: 10 },
  saveSmallText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
  settingInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  settingTitle: { fontSize: 14, fontWeight: '600', color: '#1A0E00' },
  settingSubtitle: { fontSize: 11, color: '#C4A882', marginTop: 1 },
  divider: { height: 1, backgroundColor: '#F0DCC8', marginVertical: 10 },
  premiumTag: { paddingHorizontal: 10, paddingVertical: 4, backgroundColor: '#E97B3B20', borderRadius: 8 },
  premiumTagText: { fontSize: 11, fontWeight: '700', color: '#E97B3B' },
  premiumNote: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8, marginLeft: 4 },
  premiumNoteText: { fontSize: 11, color: '#E97B3B' },
  aboutRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  aboutLabel: { fontSize: 13, color: '#8B6F47' },
  aboutValue: { fontSize: 13, fontWeight: '600', color: '#1A0E00' },
});
