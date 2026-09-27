/**
 * Highway Corridor Checker for Citizens & Travelers
 * Real-time road passability, landslide blockages, and alternate bypass routes
 */

import React, { useState } from 'react';
import { HighwayCorridor, NerState } from '../../types/landslide';
import { 
  Car, 
  AlertOctagon, 
  CheckCircle2, 
  AlertTriangle, 
  Navigation, 
  Phone, 
  Clock, 
  Compass, 
  Filter, 
  ShieldAlert, 
  ArrowRight,
  Send
} from 'lucide-react';

interface HighwayCorridorCheckerProps {
  corridors: HighwayCorridor[];
  onReportBlockage: (highwayName: string) => void;
}

export const HighwayCorridorChecker: React.FC<HighwayCorridorCheckerProps> = ({
  corridors,
  onReportBlockage
}) => {
  const [selectedState, setSelectedState] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filtered = corridors.filter(item => {
    const matchesState = selectedState === 'ALL' || item.state === selectedState;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.routeSpan.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.state.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesState && matchesSearch;
  });

  const getStatusBadge = (status: HighwayCorridor['status']) => {
    switch (status) {
      case 'OPEN':
        return (
          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-700">
            <CheckCircle2 class="w-3.5 h-3.5" />
            OPEN FOR TRAFFIC
          </span>
        );
      case 'CAUTION':
        return (
          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-amber-950 text-amber-400 border border-amber-700">
            <AlertTriangle class="w-3.5 h-3.5" />
            CAUTION (SLOW MOVING)
          </span>
        );
      case 'RESTRICTED':
        return (
          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-orange-950 text-orange-400 border border-orange-700">
            <AlertOctagon class="w-3.5 h-3.5" />
            RESTRICTED / CONVOY ONLY
          </span>
        );
      case 'BLOCKED':
        return (
          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-red-950 text-red-400 border border-red-700 animate-pulse">
            <AlertOctagon class="w-3.5 h-3.5" />
            ROAD BLOCKED (CLEARANCE UNDERWAY)
          </span>
        );
    }
  };

  return (
    <div class="space-y-6">
      {/* Header Info */}
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider mb-1">
            <Car class="w-4 h-4" />
            NORTHEAST HILL HIGHWAY SAFETY RADAR
          </div>
          <h2 class="text-xl font-bold text-slate-50">
            Live Mountain Corridor Status & Travel Advisories
          </h2>
          <p class="text-xs sm:text-sm text-slate-400 max-w-2xl mt-1">
            Real-time transit conditions, mudslide clearance updates, and alternate detours maintained in coordination with BRO, PWD, and Highway Police.
          </p>
        </div>

        <button
          onClick={() => onReportBlockage('General Highway Route')}
          class="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg shrink-0 cursor-pointer"
        >
          <AlertTriangle class="w-4 h-4" />
          <span>Report Road Obstruction</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div class="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 p-3 rounded-xl">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by Highway (e.g. NH-10, NH-29, Gangtok, Itanagar)..."
          class="w-full sm:w-80 px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-50 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
        />

        <div class="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <Filter class="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span class="text-xs text-slate-400 whitespace-nowrap">State:</span>
          {['ALL', 'Sikkim', 'Arunachal Pradesh', 'Meghalaya', 'Nagaland', 'Manipur', 'Mizoram'].map(st => (
            <button
              key={st}
              onClick={() => setSelectedState(st)}
              class={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                selectedState === st
                  ? 'bg-teal-700 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-50'
              }`}
            >
              {st === 'Arunachal Pradesh' ? 'Arunachal' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Highway Cards Grid */}
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((hw) => (
          <div
            key={hw.id}
            class={`bg-slate-900/90 border rounded-2xl p-5 space-y-4 shadow-xl transition hover:border-slate-600 ${
              hw.status === 'BLOCKED'
                ? 'border-red-800/80 bg-red-950/20'
                : hw.status === 'RESTRICTED'
                ? 'border-orange-800/80'
                : hw.status === 'CAUTION'
                ? 'border-amber-800/80'
                : 'border-slate-800'
            }`}
          >
            <div class="flex items-start justify-between gap-3">
              <div>
                <div class="flex items-center gap-2">
                  <span class="text-xs font-mono font-bold text-cyan-400 uppercase">
                    {hw.state}
                  </span>
                  <span class="text-slate-600">•</span>
                  <span class="text-xs font-mono text-slate-400">
                    Slide Probability: <strong className={hw.riskProbability >= 0.70 ? 'text-rose-400' : 'text-slate-300'}>
                      {Math.round(hw.riskProbability * 100)}%
                    </strong>
                  </span>
                </div>
                <h3 class="text-base font-extrabold text-slate-50 mt-0.5">
                  {hw.name}
                </h3>
                <p class="text-xs text-slate-400 font-mono mt-0.5">
                  {hw.routeSpan}
                </p>
              </div>

              <div>{getStatusBadge(hw.status)}</div>
            </div>

            {/* Advisory Box */}
            <div class="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 text-xs space-y-1.5">
              <div class="flex items-center gap-1.5 text-slate-300 font-semibold">
                <ShieldAlert class="w-3.5 h-3.5 text-rose-400" />
                <span>Official Clearance Advisory:</span>
              </div>
              <p class="text-slate-300 leading-relaxed pl-5">
                {hw.advisory}
              </p>
            </div>

            {/* Alternate Route & Rainfall */}
            <div class="grid grid-cols-2 gap-2 text-xs font-mono">
              <div class="p-2.5 rounded-lg bg-slate-950/50 border border-slate-800">
                <span class="text-slate-400 block mb-0.5">24h Rainfall:</span>
                <span class="text-slate-50 font-bold">{hw.currentRainfall24h} mm</span>
              </div>
              <div class="p-2.5 rounded-lg bg-slate-950/50 border border-slate-800">
                <span class="text-slate-400 block mb-0.5">Last Inspection:</span>
                <span class="text-emerald-400 font-bold">{hw.lastCleared}</span>
              </div>
            </div>

            {hw.alternateRoute && (
              <div class="text-xs text-slate-400 flex items-start gap-1.5 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/60">
                <Compass class="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                <span>
                  <strong class="text-slate-200">Recommended Detour:</strong> {hw.alternateRoute}
                </span>
              </div>
            )}

            {/* Footer Contact & Action */}
            <div class="pt-2 border-t border-slate-800 flex items-center justify-between gap-3 text-xs">
              <div class="flex items-center gap-1.5 text-slate-400 truncate">
                <Phone class="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span class="truncate">{hw.emergencyContact}</span>
              </div>

              <button
                onClick={() => onReportBlockage(hw.name)}
                class="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-semibold transition shrink-0 cursor-pointer"
              >
                Report Update
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
