/**
 * Authority Command Center — top bar.
 * Desktop navigation lives in Sidebar.tsx; this renders a slim header plus a
 * horizontal tab strip that only appears on small screens (no sidebar there).
 * This header is only ever shown inside the Authority portal; the public
 * Citizen portal has its own separate header (see CitizenHeader.tsx).
 */

import React from 'react';
import { ActiveNavTab } from '../types/landslide';
import { BrandMark } from './gov/BrandMark';
import {
  LayoutDashboard,
  Route,
  Activity,
  Map,
  Bell,
  BarChart3,
  FileText,
  Settings,
  Play,
  Pause,
  LogOut
} from 'lucide-react';

interface NavbarProps {
  activeTab: ActiveNavTab;
  onChangeTab: (tab: ActiveNavTab) => void;
  systemOnline: boolean;
  lastUpdated: string;
  isSimulating: boolean;
  onToggleSimulation: () => void;
  onOpenPredictionModal: () => void;
  onExitToGateway: () => void;
  activeAlertsCount: number;
  criticalZonesCount: number;
  highRiskZonesCount: number;
  totalMonitoredCount: number;
  citizenReportsCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onChangeTab,
  isSimulating,
  onToggleSimulation,
  onOpenPredictionModal,
  onExitToGateway,
  activeAlertsCount,
  citizenReportsCount = 0
}) => {
  const navItems: { id: ActiveNavTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard class="w-4 h-4" /> },
    { id: 'route-planner', label: 'Route Planner', icon: <Route class="w-4 h-4" /> },
    { id: 'monitoring', label: 'Live Monitoring', icon: <Activity class="w-4 h-4" /> },
    { id: 'risk-map', label: 'Risk Map', icon: <Map class="w-4 h-4" /> },
    { id: 'alerts', label: 'Alerts', icon: <Bell class="w-4 h-4" />, badge: activeAlertsCount + citizenReportsCount },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 class="w-4 h-4" /> },
    { id: 'reports', label: 'Reports', icon: <FileText class="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings class="w-4 h-4" /> },
  ];

  return (
    <header class="sticky top-0 z-[1500] w-full">
      <div class="flex h-1"><div class="flex-1 bg-gov-saffron" /><div class="flex-1 bg-white" /><div class="flex-1 bg-gov-green" /></div>
      {/* Upper bar */}
      <div class="px-4 sm:px-6 h-16 flex items-center justify-between gap-3 bg-gov-navy text-white">
        {/* Brand / Logo */}
        <div class="flex items-center gap-3">
          <div class="flex items-center justify-center w-9 h-9 rounded bg-white shrink-0">
            <BrandMark size={30} />
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h1 class="font-semibold text-base tracking-tight text-white whitespace-nowrap">
                BhooSuraksha
              </h1>
              <span class="px-1.5 py-0.5 rounded text-xs font-medium uppercase tracking-wide bg-gov-saffron text-gov-navy-dark hidden xs:inline">
                Demo
              </span>
            </div>
            <p class="text-xs text-white/70 hidden sm:block truncate max-w-xs">
              Authority Command Center
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div class="flex items-center gap-2">
          <button
            id="btn-toggle-live-simulation"
            onClick={onToggleSimulation}
            class={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer ${
              isSimulating
                ? 'bg-gov-green border-gov-green text-white'
                : 'bg-white/10 border-white/25 text-white/80 hover:text-white'
            }`}
            title={isSimulating ? 'Pause simulated live sensor updates' : 'Start live sensor simulation stream'}
          >
            {isSimulating ? (
              <>
                <Pause class="w-3.5 h-3.5" />
                <span class="hidden md:inline">Stream Active</span>
              </>
            ) : (
              <>
                <Play class="w-3.5 h-3.5" />
                <span class="hidden md:inline">Stream Paused</span>
              </>
            )}
          </button>

          <button
            id="btn-run-prediction-header"
            onClick={onOpenPredictionModal}
            class="flex items-center gap-1.5 px-3 py-1.5 bg-gov-saffron hover:brightness-105 text-gov-navy-dark rounded-lg text-xs font-semibold transition cursor-pointer"
          >
            <Activity class="w-3.5 h-3.5" />
            <span class="hidden sm:inline">Run Prediction</span>
          </button>

          <div class="w-px h-6 bg-white/25 mx-0.5 hidden sm:block" />

          <button
            id="btn-exit-to-gateway"
            onClick={onExitToGateway}
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
            title="Return to portal selection"
          >
            <LogOut class="w-3.5 h-3.5" />
            <span class="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>

      {/* Mobile-only tab strip (desktop navigation lives in the sidebar) */}
      <div class="md:hidden px-4 py-2 bg-white border-b border-slate-800 flex items-center gap-1 overflow-x-auto text-xs">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-tab-mobile-${item.id}`}
              onClick={() => onChangeTab(item.id)}
              class={`relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-blue-700 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span class={`px-1.5 py-0.2 rounded-full text-xs font-semibold ${
                  isActive ? 'bg-white text-blue-700' : 'bg-red-600 text-white'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </header>
  );
};
