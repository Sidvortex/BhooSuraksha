/**
 * Public site navigation — the govt-website-style top bar that replaces
 * the old portal gateway landing page. Persistent across public pages,
 * with a dropdown menu and a Login entry point on the right, the way
 * sarkari (government) sites separate public pages from a staff login
 * rather than a "pick your portal" landing screen.
 */
import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Landmark, ChevronDown, LogIn, LogOut, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const GovNav: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <header class="sticky top-0 z-[1500] w-full bg-slate-900 border-b border-slate-800">
      {/* Utility strip, like india.gov.in's top bar */}
      <div class="hidden sm:flex items-center justify-end gap-4 px-6 py-1 bg-slate-950 text-xs text-slate-400 border-b border-slate-800">
        <span>Government of India — North Eastern Region Disaster Management</span>
      </div>

      <div class="px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        <Link to="/" class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg bg-teal-700 flex items-center justify-center shrink-0">
            <Landmark class="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 class="font-semibold text-white text-sm">BhooSuraksha</h1>
            <p class="text-xs text-slate-400 hidden sm:block">Landslide Risk Monitoring & Early Warning</p>
          </div>
        </Link>

        <nav class="flex items-center gap-1 sm:gap-2 text-sm">
          <Link
            to="/"
            class="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition"
          >
            Home
          </Link>

          {/* Citizen Services dropdown */}
          <div class="relative" ref={menuRef}>
            <button
              id="btn-citizen-services-menu"
              onClick={() => setMenuOpen((v) => !v)}
              class="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition flex items-center gap-1 cursor-pointer"
            >
              Citizen Services <ChevronDown class="w-3.5 h-3.5" />
            </button>
            {menuOpen && (
              <div class="absolute right-0 sm:left-0 top-full mt-1 w-56 bg-slate-950 border border-slate-800 rounded-xl shadow-xl py-1.5 text-sm">
                <Link
                  to="/citizen/safe-status"
                  onClick={() => setMenuOpen(false)}
                  class="block px-3.5 py-2 text-slate-300 hover:bg-slate-800 hover:text-white"
                >
                  Safety status by district
                </Link>
                <Link
                  to="/citizen/near-me"
                  onClick={() => setMenuOpen(false)}
                  class="block px-3.5 py-2 text-slate-300 hover:bg-slate-800 hover:text-white"
                >
                  Near me (map + emergency contacts)
                </Link>
                <Link
                  to="/citizen/report-hazard"
                  onClick={() => setMenuOpen(false)}
                  class="block px-3.5 py-2 text-slate-300 hover:bg-slate-800 hover:text-white"
                >
                  Report a hazard
                </Link>
                <Link
                  to="/citizen/routes"
                  onClick={() => setMenuOpen(false)}
                  class="block px-3.5 py-2 text-slate-300 hover:bg-slate-800 hover:text-white"
                >
                  Highway corridor checker
                </Link>
              </div>
            )}
          </div>
        </nav>

        <div class="flex items-center gap-2">
          {isAuthenticated ? (
            <>
              <button
                id="btn-goto-authority-dashboard"
                onClick={() => navigate('/authority/dashboard')}
                class="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-700 hover:bg-blue-600 text-white transition cursor-pointer"
              >
                <ShieldAlert class="w-3.5 h-3.5" />
                Authority Dashboard
              </button>
              <button
                id="btn-govnav-logout"
                onClick={() => { logout(); navigate('/'); }}
                class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                title={`Signed in as ${user?.username}`}
              >
                <LogOut class="w-3.5 h-3.5" />
                <span class="hidden sm:inline">Logout</span>
              </button>
            </>
          ) : (
            <button
              id="btn-govnav-login"
              onClick={() => navigate('/login')}
              class="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 transition cursor-pointer"
            >
              <LogIn class="w-3.5 h-3.5" />
              Login
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
