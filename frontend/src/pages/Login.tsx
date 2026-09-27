import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, LogIn, Server } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { GovNav } from '../components/GovNav';
import { PageBanner } from '../components/gov/PageBanner';
import { getBackendUrl, setBackendUrl } from '../utils/backendUrl';

export const Login: React.FC = () => {
  const { login, isLoggingIn, loginError } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [backendUrlInput, setBackendUrlInput] = useState(() => getBackendUrl());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Settings (where this was previously the only place to set it) lives
    // inside the Authority portal, which requires being logged in — so it
    // has to be settable here too, or nobody could ever complete the
    // first login.
    setBackendUrl(backendUrlInput);
    const ok = await login(username, password);
    if (ok) navigate('/authority/dashboard');
  };

  return (
    <div class="flex-1 bg-gov-page text-slate-100 flex flex-col">
      <GovNav />
      <PageBanner title="Authority Login" crumbs={[{ label: 'Authority Login' }]} />
      <div id="main-content" class="flex-1 flex items-start justify-center px-4 py-10">
      <div class="w-full max-w-md bg-white border border-slate-800 rounded-lg shadow-sm overflow-hidden">
        <div class="bg-gov-navy text-white px-5 py-3 flex items-center gap-2">
          <ShieldAlert class="w-5 h-5 text-gov-saffron" />
          <div>
            <div class="font-semibold">Authority Command Center</div>
            <div class="text-xs text-white/70">For authorised disaster-management staff only</div>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          class="p-5 space-y-4"
        >
          <div>
            <label class="text-xs font-semibold text-slate-300 block mb-1 flex items-center gap-1.5">
              <Server class="w-3.5 h-3.5" /> Backend URL
            </label>
            <input
              id="login-backend-url"
              type="text"
              value={backendUrlInput}
              onChange={(e) => setBackendUrlInput(e.target.value)}
              placeholder="http://localhost:8000"
              class="w-full bg-slate-900 border border-slate-700 text-slate-100 text-sm rounded-lg p-2.5 outline-none focus:border-blue-600"
            />
            <span class="text-xs text-slate-500 block mt-1">
              Where your backend is running. Saved for next time too.
            </span>
          </div>

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

      </div>
      </div>
    </div>
  );
};
