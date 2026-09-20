/**
 * Community Relief Shelters & Evacuation Centers
 * Designated safe refuges on stable bedrock with capacity and officer contacts
 */

import React, { useState } from 'react';
import { EmergencyReliefShelter } from '../../types/landslide';
import { 
  Building2, 
  Users, 
  Phone, 
  MapPin, 
  ShieldCheck, 
  HeartHandshake, 
  Sparkles, 
  Check, 
  Navigation,
  Compass
} from 'lucide-react';

interface ReliefSheltersViewProps {
  shelters: EmergencyReliefShelter[];
}

export const ReliefSheltersView: React.FC<ReliefSheltersViewProps> = ({ shelters }) => {
  const [selectedState, setSelectedState] = useState<string>('ALL');

  const filtered = shelters.filter(
    s => selectedState === 'ALL' || s.state === selectedState
  );

  return (
    <div class="space-y-6">
      {/* Header */}
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 text-xs font-mono text-emerald-400 font-bold uppercase tracking-wider mb-1">
            <Building2 class="w-4 h-4" />
            DESIGNATED DISASTER EVACUATION SHELTERS
          </div>
          <h2 class="text-xl font-bold text-white">
            Safe Community Refuges & Relief Centers
          </h2>
          <p class="text-xs sm:text-sm text-slate-400 max-w-2xl mt-1">
            Engineered structures surveyed by geological authorities, located outside active runout zones with food, water, power, and medical facilities.
          </p>
        </div>

        <div class="flex items-center gap-2 overflow-x-auto">
          {['ALL', 'Sikkim', 'Arunachal Pradesh', 'Mizoram', 'Meghalaya', 'Nagaland'].map(st => (
            <button
              key={st}
              onClick={() => setSelectedState(st)}
              class={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                selectedState === st
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {st === 'Arunachal Pradesh' ? 'Arunachal' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Shelters Grid */}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((sh) => {
          const occupancyPct = Math.round((sh.occupancy / sh.capacity) * 100);
          const isNearFull = occupancyPct > 80;

          return (
            <div
              key={sh.id}
              class="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl hover:border-slate-700 transition flex flex-col justify-between"
            >
              <div class="space-y-3">
                <div class="flex items-start justify-between gap-2">
                  <div>
                    <span class="text-xs font-mono font-bold text-cyan-400 uppercase">
                      {sh.state} • {sh.district}
                    </span>
                    <h3 class="text-base font-extrabold text-white mt-0.5">
                      {sh.name}
                    </h3>
                    <p class="text-xs text-slate-400 flex items-center gap-1 mt-1">
                      <MapPin class="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      <span>{sh.locationName}</span>
                    </p>
                  </div>
                  <span class="p-2 rounded-xl bg-emerald-950/60 border border-emerald-700 text-emerald-400 shrink-0">
                    <ShieldCheck class="w-5 h-5" />
                  </span>
                </div>

                {/* Capacity Bar */}
                <div class="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                  <div class="flex items-center justify-between text-xs font-mono">
                    <span class="text-slate-400">Current Occupancy:</span>
                    <span className={isNearFull ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>
                      {sh.occupancy} / {sh.capacity} ({occupancyPct}%)
                    </span>
                  </div>
                  <div class="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      class={`h-full rounded-full ${
                        isNearFull ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${occupancyPct}%` }}
                    />
                  </div>
                </div>

                {/* Facilities Pills */}
                <div class="space-y-1">
                  <span class="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Available Relief Facilities:
                  </span>
                  <div class="flex flex-wrap gap-1.5">
                    {sh.facilities.map((fac, idx) => (
                      <span
                        key={idx}
                        class="px-2 py-0.5 rounded-md bg-slate-800 text-xs text-slate-300 font-medium flex items-center gap-1"
                      >
                        <Check class="w-2.5 h-2.5 text-emerald-400" />
                        {fac}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Officer in charge */}
                <div class="text-xs text-slate-400 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/60 font-mono">
                  <span class="text-slate-400 block">Nodal Officer:</span>
                  <span class="text-white font-semibold">{sh.officerInCharge}</span>
                </div>
              </div>

              {/* Call Hotline Button */}
              <div class="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                <div class="text-xs font-mono text-slate-400 flex items-center gap-1">
                  <Compass class="w-3.5 h-3.5 text-cyan-400" />
                  <span>Elev: {sh.elevationMeters}m</span>
                </div>

                <a
                  href={`tel:${sh.contactNumber.replace(/[^0-9+]/g, '')}`}
                  class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow"
                >
                  <Phone class="w-3.5 h-3.5" />
                  <span>Call Shelter Desk</span>
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
