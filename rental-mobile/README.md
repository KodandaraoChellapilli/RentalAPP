# Ridgeline Rentals — mobile

Expo (React Native) app for iPhone and Android. It talks to the existing `Rental_App` website backend over JSON APIs. It does **not** replace the website and does **not** contain rental billing or equipment-status rules.

## What each role can do

- **Employee:** clock in/out, open assigned jobs, take before-delivery photos, take after-pickup photos, report damage (cannot mark Available).
- **Owner:** dashboard, rentals, equipment condition history, people, reports.
- **Customer:** only that company’s rentals, estimates, pickup time, and allowed photos.

Demo logins (password `demo123`): `admin@rental.app`, `employee@rental.app`, `abc@rental.app`.

## Run

1. Start the website/API (from `Rental_App`):

```bash
npm run dev:lan
```

2. Start the phone app:

```bash
cd rental-mobile
npm start
```

Scan the QR code with Expo Go, or press `i` / `a` for simulators.

On the login screen, set **API server**:

- iOS Simulator: `http://localhost:3001`
- Android emulator: `http://10.0.2.2:3001` (this is the default on Android)
- Physical phone: `http://YOUR_LAN_IP:3001` (computer and phone on the same Wi-Fi)

## Rules the phone cannot bypass

The server still requires:

- at least one before photo to complete delivery
- at least one after photo to complete pickup
- condition notes and confirmation
- damage cannot set equipment to Available
- customers can only load their own rentals
