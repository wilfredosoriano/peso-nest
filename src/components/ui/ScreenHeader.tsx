import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '../../constants/Colors';

interface ScreenHeaderProps {
  title: string;
  showBack?: boolean;
  rightElement?: React.ReactNode;
  subtitle?: string;
  dark?: boolean;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  showBack = false,
  rightElement,
  subtitle,
  dark = false,
}) => {
  const insets = useSafeAreaInsets();
  const textColor = dark ? '#fff' : Colors.textDark;

  return (
    <View style={[styles.header, { paddingTop: insets.top + 8 }, dark && styles.darkBg]}>
      <View style={styles.row}>
        {showBack ? (
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={textColor} />
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}
        <View style={styles.titleWrap}>
          <Text style={[styles.title, { color: textColor }]}>{title}</Text>
          {subtitle && <Text style={[styles.subtitle, { color: dark ? 'rgba(255,255,255,0.75)' : Colors.textLight }]}>{subtitle}</Text>}
        </View>
        <View style={styles.right}>{rightElement ?? <View style={styles.placeholder} />}</View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: Colors.background,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  darkBg: {
    backgroundColor: 'transparent',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  titleWrap: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textDark,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  placeholder: {
    width: 36,
  },
  right: {
    width: 36,
    alignItems: 'flex-end',
  },
});
