import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import {
  CalendarDays, Plus, Trash2, TrendingUp, ShoppingCart, DollarSign,
  ChevronDown, Search, Send, Wallet, FileText, X, CheckCircle2, AlertCircle,
  Clock, CheckCheck
} from 'lucide-react';
import { API_BASE } from '../config';

const API = API_BASE;

// ── Searchable Particular Dropdown ────────────────────────────────────────────
const ParticularSearch = ({ particulars, value, onChange }) => {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const selected = particulars.find(p => p.id === value);
  const filtered = particulars.filter(p =>
    p.name.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const pick = (p) => { onChange(p.id); setQuery(''); setOpen(false); };

  return (
    <div className="relative" ref={ref}>
      <div
        onClick={() => setOpen(o => !o)}
        className="flex items-center justify-between w-full px-3 py-2.5 border border-gray-200 bg-white rounded-md cursor-pointer hover:border-rose-400 transition-colors text-sm"
      >
        <span className={selected ? 'text-gray-900 font-medium' : 'text-gray-400'}>
          {selected ? selected.name : 'Select particular…'}
        </span>
        <ChevronDown size={16} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </div>
      {open && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-xl overflow-hidden">
          <div className="p-2 border-b border-gray-100 flex items-center gap-2">
            <Search size={14} className="text-gray-400 shrink-0" />
            <input autoFocus className="flex-1 text-sm outline-none placeholder:text-gray-400"
              placeholder="Type to search..." value={query} onChange={e => setQuery(e.target.value)} />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0
              ? <p className="px-4 py-3 text-sm text-gray-400 text-center">No match found</p>
              : filtered.map(p => (
                <div key={p.id} onClick={() => pick(p)}
                  className="px-4 py-2.5 hover:bg-rose-50 cursor-pointer flex items-center justify-between text-sm group">
                  <span className="font-medium text-gray-800 group-hover:text-rose-700">{p.name}</span>
                  <span className="text-xs text-gray-400">₹{p.costPrice.toFixed(2)}/unit</span>
                </div>
              ))
            }
          </div>
        </div>
      )}
    </div>
  );
};

// ── Format timestamp helper ────────────────────────────────────────────────────
const fmtTime = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
};

// ── Main Records Page ──────────────────────────────────────────────────────────
const Records = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  const todayISO = new Date().toISOString().split('T')[0];
  const todayDisplay = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [particulars, setParticulars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEOD, setShowEOD] = useState(false);
  const [toast, setToast] = useState(null);

  // New record form
  const [particularId, setParticularId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [salePrice, setSalePrice] = useState('');
  const [previewCost, setPreviewCost] = useState(null);
  const [previewVariance, setPreviewVariance] = useState(null);
  const [adding, setAdding] = useState(false);

  // EOD form
  const [eod, setEod] = useState({ sentAmount1: '', sentUser1: '', sentAmount2: '', sentUser2: '', remarks: '' });
  const [submittingEod, setSubmittingEod] = useState(false);

  const headers = { 'x-user-id': user.id };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchAll = useCallback(async () => {
    try {
      const [recRes, sumRes, parRes] = await Promise.all([
        axios.get(`${API}/api/records?date=${todayISO}`, { headers }),
        axios.get(`${API}/api/settlements/summary`, { headers }),
        axios.get(`${API}/api/particulars`, { headers }),
      ]);
      setRecords(recRes.data);
      setSummary(sumRes.data);
      setParticulars(parRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Live cost/variance preview
  useEffect(() => {
    if (particularId) {
      const p = particulars.find(x => x.id === particularId);
      if (p) {
        const cost = parseFloat((p.costPrice * (parseInt(quantity) || 1)).toFixed(2));
        setPreviewCost(cost);
        setPreviewVariance(salePrice !== '' ? parseFloat((parseFloat(salePrice) - cost).toFixed(2)) : null);
      }
    } else {
      setPreviewCost(null);
      setPreviewVariance(null);
    }
  }, [particularId, quantity, salePrice, particulars]);

  const handleAddRecord = async (e) => {
    e.preventDefault();
    if (!particularId || salePrice === '') return;
    setAdding(true);
    try {
      await axios.post(`${API}/api/records`, { particularId, quantity, salePrice, date: todayISO }, { headers });
      setParticularId(''); setQuantity(1); setSalePrice('');
      showToast('Record added successfully');
      await fetchAll();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to add record', 'error');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API}/api/records/${id}`, { headers });
      showToast('Record removed');
      fetchAll();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete', 'error');
    }
  };

  const handleSettleSubmit = async (e) => {
    e.preventDefault();
    setSubmittingEod(true);
    try {
      const res = await axios.post(`${API}/api/settlements`, { ...eod }, { headers });
      showToast(res.data.message);
      setShowEOD(false);
      setEod({ sentAmount1: '', sentUser1: '', sentAmount2: '', sentUser2: '', remarks: '' });
      fetchAll();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to submit settlement', 'error');
    } finally {
      setSubmittingEod(false);
    }
  };

  // Kept preview (based on unsettled funds)
  const eodKept = summary
    ? parseFloat((
        summary.unsettledFunds
        - (parseFloat(eod.sentAmount1) || 0)
        - (parseFloat(eod.sentAmount2) || 0)
      ).toFixed(2))
    : 0;

  const hasUnsettled = summary?.unsettledCount > 0;

  const statCards = [
    { label: 'Opening Balance',   value: summary?.openingBalance ?? 0, icon: Wallet,       color: 'blue' },
    { label: "Today's Sales",     value: summary?.totalSales ?? 0,     icon: TrendingUp,   color: 'green' },
    { label: 'Total Cost',        value: summary?.totalCost ?? 0,      icon: ShoppingCart, color: 'amber' },
    { label: 'Total Profit',      value: summary?.totalVariance ?? 0,  icon: DollarSign,   color: 'rose' },
  ];

  const colorMap = {
    blue:  'bg-blue-50 text-blue-600 border-blue-100',
    green: 'bg-green-50 text-green-600 border-green-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    rose:  'bg-rose-50 text-rose-600 border-rose-100',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-rose-600" />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-6 pb-10">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-lg shadow-xl text-white text-sm font-semibold animate-in slide-in-from-right duration-300 ${toast.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'}`}>
          {toast.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-rose-600 mb-1">
            <CalendarDays size={18} />
            <span className="text-sm font-bold uppercase tracking-widest">{todayDisplay}</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Daily Records</h1>
          <p className="text-gray-500 mt-1 font-medium">
            {hasUnsettled
              ? <span className="text-amber-600 font-bold">{summary.unsettledCount} unsettled record(s) pending settlement</span>
              : 'All records settled ✓'}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {summary?.lastSettledAt && (
            <span className="text-xs font-semibold text-gray-400 flex items-center gap-1">
              <Clock size={12} /> Last settled at {fmtTime(summary.lastSettledAt)}
            </span>
          )}
          <button
            onClick={() => setShowEOD(true)}
            disabled={!hasUnsettled}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-md font-bold shadow-md transition-all active:scale-95 ${
              hasUnsettled
                ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Send size={17} />
            {hasUnsettled ? `Settle (${summary.unsettledCount} records)` : 'Nothing to Settle'}
          </button>
        </div>
      </div>

      {/* Stat Cards — today's full totals */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className={`bg-white rounded-xl border p-4 shadow-sm flex items-center gap-4 ${colorMap[color].split(' ')[2]}`}>
            <div className={`p-2.5 rounded-lg border ${colorMap[color]}`}><Icon size={20} /></div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</p>
              <p className="text-xl font-extrabold text-gray-900 mt-0.5">₹{value.toFixed(2)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Add Record Form */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Plus size={18} className="text-rose-500" /> Add Sale Entry
        </h2>
        <form onSubmit={handleAddRecord} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
          <div className="lg:col-span-2">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Particular</label>
            <ParticularSearch particulars={particulars} value={particularId} onChange={setParticularId} />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Quantity</label>
            <input type="number" min="1" step="1"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-md text-sm font-medium focus:ring-2 focus:ring-rose-400 focus:outline-none"
              value={quantity} onChange={e => setQuantity(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Sale Price (₹)</label>
            <input type="number" min="0" step="0.01"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-md text-sm font-medium focus:ring-2 focus:ring-rose-400 focus:outline-none"
              placeholder="0.00" value={salePrice} onChange={e => setSalePrice(e.target.value)} />
          </div>
          <div>
            <button type="submit" disabled={adding || !particularId || salePrice === ''}
              className="w-full py-2.5 bg-gray-900 hover:bg-black text-white rounded-md font-bold text-sm transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {adding ? <div className="h-4 w-4 border-2 border-white/50 border-t-white rounded-full animate-spin" /> : <Plus size={16} />}
              Add
            </button>
          </div>
        </form>
        {particularId && (
          <div className="mt-3 flex flex-wrap gap-4 px-1">
            {previewCost !== null && (
              <span className="text-xs font-semibold text-gray-500">
                Auto Cost: <span className="text-amber-600 font-bold">₹{previewCost.toFixed(2)}</span>
              </span>
            )}
            {previewVariance !== null && (
              <span className="text-xs font-semibold text-gray-500">
                Profit: <span className={`font-bold ${previewVariance >= 0 ? 'text-green-600' : 'text-red-500'}`}>₹{previewVariance.toFixed(2)}</span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Records Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-800">Today's Entries</h2>
          <div className="flex items-center gap-3">
            {hasUnsettled && (
              <span className="text-xs font-bold text-amber-600 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-full">
                {summary.unsettledCount} unsettled
              </span>
            )}
            <span className="text-xs font-bold text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full border">{records.length} total</span>
          </div>
        </div>

        {records.length === 0 ? (
          <div className="py-16 text-center text-gray-400 font-medium">
            <FileText size={36} className="mx-auto mb-3 opacity-30" />
            No records for today yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50/80">
                <tr>
                  {['#', 'Particular', 'Qty', 'Cost Price', 'Sale Price', 'Profit', 'Status', ''].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 bg-white">
                {records.map((r, i) => {
                  const settled = r.settlementId != null;
                  return (
                    <tr key={r.id} className={`transition-colors ${settled ? 'bg-gray-50/60' : 'hover:bg-amber-50/30'}`}>
                      <td className="px-5 py-3.5 text-xs text-gray-400 font-bold">{i + 1}</td>
                      <td className={`px-5 py-3.5 font-semibold text-sm ${settled ? 'text-gray-400' : 'text-gray-800'}`}>{r.particularName}</td>
                      <td className="px-5 py-3.5 text-sm text-gray-600 font-medium">{r.quantity}</td>
                      <td className="px-5 py-3.5 text-sm text-amber-700 font-semibold">₹{parseFloat(r.costPrice).toFixed(2)}</td>
                      <td className="px-5 py-3.5 text-sm text-blue-700 font-semibold">₹{parseFloat(r.salePrice).toFixed(2)}</td>
                      <td className="px-5 py-3.5 text-sm font-bold">
                        <span className={parseFloat(r.variance) >= 0 ? 'text-green-600' : 'text-red-500'}>
                          ₹{parseFloat(r.variance).toFixed(2)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        {settled
                          ? <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full"><CheckCheck size={10} /> Settled</span>
                          : <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full"><Clock size={10} /> Pending</span>
                        }
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {!settled && (
                          <button onClick={() => handleDelete(r.id)}
                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors">
                            <Trash2 size={15} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {records.length > 0 && (
                <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                  <tr>
                    <td colSpan={3} className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Totals (Today)</td>
                    <td className="px-5 py-3 text-sm font-extrabold text-amber-700">₹{summary?.totalCost?.toFixed(2)}</td>
                    <td className="px-5 py-3 text-sm font-extrabold text-blue-700">₹{summary?.totalSales?.toFixed(2)}</td>
                    <td className="px-5 py-3 text-sm font-extrabold text-green-600">₹{summary?.totalVariance?.toFixed(2)}</td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>

      {/* Settlement Modal */}
      {showEOD && summary && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-rose-600 to-rose-700 px-6 py-5 flex items-center justify-between">
              <div>
                <h2 className="text-white font-extrabold text-xl">Settle Records</h2>
                <p className="text-rose-200 text-sm mt-0.5">
                  Covering {summary.unsettledCount} unsettled record(s)
                </p>
              </div>
              <button onClick={() => setShowEOD(false)} className="text-white/70 hover:text-white bg-white/10 rounded-lg p-2 transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Balance Summary */}
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 space-y-3">
              {/* Row 1 */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Opening</p>
                  <p className="text-base font-extrabold text-blue-600">₹{summary.openingBalance.toFixed(2)}</p>
                  {summary.lastSettledAt && (
                    <p className="text-[9px] text-gray-400 mt-0.5">from {fmtTime(summary.lastSettledAt)}</p>
                  )}
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">+ Unsettled Sales</p>
                  <p className="text-base font-extrabold text-green-600">₹{summary.unsettledSales.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">= Available</p>
                  <p className="text-base font-extrabold text-gray-900">₹{summary.unsettledFunds.toFixed(2)}</p>
                </div>
              </div>

              <div className="border-t border-dashed border-gray-200" />

              {/* Row 2 */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-amber-50 rounded-lg py-2 px-1 border border-amber-100">
                  <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Cost Price</p>
                  <p className="text-base font-extrabold text-amber-700">₹{summary.unsettledCost.toFixed(2)}</p>
                </div>
                <div className="bg-blue-50 rounded-lg py-2 px-1 border border-blue-100">
                  <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">Sale</p>
                  <p className="text-base font-extrabold text-blue-700">₹{summary.unsettledSales.toFixed(2)}</p>
                </div>
                <div className="bg-emerald-50 rounded-lg py-2 px-1 border border-emerald-100">
                  <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Profit</p>
                  <p className="text-base font-extrabold text-emerald-700">₹{summary.unsettledVariance.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSettleSubmit} className="p-6 space-y-4">
              {/* Transfer 1 */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Send Amount 1 — To</label>
                <div className="flex gap-2">
                  <input type="number" step="0.01" min="0"
                    className="w-32 shrink-0 px-3 py-2.5 border border-gray-200 rounded-md text-sm font-medium focus:ring-2 focus:ring-rose-400 focus:outline-none"
                    placeholder="₹ 0.00" value={eod.sentAmount1}
                    onChange={e => setEod(p => ({ ...p, sentAmount1: e.target.value }))} />
                  <select className="flex-1 px-3 py-2.5 border border-gray-200 rounded-md text-sm font-medium focus:ring-2 focus:ring-rose-400 focus:outline-none bg-white"
                    value={eod.sentUser1} onChange={e => setEod(p => ({ ...p, sentUser1: e.target.value }))}>
                    <option value="">Select recipient…</option>
                    {summary.adminUsers.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Transfer 2 */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Send Amount 2 — To (Optional)</label>
                <div className="flex gap-2">
                  <input type="number" step="0.01" min="0"
                    className="w-32 shrink-0 px-3 py-2.5 border border-gray-200 rounded-md text-sm font-medium focus:ring-2 focus:ring-rose-400 focus:outline-none"
                    placeholder="₹ 0.00" value={eod.sentAmount2}
                    onChange={e => setEod(p => ({ ...p, sentAmount2: e.target.value }))} />
                  <select className="flex-1 px-3 py-2.5 border border-gray-200 rounded-md text-sm font-medium focus:ring-2 focus:ring-rose-400 focus:outline-none bg-white"
                    value={eod.sentUser2} onChange={e => setEod(p => ({ ...p, sentUser2: e.target.value }))}>
                    <option value="">Select recipient…</option>
                    {summary.adminUsers.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Remarks (Optional)</label>
                <textarea rows={2}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-md text-sm focus:ring-2 focus:ring-rose-400 focus:outline-none resize-none"
                  placeholder="Any notes for this settlement…" value={eod.remarks}
                  onChange={e => setEod(p => ({ ...p, remarks: e.target.value }))} />
              </div>

              {/* Kept Amount */}
              <div className={`rounded-lg p-4 flex items-center justify-between ${eodKept < 0 ? 'bg-red-50 border border-red-200' : 'bg-emerald-50 border border-emerald-200'}`}>
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Amount Kept / New Balance</p>
                  <p className={`text-2xl font-extrabold mt-0.5 ${eodKept < 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                    ₹{eodKept.toFixed(2)}
                  </p>
                  {eodKept < 0 && <p className="text-xs text-red-500 font-semibold mt-1">⚠ Sent more than available!</p>}
                </div>
                <Wallet size={32} className={eodKept < 0 ? 'text-red-300' : 'text-emerald-300'} />
              </div>

              <button type="submit" disabled={submittingEod || eodKept < 0}
                className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-extrabold text-sm shadow-lg shadow-rose-200 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {submittingEod
                  ? <div className="h-4 w-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                  : <Send size={16} />
                }
                Submit Settlement
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Records;
