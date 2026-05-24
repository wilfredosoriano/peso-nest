import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors } from '../src/constants/Colors';
import { rs } from '../src/utils/responsive';

const FAQS = [
  {
    q: 'How do I add a transaction?',
    a: 'Tap the orange + button on the Dashboard or Transactions screen. Choose Income or Expense, enter the amount, description, date, and category. You can also link it to a card to automatically update your balance.',
  },
  {
    q: 'How do I add a card or payment method?',
    a: 'Go to the Cards tab, tap the + button at the top right. Enter your bank name, balance, card type (Debit or Credit), and network (Visa or Mastercard). Your cards will appear in the transaction form so you can track spending per card.',
  },
  {
    q: 'How do I set a monthly budget?',
    a: 'Go to More → Settings → Budget. Enter your monthly budget amount and tap Save. The Budget Overview on your Dashboard will track how much you\'ve spent against it.',
  },
  {
    q: 'How do I create a budget goal?',
    a: 'Go to More → Budget Goals, then tap the + button. Select a spending category, set a limit amount, and save. Your goals will show progress based on that month\'s transactions.',
  },
  {
    q: 'How do I track a loan?',
    a: 'Go to the Cards tab and tap the wallet icon in the header to open Manage Loans. Tap Add Loan, fill in the details including bank, amount, due date, and whether it\'s monthly or one-time. You can pay, edit, or delete loans from the same sheet.',
  },
  {
    q: 'What is Net Worth?',
    a: 'Net Worth is the total of all your debit card balances minus your credit card balances minus your outstanding loan amounts. It gives you a real-time snapshot of your overall financial position.',
  },
  {
    q: 'How do I get loan due date reminders?',
    a: 'Go to More → Settings → Notifications and toggle on Loan Due Reminders. You can choose to be reminded 1, 3, or 7 days before the due date. Notifications are scheduled locally on your device — no internet needed.',
  },
  {
    q: 'What\'s included in Premium?',
    a: 'Premium (₱299 one-time, lifetime access) includes: Savings Goals, Unlimited Loans (free is up to 3), Unlimited Budget Goals (free is up to 3), Joint Loans via QR Sharing, Export Data (CSV/JSON), Cloud Backup & Sync, and Priority Email Support (guaranteed response). Free users can still send feedback via More → Send Feedback, but responses are best-effort. No subscription, no renewals.',
  },
  {
    q: 'How do I delete a transaction?',
    a: 'On the Transactions screen, long-press any transaction item. A confirmation dialog will appear asking if you want to delete it.',
  },
  {
    q: 'Can I change my avatar?',
    a: 'Yes! Go to More → Profile. You\'ll see a grid of 16 avatar styles to choose from. Tap one to select it, then tap Save.',
  },
];

export default function FAQScreen() {
  const insets = useSafeAreaInsets();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={rs(22)} color={Colors.textDark} />
        </TouchableOpacity>
        <Text style={styles.title}>Help & Support</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>Frequently Asked Questions</Text>

        <View style={styles.faqList}>
          {FAQS.map((item, index) => {
            const open = openIndex === index;
            return (
              <TouchableOpacity
                key={index}
                style={[styles.faqItem, open && styles.faqItemOpen]}
                onPress={() => setOpenIndex(open ? null : index)}
                activeOpacity={0.8}
              >
                <View style={styles.faqQuestion}>
                  <Text style={[styles.faqQ, open && { color: Colors.primary }]} numberOfLines={open ? undefined : 2}>
                    {item.q}
                  </Text>
                  <Ionicons
                    name={open ? 'chevron-up' : 'chevron-down'}
                    size={rs(16)}
                    color={open ? Colors.primary : Colors.textLight}
                  />
                </View>
                {open && <Text style={styles.faqA}>{item.a}</Text>}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.footer}>
          <Ionicons name="chatbubble-ellipses-outline" size={rs(16)} color={Colors.textLight} />
          <Text style={styles.footerText}>
            Still need help? Go to More → Send Feedback.{'\n'}Premium users get priority email responses.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDF1E7' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 12 },
  backBtn: { width: rs(36), height: rs(36), borderRadius: 10, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', shadowColor: 'rgba(0,0,0,0.06)', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 1, shadowRadius: 4, elevation: 2 },
  title: { fontSize: rs(22), fontFamily: 'Cause-ExtraBold', color: '#1A0E00' },
  subtitle: { fontSize: rs(13), fontFamily: 'Cause-SemiBold', color: '#C4A882', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 },
  faqList: { gap: 10 },
  faqItem: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, shadowColor: 'rgba(233,123,59,0.08)', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 6, elevation: 2 },
  faqItemOpen: { borderWidth: 1.5, borderColor: Colors.primary + '40' },
  faqQuestion: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  faqQ: { flex: 1, fontSize: rs(14), fontFamily: 'Cause-SemiBold', color: '#1A0E00', lineHeight: 20 },
  faqA: { fontSize: rs(13), fontFamily: 'Cause-Regular', color: '#5C3D1A', lineHeight: 20, marginTop: 10 },
  footer: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 24, justifyContent: 'center' },
  footerText: { fontSize: rs(12), color: Colors.textLight, fontFamily: 'Cause-Regular', lineHeight: 18, flexShrink: 1, textAlign: 'center' },
});
