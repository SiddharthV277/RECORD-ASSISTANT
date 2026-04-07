import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Package, Plus, Edit2, Trash2, X, CheckCircle2, AlertCircle, Save } from 'lucide-react';

import { API_BASE } from '../config';

const API = API_BASE;


const Particulars = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  const headers = { 'x-user-id': user.id };

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: '', costPrice: '' });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchItems = async () => {
    try {
      const res = await axios.get(`${API}/api/particulars`, { headers });
      setItems(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const openAdd = () => {
    setEditingId(null);
    setForm({ name: '', costPrice: '' });
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditingId(item.id);
    setForm({ name: item.name, costPrice: item.costPrice.toString() });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const rawCost = form.costPrice === '' ? 0 : parseFloat(form.costPrice);
      const payload = { name: form.name.trim(), costPrice: isNaN(rawCost) ? 0 : rawCost };
      if (editingId) {
        await axios.put(`${API}/api/particulars/${editingId}`, payload, { headers });
        showToast('Particular updated');
      } else {
        await axios.post(`${API}/api/particulars`, payload, { headers });
        showToast('Particular added');
      }
      setShowModal(false);
      fetchItems();
    } catch (err) {
      showToast(err.response?.data?.message || 'Error saving particular', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this particular? Existing records will still show the old name.')) return;
    try {
      await axios.delete(`${API}/api/particulars/${id}`, { headers });
      showToast('Particular deleted');
      fetchItems();
    } catch (err) {
      showToast(err.response?.data?.message || 'Error deleting', 'error');
    }
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-lg shadow-xl text-white text-sm font-semibold animate-in slide-in-from-right duration-300 ${toast.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'}`}>
          {toast.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 flex items-center gap-3">
            <Package className="text-rose-600 w-8 h-8" />
            Particulars
          </h1>
          <p className="text-gray-500 mt-1 font-medium">Manage product/service names and their base cost prices.</p>
        </div>
        <button
          onClick={openAdd}
          className="bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 rounded-md font-bold shadow-md shadow-rose-200 flex items-center gap-2 transition-all active:scale-95"
        >
          <Plus size={18} /> Add Particular
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600" />
          </div>
        ) : items.length === 0 ? (
          <div className="py-20 text-center text-gray-400">
            <Package size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">No particulars added yet.</p>
            <p className="text-sm mt-1">Click "Add Particular" to get started.</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50/80 sticky top-0">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">#</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Cost Price / Unit</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 bg-white">
              {items.map((item, i) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-4 text-sm text-gray-400 font-medium">{i + 1}</td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-gray-900 text-sm">{item.name}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-amber-50 text-amber-700 font-bold text-sm border border-amber-100">
                      ₹{parseFloat(item.costPrice).toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEdit(item)}
                        className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors"
                      >
                        <Edit2 size={15} />
                      </button>
                      {user.role === 'SUPERADMIN' && (
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in zoom-in-95 duration-200 relative">
            <button onClick={() => setShowModal(false)} className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 bg-gray-50 p-2 rounded-lg transition-colors">
              <X size={18} />
            </button>
            <h2 className="text-2xl font-extrabold text-gray-900 mb-6">
              {editingId ? 'Edit Particular' : 'Add Particular'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Name</label>
                <input
                  required
                  className="w-full px-4 py-3 border border-gray-200 bg-gray-50 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none transition-all font-medium"
                  placeholder="e.g. Internet Recharge, SIM Card…"
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Cost Price / Unit (₹)</label>
                <input
                  type="number" step="0.01" min="0"
                  className="w-full px-4 py-3 border border-gray-200 bg-gray-50 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none transition-all font-medium"
                  placeholder="0.00"
                  value={form.costPrice}
                  onChange={e => setForm(p => ({ ...p, costPrice: e.target.value }))}
                />
                <p className="text-xs text-gray-400 mt-1.5">This will be multiplied by quantity when a user logs a sale.</p>
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-extrabold shadow-md shadow-rose-200 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
              >
                {saving
                  ? <div className="h-4 w-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                  : <Save size={16} />
                }
                {editingId ? 'Save Changes' : 'Add Particular'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Particulars;
