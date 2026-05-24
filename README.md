<p align="center">
  <img src="./assets/images/app-branding.png" width="250" alt="PesoNest Logo" />
</p>

<h1 align="center">PesoNest</h1>

<p align="center">
  A personal finance app for tracking spending, managing loans, growing savings, and staying on budget. Everything stays on your device.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Platform-iOS%20%7C%20Android-lightgrey?style=flat-square" />
  <img src="https://img.shields.io/badge/Built%20with-Expo-000020?style=flat-square&logo=expo" />
  <img src="https://img.shields.io/badge/Version-1.0.0-E97B3B?style=flat-square" />
  <img src="https://img.shields.io/badge/License-Private-red?style=flat-square" />
</p>

---

## Features

**Transactions**
- Log income and expenses with categories
- Link transactions to specific bank cards
- Over-budget push notifications
- Export to CSV for spreadsheet analysis

**Cards**
- Add debit and credit cards with custom gradient designs
- Track balance per card
- Visa and Mastercard network badges

**Loans**
- Track personal and bank loans (diminishing or add-on interest)
- Joint Loans — share a loan via QR code with real-time sync when the other party pays or updates
- Pay down loans with outstanding balance tracking
- Due date push notifications (1, 3, or 7 days before)

**Savings Goals**
- Create goals with target amounts and category images
- Deposit and withdraw with optional card deduction
- Transfer funds between goals
- Auto-Save reminders via push notification

**Budget Goals**
- Set spending limits per category
- Visual progress tracking
- Over-budget alerts after each expense

**Settings & Data**
- Full JSON backup and restore (Premium)
- CSV export of all transactions (Premium)
- Device Transfer — move all data to a new phone via a 6-digit code, no account needed
- Delete all data

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native + Expo SDK 54 |
| Navigation | Expo Router (file-based) |
| State | Zustand |
| Local DB | expo-sqlite (SQLite, offline-first) |
| Backend | Supabase (loan sharing, real-time sync, anonymous auth) |
| Payments | RevenueCat |
| Notifications | expo-notifications |
| Animations | React Native Animated API + PanResponder |
| Camera | expo-camera (QR scanning) |

---

## Architecture

```
peso-nest/
├── app/                  # Expo Router screens
│   ├── (tabs)/           # Bottom tab screens (Home, Cards, Loans, Budget)
│   ├── savings.tsx
│   ├── settings.tsx
│   └── ...
├── src/
│   ├── components/ui/    # Reusable UI components
│   ├── constants/        # Colors, categories
│   ├── db/               # SQLite queries & migrations
│   ├── lib/              # Supabase client
│   ├── store/            # Zustand store
│   ├── types/            # TypeScript types
│   └── utils/            # Notifications, sync, formatters
└── assets/               # Fonts, images, icons
```

---

## Privacy & Legal

- [Privacy Policy](https://wilfredosoriano.github.io/peso-nest-legal/privacy-policy.html)
- [Terms of Use](https://wilfredosoriano.github.io/peso-nest-legal/terms.html)

All financial data is stored locally on your device. Nothing is sent to any server unless you explicitly trigger it — like sharing a joint loan or transferring to a new phone.

---

## Getting Started

```bash
npm install
npx expo start
```

For native builds:

```bash
npx expo run:ios
npx expo run:android
```

Requires Node 18+, Expo CLI, and Xcode (iOS) or Android Studio (Android).

---

## License

© 2026 PesoNest. All rights reserved. Not open for redistribution or commercial use.
