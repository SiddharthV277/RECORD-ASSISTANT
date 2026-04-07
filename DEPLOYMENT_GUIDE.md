# 🚀 Task Manager: Official Deployment Guide

This guide provides a comprehensive walkthrough for setting up the **Master Server (CEO PC)** and enabling **Remote Access** for operators worldwide using Cloudflare Tunnels.

---

## 🖥 1. Master Server Setup (CEO / Admin PC)
The Master Server is the "brain" of the operation. It hosts the database (`backend/database.db`) and the application logic.

### ✅ Prerequisites
1. **Node.js**: [Download Grade 18+ LTS](https://nodejs.org/).
2. **PM2**: A process manager that keeps your server running 24/7.
   ```powershell
   npm install -g pm2
   ```

### 📦 Installation & Execution
1. **Extract Code**: Ensure the `TASK MANAGER RS` folder is on the main drive (e.g., `C:\` or `V:\`).
2. **Install Dependencies**:
   Open PowerShell inside the root `TASK MANAGER RS` folder and run:
   ```powershell
   # Install all backend and frontend packages
   npm install
   cd backend; npm install; cd ..
   cd frontend; npm install; cd ..
   ```
3. **Start the System**:
   Use the provided `ecosystem.config.js` to start both frontend and backend instantly:
   ```powershell
   pm2 start ecosystem.config.js
   ```
4. **Save the State**:
   To ensure the app starts automatically if the PC restarts:
   ```powershell
   pm2 save
   pm2 startup  # Follow the instructions on screen if any
   ```

---

## ☁ 2. Global Access: Cloudflare Tunnel
Cloudflare Tunnels allow you to access the server from anywhere without opening firewall ports or exposing your home/office IP address.

### ✅ Configuration Steps
1. **Install Cloudflared**: [Download Windows MSI](https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.msi).
2. **Create Tunnel**: In your Cloudflare Dashboard (Zero Trust), create a tunnel named `rs-online-production`.
3. **Public Hostname Mapping (CRITICAL)**:
   You must set up **TWO** hostnames for the app to function correctly:

| Application | Public URL | Service Type | URL/Port |
| :--- | :--- | :--- | :--- |
| **Frontend** | `rs.yourdomain.com` | HTTP | `http://localhost:5173` |
| **Backend** | `api.rs.yourdomain.com` | HTTP | `http://localhost:3000` |

> [!IMPORTANT]
> The backend URL **must** start with `api.` followed by your frontend domain (e.g., if frontend is `app.com`, backend must be `api.app.com`). This is because the code automatically detects the backend location based on this pattern.

---

## 🏠 3. Local Network Access (Same Office)
For operators working in the same office on the same Wi-Fi/LAN, they can connect directly via IP address for maximum speed.

1. **Find Server IP**: On the Master Server, run `ipconfig`. Look for "IPv4 Address" (e.g., `192.168.x.x`).
2. **Access from Client**: Operators can simply type the following in their browser:
   `http://192.168.x.x:5173`

---

## 🔒 4. Maintenance & Safety
- **Power Settings**: The CEO PC must be set to **"Never Sleep"** in Windows Power Settings.
- **Database Backup**: Keep a copy of `backend/database.db` weekly.
- **Monitoring**: Run `pm2 monit` to see real-time server health and logs.
- **Restarting**: If the app feels slow, run `pm2 restart all`.

---

## 🛠 Troubleshooting
- **Port 3000/5173 Busy**: If an error says "Port already in use", run `pm2 kill` and then `pm2 start ecosystem.config.js` again.
- **Blank Screen**: Ensure the Backend is running and the Cloudflare URLs are exactly as specified in the table above.

*Owner: Your Name | Brand: Your Brand | System: Your System*

