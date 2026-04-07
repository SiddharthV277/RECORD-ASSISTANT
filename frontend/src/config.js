// Central configuration for the API base URL
// Automatically detects the environment: Localhost, Local IP, or Cloudflare Tunnel

const hostname = window.location.hostname;

let apiBase;

if (hostname === 'localhost' || hostname.startsWith('192.168.')) {
  // 🟢 CASE 1: Local Development / Local Network (append :3000)
  apiBase = `http://${hostname}:3000`;
} else {
  // 🔵 CASE 2: Remote Access via Cloudflare Tunnel
  apiBase = 'https://manufacturers-div-visual-tend.trycloudflare.com';
}

export const API_BASE = apiBase;
