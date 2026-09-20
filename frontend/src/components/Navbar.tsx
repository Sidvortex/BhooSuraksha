/**
 * Authority Command Center — top bar.
 * Desktop navigation lives in Sidebar.tsx; this renders a slim header plus a
 * horizontal tab strip that only appears on small screens (no sidebar there).
 * This header is only ever shown inside the Authority portal; the public
 * Citizen portal has its own separate header (see CitizenHeader.tsx).
 */

import React from 'react';
import { ActiveNavTab } from '../types/landslide';
import {
  ShieldAlert,
  LayoutDashboard,
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
    { id: 'monitoring', label: 'Live Monitoring', icon: <Activity class="w-4 h-4" /> },
    { id: 'risk-map', label: 'Risk Map', icon: <Map class="w-4 h-4" /> },
    { id: 'alerts', label: 'Alerts', icon: <Bell class="w-4 h-4" />, badge: activeAlertsCount + citizenReportsCount },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 class="w-4 h-4" /> },
    { id: 'reports', label: 'Reports', icon: <FileText class="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings class="w-4 h-4" /> },
  ];

  return (
    <header class="sticky top-0 z-50 w-full bg-slate-900 border-b border-slate-800">
      {/* Upper bar */}
      <div class="px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Brand / Logo */}
        <div class="flex items-center gap-3">
          <div class="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-700 shrink-0">
            <ShieldAlert class="w-5 h-5 text-white" />
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h1 class="font-semibold text-base tracking-tight text-white whitespace-nowrap">
                NER LandslideGuard
              </h1>
              <span class="px-1.5 py-0.5 rounded text-xs font-medium uppercase tracking-wide bg-amber-500/15 text-amber-400 border border-amber-500/40 hidden xs:inline">
                Demo
              </span>
            </div>
            <p class="text-xs text-slate-400 hidden sm:block truncate max-w-xs">
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
                ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
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
            class="flex items-center gap-1.5 px-3 py-1.5 bg-blue-700 hover:bg-blue-600 text-white rounded-lg text-xs font-medium transition cursor-pointer"
          >
            <Activity class="w-3.5 h-3.5" />
            <span class="hidden sm:inline">Run Prediction</span>
          </button>

          <div class="w-px h-6 bg-slate-700 mx-0.5 hidden sm:block" />

          <button
            id="btn-exit-to-gateway"
            onClick={onExitToGateway}
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Return to portal selection"
          >
            <LogOut class="w-3.5 h-3.5" />
            <span class="hidden sm:inline">Change Portal</span>
          </button>
        </div>
      </div>

      {/* Mobile-only tab strip (desktop navigation lives in the sidebar) */}
      <div class="md:hidden px-4 py-2 bg-slate-950/40 border-t border-slate-800 flex items-center gap-1 overflow-x-auto text-xs">
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
