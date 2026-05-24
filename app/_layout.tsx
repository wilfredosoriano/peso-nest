import { useEffect, useRef } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Toast } from '../src/components/ui/Toast';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import { AppState, AppStateStatus, Text } from 'react-native';
import { useAppStore } from '../src/store';
import { setupNotificationHandler } from '../src/utils/notifications';
import { flushPendingLoanSyncs } from '../src/utils/sync';
import { initializePurchases, checkPremiumEntitlement } from '../src/utils/purchases';
import { ensureAnonSession } from '../src/lib/supabase';

setupNotificationHandler();

SplashScreen.preventAutoHideAsync();

// Default all Text to Cause-Regular so unstyled text uses the brand font
if (!(Text as any).defaultProps) (Text as any).defaultProps = {};
(Text as any).defaultProps.style = { fontFamily: 'Cause-Regular' };

export default function RootLayout() {
  const { loadUser, loadTransactions, loadCards, loadLoans, loadBudgetGoals, loadSavingsGoals, loadSavingsActivity } = useAppStore();
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && next === 'active') {
        flushPendingLoanSyncs().catch(() => {});
      }
      appState.current = next;
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    let splashHidden = false;
    const hideSplash = async () => {
      if (!splashHidden) {
        splashHidden = true;
        await SplashScreen.hideAsync();
      }
    };

    // Safety net — never stay stuck on splash longer than 6 seconds
    const timeout = setTimeout(hideSplash, 6000);

    const init = async () => {
      try {
        await Font.loadAsync({
          'Cause-Thin':       require('../assets/fonts/Cause-Thin.ttf'),
          'Cause-ExtraLight': require('../assets/fonts/Cause-ExtraLight.ttf'),
          'Cause-Light':      require('../assets/fonts/Cause-Light.ttf'),
          'Cause-Regular':    require('../assets/fonts/Cause-Regular.ttf'),
          'Cause-Medium':     require('../assets/fonts/Cause-Medium.ttf'),
          'Cause-SemiBold':   require('../assets/fonts/Cause-SemiBold.ttf'),
          'Cause-Bold':       require('../assets/fonts/Cause-Bold.ttf'),
          'Cause-ExtraBold':  require('../assets/fonts/Cause-ExtraBold.ttf'),
          'Cause-Black':      require('../assets/fonts/Cause-Black.ttf'),
        });
        // Establish anonymous Supabase session before any DB operations
        await ensureAnonSession().catch(() => {});
        await Promise.all([
          loadUser(),
          loadTransactions(),
          loadCards(),
          loadLoans(),
          loadBudgetGoals(),
          loadSavingsGoals(),
          loadSavingsActivity(),
        ]);
        initializePurchases();
        // Sync RevenueCat premium status with local DB
        const isPremiumRC = await checkPremiumEntitlement().catch(() => false);
        if (isPremiumRC) {
          await useAppStore.getState().updateUser({ isPremium: true });
        }
      } finally {
        clearTimeout(timeout);
        await hideSplash();
      }
    };
    init();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" backgroundColor="#FDF1E7" />
        <Toast />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#FDF1E7' },
            // Smooth horizontal slide on both iOS and Android
            animation: 'slide_from_right',
            animationDuration: 280,
            // Allow swipe-back gesture on all screens
            gestureEnabled: true,
            gestureDirection: 'horizontal',
          }}
        >
          {/* Root / tabs — no transition, they just appear */}
          <Stack.Screen name="index" options={{ animation: 'none' }} />
          <Stack.Screen name="(tabs)" options={{ animation: 'none' }} />
          {/* Pushed screens — inherit the smooth slide */}
          <Stack.Screen name="loans" />
          <Stack.Screen name="premium" />
          <Stack.Screen name="settings" />
          <Stack.Screen name="profile" />
          <Stack.Screen name="budget-goals" />
          <Stack.Screen name="categories" />
          <Stack.Screen name="savings" />
          <Stack.Screen name="faq" />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
