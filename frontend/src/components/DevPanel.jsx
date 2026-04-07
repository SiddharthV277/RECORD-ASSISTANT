import React, { useState } from 'react';
import axios from 'axios';
import { API_BASE } from '../config';

const API = API_BASE;

// Identity check — must match all three
const isDevUser = (user) =>
  user?.name === 'System Admin' &&
  user?.alias === 'dev' &&
  user?.branchName === 'MAIN BRANCH';

const DevPanel = () => {
  const user = JSON.parse(localStorage.getItem('user'));

  // Hidden — render nothing if not the dev user
  if (!isDevUser(user)) return null;

  const headers = { 'x-user-id': user.id };

  const [log, setLog] = useState([]);
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(null); // which action is pending confirm

  const addLog = (msg, ok = true) => {
    const ts = new Date().toLocaleTimeString();
    setLog(prev => [`[${ts}] ${ok ? '✅' : '❌'} ${msg}`, ...prev]);
  };

  const wipe = async (target, label) => {
    try {
      const res = await axios.delete(`${API}/api/dev/wipe/${target}`, { headers });
      addLog(res.data.message);
    } catch (err) {
      addLog(err.response?.data?.message || `Failed to wipe ${label}`, false);
    } finally {
      setConfirm(null);
    }
  };

  const actions = [
    { key: 'records',     label: 'Wipe All Records',     color: 'amber' },
    { key: 'settlements', label: 'Wipe All Settlements',  color: 'orange' },
    { key: 'tasks',       label: 'Wipe All Tasks',        color: 'red' },
    { key: 'all',         label: '⚠ WIPE EVERYTHING',    color: 'rose' },
  ];

  const colorMap = {
    amber:  { btn: 'bg-amber-500 hover:bg-amber-600',   ring: 'ring-amber-400' },
    orange: { btn: 'bg-orange-500 hover:bg-orange-600', ring: 'ring-orange-400' },
    red:    { btn: 'bg-red-600 hover:bg-red-700',       ring: 'ring-red-500' },
    rose:   { btn: 'bg-rose-700 hover:bg-rose-800',     ring: 'ring-rose-600' },
  };

  return (
    <>
      {/* Secret trigger — tiny badge at bottom of sidebar */}
      <button
        onClick={() => setOpen(o => !o)}
        title="DEV"
        className="fixed bottom-3 left-3 z-[200] w-6 h-6 rounded-full bg-gray-800/30 hover:bg-gray-800/60 transition-all duration-300"
        style={{ fontSize: 0 }}
      >
        .
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed inset-0 z-[300] flex items-end justify-start p-4 pointer-events-none">
          <div
            className="pointer-events-auto bg-gray-950 border border-gray-700 rounded-2xl w-full max-w-sm shadow-2xl text-white overflow-hidden animate-in slide-in-from-bottom-4 duration-300"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800 bg-gray-900">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs font-mono font-bold text-green-400 uppercase tracking-widest">DEV MODE</span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-500 hover:text-white text-lg leading-none transition-colors"
              >×</button>
            </div>

            {/* Actions */}
            <div className="p-4 grid grid-cols-2 gap-2">
              {actions.map(({ key, label, color }) => (
                confirm === key ? (
                  <div key={key} className={`col-span-2 rounded-lg ring-2 ${colorMap[color].ring} p-3 flex items-center justify-between gap-2 bg-gray-900`}>
                    <span className="text-xs font-bold text-gray-300">Confirm delete?</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => wipe(key, label)}
                        className="px-3 py-1 text-xs font-bold bg-red-600 hover:bg-red-700 rounded-md transition-colors"
                      >
                        Yes, wipe
                      </button>
                      <button
                        onClick={() => setConfirm(null)}
                        className="px-3 py-1 text-xs font-bold bg-gray-700 hover:bg-gray-600 rounded-md transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    key={key}
                    onClick={() => setConfirm(key)}
                    className={`${key === 'all' ? 'col-span-2' : ''} px-3 py-2.5 rounded-lg text-xs font-bold transition-all active:scale-95 text-white ${colorMap[color].btn}`}
                  >
                    {label}
                  </button>
                )
              ))}
            </div>

            {/* Log */}
            {log.length > 0 && (
              <div className="border-t border-gray-800 mx-4 mb-4 pt-3">
                <p className="text-[10px] font-mono text-gray-500 mb-1 uppercase tracking-widest">Log</p>
                <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                  {log.map((entry, i) => (
                    <p key={i} className="text-[11px] font-mono text-gray-400 leading-tight">{entry}</p>
                  ))}
                </div>
              </div>
            )}

            <div className="px-5 pb-4 text-[10px] text-gray-600 font-mono">
              Authenticated as: {user.name} · {user.alias} · {user.branchName}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DevPanel;
