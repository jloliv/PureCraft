# PureCraft

A clickable Expo prototype for AI-generated household-product creation —
clean DIY recipes, regional cost-of-living-aware savings, premium luxury UI.

## Run it

```bash
npm install
npx expo start --web        # or --ios / --android
```

The web preview defaults to `http://localhost:8081`.

## What's inside

- **`app/`** — Expo Router screens (file-based routing)
  - Make Hub destinations: `categories`, `pantry`, `scan`, `build`, `my-recipe`
  - Saved · Discover · Settings · Premium paywall
  - Onboarding flow including region selection (PT / EU / USA / UK)
  - Legal: Privacy Policy, Terms, Permissions, Delete Account
- **`components/`** — `MakeNav` (bottom nav + animated sheet),
  `SavingsDashboard`, `LegalArticle`
- **`constants/`** — region pricing, savings engine, ingredient database,
  product catalog, currency, theme tokens
- **`lib/`** — `haptics` (subtle Apple-quality feedback) and
  `recipe-icons` (thin-line illustration map + blend workaround for web)
- **`assets/`** — premium thin-line line-art recipe illustrations
- **`constants/launch-recipes-v3.json`** — 100 launch recipes across
  10 categories

## Stack

Expo SDK 54 · React Native 0.81 · expo-router · expo-haptics ·
expo-linear-gradient · TypeScript

## Status

Prototype-only — no backend, no auth. Built for clickable demos.

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)
