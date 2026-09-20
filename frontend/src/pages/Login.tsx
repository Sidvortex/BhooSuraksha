import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldAlert, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Login: React.FC = () => {
  const { login, isLoggingIn, loginError } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await login(username, password);
    if (ok) navigate('/authority/dashboard');
  };

  return (
    <div class="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center px-4">
      <div class="w-full max-w-sm">
        <div class="flex items-center gap-3 mb-6 justify-center">
          <div class="w-10 h-10 rounded-lg bg-blue-700 flex items-center justify-center">
            <ShieldAlert class="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 class="font-semibold text-white">NER LandslideGuard</h1>
            <p class="text-xs text-slate-400">Authority Command Center Login</p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          class="bg-slate-950/70 border border-slate-800 rounded-xl p-5 space-y-4"
        >
          <div>
            <label class="text-xs font-semibold text-slate-300 block mb-1">Username</label>
            <input
              id="login-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
              class="w-full bg-slate-900 border border-slate-700 text-slate-100 text-sm rounded-lg p-2.5 outline-none focus:border-blue-600"
            />
          </div>
          <div>
            <label class="text-xs font-semibold text-slate-300 block mb-1">Password</label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              class="w-full bg-slate-900 border border-slate-700 text-slate-100 text-sm rounded-lg p-2.5 outline-none focus:border-blue-600"
            />
          </div>

          {loginError && (
            <div class="text-xs text-red-400 bg-red-950/40 border border-red-900 rounded-lg p-2.5">
              {loginError}
            </div>
          )}

          <button
            id="btn-login-submit"
            type="submit"
            disabled={isLoggingIn}
            class="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-700 hover:bg-blue-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition cursor-pointer"
          >
            <LogIn class="w-4 h-4" />
            {isLoggingIn ? 'Signing in...' : 'Sign in'}
          </button>

          <p class="text-xs text-slate-500 text-center">
            Authority accounts are created by an administrator — there's no
            public sign-up. See <code class="text-slate-400">backend/create_admin.py</code>.
          </p>
        </form>

        <div class="text-center mt-4">
          <Link to="/" class="text-xs text-slate-400 hover:text-slate-200">
            &larr; Back to the public site
          </Link>
        </div>
      </div>
    </div>
  );
};
