# Rudra's Farm Fresh — Mobile App

Cross-platform React Native app built with **Expo**.

## Prerequisites

- Node.js 18+
- Expo Go app on your phone (for quick testing), or iOS Simulator / Android Emulator
- Backend API running at `http://localhost:8000/api`

## Setup

```bash
cd mobile
npm install
```

Ensure the root `.env` has:

```env
EXPO_PUBLIC_API_URL=http://localhost:8000/api
```

For a physical device, use your machine's LAN IP instead of `localhost`, e.g.:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.10:8000/api
```

## Run

```bash
npm start
```

Then press:
- `i` — iOS Simulator
- `a` — Android Emulator
- Scan QR code — Expo Go on your phone

Or directly:

```bash
npm run ios
npm run android
```

## App structure

| Tab | Features |
|-----|----------|
| **Home** | Welcome hero, banners, categories, subscriptions, featured products |
| **Products** | Search, category filters, product grid |
| **Cart** | Qty controls, order summary, checkout |
| **Profile** | Account, orders, subscription, CMS pages, logout |

**Welcome screen** → **Get Started** → Login (OTP) → Main tabs

## Backend

Start the API from the project root (use `0.0.0.0` so phones on the same Wi‑Fi can reach it):

```bash
cd backend
php -S 0.0.0.0:8000 router.php
```
