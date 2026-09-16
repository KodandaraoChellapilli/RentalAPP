# Ridgeline Rentals — mobile

Expo (React Native) app for iPhone and Android. It talks to the existing `Rental_App` website backend over JSON APIs. It does **not** replace the website and does **not** contain rental billing or equipment-status rules.

## What each role can do

- **Employee:** clock in/out, open assigned jobs, take before-delivery photos, take after-pickup photos, report damage (cannot mark Available).
- **Owner:** dashboard, rentals, equipment condition history, people, reports.
- **Customer:** only that company’s rentals, estimates, pickup time, and allowed photos.

Demo logins (password `demo123`): `admin@rental.app`, `employee@rental.app`, `abc@rental.app`.

## Run

### Phone format (recommended)

Use the **iOS Simulator** so it looks and behaves like a real phone (not a full desktop browser page):

```bash
cd rental-mobile
npm run ios
```

That boots Expo in the iPhone Simulator (Expo Go). First launch may download Expo Go into the simulator.

- Simulator already open: press `i` in the Expo terminal
- Physical iPhone: install **Expo Go** from the App Store, then scan the QR code from `npm start`
- Android emulator: install Android Studio, start an AVD, then `npm run android`

### Web preview (phone frame)

If you open the browser (`npm run web`), the app is constrained to a phone-sized frame on desktop so it no longer stretches across the whole page.

### API server

1. Start the website/API (from `Rental_App`):

```bash
npm run dev:lan
```

2. On login, the API URL is hidden by default. Tap **Ridgeline Rentals** five times to reveal it if needed:

- iOS Simulator: `http://localhost:3001`
- Android emulator: `http://10.0.2.2:3001`
- Physical phone: `http://YOUR_LAN_IP:3001`

## Rules the phone cannot bypass

The server still requires:

- at least one before photo to complete delivery
- at least one after photo to complete pickup
- condition notes and confirmation
- damage cannot set equipment to Available
- customers can only load their own rentals
