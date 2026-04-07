import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Lock, Mail, Building, ArrowRight, Loader2 } from 'lucide-react';
import { API_BASE } from '../config';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/api/auth/login`, {
        email,
        password
      });
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent px-4 sm:px-6 lg:px-8 relative overflow-hidden watercolor-bg paper-texture">
      
      <div className="max-w-md w-full space-y-8 bg-[#fdf8f5]/95 backdrop-blur-xl p-10 rounded-sm shadow-2xl border border-[#ead5b4] relative z-10 transform transition-all">
        <div>
          <div className="mx-auto flex items-center justify-center">
             <h1 className="text-4xl font-black tracking-tighter text-[#9c410f] border-b-4 border-[#e2a946] pb-1 uppercase">RS.ONLINE</h1>
          </div>
          <h2 className="mt-8 text-center text-2xl font-bold text-[#3f2a1d] tracking-tight">
            System Access
          </h2>
          <p className="mt-2 text-center text-sm text-[#bc5d16] font-semibold uppercase tracking-wider">
            Internal Network
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4 rounded-md shadow-sm">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-rose-500 transition-colors">
                <Mail className="h-5 w-5" />
              </div>
              <input
                id="email-address"
                name="email"
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="appearance-none block w-full pl-10 pr-3 py-3 border border-[#ead5b4] rounded-sm text-[#3f2a1d] placeholder-[#bc5d16]/50 focus:outline-none focus:ring-2 focus:ring-[#e2a946] focus:border-transparent transition-all sm:text-sm bg-white"
                placeholder="Email address"
              />
            </div>
            
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#bc5d16] group-focus-within:text-[#9c410f] transition-colors">
                <Lock className="h-5 w-5" />
              </div>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="appearance-none block w-full pl-10 pr-3 py-3 border border-[#ead5b4] rounded-sm text-[#3f2a1d] placeholder-[#bc5d16]/50 focus:outline-none focus:ring-2 focus:ring-[#e2a946] focus:border-transparent transition-all sm:text-sm bg-white"
                placeholder="Password"
              />
            </div>
          </div>

          {error && (
            <div className="text-red-700 text-sm mt-2 text-center bg-red-100 py-2 rounded-sm font-semibold border border-red-200">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3.5 px-4 rounded-sm text-white font-bold tracking-wide transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed bg-gradient-to-r from-[#bc5d16] to-[#d38c32] hover:to-[#e2a946] shadow-md border-b-2 border-[#9c410f]"
            >
              {loading ? (
                 <Loader2 className="animate-spin h-5 w-5 text-white" />
              ) : (
                <span className="flex items-center gap-2">
                  Sign in <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
