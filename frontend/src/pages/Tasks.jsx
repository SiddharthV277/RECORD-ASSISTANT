import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Check, Clock, Eye, X, Filter } from 'lucide-react';
import { API_BASE } from '../config';

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [filter, setFilter] = useState('all');

  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    fetchTasks();
    if (user.role !== 'OPERATOR') {
      fetchUsers();
    }
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/tasks`, { headers: { 'x-user-id': user.id } });
      setTasks(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/users`, { headers: { 'x-user-id': user.id } });
      // Filter out superadmins as targets typically
      setUsers(res.data.filter(u => u.role !== 'SUPERADMIN'));
      if (res.data.length > 0) setAssignedTo(res.data[0].id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE}/api/tasks`, 
        { title, description, assignedTo },
        { headers: { 'x-user-id': user.id } }
      );
      setShowModal(false);
      setTitle('');
      setDescription('');
      fetchTasks();
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating task');
    }
  };

  const updateStatus = async (taskId, newStatus) => {
    try {
      await axios.put(`${API_BASE}/api/tasks/${taskId}/status`, 
        { status: newStatus },
        { headers: { 'x-user-id': user.id } }
      );
      fetchTasks();
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating status');
    }
  };

  const filteredTasks = tasks.filter(t => filter === 'all' ? true : t.status === filter);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 h-[calc(100vh-6rem)] flex flex-col">
       <div className="flex items-center justify-between mb-6 shrink-0">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Tasks</h1>
            <p className="text-gray-500 mt-1 font-medium">Manage and monitor workflows.</p>
          </div>
          <div className="flex gap-3">
             <div className="relative inline-flex items-center">
                <Filter className="w-4 h-4 text-gray-500 absolute left-3" />
                <select 
                  className="pl-9 pr-8 py-2.5 bg-white border border-gray-200 rounded-sm text-sm font-medium text-gray-700 outline-none appearance-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-shadow cursor-pointer shadow-sm"
                  value={filter}
                  onChange={e => setFilter(e.target.value)}
                >
                  <option value="all">All Tasks</option>
                  <option value="pending">Pending</option>
                  <option value="in_review">In Review</option>
                  <option value="completed">Completed</option>
                </select>
             </div>
             {user.role !== 'OPERATOR' && (
                <button 
                  onClick={() => setShowModal(true)}
                  className="bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 rounded-sm font-semibold shadow-md shadow-rose-200 flex items-center gap-2 transition-all active:scale-95"
                >
                  <Plus className="w-5 h-5" /> New Task
                </button>
             )}
          </div>
       </div>

       <div className="bg-white rounded-sm shadow-sm border border-gray-100 flex-1 overflow-hidden flex flex-col">
          {loading ? (
             <div className="flex-1 flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
             </div>
          ) : (
             <div className="overflow-auto flex-1 p-6">
                {filteredTasks.length === 0 ? (
                  <div className="text-center py-20 text-gray-400 font-medium">No tasks found.</div>
                ) : (
                  <div className="grid gap-4 w-full">
                     {filteredTasks.map(task => (
                       <div key={task.id} className="group border border-gray-100 bg-gray-50/50 hover:bg-white hover:border-rose-100 p-5 rounded-sm transition-all hover:shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex-1">
                             <div className="flex items-center gap-3 mb-2">
                               <h3 className="font-bold text-gray-900 text-lg tracking-tight group-hover:text-rose-600 transition-colors">{task.title}</h3>
                               <span className={`inline-flex items-center px-2.5 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider
                                 ${task.status === 'completed' ? 'bg-green-100 text-green-800' : 
                                   task.status === 'in_review' ? 'bg-amber-100 text-amber-800' : 
                                   'bg-amber-100 text-amber-800'}`}>
                                 {task.status.replace('_', ' ')}
                               </span>
                             </div>
                             <p className="text-gray-600 text-sm mb-3 line-clamp-2 leading-relaxed">{task.description}</p>
                             <div className="flex gap-4 text-xs font-medium text-gray-400 bg-gray-100/50 inline-flex px-3 py-1.5 rounded-sm border border-gray-100">
                                <span>From: <span className="text-gray-700">{task.assignedByName}</span></span>
                                <span className="w-px h-full bg-gray-300 block"></span>
                                <span>To: <span className="text-rose-600 font-bold">{task.assignedToName}</span></span>
                             </div>
                          </div>
                          <div className="shrink-0 flex items-center md:flex-col gap-2">
                             {/* OPERATOR Actions */}
                             {user.role === 'OPERATOR' && task.status === 'pending' && (
                                <button 
                                  onClick={() => updateStatus(task.id, 'in_review')}
                                  className="w-full text-sm flex items-center justify-center gap-1.5 px-4 py-2 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-sm font-semibold transition-colors"
                                >
                                  <Eye className="w-4 h-4" /> Check
                                </button>
                             )}

                             {/* ADMIN / SUPERADMIN Actions */}
                             {(user.role === 'ADMIN' || user.role === 'SUPERADMIN') && (task.status === 'pending' || task.status === 'in_review') && (
                                <button 
                                  onClick={() => updateStatus(task.id, 'completed')}
                                  className="w-full text-sm flex items-center justify-center gap-1.5 px-4 py-2 bg-green-50 text-green-700 hover:bg-green-100 rounded-sm font-semibold transition-colors shadow-sm shadow-green-100/50"
                                >
                                  <Check className="w-4 h-4 text-green-600" /> Verify & Complete
                                </button>
                             )}
                          </div>
                       </div>
                     ))}
                  </div>
                )}
             </div>
          )}
       </div>

       {showModal && (
         <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in p-4">
           <div className="bg-white p-8 rounded-sm shadow-2xl max-w-md w-full relative animate-in zoom-in-95 duration-200">
             <button onClick={() => setShowModal(false)} className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 bg-gray-50 p-2 rounded-sm transition-colors">
                <X className="w-5 h-5"/>
             </button>
             <h2 className="text-2xl font-extrabold text-gray-900 mb-6">Create New Task</h2>
             <form onSubmit={handleCreateTask} className="space-y-5">
               <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Title</label>
                  <input required className="w-full px-4 py-3 border border-gray-200 bg-gray-50 rounded-sm focus:ring-2 focus:ring-rose-500 focus:outline-none focus:border-transparent transition-all" value={title} onChange={e=>setTitle(e.target.value)} placeholder="Task headline..." />
               </div>
               <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
                  <textarea required rows="4" className="w-full px-4 py-3 border border-gray-200 bg-gray-50 rounded-sm focus:ring-2 focus:ring-rose-500 focus:outline-none focus:border-transparent transition-all resize-none" value={description} onChange={e=>setDescription(e.target.value)} placeholder="Detailed instructions..."></textarea>
               </div>
               <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Assign To</label>
                  <select className="w-full px-4 py-3 border border-gray-200 bg-gray-50 rounded-sm focus:ring-2 focus:ring-rose-500 focus:outline-none focus:border-transparent transition-all" value={assignedTo} onChange={e=>setAssignedTo(e.target.value)}>
                    {users.map(u => (
                       <option key={u.id} value={u.id}>{u.name} ({u.role}) - {u.branchName || 'No Branch'}</option>
                    ))}
                  </select>
               </div>
               <button type="submit" className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-sm font-bold tracking-wide shadow-md shadow-rose-200 transition-all active:scale-[0.98] mt-2">
                  Assign Task
               </button>
             </form>
           </div>
         </div>
       )}
    </div>
  );
};

export default Tasks;
