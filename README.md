# React + Supabase — WZ Document Manager (Multi-tenant SaaS)

A multi-tenant SaaS application that digitizes delivery document (WZ) workflows for Polish distribution companies, replacing paper-based processes with a real-time digital platform.

**Live demo:** https://wz-flow-manager.vercel.app

---

## The Problem It Solves

Distribution companies in Poland manage WZ documents (proof of delivery) manually on paper — drivers fill out forms by hand, documents get lost, billing errors accumulate, and managers have no real-time visibility into daily operations.

This platform replaces the entire paper workflow: drivers fill digital forms on their phone, managers see live dashboards, and monthly reports compile automatically.

---

## How It Works

```
Driver opens mobile-friendly form on any device
        ↓
Selects client and enters delivery quantities
        ↓
Document saved to Supabase (PostgreSQL) with company isolation (RLS)
        ↓
Manager dashboard updates in real time
        ↓
Print-ready WZ document generated on demand
        ↓
Monthly report auto-compiled per client and product
```

**Three user roles:**

| Role | Access |
|------|--------|
| `superadmin` | All organizations, subscriptions, billing |
| `admin` | Full access to own company — documents, clients, products, team, reports |
| `driver` | Delivery form and print page only |

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | React, TypeScript, Vite |
| UI Components | shadcn/ui, Tailwind CSS |
| Backend & Database | Supabase (PostgreSQL) |
| Authentication | Supabase Auth |
| Data Isolation | Row Level Security (RLS) |
| Routing | React Router |
| Deployment | Vercel |

---

## File Structure

```
src/
  components/          — UI components (forms, dashboards, tables)
  pages/               — Route-level page components
  integrations/
    supabase/          — Supabase client and generated types
  hooks/               — Custom React hooks
  lib/                 — Utilities
supabase/
  migrations/          — Database schema and RLS policies
public/
package.json
vite.config.ts
```

---

## Setup

1. Create a Supabase project and run the migrations from `supabase/migrations/`
2. Set environment variables:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
   ```
3. Install dependencies and start the dev server:
   ```
   npm install
   npm run dev
   ```
4. Deploy to Vercel — connect the repository and set the same environment variables in project settings

