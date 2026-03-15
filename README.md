# WZ Manager

A multi-tenant SaaS application for managing WZ (external release) documents in Polish distribution companies. Built to replace manual paper-based workflows with a fast, digital solution.

**Live demo:** https://wz-flow-manager.vercel.app

---

## The Problem

Distribution companies in Poland rely on WZ documents (proof of delivery) to track goods sent to clients. Traditionally this is done on paper — drivers fill out forms manually, which leads to errors, lost documents, and no real-time visibility for managers.

## The Solution

WZ Manager digitizes the entire workflow:
- Drivers fill out delivery documents on their phone
- Managers see all documents in real-time on the dashboard
- Reports are generated automatically per client and product
- Each document is print-ready with one click

---

## Features

**For drivers**
- Simple delivery form — select client, enter quantities
- Instant print-ready WZ document after submission
- Works on mobile

**For managers (admin)**
- Real-time dashboard with today's and monthly delivery stats
- Full WZ document history with filters
- Client management with individual pricing per product
- Product catalog management
- Monthly reports: client × product (issued / returned / balance / value)
- Team management — invite drivers and admins by email
- Company settings (name and tax ID on documents)

**For SaaS owner (superadmin)**
- Overview of all organizations
- Subscription management (trial / active / inactive)
- Account blocking when subscription expires

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + TypeScript + Vite |
| UI Components | shadcn/ui + Tailwind CSS |
| Backend & Database | Supabase (PostgreSQL) |
| Authentication | Supabase Auth |
| Security | Row Level Security (RLS) — each company sees only its own data |
| Routing | React Router |
| Deployment | Vercel |

---

## Architecture

Multi-tenant architecture — one database, multiple companies, fully isolated data:

```
organizacje (tenants)
  ├── produkty        (product catalog per company)
  ├── klienci         (clients per company)
  │     └── ceny_klientow   (individual pricing per client)
  └── dokumenty_wz    (delivery documents)
        └── pozycje_wz      (line items per document)
```

Row Level Security ensures company A can never access company B's data, enforced at the database level — not just in application code.

---

## User Roles

| Role | Access |
|------|--------|
| `superadmin` | All companies, subscriptions, billing |
| `admin` | Full access to own company data |
| `kierowca` (driver) | Delivery form + print page only |

---

## Local Development

```sh
git clone https://github.com/kvcskr/wz-flow-manager
cd wz-flow-manager
npm install
npm run dev
```

Requires a Supabase project with the schema from `supabase/migrations/`.

---

## About

Built as a real-world tool for Polix, a Polish food distribution company — replacing their paper WZ workflow. Designed with simplicity in mind: a driver with no technical background can use it in under 30 seconds.
