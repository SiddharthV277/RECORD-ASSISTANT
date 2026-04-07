import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Admin from './pages/Admin';
import Records from './pages/Records';
import Particulars from './pages/Particulars';
import Ledger from './pages/Ledger';
import Layout from './components/Layout';

// Simple auth check
const RequireAuth = ({ children }) => {
  const user = localStorage.getItem('user');
  if (!user) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
};

// Admin/Superadmin check
const RequireAdmin = ({ children }) => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return <Navigate to="/login" replace />;
  const user = JSON.parse(userStr);
  if (user.role !== 'SUPERADMIN') return <Navigate to="/dashboard" replace />;
  return <Layout>{children}</Layout>;
};

// Admin OR Superadmin
const RequireAdminOrSuperadmin = ({ children }) => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return <Navigate to="/login" replace />;
  const user = JSON.parse(userStr);
  if (user.role !== 'SUPERADMIN' && user.role !== 'ADMIN') return <Navigate to="/dashboard" replace />;
  return <Layout>{children}</Layout>;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/dashboard" element={
          <RequireAuth><Dashboard /></RequireAuth>
        } />

        <Route path="/tasks" element={
          <RequireAuth><Tasks /></RequireAuth>
        } />

        <Route path="/records" element={
          <RequireAuth><Records /></RequireAuth>
        } />

        <Route path="/ledger" element={
          <RequireAdminOrSuperadmin><Ledger /></RequireAdminOrSuperadmin>
        } />

        <Route path="/particulars" element={
          <RequireAdminOrSuperadmin><Particulars /></RequireAdminOrSuperadmin>
        } />

        <Route path="/admin" element={
          <RequireAdmin><Admin /></RequireAdmin>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
