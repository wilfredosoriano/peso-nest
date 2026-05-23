# PesoNest

Budget tracker app for Philippine Peso. Offline-first with SQLite, Zustand state, and optional cloud sync.

## Stack

- **Expo SDK 54** with Expo Router (file-based navigation)
- **expo-sqlite** — offline-first local database with WAL mode
- **Zustand** — global state synced to SQLite
- **react-native-svg** — custom donut and line charts
- **expo-linear-gradient** — warm orange/teal UI gradients
- TypeScript throughout

## Setup

```bash
cd PesoNest
npm install
npx expo start
```

Scan the QR with Expo Go (iOS/Android) or press `i` for iOS simulator / `a` for Android emulator.

## Screens

| Screen | Route |
|--------|-------|
| Splash / Welcome | `/` |
| Dashboard | `/(tabs)` |
| Transactions | `/(tabs)/transactions` |
| Charts | `/(tabs)/charts` |
| Cards | `/(tabs)/cards` |
| More | `/(tabs)/more` |
| Loans | `/loans` |
| Premium | `/premium` |
| Settings | `/settings` |
| Profile | `/profile` |
| Budget Goals | `/budget-goals` |
| Categories | `/categories` |

## Project Structure

```
PesoNest/
├── app/                    # Expo Router screens
│   ├── _layout.tsx         # Root stack + DB init
│   ├── index.tsx           # Splash/welcome
│   ├── (tabs)/             # Bottom tab screens
│   └── *.tsx               # Secondary screens
├── src/
│   ├── constants/          # Colors, Categories
│   ├── types/              # TypeScript interfaces
│   ├── db/                 # SQLite schema + queries
│   ├── store/              # Zustand store
│   ├── components/         # Reusable UI + charts
│   └── utils/              # Formatters
└── assets/images/          # App icons
```

## Cloud Sync (Coming Soon)

Settings screen has the cloud sync toggle wired up with a Premium gate. When ready to connect Supabase:

1. `npm install @supabase/supabase-js`
2. Add `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` to `.env`
3. Implement sync logic in `src/db/sync.ts` — mirror the local SQLite tables to Supabase

QR joint-loan sharing is also Premium-gated and ready for implementation in `app/settings.tsx`.

## Seeded Data

On first launch the app seeds sample data: salary income, several expense transactions, 2 bank cards, and 1 personal loan so every screen has something to display immediately.
