
## Direction

Rip out the current admin-template look. Rebuild as **institutional banking software** — Bloomberg Terminal density + Stripe Dashboard clarity. Neutral palette, sharp typography, asymmetric layouts, zero decorative gradients / glass / neon. Desktop-first, 1700px max content width, 280px sidebar.

The existing `dashboard.tsx` stays untouched per your instruction. Everything else is rebuilt.

## Design System (rewrite `src/styles.css`)

- Palette: near-black ink `#0A0B0D`, paper `#FAFAF7`, ink surfaces `#111318 / #17191F / #1E2027`, hairline borders `#E5E5E0 / #23262D`, single accent `#0B5FFF` (institutional blue), semantic `#0F8A5F` (success), `#B8860B` (warn), `#B00020` (danger). No gradients, no glow.
- Type: **Söhne-substitute** — `Inter Tight` for UI, `IBM Plex Sans` for numeric/tabular, `JetBrains Mono` for code/IDs. Tight tracking on headings, tabular-nums everywhere in tables.
- Density scale: 4px grid, primary row height 32px, dense 28px. Font sizes 11/12/13/14/16/20/28.
- Utilities: `.hairline` (1px border), `.tabular` (font-variant-numeric), `.mono`, `.chip`, `.kbd`, `.divider-v`. Remove `.glass`, `.gradient-text`, `.shadow-elegant`.

## Shell Rewrite

- `src/components/app-shell.tsx` → new **280px sidebar** + **44px header** + fluid content (`max-w-[1700px]`).
- Sidebar sections: Institution logo + name, Workspace selector (dropdown), Environment pill (Prod/Sandbox/Dev), Nav groups (Operate / Money Movement / Intelligence / Developer / Admin), Pinned, Recently viewed, Keyboard-shortcuts hint (`⌘K`), Collapse toggle, User profile footer.
- Header: Breadcrumb, Global search (`⌘K` opens command palette using existing `cmdk`), Notifications, Pending approvals count, Realtime dot, IST clock, Settlement window status (Open/Closing/Closed), Currency selector (INR/USD), Profile menu.
- Command palette component (`src/components/command-palette.tsx`) with go-to-page, quick actions, recent transactions.

## Route-by-Route Layouts (all rewritten except dashboard)

Each page gets a **workflow-specific** asymmetric grid — no shared card component doing all the work.

- **Transactions** — 3-pane: dense table left, **detail drawer** right (Sheet from right, 520px) with tabs: Overview / Timeline / API Payload / Webhook / Risk / Settlement / Audit / Receipt. Row click opens drawer, keyboard `j/k` to move.
- **Merchants** — CRM 3-pane: list left (280px), profile center (KPIs, revenue sparkline, orders, API health), right rail (settlement status, webhook health, API usage 24h, live requests feed).
- **Customers** — CRM 3-pane: search+list left, overview center (lifetime spend, AOV, preferred merchant, payment mix, order timeline), right rail (fraud score gauge, refund history, support tickets).
- **Fraud** — SOC layout: top strip (risk score gauge, threat level, high-risk count, ML confidence), middle grid (risk timeline area chart full-width, heatmap 24×7, geo activity list, velocity chart), bottom split (investigation queue table + flagged payments + device fingerprints + IP intel).
- **Analytics** — executive: full-width revenue+forecast, 2-up cash flow + settlement trends, merchant growth, hourly heatmap, weekday bars, top categories, seasonality.
- **API** — 3-pane Stripe-dev style: left (keys, secrets, webhook URLs), center (REST docs with tabbed examples cURL/JS/Python + auth), right (live request log stream, status codes bar, latency p50/p95/p99, JSON viewer for selected request).
- **Settlements** — **Kanban** with 5 columns: Received → Processing → Verified → Ready → Settled. Each card: amount, txn count, elapsed, approver avatar. Drag disabled (read-only), click opens side sheet.
- **Reports** — reporting center: saved reports list left, scheduled exports panel, recent exports table, filter/preview pane right with chart preview + CSV/XLSX/PDF export.
- **Settings** — Notion-style vertical nav (Profile / Bank / Organization / API / Billing / Security / Audit / Roles / Preferences) + content pane.
- **Notifications** — timeline feed grouped by day with type filters + right rail summary.

## Realtime

Keep existing Supabase realtime hooks in `src/lib/queries.ts`. Add a small `<RealtimeIndicator />` in header. On new transaction: subtle 150ms row-flash in tables, KPI number ticker via framer-motion `animate`, toast only for high-risk.

## Demo Data

No placeholders. Extend the existing seed util so every table/chart has realistic INR banking data on first load (~200 transactions, 12 merchants, 60 customers, settlements across all 5 stages, 15 fraud alerts, API request logs).

## Motion

Framer Motion, 200–250ms `ease-out`, spring only for drawer. Row hover: bg shift only, no scale. Card hover: 1px border tint. Button press: 1px translate.

## Files Touched

- Rewrite: `src/styles.css`, `src/components/app-shell.tsx`, `src/components/page-header.tsx`, `src/components/stat-card.tsx` (repurposed as dense KPI strip), `src/routes/__root.tsx` (fonts).
- Rewrite each route under `src/routes/_authenticated/` **except** `dashboard.tsx`.
- Add: `src/components/command-palette.tsx`, `src/components/transaction-drawer.tsx`, `src/components/kanban.tsx`, `src/components/realtime-indicator.tsx`, `src/components/env-pill.tsx`, `src/lib/demo-seed.ts`.
- Remove decorative CSS tokens (`--gradient-*`, `--shadow-elegant`, `.glass*`).

## Tech notes

Stays on TanStack Start + Supabase + TanStack Query + Recharts + shadcn + framer-motion. No new heavy deps. Table virtualization via `@tanstack/react-virtual` (add) for Transactions when >200 rows.

## Out of scope

- Dashboard page (`_authenticated/dashboard.tsx`) — untouched, per your instruction.
- Mobile responsive polish — desktop-first only.
- Auth flows — kept as-is.

Approve and I'll execute in one pass.
