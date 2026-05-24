import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/Colors';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TAB_ICON: Record<string, string> = {
  index: 'grid',
  transactions: 'receipt',
  charts: 'stats-chart',
  cards: 'wallet',
  more: 'apps',
};

const TAB_LABEL: Record<string, string> = {
  index: 'Dashboard',
  transactions: 'Transactions',
  charts: 'Charts',
  cards: 'Cards',
  more: 'More',
};

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 60 + insets.bottom,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0,
          borderTopColor: 'transparent',
          elevation: 20,
          shadowColor: 'rgba(26,14,0,0.15)',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 1,
          shadowRadius: 12,
        },
        tabBarActiveTintColor: Colors.navActive,
        tabBarInactiveTintColor: Colors.navInactive,
        tabBarLabelStyle: { fontSize: 10, fontFamily: 'Cause-SemiBold', marginBottom: 4 },
        tabBarItemStyle: { paddingTop: 8 },
        tabBarIcon: ({ color, focused }) => (
          <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
            <Ionicons
              name={(focused ? TAB_ICON[route.name] : `${TAB_ICON[route.name]}-outline`) as any}
              size={22}
              color={color}
            />
          </View>
        ),
        tabBarLabel: TAB_LABEL[route.name] ?? route.name,
      })}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="transactions" />
      <Tabs.Screen name="charts" />
      <Tabs.Screen name="cards" />
      <Tabs.Screen name="more" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    width: 36,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  iconWrapActive: {
    backgroundColor: `${Colors.primary}18`,
  },
});
