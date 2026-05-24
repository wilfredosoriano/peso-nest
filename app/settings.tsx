import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Switch,
  Alert, Linking, Modal, TextInput, ActivityIndicator, StatusBar,
  Animated, PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { useAppStore } from '../src/store';
import { Colors } from '../src/constants/Colors';
import { rs } from '../src/utils/responsive';
import {
  requestNotificationPermission,
  scheduleAllLoanNotifications,
  cancelAllLoanNotifications,
} from '../src/utils/notifications';
import { createDeviceTransfer, claimDeviceTransfer } from '../src/utils/sync';
import { QRScanner } from '../src/components/ui/QRScanner';

const DAYS_OPTIONS = [1, 3, 7] as const;

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const user = useAppStore((s) => s.user);
  const loans = useAppStore((s) => s.loans);
  const updateUser = useAppStore((s) => s.updateUser);
  const deleteAllData = useAppStore((s) => s.deleteAllData);
  const exportAllData = useAppStore((s) => s.exportAllData);
  const importAllData = useAppStore((s) => s.importAllData);

  const [exporting, setExporting] = useState(false);
  const [transferModal, setTransferModal] = useState(false);
  const [transferTab, setTransferTab] = useState<'send' | 'receive'>('send');
  const [transferCode, setTransferCode] = useState('');
  const [transferInput, setTransferInput] = useState('');
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferScannerVisible, setTransferScannerVisible] = useState(false);

  const transferY = useRef(new Animated.Value(800)).current;
  const transferOverlay = transferY.interpolate({ inputRange: [0, 400], outputRange: [1, 0], extrapolate: 'clamp' });
  useEffect(() => {
    if (transferModal) { transferY.setValue(800); Animated.spring(transferY, { toValue: 0, useNativeDriver: true, damping: 28, stiffness: 220 }).start(); }
  }, [transferModal]);
  const dismissTransfer = (dy: number, vy: number) => {
    if (dy > 100 || vy > 1.0) { Animated.timing(transferY, { toValue: 800, duration: 220, useNativeDriver: true }).start(() => setTransferModal(false)); }
    else { Animated.spring(transferY, { toValue: 0, useNativeDriver: true }).start(); }
  };
  const transferPan = useRef(PanResponder.create({ onStartShouldSetPanResponder: () => true, onPanResponderMove: (_, { dy }) => { if (dy > 0) transferY.setValue(dy); }, onPanResponderRelease: (_, { dy, vy }) => dismissTransfer(dy, vy) })).current;

  const handleGenerateTransfer = async () => {
    setTransferLoading(true);
    try {
      const data = await exportAllData();
      const code = await createDeviceTransfer(data);
      setTransferCode(code);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Could not generate transfer code.');
    } finally {
      setTransferLoading(false);
    }
  };

  const handleClaimTransfer = async () => {
    if (!transferInput.trim()) {
      Alert.alert('Missing Code', 'Please enter your transfer code.');
      return;
    }
    setTransferLoading(true);
    try {
      const result = await claimDeviceTransfer(transferInput.trim());
      await importAllData(result as Parameters<typeof importAllData>[0]);
      setTransferModal(false);
      setTransferInput('');
      Alert.alert('Success', 'Data restored successfully.');
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Could not restore data.');
    } finally {
      setTransferLoading(false);
    }
  };

  const handleToggleNotifications = async (enabled: boolean) => {
    if (enabled) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        Alert.alert('Permission Denied', 'Enable notifications in your device Settings to use this feature.');
        return;
      }
      await updateUser({ notificationsEnabled: true });
      await scheduleAllLoanNotifications(loans, user?.notificationsDaysBefore ?? 1);
    } else {
      await cancelAllLoanNotifications(loans);
      await updateUser({ notificationsEnabled: false });
    }
  };

  const handleDaysBefore = async (days: number) => {
    if (!user?.notificationsEnabled) return;
    await cancelAllLoanNotifications(loans);
    await updateUser({ notificationsDaysBefore: days });
    await scheduleAllLoanNotifications(loans, days);
  };

  const requirePremium = () => {
    Alert.alert(
      'Premium Feature',
      'Export is available for Premium members only.',
      [
        { text: 'Not Now', style: 'cancel' },
        { text: 'Upgrade', onPress: () => router.push('/premium') },
      ]
    );
  };

  const handleExportJSON = async () => {
    if (!user?.isPremium) { requirePremium(); return; }
    setExporting(true);
    try {
      const data = await exportAllData();
      const json = JSON.stringify(data, null, 2);
      const path = FileSystem.cacheDirectory + 'pesonest-backup.json';
      await FileSystem.writeAsStringAsync(path, json, { encoding: FileSystem.EncodingType.UTF8 });
      await Sharing.shareAsync(path, { mimeType: 'application/json', dialogTitle: 'Export PesoNest Data' });
    } catch (e) {
      Alert.alert('Export Failed', 'Could not export data. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const handleExportCSV = async () => {
    if (!user?.isPremium) { requirePremium(); return; }
    setExporting(true);
    try {
      const data = await exportAllData();
      const header = 'id,type,amount,category,description,date,cardId\n';
      const rows = data.transactions
        .map((t) => `${t.id},${t.type},${t.amount},"${t.category}","${t.description.replace(/"/g, '""')}",${t.date},${t.cardId ?? ''}`)
        .join('\n');
      const csv = header + rows;
      const path = FileSystem.cacheDirectory + 'pesonest-transactions.csv';
      await FileSystem.writeAsStringAsync(path, csv, { encoding: FileSystem.EncodingType.UTF8 });
      await Sharing.shareAsync(path, { mimeType: 'text/csv', dialogTitle: 'Export Transactions CSV' });
    } catch (e) {
      Alert.alert('Export Failed', 'Could not export data. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const handleImportJSON = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/json', copyToCacheDirectory: true });
      if (result.canceled) return;
      const uri = result.assets[0].uri;
      const raw = await FileSystem.readAsStringAsync(uri);
      const data = JSON.parse(raw);
      if (!data || typeof data !== 'object') throw new Error('Invalid file');
      Alert.alert(
        'Restore Backup',
        'This will replace all your current data with the backup. Continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Restore',
            onPress: async () => {
              await importAllData(data);
              Alert.alert('Done', 'Your data has been restored successfully.');
            },
          },
        ]
      );
    } catch (e) {
      Alert.alert('Import Failed', 'The file could not be read. Make sure it is a valid PesoNest backup.');
    }
  };

  const handleDeleteAllData = () => {
    Alert.alert(
      'Delete All Data',
      'This will permanently delete all your transactions, cards, loans, and budget goals. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: async () => {
            await deleteAllData();
            Alert.alert('Done', 'All data has been deleted.');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={rs(22)} color={Colors.textDark} />
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Notifications</Text>
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="notifications-outline" size={rs(20)} color={Colors.primary} style={{ marginRight: 10 }} />
                <View>
                  <Text style={styles.settingTitle}>Loan Due Reminders</Text>
                  <Text style={styles.settingSubtitle}>Get notified before a payment is due</Text>
                </View>
              </View>
              <Switch
                value={user?.notificationsEnabled ?? false}
                onValueChange={handleToggleNotifications}
                trackColor={{ false: Colors.border, true: Colors.primary }}
                thumbColor="#fff"
              />
            </View>
            {user?.notificationsEnabled && (
              <>
                <View style={styles.divider} />
                <Text style={styles.fieldLabel}>Remind me</Text>
                <View style={styles.daysRow}>
                  {DAYS_OPTIONS.map((d) => {
                    const active = (user?.notificationsDaysBefore ?? 1) === d;
                    return (
                      <TouchableOpacity
                        key={d}
                        style={[styles.dayChip, active && styles.dayChipActive]}
                        onPress={() => handleDaysBefore(d)}
                      >
                        <Text style={[styles.dayChipText, active && styles.dayChipTextActive]}>
                          {d} day{d !== 1 ? 's' : ''} before
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}
          </View>
        </View>

        {/* Cloud Sync */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Cloud Sync</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.connectRow}
              onPress={() => { setTransferCode(''); setTransferInput(''); setTransferTab('send'); setTransferModal(true); }}
              activeOpacity={0.75}
            >
              <View style={styles.settingInfo}>
                <Ionicons name="phone-portrait-outline" size={rs(20)} color={Colors.primary} style={{ marginRight: 10 }} />
                <View>
                  <Text style={styles.settingTitle}>Transfer to New Device</Text>
                  <Text style={styles.settingSubtitle}>Move all your data to a new phone</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={rs(16)} color="#C4A882" />
            </TouchableOpacity>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="qr-code-outline" size={rs(20)} color={Colors.primary} style={{ marginRight: 10 }} />
                <View>
                  <Text style={styles.settingTitle}>QR Joint Loan Sharing</Text>
                  <Text style={styles.settingSubtitle}>Go to Loans to share or claim</Text>
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
        </View>

        {/* Display */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Display</Text>
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="cash-outline" size={rs(20)} color={Colors.primary} style={{ marginRight: 10 }} />
                <View>
                  <Text style={styles.settingTitle}>Currency</Text>
                  <Text style={styles.settingSubtitle}>{user?.currency ?? 'PHP'} — Philippine Peso</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Data */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Data</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.dataRow} onPress={handleExportJSON} disabled={exporting} activeOpacity={0.7}>
              <View style={styles.settingInfo}>
                <Ionicons name="cloud-download-outline" size={rs(20)} color={Colors.primary} style={{ marginRight: 10 }} />
                <View>
                  <Text style={styles.settingTitle}>Export Full Backup (JSON)</Text>
                  <Text style={styles.settingSubtitle}>All data — restore on any device</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.premiumTag} onPress={() => !user?.isPremium && router.push('/premium')}>
                <Text style={styles.premiumTagText}>{user?.isPremium ? 'Active' : 'Premium'}</Text>
              </TouchableOpacity>
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.dataRow} onPress={handleExportCSV} disabled={exporting} activeOpacity={0.7}>
              <View style={styles.settingInfo}>
                <Ionicons name="document-text-outline" size={rs(20)} color={Colors.primary} style={{ marginRight: 10 }} />
                <View>
                  <Text style={styles.settingTitle}>Export Transactions (CSV)</Text>
                  <Text style={styles.settingSubtitle}>Open in Excel or Google Sheets</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.premiumTag} onPress={() => !user?.isPremium && router.push('/premium')}>
                <Text style={styles.premiumTagText}>{user?.isPremium ? 'Active' : 'Premium'}</Text>
              </TouchableOpacity>
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.dataRow} onPress={handleImportJSON} activeOpacity={0.7}>
              <View style={styles.settingInfo}>
                <Ionicons name="cloud-upload-outline" size={rs(20)} color={Colors.primary} style={{ marginRight: 10 }} />
                <View>
                  <Text style={styles.settingTitle}>Import Backup (JSON)</Text>
                  <Text style={styles.settingSubtitle}>Restore from a previous backup file</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={rs(16)} color="#C4A882" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: '#E53935' }]}>Danger Zone</Text>
          <View style={[styles.card, { borderWidth: 1, borderColor: '#FFCDD2' }]}>
            <TouchableOpacity style={styles.dataRow} onPress={handleDeleteAllData} activeOpacity={0.7}>
              <View style={styles.settingInfo}>
                <Ionicons name="trash-outline" size={rs(20)} color="#E53935" style={{ marginRight: 10 }} />
                <View>
                  <Text style={[styles.settingTitle, { color: '#E53935' }]}>Delete All Data</Text>
                  <Text style={styles.settingSubtitle}>Remove all transactions, cards, loans & goals</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={rs(16)} color="#E53935" />
            </TouchableOpacity>
          </View>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>About</Text>
          <View style={styles.card}>
            <View style={styles.aboutRow}>
              <Text style={styles.aboutLabel}>Version</Text>
              <Text style={styles.aboutValue}>1.0.0</Text>
            </View>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.aboutLinkRow} onPress={() => Linking.openURL('https://wilfredosoriano.github.io/peso-nest-legal/privacy-policy.html')}>
              <Text style={styles.aboutLabel}>Privacy Policy</Text>
              <Ionicons name="chevron-forward" size={rs(16)} color="#C4A882" />
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.aboutLinkRow} onPress={() => Linking.openURL('https://wilfredosoriano.github.io/peso-nest-legal/terms.html')}>
              <Text style={styles.aboutLabel}>Terms of Service</Text>
              <Ionicons name="chevron-forward" size={rs(16)} color="#C4A882" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Credits */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Credits</Text>
          <View style={styles.card}>
            <Text style={styles.creditHeading}>Avatar Illustrations</Text>
            <Text style={styles.creditDesc}>
              {'The avatar style '}
              <Text style={styles.creditLink} onPress={() => Linking.openURL('https://www.dicebear.com/styles/toon-head/')}>Toon Head</Text>
              {' is a remix of '}
              <Text style={styles.creditLink} onPress={() => Linking.openURL('https://www.figma.com/community/file/1589627891082866389')}>ToonHead</Text>
              {' by '}
              <Text style={styles.creditLink} onPress={() => Linking.openURL('https://www.johanmelin.com/')}>Johan Melin</Text>
              {', licensed under '}
              <Text style={styles.creditLink} onPress={() => Linking.openURL('https://creativecommons.org/licenses/by/4.0/')}>CC BY 4.0</Text>
              {'.'}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Transfer Modal */}
      <Modal visible={transferModal} animationType="none" transparent statusBarTranslucent onRequestClose={() => setTransferModal(false)}>
        <StatusBar translucent backgroundColor="transparent" />
        <Animated.View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)', opacity: transferOverlay }} pointerEvents="none" />
        <Animated.View style={{ flex: 1, justifyContent: 'flex-end', transform: [{ translateY: transferY }] }}>
          <View style={authStyles.sheet}>
            <View style={authStyles.handle} {...transferPan.panHandlers}>
              <View style={authStyles.handlePill} />
            </View>
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              automaticallyAdjustKeyboardInsets
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 24 }}
            >
              <Text style={authStyles.sheetTitle}>Transfer to New Device</Text>

              {/* Tabs */}
              <View style={authStyles.tabs}>
                {(['send', 'receive'] as const).map((tab) => (
                  <TouchableOpacity
                    key={tab}
                    style={[authStyles.tab, transferTab === tab && authStyles.tabActive]}
                    onPress={() => { setTransferTab(tab); setTransferCode(''); setTransferInput(''); }}
                  >
                    <Text style={[authStyles.tabText, transferTab === tab && authStyles.tabTextActive]}>
                      {tab === 'send' ? 'Send' : 'Receive'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {transferTab === 'send' ? (
                <>
                  {transferCode ? (
                    <View style={authStyles.codeBlock}>
                      <Text style={authStyles.codeLabel}>Your transfer code</Text>
                      <Text style={authStyles.codeText}>{transferCode}</Text>
                      <View style={{ alignItems: 'center', marginTop: 16 }}>
                        <QRCode value={transferCode} size={160} color="#1A0E00" backgroundColor="#FDF1E7" />
                      </View>
                      <Text style={authStyles.codeHint}>Code expires in 24 hours. Use it on your new device.</Text>
                    </View>
                  ) : (
                    <Text style={authStyles.transferDesc}>
                      Generate a one-time code to transfer all your PesoNest data to a new device.
                    </Text>
                  )}
                  <TouchableOpacity
                    style={[authStyles.authBtn, transferLoading && { opacity: 0.6 }]}
                    onPress={handleGenerateTransfer}
                    disabled={transferLoading || !!transferCode}
                    activeOpacity={0.85}
                  >
                    {transferLoading
                      ? <ActivityIndicator color="#fff" />
                      : <Text style={authStyles.authBtnText}>{transferCode ? 'Code Generated' : 'Generate Transfer Code'}</Text>
                    }
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={authStyles.transferDesc}>
                    Enter the 6-character code from your old device to restore your data here.
                  </Text>
                  <TouchableOpacity
                    style={authStyles.scanBtn}
                    onPress={() => setTransferScannerVisible(true)}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="qr-code-outline" size={rs(18)} color="#fff" />
                    <Text style={authStyles.scanBtnText}>Scan QR Code</Text>
                  </TouchableOpacity>
                  <View style={authStyles.orRow}>
                    <View style={authStyles.orLine} />
                    <Text style={authStyles.orText}>or enter manually</Text>
                    <View style={authStyles.orLine} />
                  </View>
                  <TextInput
                    style={[authStyles.input, { color: '#1A0E00', textTransform: 'uppercase', letterSpacing: 4, textAlign: 'center', fontSize: rs(18), fontFamily: 'Cause-Bold' }]}
                    placeholder="XXXXXX"
                    placeholderTextColor={Colors.textLight}
                    value={transferInput}
                    onChangeText={(v) => setTransferInput(v.toUpperCase())}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    maxLength={6}
                    selectionColor={Colors.primary}
                  />
                  <TouchableOpacity
                    style={[authStyles.authBtn, transferLoading && { opacity: 0.6 }]}
                    onPress={handleClaimTransfer}
                    disabled={transferLoading}
                    activeOpacity={0.85}
                  >
                    {transferLoading
                      ? <ActivityIndicator color="#fff" />
                      : <Text style={authStyles.authBtnText}>Restore Data</Text>
                    }
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          </View>
        </Animated.View>
      </Modal>

      <QRScanner
        visible={transferScannerVisible}
        onScan={(code) => { setTransferScannerVisible(false); setTransferInput(code); }}
        onClose={() => setTransferScannerVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDF1E7' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 12, gap: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', shadowColor: 'rgba(0,0,0,0.06)', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 1, shadowRadius: 4, elevation: 2 },
  title: { flex: 1, fontSize: rs(22), fontFamily: 'Cause-ExtraBold', color: '#1A0E00' },
  section: { marginBottom: 20 },
  sectionLabel: { fontSize: rs(12), fontFamily: 'Cause-Bold', color: '#C4A882', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginLeft: 4 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, shadowColor: 'rgba(233,123,59,0.08)', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 6, elevation: 2 },
  fieldLabel: { fontSize: rs(13), fontFamily: 'Cause-SemiBold', color: '#8B6F47', marginBottom: 8 },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
  settingInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  settingTitle: { fontSize: rs(14), fontFamily: 'Cause-SemiBold', color: '#1A0E00' },
  settingSubtitle: { fontSize: rs(11), color: '#C4A882', marginTop: 1 },
  divider: { height: 1, backgroundColor: '#F0DCC8', marginVertical: 10 },
  premiumTag: { paddingHorizontal: 10, paddingVertical: 4, backgroundColor: '#E97B3B20', borderRadius: 8 },
  premiumTagText: { fontSize: rs(11), fontFamily: 'Cause-Bold', color: '#E97B3B' },
  daysRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  dayChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.surface },
  dayChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '15' },
  dayChipText: { fontSize: rs(12), fontFamily: 'Cause-SemiBold', color: Colors.textMedium },
  dayChipTextActive: { color: Colors.primary },
  premiumNote: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8, marginLeft: 4 },
  premiumNoteText: { fontSize: rs(11), color: '#E97B3B' },
  dataRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
  aboutRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  aboutLinkRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  aboutLabel: { fontSize: rs(13), color: '#8B6F47' },
  aboutValue: { fontSize: rs(13), fontFamily: 'Cause-SemiBold', color: '#1A0E00' },
  creditHeading: { fontSize: rs(13), fontFamily: 'Cause-Bold', color: '#1A0E00', marginBottom: 6 },
  creditDesc: { fontSize: rs(13), color: '#8B6F47', lineHeight: 20 },
  creditLink: { fontFamily: 'Cause-SemiBold', color: Colors.primary },
  connectRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
});

const authStyles = StyleSheet.create({
  modalWrap:  { flex: 1, justifyContent: 'flex-end' },
  overlay:    { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet:      { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '88%' },
  handle:     { width: '100%', alignItems: 'center', paddingTop: 14, paddingBottom: 10 },
  handlePill: { width: 36, height: 4, backgroundColor: '#D0C0B0', borderRadius: 2 },
  sheetTitle: { fontSize: rs(20), fontFamily: 'Cause-ExtraBold', color: '#1A0E00', textAlign: 'center', marginBottom: 20 },
  tabs: { flexDirection: 'row', backgroundColor: '#F5EDE0', borderRadius: 12, padding: 4, marginBottom: 20 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  tabActive: { backgroundColor: '#fff', shadowColor: 'rgba(0,0,0,0.08)', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 1, shadowRadius: 4, elevation: 2 },
  tabText: { fontSize: rs(13), fontFamily: 'Cause-SemiBold', color: Colors.textLight },
  tabTextActive: { color: Colors.primary, fontFamily: 'Cause-ExtraBold' },
  input: { backgroundColor: '#F9F3EC', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: rs(14), fontFamily: 'Cause-Regular', color: '#1A0E00', marginBottom: 12, borderWidth: 1, borderColor: '#F0DCC8' },
  authBtn: { backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 4 },
  authBtnText: { fontSize: rs(15), fontFamily: 'Cause-ExtraBold', color: '#fff' },
  transferDesc: { fontSize: rs(13), color: '#8B6F47', fontFamily: 'Cause-Regular', marginBottom: 20, lineHeight: 20 },
  codeBlock: { backgroundColor: '#FDF1E7', borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 16 },
  codeLabel: { fontSize: rs(12), fontFamily: 'Cause-Bold', color: '#C4A882', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  codeText: { fontSize: rs(36), fontFamily: 'Cause-ExtraBold', color: '#1A0E00', letterSpacing: 8 },
  codeHint: { fontSize: rs(12), color: '#C4A882', fontFamily: 'Cause-Regular', textAlign: 'center', marginTop: 16 },
  scanBtn: { backgroundColor: '#1A0E00', borderRadius: 14, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16 },
  scanBtnText: { fontSize: rs(14), fontFamily: 'Cause-ExtraBold', color: '#fff' },
  orRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  orLine: { flex: 1, height: 1, backgroundColor: '#F0DCC8' },
  orText: { fontSize: rs(12), color: '#C4A882', fontFamily: 'Cause-Regular' },
});
