import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  BookOpen, ArrowRight, CalendarDays, User, Clock,
  Wallet, TrendingUp, ShoppingCart, DollarSign, MessageSquare,
  ChevronDown, ChevronUp, Package
} from 'lucide-react';

import { API_BASE } from '../config';

const API = API_BASE;


// Pill badge for user roles
const RolePill = ({ role }) => {
  const styles = {
    SUPERADMIN: 'bg-purple-100 text-purple-700',
    ADMIN:      'bg-rose-100 text-rose-700',
    OPERATOR:   'bg-gray-100 text-gray-600',
  };
  return (
    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider ${styles[role] || styles.OPERATOR}`}>
      {role}
    </span>
  );
};

// Expandable row detail
const SettlementRow = ({ row }) => {
  const [open, setOpen] = useState(false);

  const hasSend1 = row.sentAmount1 > 0 && row.sentUser1Name;
  const hasSend2 = row.sentAmount2 > 0 && row.sentUser2Name;

  return (
    <>
      <tr
        onClick={() => setOpen(o => !o)}
        className="cursor-pointer hover:bg-rose-50/40 transition-colors border-b border-gray-100"
      >
        {/* Date + Time */}
        <td className="px-5 py-3.5 whitespace-nowrap">
          <p className="text-sm font-bold text-gray-700">
            {new Date(row.settledAt || row.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
          </p>
          {row.settledAt && (
            <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
              <Clock size={10} />
              {new Date(row.settledAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
            </p>
          )}
        </td>

        {/* Sender */}
        <td className="px-5 py-3.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center text-xs font-extrabold shrink-0">
              {row.senderName?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">{row.senderName}</p>
              <RolePill role={row.senderRole} />
            </div>
          </div>
        </td>

        {/* Transfers */}
        <td className="px-5 py-3.5">
          <div className="flex flex-col gap-1">
            {hasSend1 && (
              <div className="flex items-center gap-1.5 text-xs">
                <ArrowRight size={12} className="text-rose-400 shrink-0" />
                <span className="font-bold text-gray-800">₹{parseFloat(row.sentAmount1).toFixed(2)}</span>
                <span className="text-gray-400">→</span>
                <span className="font-semibold text-gray-700">{row.sentUser1Name}</span>
                <RolePill role={row.sentUser1Role} />
              </div>
            )}
            {hasSend2 && (
              <div className="flex items-center gap-1.5 text-xs">
                <ArrowRight size={12} className="text-rose-400 shrink-0" />
                <span className="font-bold text-gray-800">₹{parseFloat(row.sentAmount2).toFixed(2)}</span>
                <span className="text-gray-400">→</span>
                <span className="font-semibold text-gray-700">{row.sentUser2Name}</span>
                <RolePill role={row.sentUser2Role} />
              </div>
            )}
            {!hasSend1 && !hasSend2 && (
              <span className="text-xs text-gray-400 italic">Nothing sent</span>
            )}
          </div>
        </td>

        {/* Kept */}
        <td className="px-5 py-3.5">
          <span className={`text-sm font-extrabold ${parseFloat(row.keptAmount) > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
            ₹{parseFloat(row.keptAmount).toFixed(2)}
          </span>
        </td>

        {/* Profit */}
        <td className="px-5 py-3.5">
          <span className={`text-sm font-extrabold ${parseFloat(row.totalVariance) >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            ₹{parseFloat(row.totalVariance).toFixed(2)}
          </span>
        </td>

        {/* Expand toggle */}
        <td className="px-5 py-3.5 text-right text-gray-400">
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </td>
      </tr>

      {/* Expanded Detail Row */}
      {open && (
        <tr className="bg-gray-50/80">
          <td colSpan={6} className="px-6 py-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white rounded-lg border border-gray-100 p-3 shadow-sm">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                  <Wallet size={10} /> Opening Balance
                </p>
                <p className="text-base font-extrabold text-blue-600 mt-1">₹{parseFloat(row.openingBalance).toFixed(2)}</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-100 p-3 shadow-sm">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                  <TrendingUp size={10} /> Total Sales
                </p>
                <p className="text-base font-extrabold text-green-600 mt-1">₹{parseFloat(row.totalSales).toFixed(2)}</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-100 p-3 shadow-sm">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                  <ShoppingCart size={10} /> Total Cost
                </p>
                <p className="text-base font-extrabold text-amber-600 mt-1">₹{parseFloat(row.totalCost).toFixed(2)}</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-100 p-3 shadow-sm">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                  <DollarSign size={10} /> Profit
                </p>
                <p className="text-base font-extrabold text-emerald-600 mt-1">₹{parseFloat(row.totalVariance).toFixed(2)}</p>
              </div>
            </div>

            {row.remarks && (
              <div className="mt-3 flex items-start gap-2 bg-white rounded-lg border border-gray-100 p-3 shadow-sm">
                <MessageSquare size={14} className="text-gray-400 mt-0.5 shrink-0" />
                <p className="text-sm text-gray-700 italic">"{row.remarks}"</p>
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
};

// ── Main Ledger Page ───────────────────────────────────────────────────────────
const Ledger = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  const headers = { 'x-user-id': user.id };

  const today = new Date().toISOString().split('T')[0];

  const [rows, setRows] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState('');
  const [filterUser, setFilterUser] = useState('');

  // Summary totals
  const totals = rows.reduce((acc, r) => ({
    sales:    acc.sales    + parseFloat(r.totalSales    || 0),
    cost:     acc.cost     + parseFloat(r.totalCost     || 0),
    profit:   acc.profit   + parseFloat(r.totalVariance || 0),
    sent:     acc.sent     + parseFloat(r.sentAmount1   || 0) + parseFloat(r.sentAmount2 || 0),
    kept:     acc.kept     + parseFloat(r.keptAmount    || 0),
  }), { sales: 0, cost: 0, profit: 0, sent: 0, kept: 0 });

  const fetchLedger = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterDate) params.set('date', filterDate);
      if (filterUser) params.set('userId', filterUser);

      const [ledgerRes, usersRes] = await Promise.all([
        axios.get(`${API}/api/settlements/all?${params}`, { headers }),
        axios.get(`${API}/api/users`, { headers }),
      ]);
      setRows(ledgerRes.data);
      setUsers(usersRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filterDate, filterUser]);

  useEffect(() => { fetchLedger(); }, [fetchLedger]);

  const summaryCards = [
    { label: 'Total Sales',  value: totals.sales,  color: 'green',  icon: TrendingUp },
    { label: 'Total Cost',   value: totals.cost,   color: 'amber',  icon: ShoppingCart },
    { label: 'Total Profit', value: totals.profit, color: 'emerald',icon: DollarSign },
    { label: 'Total Sent',   value: totals.sent,   color: 'blue',   icon: ArrowRight },
    { label: 'Total Kept',   value: totals.kept,   color: 'rose',   icon: Wallet },
  ];

  const colorMap = {
    green:   'bg-green-50 text-green-600 border-green-100',
    amber:   'bg-amber-50 text-amber-600 border-amber-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    blue:    'bg-blue-50 text-blue-600 border-blue-100',
    rose:    'bg-rose-50 text-rose-600 border-rose-100',
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-6 pb-10">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 flex items-center gap-3">
          <BookOpen className="text-rose-600 w-8 h-8" />
          Settlement Ledger
        </h1>
        <p className="text-gray-500 mt-1 font-medium">View all daily settlements — who sent what to whom.</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
            <CalendarDays size={11} className="inline mr-1" />Filter by Date
          </label>
          <input
            type="date"
            max={today}
            className="px-3 py-2.5 border border-gray-200 rounded-md text-sm font-medium focus:ring-2 focus:ring-rose-400 focus:outline-none"
            value={filterDate}
            onChange={e => setFilterDate(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
            <User size={11} className="inline mr-1" />Filter by User
          </label>
          <select
            className="px-3 py-2.5 border border-gray-200 rounded-md text-sm font-medium focus:ring-2 focus:ring-rose-400 focus:outline-none bg-white min-w-[160px]"
            value={filterUser}
            onChange={e => setFilterUser(e.target.value)}
          >
            <option value="">All users</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
            ))}
          </select>
        </div>
        {(filterDate || filterUser) && (
          <button
            onClick={() => { setFilterDate(''); setFilterUser(''); }}
            className="px-4 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-800 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-md transition-colors"
          >
            Clear Filters
          </button>
        )}
        <div className="ml-auto text-right">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Showing</p>
          <p className="text-xl font-extrabold text-gray-900">{rows.length} records</p>
        </div>
      </div>

      {/* Summary Cards (only when data exists) */}
      {rows.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {summaryCards.map(({ label, value, color, icon: Icon }) => (
            <div key={label} className={`bg-white rounded-xl border p-4 shadow-sm flex items-center gap-3 ${colorMap[color].split(' ')[2]}`}>
              <div className={`p-2 rounded-lg border ${colorMap[color]}`}>
                <Icon size={16} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider leading-tight">{label}</p>
                <p className="text-sm font-extrabold text-gray-900 mt-0.5">₹{value.toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600" />
          </div>
        ) : rows.length === 0 ? (
          <div className="py-20 text-center text-gray-400">
            <Package size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">No settlements found.</p>
            <p className="text-sm mt-1">Try changing the filters or check back after users submit their end-of-day settlements.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50/80 sticky top-0">
                <tr>
                  {['Date', 'Sent By', 'Transfers', 'Amount Kept', 'Profit', ''].map(h => (
                    <th key={h} className="px-5 py-3.5 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(row => <SettlementRow key={row.id} row={row} />)}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Ledger;
