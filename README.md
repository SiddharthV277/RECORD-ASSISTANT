<div align="center">
  <h1>📊 Record Assistant</h1>
  <p><b>Internal Operations & Financial Management System</b></p>
  <p><i>Built to manage real branches. Currently in active use.</i></p>

  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React"/>
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite"/>
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js"/>
  <img src="https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express"/>
  <img src="https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white" alt="SQLite"/>
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS"/>
  <img src="https://img.shields.io/badge/Cloudflare_Tunnels-F38020?style=for-the-badge&logo=cloudflare&logoColor=white" alt="Cloudflare"/>
</div>

---

## What is this?

This is an internal management system I built for a real multi-branch organization. It handles daily task delegation, financial settlements, and end-of-day reporting across branches like RS Online, CSP, Payworld, RS Travels, and others.

The problem I was solving: the business was running everything on WhatsApp messages and spreadsheets. There was no way to track who did what, which branch sent how much money, or whether tasks were actually completed. I built this to fix that.

It's currently **deployed and actively used** by staff across multiple branches. Operators log in daily to submit their records and mark tasks. Admins use it to verify settlements and monitor cash flow. The system runs 24/7 on a master PC and is accessible globally via Cloudflare Tunnels.

---

## Why I made certain technical decisions

**SQLite over MySQL** — The business doesn't have a dedicated database server, and I didn't want to introduce that dependency. SQLite runs as a single file, backups are trivial, and for the read/write load of this application, it's more than fast enough. I used Node's experimental native `node:sqlite` module directly in some places to avoid unnecessary abstraction.

**No JWT, no sessions** — The system operates on a trusted internal network (or through Cloudflare's zero-trust tunnel). Adding JWT would mean managing token expiry, refresh flows, and more surface area for bugs. A simple credential check on each request is sufficient and easier for non-technical staff to work with (no "session expired" confusion).

**Cloudflare Tunnels instead of port forwarding** — The server PC sits behind a residential internet connection. Opening ports exposes the server IP. With Cloudflare Tunnels, the machine makes an outbound-only connection to Cloudflare's edge. Staff access it via a clean `https://` domain. No exposed IPs, no firewall rules to maintain.

**No ORM** — I wrote raw SQL. The schema is not complex, and using an ORM like Prisma adds a build step, migration files, and a learning curve. Direct queries are readable, debuggable, and fast.

---

## What it does

### Role-Based Access (3 levels)

| Role | What they can do |
|:---|:---|
| **Superadmin** (CEO / Dev) | Full system access — manage users, branches, tasks, view all data |
| **Admin** (COO / Accountant) | Branch-level access — assign tasks, verify settlements, view ledger |
| **Operator** (Coordinator) | Submit daily records, mark tasks as "in review", settle their drawer |

### Financial Settlements (the core feature)

Each operator has a financial "drawer" they settle at end of day. The tricky part: they can settle multiple times a day. I built a chained settlement engine where each new settlement automatically picks up the "kept amount" from the previous one as its opening balance. Records are permanently linked to their settlement for auditing.

### Task Management

Tasks flow through `pending → in_review → completed`. Operators can only push to `in_review`. Only Admins and above can mark complete. This prevents operators from self-approving their own work.

### Financial Ledger

Admins see a live audit trail of all settlements across all branches — who sent what, when, with expandable cost/profit breakdowns. Filterable by date and staff member.

### Hidden Dev Panel

There's an undocumented UI panel (only accessible at the Superadmin level with a specific identity check) that allows wiping test data without touching the database manually. Useful during testing and onboarding new branches.

---

## System Architecture

```
Global Staff
    │
    ▼
Cloudflare Tunnel (outbound-only, zero-trust)
    │
    ▼
Master PC (runs 24/7 via PM2)
    ├── React + Vite frontend   (port 5173)
    └── Express API             (port 3000)
              │
              ▼
         SQLite DB (database.db)
```

The frontend dynamically resolves the API base URL based on `window.location.hostname` — so the same build works on localhost, local Wi-Fi, and the public Cloudflare domain without any rebuild or config change.

---

## Running it locally

### Requirements
- Node.js v18+
- pnpm (`npm install -g pnpm`)

### Install

```bash
git clone https://github.com/SiddharthV277/RECORD-ASSISTANT.git
cd RECORD-ASSISTANT

# Install all dependencies
pnpm install
cd backend && pnpm install && cd ..
cd frontend && pnpm install && cd ..

# Approve native module builds (sqlite3, bcrypt)
cd backend && pnpm approve-builds && cd ..
cd frontend && pnpm approve-builds && cd ..
```

### Start (dev)

```bash
pnpm run dev
```

Frontend: http://localhost:5173  
Backend API: http://localhost:3000

### Default login

```
Email:    admin@example.local
Password: admin123
```

### Production (PM2)

```bash
pm2 start ecosystem.config.js
```

---

<div align="center">
  Built by <a href="https://github.com/SiddharthV277">Siddharth V</a> — a real system for a real problem.
</div>
