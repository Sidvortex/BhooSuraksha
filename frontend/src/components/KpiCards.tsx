/**
 * KPI Cards for Disaster Management Command Center
 * Displays the 6 primary vital indicators for regional landslide vulnerability
 */

import React from 'react';
import { 
  MapPin, 
  AlertTriangle, 
  AlertOctagon, 
  Bell, 
  Gauge, 
  Clock, 
  TrendingUp, 
  ShieldCheck 
} from 'lucide-react';

interface KpiCardsProps {
  totalMonitored: number;
  highRiskCount: number;
  criticalCount: number;
  activeAlertsCount: number;
  averageRisk: number; // 0.0 - 1.0
  lastModelUpdate: string;
  onFilterRisk?: (risk: string) => void;
}

export const KpiCards: React.FC<KpiCardsProps> = ({
  totalMonitored,
  highRiskCount,
  criticalCount,
  activeAlertsCount,
  averageRisk,
  lastModelUpdate,
  onFilterRisk
}) => {
  const cards = [
    {
      id: 'kpi-monitored',
      title: 'Monitored Zones',
      value: totalMonitored,
      subtitle: 'Across 8 NER States',
      icon: <MapPin class="w-5 h-5 text-blue-400" />,
      borderColor: 'border-slate-800 hover:border-blue-500/50',
      bgColor: 'bg-slate-900/80',
      accentColor: 'text-cyan-400',
      tag: 'All stations reporting',
      tagColor: 'text-blue-400 bg-blue-950/60 border-blue-800',
      onClick: () => onFilterRisk?.('ALL')
    },
    {
      id: 'kpi-high-risk',
      title: 'High Risk Zones',
      value: highRiskCount,
      subtitle: 'Prob. 70% – 84%',
      icon: <AlertTriangle class="w-5 h-5 text-orange-400" />,
      borderColor: 'border-orange-900/60 hover:border-orange-500',
      bgColor: 'bg-orange-950/20',
      accentColor: 'text-orange-400',
      tag: 'Auto-geofenced at 70%+',
      tagColor: 'text-orange-400 bg-orange-950/60 border-orange-800',
      onClick: () => onFilterRisk?.('VERY_HIGH')
    },
    {
      id: 'kpi-critical-risk',
      title: 'Critical Risk Zones',
      value: criticalCount,
      subtitle: 'Prob. >= 85%',
      icon: <AlertOctagon class="w-5 h-5 text-red-500 animate-pulse" />,
      borderColor: 'border-red-900/80 hover:border-red-500 ring-1 ring-red-900/30',
      bgColor: 'bg-red-950/30',
      accentColor: 'text-red-400',
      tag: 'Review immediately',
      tagColor: 'text-red-300 bg-red-950 border-red-700 font-bold',
      onClick: () => onFilterRisk?.('CRITICAL')
    },
    {
      id: 'kpi-alerts',
      title: 'Active Alerts',
      value: activeAlertsCount,
      subtitle: 'Early Warnings Issued',
      icon: <Bell class="w-5 h-5 text-red-400" />,
      borderColor: 'border-red-900/60 hover:border-red-500',
      bgColor: 'bg-red-950/20',
      accentColor: 'text-red-400',
      tag: 'Active early warnings',
      tagColor: 'text-red-300 bg-red-950/60 border-red-800'
    },
    {
      id: 'kpi-avg-risk',
      title: 'Average Regional Risk',
      value: `${Math.round(averageRisk * 100)}%`,
      subtitle: 'Composite NER Vulnerability',
      icon: <Gauge class="w-5 h-5 text-amber-400" />,
      borderColor: 'border-amber-900/50 hover:border-amber-500',
      bgColor: 'bg-amber-950/20',
      accentColor: 'text-amber-400',
      tag: 'Across monitored zones',
      tagColor: 'text-amber-300 bg-amber-950/60 border-amber-800'
    },
    {
      id: 'kpi-last-update',
      title: 'Last Model Update',
      value: lastModelUpdate,
      subtitle: 'RandomForest model',
      icon: <Clock class="w-5 h-5 text-emerald-400" />,
      borderColor: 'border-slate-800 hover:border-emerald-500/50',
      bgColor: 'bg-slate-900/80',
      accentColor: 'text-emerald-400',
      tag: 'Simulated live stream',
      tagColor: 'text-emerald-400 bg-emerald-950/60 border-emerald-800'
    }
  ];

  return (
    <div id="kpi-cards-grid" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((card) => (
        <div
          key={card.id}
          id={card.id}
          onClick={card.onClick}
          class={`${card.bgColor} ${card.borderColor} border rounded-xl p-3.5 flex flex-col justify-between transition-all duration-200 shadow-lg hover:shadow-xl backdrop-blur relative overflow-hidden group ${
            card.onClick ? 'cursor-pointer hover:-translate-y-0.5' : ''
          }`}
        >
          {/* Card Header */}
          <div class="flex items-center justify-between mb-1.5">
            <span class="text-xs font-semibold text-slate-400 group-hover:text-slate-200 transition">
              {card.title}
            </span>
            <div class="p-1.5 rounded-lg bg-slate-950/60 border border-slate-800">
              {card.icon}
            </div>
          </div>

          {/* Metric Value */}
          <div class="my-1">
            <span class={`text-2xl lg:text-3xl font-bold font-mono tracking-tight ${card.accentColor}`}>
              {card.value}
            </span>
          </div>

          {/* Subtitle & Tag */}
          <div class="mt-1 flex flex-col gap-1">
            <span class="text-xs text-slate-400 leading-tight">
              {card.subtitle}
            </span>
            <span class={`text-xs font-mono px-1.5 py-0.5 rounded border self-start ${card.tagColor}`}>
              {card.tag}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};
