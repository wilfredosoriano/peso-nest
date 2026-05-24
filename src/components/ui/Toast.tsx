import React, { useEffect, useRef } from 'react';
import {
  Animated, View, Text, StyleSheet, PanResponder, TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useToastStore, ToastType } from '../../store/toastStore';
import { rs } from '../../utils/responsive';

const CONFIG: Record<ToastType, { bg: string; icon: string; iconColor: string }> = {
  success: { bg: '#1A6B2F', icon: 'checkmark-circle',    iconColor: '#4ADE80' },
  warning: { bg: '#7A3B00', icon: 'warning',              iconColor: '#FFA040' },
  error:   { bg: '#7A1A1A', icon: 'close-circle',         iconColor: '#FF6B6B' },
  info:    { bg: '#1A3A6B', icon: 'information-circle',   iconColor: '#60AAFF' },
};

export const Toast: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { visible, message, subtitle, type, hideToast } = useToastStore();
  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Spring in
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          damping: 22,
          stiffness: 280,
          mass: 0.8,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 160,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Slide back up
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -120,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  // Swipe up to dismiss
  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, { dy }) => {
        if (dy < 0) translateY.setValue(dy);
      },
      onPanResponderRelease: (_, { dy, vy }) => {
        if (dy < -30 || vy < -0.8) {
          hideToast();
        } else {
          Animated.spring(translateY, { toValue: 0, useNativeDriver: true }).start();
        }
      },
    }),
  ).current;

  const cfg = CONFIG[type];

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: insets.top + 10,
          transform: [{ translateY }],
          opacity,
        },
      ]}
      {...pan.panHandlers}
      pointerEvents={visible ? 'box-none' : 'none'}
    >
      <View style={[styles.toast, { backgroundColor: cfg.bg }]}>
        {/* Icon */}
        <View style={styles.iconWrap}>
          <Ionicons name={cfg.icon as any} size={rs(22)} color={cfg.iconColor} />
        </View>

        {/* Text */}
        <View style={styles.textWrap}>
          <Text style={styles.message} numberOfLines={2}>{message}</Text>
          {subtitle ? <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
        </View>

        {/* Close button */}
        <TouchableOpacity onPress={hideToast} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="close" size={rs(18)} color="rgba(255,255,255,0.55)" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 12,
  },
  iconWrap: {
    width: rs(32),
    height: rs(32),
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  textWrap: {
    flex: 1,
  },
  message: {
    fontSize: rs(14),
    fontFamily: 'Cause-Bold',
    color: '#fff',
    lineHeight: 19,
  },
  subtitle: {
    fontSize: rs(12),
    fontFamily: 'Cause-Regular',
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
});
