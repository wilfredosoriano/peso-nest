import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, ImageBackground } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../src/constants/Colors';

const BG = require('../assets/images/backgrounds/welcome-bg.webp');

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const progress = useRef(new Animated.Value(0)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(fadeIn, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(progress, { toValue: 1, duration: 2000, useNativeDriver: false }),
    ]).start(() => {
      router.replace('/(tabs)');
    });
  }, []);

  const progressWidth = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <ImageBackground source={BG} style={styles.container} resizeMode="cover">
      <StatusBar style="light" />

      {/* Dark gradient scrim so bottom content is always legible */}
      <LinearGradient
        colors={['transparent', 'transparent', 'rgba(20,10,0,0.55)', 'rgba(20,10,0,0.82)']}
        locations={[0, 0.45, 0.72, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Overlay content pinned to bottom */}
      <Animated.View style={[styles.content, { opacity: fadeIn, paddingBottom: insets.bottom + 48 }]}>
        {/* Logo */}
        <View style={styles.logoWrap}>
          <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.logo}>
            <Text style={styles.logoIcon}>🌿</Text>
          </LinearGradient>
        </View>

        <Text style={styles.appName}>PesoNest</Text>
        <Text style={styles.tagline}>Track your expenses,{'\n'}Plan your future.</Text>

        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressBar, { width: progressWidth }]} />
        </View>
        <Text style={styles.loadingText}>Loading your journey...</Text>
      </Animated.View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A0E00',
  },
  content: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  logoWrap: {
    marginBottom: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  logo: {
    width: 76,
    height: 76,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoIcon: {
    fontSize: 36,
  },
  appName: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  tagline: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  progressTrack: {
    width: '80%',
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  loadingText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.55)',
  },
});
