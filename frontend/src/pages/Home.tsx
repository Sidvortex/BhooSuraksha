/**
 * Public home page, laid out like an Indian government portal front page:
 * hero, quick-service tiles, live alerts next to helplines, warning signs,
 * and about / data-source sections (targets of the header's About menu).
 */
import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  MapPin, LocateFixed, AlertTriangle, Car, Building2, LifeBuoy, PhoneCall, ArrowRight,
  TreePine, Droplets, Volume2, ShieldAlert,
} from 'lucide-react';
import { GovNav } from '../components/GovNav';
import { api } from '../services/api';
import { AlertNotification } from '../types/landslide';
import { EMERGENCY_HELPLINES } from '../data/citizenData';
import { ISRO_LANDSLIDE_ATLAS_URL } from '../data/links';

const SERVICES = [
  { to: '/citizen/safe-status', icon: MapPin, title: 'District Safety Status', desc: 'Current landslide risk for monitored districts' },
  { to: '/citizen/near-me', icon: LocateFixed, title: 'Near Me', desc: 'Risk zones, hospitals and police within 100 km' },
  { to: '/citizen/report-hazard', icon: AlertTriangle, title: 'Report a Hazard', desc: 'Cracks, rockfall, tilting trees or muddy springs' },
  { to: '/citizen/routes', icon: Car, title: 'Highway Corridors', desc: 'Road status before you travel through the hills' },
  { to: '/citizen/shelters', icon: Building2, title: 'Evacuation Shelters', desc: 'Relief camps and their capacity' },
  { to: '/citizen/guidelines', icon: LifeBuoy, title: 'Safety Guidelines', desc: 'What to do before, during and after' },
];

const WARNING_SIGNS = [
  { icon: AlertTriangle, title: 'New cracks', desc: 'In the ground, roads, walls or foundations — or bulging soil at the base of a slope.' },
  { icon: TreePine, title: 'Tilting trees & poles', desc: 'Trees, fences or utility poles suddenly leaning downhill.' },
  { icon: Droplets, title: 'Water changes', desc: 'New springs or seepage, or stream water turning suddenly muddy.' },
  { icon: Volume2, title: 'Rumbling sounds', desc: 'A faint rumble that grows louder, or trees cracking with no wind.' },
];

const RISK_BADGE: Record<string, string> = {
  CRITICAL: 'bg-red-600 text-white',
  VERY_HIGH: 'bg-orange-600 text-white',
  HIGH: 'bg-amber-600 text-white',
  MODERATE: 'bg-yellow-600 text-white',
  LOW: 'bg-emerald-600 text-white',
};

export const Home: React.FC = () => {
  const [alerts, setAlerts] = useState<AlertNotification[]>([]);
  const location = useLocation();

  useEffect(() => {
    api.getAlerts().then(setAlerts).catch(() => setAlerts([]));
  }, []);

  // react-router doesn't scroll to #anchors on its own (About menu links)
  useEffect(() => {
    if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: 'smooth' });
  }, [location.hash]);

  return (
    <div class="flex-1 bg-gov-page flex flex-col">
      <GovNav />

      <main id="main-content">
        {/* Hero */}
        <section class="bg-gov-navy text-white relative overflow-hidden">
          <svg class="absolute right-0 bottom-0 h-full w-2/3 opacity-25 pointer-events-none" viewBox="0 0 600 300" preserveAspectRatio="xMaxYMax slice" aria-hidden="true">
            <path d="M0 300 L120 150 L190 220 L300 70 L400 190 L470 120 L600 250 L600 300 Z" fill="#1a4a8f" />
            <path d="M150 300 L300 120 L360 190 L450 90 L600 230 L600 300 Z" fill="#ff9933" opacity="0.55" />
            <path d="M300 70 L330 110 L310 105 L290 120 Z" fill="#ffffff" />
          </svg>
          <div class="relative max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
            <p class="text-gov-saffron font-semibold text-sm mb-2">भूस्खलन से पहले, सतर्कता</p>
            <h2 class="text-3xl sm:text-4xl font-bold leading-tight max-w-2xl">
              Know your landslide risk before the hills move.
            </h2>
            <p class="mt-3 text-white/80 max-w-xl text-base">
              Risk estimates for India's North Eastern Region and neighbouring hill districts, nearby
              emergency services, and the warning signs to watch for — free, no login needed.
            </p>
            <div class="mt-6 flex flex-wrap gap-3">
              <Link to="/citizen/near-me" class="inline-flex items-center gap-2 px-5 py-2.5 rounded bg-gov-saffron text-gov-navy-dark font-semibold hover:brightness-105">
                <LocateFixed class="w-4 h-4" /> Check risk near me
              </Link>
              <Link to="/citizen/report-hazard" class="inline-flex items-center gap-2 px-5 py-2.5 rounded border-2 border-white/70 text-white font-semibold hover:bg-white/10">
                <AlertTriangle class="w-4 h-4" /> Report a hazard
              </Link>
            </div>
          </div>
        </section>

        {/* Quick services */}
        <section class="max-w-7xl mx-auto px-4 sm:px-6 -mt-6 relative">
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {SERVICES.map(({ to, icon: Icon, title, desc }) => (
              <Link key={to} to={to} class="group bg-white border border-slate-800 rounded-lg p-4 shadow-sm hover:shadow-md hover:border-blue-600 transition text-center">
                <div class="w-11 h-11 mx-auto rounded-full bg-blue-50 text-gov-navy flex items-center justify-center mb-2 group-hover:bg-gov-navy group-hover:text-white transition">
                  <Icon class="w-5 h-5" />
                </div>
                <div class="font-semibold text-sm text-slate-100">{title}</div>
                <div class="text-xs text-slate-400 mt-1">{desc}</div>
              </Link>
            ))}
          </div>
        </section>

        {/* Alerts + helplines */}
        <section class="max-w-7xl mx-auto px-4 sm:px-6 py-10 grid gap-6 lg:grid-cols-3">
          <div class="lg:col-span-2 bg-white border border-slate-800 rounded-lg">
            <div class="flex items-center justify-between px-5 py-3 border-b border-slate-800">
              <h2 class="font-semibold text-gov-navy flex items-center gap-2"><ShieldAlert class="w-5 h-5 text-red-600" /> Current Landslide Alerts</h2>
              <Link to="/citizen/safe-status" class="text-sm text-blue-600 hover:underline flex items-center gap-1">View all <ArrowRight class="w-3.5 h-3.5" /></Link>
            </div>
            {alerts.length === 0 ? (
              <p class="px-5 py-6 text-sm text-slate-400">No active alerts right now.</p>
            ) : (
              <ul class="divide-y divide-slate-800">
                {alerts.slice(0, 5).map((a) => (
                  <li key={a.id} class="px-5 py-3 flex items-center justify-between gap-3">
                    <div class="min-w-0">
                      <div class="font-medium text-slate-100 truncate">{a.locationName}</div>
                      <div class="text-xs text-slate-400">{a.district}, {a.state}</div>
                    </div>
                    <div class="flex items-center gap-3 shrink-0">
                      <span class="text-sm font-mono text-slate-300">{Math.round(a.risk_probability * 100)}%</span>
                      <span class={`text-xs font-semibold px-2 py-0.5 rounded ${RISK_BADGE[a.risk_level] ?? RISK_BADGE.LOW}`}>
                        {a.risk_level.replace('_', ' ')}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div class="bg-white border border-slate-800 rounded-lg">
            <div class="px-5 py-3 border-b border-slate-800 bg-red-50 rounded-t-lg">
              <h2 class="font-semibold text-red-700 flex items-center gap-2"><PhoneCall class="w-5 h-5" /> Emergency Helplines</h2>
            </div>
            <ul class="divide-y divide-slate-800">
              {EMERGENCY_HELPLINES.map((h) => (
                <li key={h.service}>
                  <a href={`tel:${h.number}`} class="px-5 py-2.5 flex items-center justify-between gap-3 hover:bg-slate-950">
                    <span class="text-sm text-slate-200">{h.service}</span>
                    <span class="font-mono font-bold text-gov-navy whitespace-nowrap">{h.number}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Warning signs */}
        <section class="bg-white border-y border-slate-800">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 py-10">
            <h2 class="text-xl font-semibold text-gov-navy border-l-4 border-gov-saffron pl-3 mb-1">Warning signs of a landslide</h2>
            <p class="text-sm text-slate-400 mb-6 pl-4">If you notice these, move away from the slope — sideways or uphill, never down a valley — and call 112.</p>
            <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {WARNING_SIGNS.map(({ icon: Icon, title, desc }) => (
                <div key={title} class="border border-slate-800 rounded-lg p-4 border-t-4 border-t-orange-500">
                  <Icon class="w-6 h-6 text-orange-600 mb-2" />
                  <div class="font-semibold text-slate-100">{title}</div>
                  <div class="text-sm text-slate-400 mt-1">{desc}</div>
                </div>
              ))}
            </div>
            <Link to="/citizen/guidelines" class="inline-flex items-center gap-1 mt-5 text-sm text-blue-600 hover:underline">
              Full safety guidelines <ArrowRight class="w-3.5 h-3.5" />
            </Link>
          </div>
        </section>

        {/* About + data sources */}
        <section class="max-w-7xl mx-auto px-4 sm:px-6 py-10 grid gap-6 lg:grid-cols-2">
          <div id="about" class="bg-white border border-slate-800 rounded-lg p-6 scroll-mt-16">
            <h2 class="text-lg font-semibold text-gov-navy mb-2">About BhooSuraksha</h2>
            <p class="text-sm text-slate-300 leading-relaxed">
              BhooSuraksha (भूसुरक्षा, "ground safety") is a student-built landslide early-warning system.
              It combines trained machine-learning models with open disaster-event data to estimate risk,
              lets citizens report ground hazards, and gives disaster-management staff a dashboard to
              monitor zones and notify local authorities. It is a prototype — not an official government
              service — and its estimates are not evacuation orders.
            </p>
            <Link to="/contact" class="inline-flex items-center gap-1 mt-4 text-sm text-blue-600 hover:underline">
              Meet the team <ArrowRight class="w-3.5 h-3.5" />
            </Link>
          </div>

          <div id="data-sources" class="bg-white border border-slate-800 rounded-lg p-6 scroll-mt-16">
            <h2 class="text-lg font-semibold text-gov-navy mb-4">Data sources</h2>
            <dl class="grid grid-cols-2 gap-4 mb-4">
              {[
                ['1,886', 'recorded landslide events used for training'],
                ['6', 'countries/regions: India, Nepal, Bhutan, Myanmar, Bangladesh, Tibet'],
                ['3', 'trained prediction models'],
                ['17', 'monitored points in the North East'],
              ].map(([n, label]) => (
                <div key={label} class="border-l-4 border-gov-green pl-3">
                  <dt class="text-2xl font-bold text-gov-navy">{n}</dt>
                  <dd class="text-xs text-slate-400">{label}</dd>
                </div>
              ))}
            </dl>
            <p class="text-sm text-slate-300">
              Event data: NASA Global Landslide Catalog (2007–2016). Maps: OpenStreetMap and AWS terrain tiles.
              For India's official landslide inventory, see the{' '}
              <a href={ISRO_LANDSLIDE_ATLAS_URL} target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">ISRO Landslide Atlas of India</a>.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
};
