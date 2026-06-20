# QuoteGen Lead Management CRM

A modern, SaaS-style lead management CRM for **QuoteGen by Digiteq** (quotegen.in) — a B2B
quotation platform for industrial businesses. Built with React + TypeScript + Tailwind on top of
the existing Supabase backend.

Every employee gets an individual login with equal permissions, and **every action is logged**
with the acting employee and a timestamp.

---

## Features

- **Dashboard** — live metrics: New Leads, Fresh, In Pipeline, Meetings Today, Active Demos,
  Conversions, Lost, plus a global recent-activity timeline.
- **New Customers** — leads that have never been opened. Opening one records `first_viewed_at` /
  `first_viewed_by` exactly once and automatically moves it into the Ongoing pipeline.
- **Ongoing Customers** — Fresh and In-Pipeline sections. Log calls (Call Done / Didn't Pickup /
  Busy + remark) and advance the customer stage. Stage changes drive automation:
  - `Meeting Scheduled` → opens the meeting scheduler
  - `Demo Started` → starts a 10-day demo trial
  - `Others` → requires an explanatory note
- **Meetings** — upcoming vs. history, status updates, and client-side reminders **15 and 5
  minutes** before each meeting (browser + in-app).
- **Demo Started** — active 10-day trials with a live countdown and follow-up reminders on
  **days 3, 7, 9 and expiry**. Interest status propagates terminal outcomes to the lead
  (`Converted` → converted, `Not Interested` → lost).
- **Per-lead activity timeline** — Created → Viewed → Call → Meeting → Demo → Converted/Lost.
- **Global search** across customer name, company, phone and email.
- **Notifications** — browser notifications + an in-app notification bell with deep links.
- **Realtime** — Supabase postgres changes keep every open tab in sync.
- **Dark / light mode** and a responsive, HubSpot/Pipedrive-inspired layout.

---

## Tech stack

| Area        | Choice                                             |
| ----------- | -------------------------------------------------- |
| Build       | Vite (SPA)                                         |
| UI          | React 18 + TypeScript (strict) + Tailwind CSS v3   |
| Data        | TanStack Query v5                                  |
| Backend     | Supabase (Postgres, Auth, Realtime)                |
| Routing     | react-router-dom v6                                |
| Icons       | lucide-react                                       |
| Dates       | date-fns                                           |

---

## Project structure

```
supabase/
  migrations/0001_crm_schema.sql   # idempotent schema migration (extends live data)
  functions/send-email/            # email Edge Function (stub — see below)
src/
  components/      # UI primitives, layout, lead/meeting feature components
  contexts/        # Auth + Theme providers
  hooks/           # TanStack Query data layer + realtime + reminder scheduler
  lib/             # supabase client, db types, utils, browser notifications
  pages/           # Dashboard, NewCustomers, Ongoing, Meetings, DemoStarted, …
  types/           # domain types + status vocabularies
```

---

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

The app connects to the **existing** Supabase project
(`vllymwxevoftgsilvyng`, region ap-south-1 / Mumbai).

```bash
cp .env.example .env.local
```

Then set the anon (publishable) key in `.env.local` — find it in
**Supabase Dashboard → Project Settings → API**:

```env
VITE_SUPABASE_URL=https://vllymwxevoftgsilvyng.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

> `.env.local` is gitignored — never commit secrets.

### 3. Apply the database migration

The migration in `supabase/migrations/0001_crm_schema.sql` is **idempotent** and **safe for live
data**. It only:

- creates `employees` (mirrors `auth.users`) and 5 supporting tables
  (`call_logs`, `meetings`, `demo_trials`, `activity_logs`, `notifications`);
- **extends** the existing `"Lead Details"` table with `ADD COLUMN IF NOT EXISTS` (it is never
  dropped or recreated, and the existing `allow_anon_insert` policy is preserved);
- adds RLS policies, indexes, an `auth.users → employees` trigger, and realtime publication.

Apply it via the Supabase SQL editor (paste the file) or with `psql`:

```bash
psql "$SUPABASE_DB_URL" -f supabase/migrations/0001_crm_schema.sql
```

### 4. Create employee logins

Accounts are provisioned in **Supabase Auth** (Dashboard → Authentication → Users). The
`handle_new_employee` trigger automatically creates the matching `employees` row on first sign-up,
and the app also self-heals the row on first login.

### 5. Run

```bash
npm run dev        # start the dev server
npm run typecheck  # tsc -b (project references)
npm run build      # tsc -b && vite build
npm run preview    # preview the production build
```

---

## Email notifications (stub)

Email delivery is intentionally **not** enabled — the app ships with browser + in-app
notifications only. `supabase/functions/send-email/index.ts` is a ready-to-fill Edge Function.
To enable it:

1. Choose a provider (Resend, SendGrid, Postmark, SES…).
2. `supabase secrets set EMAIL_API_KEY=...`
3. Fill in the `TODO` delivery block in the function.
4. `supabase functions deploy send-email`

---

## Data model notes

- **`status`** is the lead *outcome* (`new` / `open` / `converted` / `lost`) and drives the
  Conversions / Lost metrics.
- **`customer_status`** is the funnel *stage*
  (`Fresh` / `In Pipeline` / `Meeting Scheduled` / `Demo Started` / `Others`).
- **`demo_trials.expiry_date`** is a generated column = `start_date + 10 days`.
- Employee names are resolved client-side (`useEmployeeMap`) to avoid PostgREST FK ambiguity
  (`"Lead Details"` has two foreign keys into `employees`).
