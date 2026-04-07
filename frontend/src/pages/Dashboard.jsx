import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  LayoutDashboard, Clock, AlertCircle, CheckCircle,
  TrendingUp, ChevronDown, ChevronUp, IndianRupee,
  Users, Calendar, CalendarDays, ArrowDownCircle, Banknote,
  CircleDot
} from 'lucide-react';
import { API_BASE } from '../config';

// ── helpers ───────────────────────────────────────────────────────────────────
const fmt  = (n) => `₹${parseFloat(n || 0).toFixed(2)}`;
const fmtDT = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true
  });
};
const fmtDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
};

const PERIODS = [
  { key: 'today', label: 'Today' },
  { key: 'week',  label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'all',   label: 'All Time' },
];

// ── Stat Card ─────────────────────────────────────────────────────────────────
const StatCard = ({ title, count, icon: Icon, accent, active, onClick }) => {
  const colors = {
    amber:   { bg: 'from-amber-50 to-amber-100/50',   icon: 'bg-amber-100 text-amber-600',   ring: 'ring-amber-400',   num: 'text-amber-700' },
    blue:    { bg: 'from-blue-50 to-blue-100/50',     icon: 'bg-blue-100 text-blue-600',     ring: 'ring-blue-400',     num: 'text-blue-700' },
    emerald: { bg: 'from-emerald-50 to-emerald-100/50', icon: 'bg-emerald-100 text-emerald-600', ring: 'ring-emerald-400', num: 'text-emerald-700' },
  };
  const c = colors[accent] || colors.amber;
  return (
    <button
      onClick={onClick}
      className={`w-full text-left bg-gradient-to-br ${c.bg} rounded-xl p-5 shadow-sm border transition-all duration-200 hover:shadow-md active:scale-[0.98] cursor-pointer
        ${active ? `ring-2 ${c.ring} border-transparent shadow-md` : 'border-gray-100'}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">{title}</p>
          <p className={`text-5xl font-black tracking-tight ${c.num}`}>{count}</p>
        </div>
        <div className={`p-3 rounded-xl ${c.icon} shadow-sm`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <div className="mt-3 flex items-center gap-1 text-xs text-gray-400 font-semibold">
        {active ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        {active ? 'Hide details' : 'View breakdown'}
      </div>
    </button>
  );
};

// ── Detail Panel (expands under a stat card) ──────────────────────────────────
const DetailPanel = ({ stat, counts }) => {
  const [period, setPeriod] = useState('today');
  const data = counts?.[period] || {};
  const val  = data[stat] ?? 0;

  const labels = { pending: 'Pending', in_review: 'In Review', completed: 'Completed' };
  const accents = { pending: 'amber', in_review: 'blue', completed: 'emerald' };
  const colors  = {
    amber:   'bg-amber-100 text-amber-700',
    blue:    'bg-blue-100 text-blue-700',
    emerald: 'bg-emerald-100 text-emerald-700',
  };

  return (
    <div className="col-span-1 md:col-span-3 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden animate-in slide-in-from-top-2 duration-200">
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50/60">
        <span className="text-sm font-bold text-gray-700">
          Breakdown — <span className="capitalize">{labels[stat]}</span>
        </span>
        {/* Period tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          {PERIODS.map(p => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                period === p.key
                  ? 'bg-white shadow text-gray-800'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
      <div className="p-5 grid grid-cols-3 gap-4">
        {PERIODS.filter(p => p.key === period).map(p => (
          Object.keys(labels).map(s => {
            const c = colors[accents[s]];
            return (
              <div key={s} className={`rounded-lg p-4 ${c} flex flex-col items-center gap-1`}>
                <span className="text-xs font-bold uppercase tracking-wider opacity-70">{labels[s]}</span>
                <span className="text-4xl font-black">{counts?.[p.key]?.[s] ?? 0}</span>
              </div>
            );
          })
        ))}
      </div>
    </div>
  );
};

// ── Money Received Feed ───────────────────────────────────────────────────────
const ReceivedFeed = ({ feed, role, isAll }) => {
  if (!feed || feed.length === 0) {
    return (
      <div className="py-10 text-center text-gray-400">
        <Banknote size={36} className="mx-auto mb-2 opacity-20" />
        <p className="text-sm font-medium">No money received yet.</p>
      </div>
    );
  }

  // Superadmin "all" view has a different structure
  if (isAll) {
    return (
      <ul className="divide-y divide-gray-50">
        {feed.map((row, i) => (
          <li key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-5 py-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600 shrink-0">
                <ArrowDownCircle size={18} />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800">
                  {row.senderName}
                  <span className="ml-1.5 text-xs font-semibold text-gray-400 capitalize">({row.senderRole?.toLowerCase()})</span>
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{fmtDT(row.settledAt)}</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              {row.sentAmount1 > 0 && (
                <span className="text-sm font-extrabold text-emerald-600">
                  {fmt(row.sentAmount1)} → <span className="text-gray-500 font-semibold">{row.recipient1Name}</span>
                </span>
              )}
              {row.sentAmount2 > 0 && (
                <span className="text-sm font-extrabold text-emerald-600">
                  {fmt(row.sentAmount2)} → <span className="text-gray-500 font-semibold">{row.recipient2Name}</span>
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul className="divide-y divide-gray-50">
      {feed.map((row, i) => (
        <li key={i} className="flex items-center justify-between gap-3 px-5 py-4 hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600 shrink-0">
              <ArrowDownCircle size={18} />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800">
                From <span className="text-rose-600">{row.senderName}</span>
              </p>
              <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                <Calendar size={10} /> {fmtDT(row.settledAt)}
              </p>
            </div>
          </div>
          <span className="text-base font-extrabold text-emerald-600 shrink-0">{fmt(row.amount)}</span>
        </li>
      ))}
    </ul>
  );
};

// ── User Breakdown Table (admin/superadmin) ───────────────────────────────────
const UserTable = ({ breakdown }) => {
  if (!breakdown || breakdown.length === 0) return null;
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2.5">
        <Users size={18} className="text-rose-500" />
        <h2 className="font-bold text-gray-800">Staff Task Overview</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50/80">
            <tr>
              {['Operator', 'Pending', 'In Review', 'Completed', 'Total'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {breakdown.map(u => (
              <tr key={u.id} className="hover:bg-rose-50/20 transition-colors">
                <td className="px-4 py-3 text-sm font-bold text-gray-800 flex items-center gap-2">
                  <CircleDot size={10} className="text-rose-400" /> {u.name}
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-100 px-2.5 py-0.5 rounded-full">
                    {u.pending ?? 0}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-full">
                    {u.in_review ?? 0}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-full">
                    {u.completed ?? 0}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm font-extrabold text-gray-700">{u.total ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ── Main Dashboard ────────────────────────────────────────────────────────────
const Dashboard = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  const role = user?.role || 'OPERATOR';
  const isSuperAdmin = role === 'SUPERADMIN';
  const isAdmin      = role === 'ADMIN' || role === 'SUPERADMIN';

  const [stats,    setStats]    = useState(null);
  const [feed,     setFeed]     = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [activeCard, setActive] = useState(null);   // 'pending' | 'in_review' | 'completed' | null
  const [period,   setPeriod]   = useState('today');
  // Superadmin sees ALL transfers by default; admins/operators see their own received
  const [showAllMoney, setShowAllMoney] = useState(isSuperAdmin);

  const headers = { 'x-user-id': user.id };

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, feedRes] = await Promise.all([
        axios.get(`${API_BASE}/api/settlements/dashboard-stats`, { headers }),
        axios.get(`${API_BASE}/api/settlements/received${showAllMoney ? '?all=1' : ''}`, { headers }),
      ]);
      setStats(statsRes.data);
      setFeed(feedRes.data);
    } catch (err) {
      console.error('Dashboard fetch failed', err);
    } finally {
      setLoading(false);
    }
  }, [showAllMoney]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const toggleCard = (key) => setActive(prev => prev === key ? null : key);

  // Current period counts
  const counts = stats?.counts?.[period] || {};

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-rose-600" />
      </div>
    );
  }

  const greeting = role === 'SUPERADMIN' ? 'Super Admin' : role === 'ADMIN' ? 'Admin' : 'Operator';
  const scopeNote = role === 'OPERATOR'
    ? 'Showing your personal task stats.'
    : role === 'ADMIN'
    ? 'Showing all stats for your branch.'
    : 'Showing system-wide stats for all users.';

  // Received money summary row
  const recv = stats?.received || {};

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-7 pb-10">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <LayoutDashboard className="text-rose-600 w-7 h-7" />
            <h1 className="text-3xl font-black tracking-tight text-gray-900">Dashboard</h1>
          </div>
          <p className="text-gray-500 font-medium text-sm">
            Welcome back, <span className="text-gray-800 font-bold">{user.name}</span>
            <span className="ml-2 text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-100 px-2 py-0.5 rounded-full uppercase tracking-wider">{greeting}</span>
          </p>
          <p className="text-xs text-gray-400 mt-1 font-medium">{scopeNote}</p>
        </div>

        {/* Period selector (header level — for stat cards) */}
        <div className="flex items-center gap-1 bg-gray-100 p-1.5 rounded-xl self-start sm:self-center">
          {PERIODS.map(p => (
            <button key={p.key} onClick={() => setPeriod(p.key)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                period === p.key
                  ? 'bg-white shadow text-gray-800'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >{p.label}</button>
          ))}
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Pending"
          count={counts.pending ?? 0}
          icon={Clock}
          accent="amber"
          active={activeCard === 'pending'}
          onClick={() => toggleCard('pending')}
        />
        <StatCard
          title="In Review"
          count={counts.in_review ?? 0}
          icon={AlertCircle}
          accent="blue"
          active={activeCard === 'in_review'}
          onClick={() => toggleCard('in_review')}
        />
        <StatCard
          title="Completed"
          count={counts.completed ?? 0}
          icon={CheckCircle}
          accent="emerald"
          active={activeCard === 'completed'}
          onClick={() => toggleCard('completed')}
        />

        {/* Inline detail panel */}
        {activeCard && (
          <DetailPanel stat={activeCard} counts={stats?.counts} />
        )}
      </div>

      {/* ── User Breakdown Table (admin/superadmin) ── */}
      {isAdmin && <UserTable breakdown={stats?.userBreakdown} />}

      {/* ── Received Money Summary Cards ── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <IndianRupee size={18} className="text-emerald-600" />
            <div>
              <h2 className="font-bold text-gray-800">
                {isSuperAdmin ? 'All Money Transfers' : 'Money Received'}
              </h2>
              <p className="text-xs text-gray-400 font-medium">
                {isSuperAdmin ? 'All settlements sent across the system' : 'Settlements sent to you'}
              </p>
            </div>
          </div>

          {isSuperAdmin && (
            <button
              onClick={() => setShowAllMoney(v => !v)}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${
                showAllMoney
                  ? 'bg-rose-600 text-white border-rose-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-rose-300'
              }`}
            >
              {showAllMoney ? 'All Transfers' : 'My Received'}
            </button>
          )}
        </div>

        {/* Quick summary bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-0 border-b border-gray-100">
          {[
            { label: 'Today',      val: recv.today },
            { label: 'This Week',  val: recv.week  },
            { label: 'This Month', val: recv.month },
            { label: 'All Time',   val: recv.total },
          ].map(({ label, val }) => (
            <div key={label} className="px-5 py-4 flex flex-col gap-0.5 border-r last:border-r-0 border-gray-100">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</span>
              <span className="text-lg font-extrabold text-emerald-700">{fmt(val)}</span>
            </div>
          ))}
        </div>

        {/* Timeline feed */}
        <ReceivedFeed
          feed={feed}
          role={role}
          isAll={isSuperAdmin && showAllMoney}
        />
      </div>

    </div>
  );
};

export default Dashboard;
