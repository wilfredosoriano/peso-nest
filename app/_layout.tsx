import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { useAppStore } from '../src/store';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { loadUser, loadTransactions, loadCards, loadLoans, loadBudgetGoals } = useAppStore();

  useEffect(() => {
    const init = async () => {
      try {
        await Promise.all([
          loadUser(),
          loadTransactions(),
          loadCards(),
          loadLoans(),
          loadBudgetGoals(),
        ]);
      } finally {
        await SplashScreen.hideAsync();
      }
    };
    init();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" backgroundColor="#FDF1E7" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#FDF1E7' } }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="loans" options={{ presentation: 'card' }} />
          <Stack.Screen name="premium" options={{ presentation: 'card' }} />
          <Stack.Screen name="settings" options={{ presentation: 'card' }} />
          <Stack.Screen name="profile" options={{ presentation: 'card' }} />
          <Stack.Screen name="budget-goals" options={{ presentation: 'card' }} />
          <Stack.Screen name="categories" options={{ presentation: 'card' }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
