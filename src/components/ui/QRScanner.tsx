import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Linking, StatusBar,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';

type Props = {
  visible: boolean;
  onScan: (code: string) => void;
  onClose: () => void;
};

// We intentionally avoid <Modal> — iOS AVFoundation won't start a camera
// session inside a modal UIViewController (black screen). Plain absolute
// View keeps us in the main view hierarchy and works on both platforms.
export function QRScanner({ visible, onScan, onClose }: Props) {
  const [permission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    if (visible) setScanned(false);
  }, [visible]);

  if (!visible) return null;

  const handleScan = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    onScan(data.trim().toUpperCase());
  };

  const denied  = permission != null && !permission.granted && !permission.canAskAgain;
  const granted = permission?.granted === true;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* ── 1. CAMERA — rendered FIRST so it is the lowest z-layer ── */}
      {granted && (
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={scanned ? undefined : handleScan}
        />
      )}

      {/* ── 2. VIEWFINDER OVERLAY — dims everything around the scan window ── */}
      {granted && (
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
          {/* Top dark band — covers status bar + header area + gap above viewfinder */}
          <View style={styles.dimTop} />
          {/* Middle row: side dims + clear scan window */}
          <View style={styles.dimMiddle}>
            <View style={styles.dimSide} />
            <View style={styles.scanWindow}>
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />
            </View>
            <View style={styles.dimSide} />
          </View>
          {/* Bottom dark band with hint */}
          <View style={styles.dimBottom}>
            <Text style={styles.scanHint}>Point camera at a PesoNest QR code</Text>
          </View>
        </View>
      )}

      {/* ── 3. HEADER — rendered LAST so it is always on top ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Ionicons name="close" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan QR Code</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* ── 4. PERMISSION / LOADING STATES ── */}
      {denied ? (
        <View style={styles.center}>
          <Ionicons name="camera-outline" size={56} color="rgba(255,255,255,0.5)" />
          <Text style={styles.noPermText}>Camera access denied</Text>
          <Text style={styles.noPermSub}>Enable camera access in Settings to scan QR codes.</Text>
          <TouchableOpacity style={styles.settingsBtn} onPress={() => Linking.openSettings()}>
            <Text style={styles.settingsBtnText}>Open Settings</Text>
          </TouchableOpacity>
        </View>
      ) : !granted ? (
        <View style={styles.center}>
          <Ionicons name="camera-outline" size={56} color="rgba(255,255,255,0.5)" />
          <Text style={styles.noPermText}>Starting camera…</Text>
        </View>
      ) : null}

      {/* ── 5. SCANNED CONFIRMATION BANNER ── */}
      {granted && scanned && (
        <View style={styles.scannedBanner}>
          <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
          <Text style={styles.scannedText}>Code scanned!</Text>
        </View>
      )}
    </View>
  );
}

const VIEWFINDER = 220;
const CORNER     = 24;
const BORDER     = 3;

const styles = StyleSheet.create({
  // Full-screen absolute overlay — no Modal, stays in main view hierarchy
  root: { ...StyleSheet.absoluteFillObject, zIndex: 9999, backgroundColor: '#000' },

  // Header always floats above camera (absolute so it doesn't affect flex layout)
  header: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 16,
    gap: 12,
  },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {
    flex: 1, fontSize: 18, fontFamily: 'Cause-ExtraBold',
    color: '#fff', textAlign: 'center',
  },

  // Viewfinder dim layout — flex stretches top/bottom to fill remaining space
  dimTop:    { flex: 1, minHeight: 120, backgroundColor: 'rgba(0,0,0,0.6)' },
  dimMiddle: { flexDirection: 'row', height: VIEWFINDER },
  dimSide:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  scanWindow:{ width: VIEWFINDER, height: VIEWFINDER },
  dimBottom: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', paddingTop: 24 },
  scanHint:  { fontSize: 13, color: 'rgba(255,255,255,0.75)', fontFamily: 'Cause-Medium' },

  // Corner markers on the scan window
  corner:   { position: 'absolute', width: CORNER, height: CORNER },
  cornerTL: { top: 0,    left: 0,  borderTopWidth: BORDER,    borderLeftWidth: BORDER,  borderColor: Colors.primary, borderTopLeftRadius: 6 },
  cornerTR: { top: 0,    right: 0, borderTopWidth: BORDER,    borderRightWidth: BORDER, borderColor: Colors.primary, borderTopRightRadius: 6 },
  cornerBL: { bottom: 0, left: 0,  borderBottomWidth: BORDER, borderLeftWidth: BORDER,  borderColor: Colors.primary, borderBottomLeftRadius: 6 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: BORDER, borderRightWidth: BORDER, borderColor: Colors.primary, borderBottomRightRadius: 6 },

  // Permission / loading states
  center:         { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 40 },
  noPermText:     { fontSize: 16, fontFamily: 'Cause-Bold', color: '#fff', textAlign: 'center' },
  noPermSub:      { fontSize: 13, color: 'rgba(255,255,255,0.6)', textAlign: 'center', lineHeight: 20 },
  settingsBtn:    { marginTop: 8, backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 28 },
  settingsBtnText:{ fontSize: 14, fontFamily: 'Cause-ExtraBold', color: '#fff' },

  // Scanned confirmation
  scannedBanner: {
    position: 'absolute', bottom: 60, left: 40, right: 40,
    backgroundColor: '#1A0E00', borderRadius: 14, paddingVertical: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  scannedText: { fontSize: 15, fontFamily: 'Cause-Bold', color: '#fff' },
});
