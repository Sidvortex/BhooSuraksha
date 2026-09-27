/**
 * Authority Command Center — left sidebar navigation.
 * Conventional admin-dashboard layout: persistent icon+label nav on the
 * left, content on the right. Only used in the Authority portal — the
 * public Citizen portal keeps its own simpler top tab bar.
 */

import React from 'react';
import { ActiveNavTab } from '../types/landslide';
import {
  LayoutDashboard,
  Route,
  Activity,
  Map,
  Bell,
  BarChart3,
  FileText,
  Settings,
} from 'lucide-react';

interface SidebarProps {
  activeTab: ActiveNavTab;
  onChangeTab: (tab: ActiveNavTab) => void;
  activeAlertsCount: number;
  criticalZonesCount: number;
  highRiskZonesCount: number;
  totalMonitoredCount: number;
  citizenReportsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onChangeTab,
  activeAlertsCount,
  criticalZonesCount,
  highRiskZonesCount,
  totalMonitoredCount,
  citizenReportsCount = 0
}) => {
  const navItems: { id: ActiveNavTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard class="w-4 h-4" /> },
    { id: 'route-planner', label: 'Route Planner', icon: <Route class="w-4 h-4" /> },
    { id: 'monitoring', label: 'Live Monitoring', icon: <Activity class="w-4 h-4" /> },
    { id: 'risk-map', label: 'Risk Map', icon: <Map class="w-4 h-4" /> },
    { id: 'alerts', label: 'Alerts & Reports', icon: <Bell class="w-4 h-4" />, badge: activeAlertsCount + citizenReportsCount },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 class="w-4 h-4" /> },
    { id: 'reports', label: 'Reports', icon: <FileText class="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings class="w-4 h-4" /> },
  ];

  return (
    <aside class="hidden md:flex md:flex-col w-56 shrink-0 bg-slate-900 border-r border-slate-800">
      <nav class="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-tab-${item.id}`}
              onClick={() => onChangeTab(item.id)}
              class={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
                isActive
                  ? 'bg-blue-700 text-white'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
              }`}
            >
              {item.icon}
              <span class="flex-1 text-left">{item.label}</span>
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
      </nav>

      {/* Compact status footer */}
      <div class="p-3 border-t border-slate-800 space-y-1.5 text-xs font-mono">
        <div class="flex items-center justify-between text-slate-400">
          <span>Monitored</span>
          <strong class="text-slate-50">{totalMonitoredCount}</strong>
        </div>
        <div class="flex items-center justify-between text-orange-300">
          <span>High risk</span>
          <strong>{highRiskZonesCount}</strong>
        </div>
        <div class="flex items-center justify-between text-red-300">
          <span>Critical</span>
          <strong>{criticalZonesCount}</strong>
        </div>
      </div>
    </aside>
  );
};
