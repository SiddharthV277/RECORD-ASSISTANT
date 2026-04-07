import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { LogOut, Home, CheckSquare, Users, FileText, Package, BookOpen } from 'lucide-react';
import DevPanel from './DevPanel';

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [user, setUser] = useState(() => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  });

  useEffect(() => {
    const handleUserUpdate = () => {
      const userStr = localStorage.getItem('user');
      if (userStr) setUser(JSON.parse(userStr));
    };
    window.addEventListener('userUpdated', handleUserUpdate);
    return () => window.removeEventListener('userUpdated', handleUserUpdate);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard',    icon: Home,        path: '/dashboard',  show: true },
    { label: 'Records',      icon: FileText,    path: '/records',    show: true },
    { label: 'Tasks',        icon: CheckSquare, path: '/tasks',      show: true },
    { label: 'Ledger',       icon: BookOpen,    path: '/ledger',     show: user?.role === 'SUPERADMIN' || user?.role === 'ADMIN' },
    { label: 'Particulars',  icon: Package,     path: '/particulars',show: user?.role === 'SUPERADMIN' || user?.role === 'ADMIN' },
    { label: 'Staff Control',icon: Users,       path: '/admin',      show: user?.role === 'SUPERADMIN' },
  ];

  return (
    <div className="min-h-screen flex bg-gray-50 flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-[#fdf8f5] shadow-xl flex-shrink-0 relative overflow-hidden flex flex-col pt-4 md:min-h-screen border-r border-[#ead5b4] paper-texture">
        <div className="px-6 mb-8 flex items-center justify-between md:justify-start relative z-10">
          <div className="w-full mb-2">
             <h1 className="text-2xl font-black tracking-tighter text-[#9c410f] border-b-2 border-[#e2a946] pb-1 uppercase inline-block">RS.ONLINE</h1>
             <p className="text-[10px] text-[#bc5d16] font-bold uppercase tracking-widest mt-1">Internal Network</p>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {navItems.filter(i => i.show).map((item) => {
            const Icon = item.icon;
            const active = location.pathname.startsWith(item.path);
            return (
              <Link 
                key={item.path} 
                to={item.path} 
                className={`flex items-center gap-3 px-4 py-3 rounded-sm transition-all duration-200 font-medium ${
                  active 
                    ? 'bg-rose-50 text-rose-700 shadow-sm' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-rose-600'
                }`}
              >
                <Icon size={20} className={active ? 'text-rose-600' : 'text-gray-400'} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 mt-auto relative z-10">
           <div className="bg-white/60 rounded-sm p-4 border border-[#ead5b4] mb-4 shadow-sm relative overflow-hidden backdrop-blur-sm">
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-[#e2a946] to-transparent opacity-20 rounded-bl-full pointer-events-none"></div>
              <p className="text-sm font-bold text-[#3f2a1d] truncate">{user?.name}</p>
              <p className="text-xs text-[#bc5d16] font-bold mt-1 uppercase tracking-wider">{user?.role} • {user?.branchName || 'No Branch'}</p>
           </div>
           <button 
             onClick={handleLogout}
             className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-sm transition-colors"
           >
             <LogOut size={16} /> Logout
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden p-4 md:p-8 pt-6">
        <div className="max-w-6xl mx-auto h-full animate-in fade-in duration-300">
           {children}
        </div>
      </main>

      {/* Hidden dev panel — only activates for SidV/DEV/RS ONLINE */}
      <DevPanel />
    </div>
  );
};

export default Layout;
