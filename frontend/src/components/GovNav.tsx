/**
 * Public site header, in the layout Indian government portals use (ISRO,
 * IRCTC, india.gov.in): tricolour strip, a white bilingual branding band,
 * a navy navigation bar with dropdown menus, and a "Latest Alerts" ticker.
 *
 * Dropdowns open on hover and on keyboard focus (focus-within), and via a
 * hamburger menu on small screens.
 */
import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { ChevronDown, LogIn, LogOut, ShieldAlert, Menu, X, PhoneCall, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { BrandMark } from './gov/BrandMark';
import { AlertsTicker } from './gov/AlertsTicker';
import { REPO_URL, DOCS_URL, ISRO_LANDSLIDE_ATLAS_URL, NDMA_URL } from '../data/links';

interface MenuItem { label: string; to: string; external?: boolean }
interface MenuGroup { label: string; to?: string; items?: MenuItem[] }

export const GovNav: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const menu: MenuGroup[] = [
    { label: t('nav.home'), to: '/' },
    {
      label: t('nav.about'),
      items: [
        { label: 'About BhooSuraksha', to: '/#about' },
        { label: 'Project team', to: '/contact' },
        { label: 'Data sources', to: '/#data-sources' },
      ],
    },
    {
      label: t('nav.citizenServices'),
      items: [
        { label: 'Safety status by district', to: '/citizen/safe-status' },
        { label: 'Near me (map + emergency contacts)', to: '/citizen/near-me' },
        { label: 'Report a hazard', to: '/citizen/report-hazard' },
        { label: 'Highway corridor status', to: '/citizen/routes' },
        { label: 'Evacuation shelters', to: '/citizen/shelters' },
      ],
    },
    {
      label: t('nav.resources'),
      items: [
        { label: 'Landslide safety guidelines', to: '/citizen/guidelines' },
        { label: 'ISRO Landslide Atlas of India', to: ISRO_LANDSLIDE_ATLAS_URL, external: true },
        { label: 'NDMA (National Disaster Management Authority)', to: NDMA_URL, external: true },
        { label: 'Project documentation', to: DOCS_URL, external: true },
        { label: 'Source code', to: REPO_URL, external: true },
        { label: 'Sitemap', to: '/sitemap' },
      ],
    },
    { label: t('nav.emergency'), to: '/contact' },
    { label: t('nav.feedback'), to: '/feedback' },
  ];

  const itemLink = (item: MenuItem, className: string) =>
    item.external ? (
      <a key={item.label} href={item.to} target="_blank" rel="noopener noreferrer" class={className}>
        {item.label} <ExternalLink class="inline w-3 h-3 ml-1 opacity-60" />
      </a>
    ) : (
      <Link key={item.label} to={item.to} class={className} onClick={() => setMobileOpen(false)}>
        {item.label}
      </Link>
    );

  return (
    <header class="w-full">
      {/* Tricolour strip */}
      <div class="flex h-1.5">
        <div class="flex-1 bg-gov-saffron" />
        <div class="flex-1 bg-white" />
        <div class="flex-1 bg-gov-green" />
      </div>

      {/* Branding band */}
      <div class="bg-white border-b border-slate-800">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <Link to="/" class="flex items-center gap-3 min-w-0">
            <BrandMark size={56} />
            <div class="min-w-0">
              <div class="text-xl sm:text-2xl font-bold text-gov-navy leading-tight">
                भूसुरक्षा <span class="text-slate-500 font-normal">|</span> BhooSuraksha
              </div>
              <div class="text-xs sm:text-sm text-slate-300 leading-snug">
                भूस्खलन पूर्व चेतावनी प्रणाली · {t('brand.tagline')}
              </div>
              <div class="text-xs text-slate-500 hidden sm:block">{t('brand.disclaimer')}</div>
            </div>
          </Link>

          <div class="flex items-center gap-2 shrink-0">
            <a
              href="tel:112"
              class="hidden md:flex items-center gap-2 px-3 py-2 rounded border-2 border-red-600 text-red-700 font-semibold text-sm hover:bg-red-50"
            >
              <PhoneCall class="w-4 h-4" /> Emergency: 112
            </a>
            <button
              class="lg:hidden p-2 rounded border border-slate-700 text-gov-navy cursor-pointer"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle menu"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X class="w-5 h-5" /> : <Menu class="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Navy navigation bar (desktop) */}
      <nav class="hidden lg:block bg-gov-navy text-white sticky top-0 z-[1500] shadow">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <ul class="flex items-stretch">
            {menu.map((group) =>
              group.items ? (
                <li key={group.label} class="relative group">
                  <button class="h-full flex items-center gap-1 px-4 py-3 text-[15px] hover:bg-gov-navy-light group-hover:text-gov-saffron group-focus-within:text-gov-saffron cursor-pointer">
                    {group.label} <ChevronDown class="w-3.5 h-3.5" />
                  </button>
                  <div class="absolute left-0 top-full min-w-64 bg-white text-slate-100 border-t-4 border-gov-saffron shadow-xl invisible opacity-0 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 transition">
                    {group.items.map((item) =>
                      itemLink(item, 'block px-4 py-2.5 text-sm border-b border-slate-800 last:border-0 hover:bg-blue-50 hover:text-gov-navy')
                    )}
                  </div>
                </li>
              ) : (
                <li key={group.label}>
                  <NavLink
                    to={group.to!}
                    end
                    className={({ isActive }) =>
                      `h-full flex items-center px-4 py-3 text-[15px] hover:bg-gov-navy-light ${isActive ? 'text-gov-saffron' : ''}`
                    }
                  >
                    {group.label}
                  </NavLink>
                </li>
              )
            )}
          </ul>

          {isAuthenticated ? (
            <div class="flex items-center gap-2">
              <button
                onClick={() => navigate('/authority/dashboard')}
                class="flex items-center gap-1.5 px-3 py-1.5 rounded bg-gov-saffron text-gov-navy-dark text-sm font-semibold hover:brightness-105 cursor-pointer"
              >
                <ShieldAlert class="w-4 h-4" /> {t('auth.dashboard')}
              </button>
              <button
                onClick={() => { logout(); navigate('/'); }}
                class="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm text-white/85 hover:text-white hover:bg-gov-navy-light cursor-pointer"
                title={`Signed in as ${user?.username}`}
              >
                <LogOut class="w-4 h-4" /> {t('nav.logout')}
              </button>
            </div>
          ) : (
            <button
              id="btn-govnav-login"
              onClick={() => navigate('/login')}
              class="flex items-center gap-1.5 px-4 py-1.5 rounded bg-gov-saffron text-gov-navy-dark text-sm font-semibold hover:brightness-105 cursor-pointer"
            >
              <LogIn class="w-4 h-4" /> {t('nav.authorityLogin')}
            </button>
          )}
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <nav class="lg:hidden bg-gov-navy text-white">
          {menu.map((group) =>
            group.items ? (
              <details key={group.label} class="border-b border-white/10">
                <summary class="px-4 py-3 cursor-pointer">{group.label}</summary>
                <div class="bg-gov-navy-dark">
                  {group.items.map((item) => itemLink(item, 'block px-6 py-2.5 text-sm text-white/85'))}
                </div>
              </details>
            ) : (
              <Link key={group.label} to={group.to!} onClick={() => setMobileOpen(false)} class="block px-4 py-3 border-b border-white/10">
                {group.label}
              </Link>
            )
          )}
          <Link
            to={isAuthenticated ? '/authority/dashboard' : '/login'}
            onClick={() => setMobileOpen(false)}
            class="block px-4 py-3 bg-gov-saffron text-gov-navy-dark font-semibold"
          >
            {isAuthenticated ? t('auth.dashboard') : t('nav.authorityLogin')}
          </Link>
        </nav>
      )}

      <AlertsTicker />
    </header>
  );
};
