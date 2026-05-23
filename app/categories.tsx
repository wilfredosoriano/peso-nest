import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { CATEGORIES } from '../src/constants/Categories';
import { Colors } from '../src/constants/Colors';

export default function CategoriesScreen() {
  const insets = useSafeAreaInsets();
  const incomeCategories = CATEGORIES.filter((c) => c.type === 'income');
  const expenseCategories = CATEGORIES.filter((c) => c.type === 'expense' || c.type === 'both');

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.textDark} />
        </TouchableOpacity>
        <Text style={styles.title}>Categories</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {[
          { label: 'Income', items: incomeCategories },
          { label: 'Expense', items: expenseCategories },
        ].map((group) => (
          <View key={group.label} style={styles.section}>
            <Text style={styles.sectionLabel}>{group.label}</Text>
            <View style={styles.grid}>
              {group.items.map((cat) => (
                <View key={cat.id} style={styles.catCard}>
                  <View style={[styles.catIcon, { backgroundColor: cat.color + '20' }]}>
                    <Ionicons name={cat.icon as any} size={22} color={cat.color} />
                  </View>
                  <Text style={styles.catName}>{cat.name}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDF1E7' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 12, gap: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', shadowColor: 'rgba(0,0,0,0.06)', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 1, shadowRadius: 4, elevation: 2 },
  title: { flex: 1, fontSize: 22, fontWeight: '800', color: '#1A0E00' },
  section: { marginBottom: 24 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: '#C4A882', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, marginLeft: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  catCard: { width: '30%', backgroundColor: '#FFFFFF', borderRadius: 14, padding: 12, alignItems: 'center', gap: 8, shadowColor: 'rgba(233,123,59,0.06)', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 1, shadowRadius: 4, elevation: 1 },
  catIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  catName: { fontSize: 10, fontWeight: '600', color: '#8B6F47', textAlign: 'center' },
});
