import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Shield, Plus, Trash2, Edit2, X, AlertOctagon } from 'lucide-react';
import { API_BASE } from '../config';

const Admin = () => {
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', role: 'OPERATOR', alias: '', branchId: ''
  });

  const me = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [uRes, bRes] = await Promise.all([
        axios.get(`${API_BASE}/api/users`, { headers: { 'x-user-id': me.id } }),
        axios.get(`${API_BASE}/api/branches`)
      ]);
      setUsers(uRes.data);
      setBranches(bRes.data);
      if (bRes.data.length > 0) setFormData(prev => ({ ...prev, branchId: bRes.data[0].id }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdate = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
         // omit password if empty for update
         const payload = { ...formData };
         if (!payload.password) delete payload.password;
         await axios.put(`${API_BASE}/api/users/${editingId}`, payload, { headers: { 'x-user-id': me.id } });
         
         // If editing self, cleanly update local storage to keep Layout in sync
         if (editingId === me.id) {
             const updatedUser = { ...me, ...payload };
             updatedUser.branchName = branches.find(b => b.id == payload.branchId)?.name || me.branchName;
             localStorage.setItem('user', JSON.stringify(updatedUser));
             window.dispatchEvent(new Event('userUpdated'));
         }
      } else {
         await axios.post(`${API_BASE}/api/users`, formData, { headers: { 'x-user-id': me.id } });
      }
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error processing request');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await axios.delete(`${API_BASE}/api/users/${id}`, { headers: { 'x-user-id': me.id } });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting user');
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({ name: '', email: '', password: '', role: 'OPERATOR', alias: '', branchId: branches[0]?.id || '' });
  };

  const openEdit = (user) => {
    setEditingId(user.id);
    setFormData({
      name: user.name,
      email: user.email,
      password: '', // require new password if changing
      role: user.role,
      alias: user.alias || '',
      branchId: branches.find(b => b.name === user.branchName)?.id || branches[0]?.id || ''
    });
    setShowModal(true);
  };

  return (
    <div className="animate-in fade-in duration-500 h-[calc(100vh-6rem)] flex flex-col">
       <div className="flex items-center justify-between mb-6 shrink-0">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 flex items-center gap-3">
              <Shield className="text-rose-600 w-8 h-8" />
              Staff Control
            </h1>
            <p className="text-gray-500 mt-1 font-medium">Manage hierarchy and branches globally.</p>
          </div>
          <button 
             onClick={() => { resetForm(); setShowModal(true); }}
             className="bg-gray-900 hover:bg-black text-white px-5 py-2.5 rounded-sm font-semibold shadow-md flex items-center gap-2 transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" /> Add Staff
          </button>
       </div>

       <div className="bg-white rounded-sm shadow-sm border border-gray-100 flex-1 overflow-hidden flex flex-col relative">
          {loading ? (
             <div className="flex-1 flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
             </div>
          ) : (
            <div className="overflow-auto w-full h-full align-middle">
              <table className="min-w-full divide-y divide-gray-200">
                 <thead className="bg-gray-50 sticky top-0 z-10 backdrop-blur-sm bg-gray-50/90">
                   <tr>
                     <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Employee</th>
                     <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Role & Alias</th>
                     <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Branch</th>
                     <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                   </tr>
                 </thead>
                 <tbody className="bg-white divide-y divide-gray-100">
                   {users.map(user => (
                     <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                       <td className="px-6 py-4 whitespace-nowrap">
                         <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-sm bg-gradient-to-tr from-rose-100 to-rose-50 flex items-center justify-center text-rose-700 font-bold border border-rose-100 shadow-inner">
                               {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                               <div className="text-sm font-bold text-gray-900">{user.name}</div>
                               <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                         </div>
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1 items-start">
                             <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-bold rounded-sm
                               ${user.role === 'SUPERADMIN' ? 'bg-purple-100 text-purple-800' :
                                 user.role === 'ADMIN' ? 'bg-rose-100 text-rose-800' : 'bg-gray-100 text-gray-800'}`}>
                               {user.role}
                             </span>
                             {user.alias && <span className="text-xs text-gray-400 font-medium">aka {user.alias}</span>}
                          </div>
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap">
                         <div className="text-sm text-gray-900 font-semibold">{user.branchName || 'Global'}</div>
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                         <div className="flex items-center justify-end gap-3">
                           <button onClick={() => openEdit(user)} className="text-rose-600 hover:text-rose-900 bg-rose-50 p-2 rounded-sm transition-colors">
                              <Edit2 className="w-4 h-4" />
                           </button>
                           {user.id !== me.id && (
                             <button onClick={() => handleDelete(user.id)} className="text-red-600 hover:text-red-900 bg-red-50 p-2 rounded-sm transition-colors">
                                <Trash2 className="w-4 h-4" />
                             </button>
                           )}
                         </div>
                       </td>
                     </tr>
                   ))}
                 </tbody>
              </table>
            </div>
          )}
       </div>

       {showModal && (
         <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in p-4 overflow-y-auto">
           <div className="bg-white p-8 rounded-sm shadow-2xl max-w-md w-full relative my-8 animate-in zoom-in-95 duration-200">
             <button onClick={() => setShowModal(false)} className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 bg-gray-50 p-2 rounded-sm transition-colors">
                <X className="w-5 h-5"/>
             </button>
             <h2 className="text-2xl font-extrabold text-gray-900 mb-6">{editingId ? 'Edit Staff' : 'Add New Staff'}</h2>
             
             {editingId && (
                <div className="bg-amber-50 border border-amber-200 rounded-sm p-3 mb-6 flex gap-3 items-start">
                   <AlertOctagon className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                   <p className="text-xs font-medium text-amber-800">Leave password blank if you do not want to reset it.</p>
                </div>
             )}

             <form onSubmit={handleCreateOrUpdate} className="space-y-4">
               <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                  <input required className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-sm focus:ring-2 focus:ring-rose-500 focus:outline-none focus:border-transparent transition-all" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} placeholder="Jane Doe" />
               </div>
               <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                  <input required type="email" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-sm focus:ring-2 focus:ring-rose-500 focus:outline-none focus:border-transparent transition-all" value={formData.email} onChange={e=>setFormData({...formData, email: e.target.value})} placeholder="jane@internal.local" />
               </div>
               <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Password {editingId && '(Optional)'}</label>
                  <input required={!editingId} type="password" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-sm focus:ring-2 focus:ring-rose-500 focus:outline-none focus:border-transparent transition-all" value={formData.password} onChange={e=>setFormData({...formData, password: e.target.value})} placeholder="••••••••" />
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div>
                     <label className="block text-sm font-semibold text-gray-700 mb-1">Role</label>
                     <select className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-sm focus:ring-2 focus:ring-rose-500 outline-none" value={formData.role} onChange={e=>setFormData({...formData, role: e.target.value})}>
                       <option>OPERATOR</option>
                       <option>ADMIN</option>
                       <option>SUPERADMIN</option>
                     </select>
                  </div>
                  <div>
                     <label className="block text-sm font-semibold text-gray-700 mb-1">Alias / Title</label>
                     <input className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-sm focus:ring-2 focus:ring-rose-500 outline-none" value={formData.alias} onChange={e=>setFormData({...formData, alias: e.target.value})} placeholder="e.g. HR, DEV" />
                  </div>
               </div>
               <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Assigned Branch</label>
                  <select className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-sm focus:ring-2 focus:ring-rose-500 outline-none" value={formData.branchId} onChange={e=>setFormData({...formData, branchId: e.target.value})}>
                    {branches.map(b => (
                       <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
               </div>
               
               <div className="pt-2">
                 <button type="submit" className="w-full py-3.5 bg-gray-900 hover:bg-black text-white rounded-sm font-bold tracking-wide shadow-md transition-all active:scale-[0.98]">
                    {editingId ? 'Save Changes' : 'Create Staff'}
                 </button>
               </div>
             </form>
           </div>
         </div>
       )}
    </div>
  );
};

export default Admin;
