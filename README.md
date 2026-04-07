<div align="center">
  <h1>📊 Record Assistant (Task & Financial Manager)</h1>
  <p>A comprehensive, lightweight system for multi-branch daily accounting, task delegation, and settlement tracking.</p>

  <!-- Badges -->
  <img src="https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white" alt="Vite"/>
  <img src="https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB" alt="React"/>
  <img src="https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js"/>
  <img src="https://img.shields.io/badge/sqlite-%2307405e.svg?style=for-the-badge&logo=sqlite&logoColor=white" alt="SQLite"/>
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS"/>
</div>

---

<details open>
  <summary><b>📖 Table of Contents</b></summary>
  <ol>
    <li><a href="#-about-the-project">About the Project</a></li>
    <li><a href="#-core-features">Core Features</a></li>
    <li><a href="#-tech-stack">Tech Stack</a></li>
    <li><a href="#-getting-started">Getting Started</a></li>
    <li><a href="#-system-architecture">System Architecture</a></li>
  </ol>
</details>

## 🌟 About the Project

**Record Assistant** is designed for centralized monitoring of multiple organizational branches. It tracks daily financial data, manages task delegation between staff members, and enforces a rigid, audited settlement process—making it impossible for end-of-day balances to slip through the cracks.

Designed to be hosted strictly on a master node, clients can connect internally via IPv4 or externally across the world using secure Cloudflare tunnels.

## 🚀 Core Features

<details>
<summary><b>1. Account-Based Sales Logging</b></summary>

- Every user acts as an individual "Account" with a balance.
- **Auto-Calculation**: Cost price (`qty * unit_cost`) and Variance (`price - cost`) are calculated immediately on entry.
</details>

<details>
<summary><b>2. Multi-Settlement Logic (Advanced)</b></summary>

- Users can settle funds multiple times a day.
- **Unsettled Records**: New sales are marked as pending automatically.
- **Settlement Chain**: Each settlement seamlessly starts with the `Kept Amount` of the previous one as its `Opening Balance`.
</details>

<details>
<summary><b>3. Financial Ledger (Admin Control)</b></summary>

- Central audit trail showing detailed who sent what to whom.
- Timestamped settlements with expandable cost/profit breakdowns.
</details>

<details>
<summary><b>4. Robust Routing & Accessibility</b></summary>

- Seamless network switching between `localhost`, local Wi-Fi IPs (`192.168.x.x`), and Cloudflare Tunnel hosts without requiring rebuilds.
</details>

---

## 🛠 Tech Stack

- **Frontend**: React.js, Vite, TailwindCSS, Lucide-React
- **Backend**: Node.js, Express.js, `bcrypt`
- **Database**: `node:sqlite` (New Native SQLite for Node.js)
- **Deployment**: `pm2` (Process Manager)

---

## 🏁 Getting Started

Follow these instructions to get a copy of the project running on your master server.

### 1. Prerequisites
- **Node.js**: v18+ is required.
- **PM2**: Install globally by running:
  ```bash
  npm install -g pm2
  ```

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/SiddharthV277/RECORD-ASSISTANT.git
cd RECORD-ASSISTANT

# Install root, backend, and frontend dependencies
npm install
cd backend && npm install
cd ../frontend && npm install
cd ..
```

### 3. Run the Application
You can fire up both the frontend and backend servers simultaneously using the provided PM2 configuration:
```bash
pm2 start ecosystem.config.js
```

### 4. Default Seed Credentials
On the first run, the database automatically populates a default Super Admin account so you can log in:
- **Email**: `admin@example.local`
- **Password**: `admin123`

---

## 🏗 System Architecture 

If you are looking to read more about the logic flows or how to port it to production safely, refer to the included markdown manuals:

- 📖 [`APP_GENESIS.md`](./APP_GENESIS.md): Detailed information on table structures, routing mechanics, and database schemas.
- 🚀 [`DEPLOYMENT_GUIDE.md`](./DEPLOYMENT_GUIDE.md): End-to-end guide on setting up Cloudflare tunnels for remote connection capabilities.

---

<div align="center">
  <b>Built by <a href="https://github.com/SiddharthV277">SiddharthV277</a> </b><br>
  <i>Don't forget to star ⭐ the repo!</i>
</div>
