# Trip Tracker v2.0

A personal vehicle trip & fuel tracking Progressive Web App (PWA). Fully offline, mobile-first, built with React 19, Vite, Tailwind CSS v4, and IndexedDB.

---

## Features

- **Dashboard** — fuel gauge, stat cards, quick actions, upcoming maintenance alerts, recent activity
- **Trips** — log with odometer, category, purpose, locations; search & filter; sort by date or distance
- **Fuel / Fill-Ups** — track price, volume, discount programs (PC Points etc.), station analytics, fuel economy per fill-up
- **Maintenance** — oil changes, tire rotations, brakes, filters, battery & more; reminders by km or date; overdue alerts
- **Analytics** — monthly/yearly spend, distance trends, fuel economy history, cost per km, category breakdown, commute stats, station comparison, fuel price history
- **Vehicle Costs** — insurance, registration, tires, other costs with category totals
- **Settings** — full vehicle profile (VIN, plate, expiry dates), units, categories, JSON backup/restore, CSV export/import
- **PWA** — installable, works fully offline, IndexedDB storage (no server required)
- **Dark mode** — system / light / dark toggle

---

## Installation

### Prerequisites

- [Node.js](https://nodejs.org/) 18 or later
- [npm](https://www.npmjs.com/) 9+ **or** [pnpm](https://pnpm.io/) 9+ **or** [yarn](https://yarnpkg.com/)

### Steps

```bash
# 1. Clone or unzip the project
cd trip-tracker

# 2. Install dependencies
npm install
# or: pnpm install / yarn install

# 3. Start the dev server
npm run dev
```

The app will be available at **http://localhost:5173**

---

## Running Locally

```bash
npm run dev          # Start dev server with hot reload
npm run build        # Type-check + production build → ./dist
npm run preview      # Preview the production build locally
npm run typecheck    # TypeScript check only (no build)
```

> **Note:** The production build outputs to `./dist`. This folder is everything you need to deploy.

---

## Deploying to Vercel

### Option A — Vercel CLI (fastest)

```bash
npm install -g vercel
vercel
```

Follow the prompts. Vercel auto-detects Vite. Use these settings if asked:

| Setting | Value |
|---|---|
| Framework | Vite |
| Build command | `npm run build` |
| Output directory | `dist` |
| Install command | `npm install` |

### Option B — Vercel Dashboard

1. Push the project to a GitHub / GitLab / Bitbucket repo.
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import your repo.
3. Vercel auto-detects Vite — accept the defaults and click **Deploy**.

### Option C — vercel.json (manual SPA routing)

If you need client-side routing to work on direct URL loads, add this file to the project root:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

---

## Other Deployment Options

```bash
# Netlify
npm run build
# Drag-and-drop the ./dist folder to app.netlify.com/drop

# GitHub Pages (with base path)
# In vite.config.ts, set: base: "/your-repo-name/"
npm run build

# Self-hosted / Docker
npm run build
npx serve dist   # or use nginx / caddy pointing to ./dist
```

---

## Data & Privacy

All data is stored locally in your browser's **IndexedDB** — nothing is ever sent to a server. Use **Settings → Export Backup (JSON)** to save your data before clearing browser storage or switching devices.

---

## New Dependencies Added in v2.0

No new runtime dependencies were added. All packages were already present in the original project. The standalone `package.json` resolves the Replit-specific `catalog:` version aliases to real semver ranges.

| Package | Purpose |
|---|---|
| `idb` | IndexedDB wrapper |
| `recharts` | Charts & analytics |
| `react-hook-form` + `zod` | Form validation |
| `@tanstack/react-query` | Data fetching / caching |
| `wouter` | Client-side routing |
| `sonner` | Toast notifications |
| `date-fns` | Date formatting |
| `lucide-react` | Icons |
| `tailwindcss` v4 + `tw-animate-css` | Styling & animations |
| `vite-plugin-pwa` | PWA / offline support |

---

## Project Structure

```
trip-tracker/
├── public/                  # Static assets (PWA icons, favicon)
├── src/
│   ├── components/
│   │   ├── ui/              # shadcn/ui base components
│   │   ├── BottomNav.tsx    # Mobile tab navigation
│   │   ├── Charts.tsx       # Recharts wrappers
│   │   ├── FillUpCard.tsx   # Fill-up list item
│   │   ├── PWAInstallBanner.tsx
│   │   ├── StatCard.tsx
│   │   └── TripCard.tsx     # Trip list item
│   ├── contexts/
│   │   ├── AppContext.tsx   # Settings + theme
│   │   └── DataContext.tsx  # Trips, fill-ups, maintenance
│   ├── lib/
│   │   ├── db.ts            # IndexedDB + stats engine
│   │   ├── export.ts        # CSV import/export
│   │   └── utils.ts         # Formatting helpers
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── Trips.tsx / AddTrip.tsx
│   │   ├── FillUps.tsx / AddFillUp.tsx
│   │   ├── Maintenance.tsx
│   │   ├── Analytics.tsx
│   │   ├── VehicleCosts.tsx
│   │   ├── Settings.tsx
│   │   └── not-found.tsx
│   ├── types/index.ts       # All TypeScript types
│   ├── App.tsx              # Router
│   ├── main.tsx             # Entry point
│   └── index.css            # Tailwind v4 design tokens
├── index.html
├── vite.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## License

MIT
