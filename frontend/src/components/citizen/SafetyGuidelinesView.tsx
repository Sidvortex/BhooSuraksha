/**
 * Citizen Safety Guidelines & Emergency Preparedness Protocol
 * Educational and survival guides for residents in landslide-prone hilly terrain
 */

import React, { useState } from 'react';
import { 
  ShieldAlert, 
  HelpCircle, 
  CheckSquare, 
  Square, 
  PhoneCall, 
  AlertTriangle, 
  Lightbulb, 
  Printer, 
  Info,
  LifeBuoy
} from 'lucide-react';
import { EMERGENCY_HELPLINES, LANDSLIDE_SIGNS_GUIDE } from '../../data/citizenData';

export const SafetyGuidelinesView: React.FC = () => {
  // Interactive Go-Bag Checklist
  const [checklist, setChecklist] = useState<Record<string, boolean>>({
    water: true,
    torch: true,
    whistle: false,
    firstaid: true,
    rations: false,
    powerbank: true,
    documents: false,
    medicines: true
  });

  const toggleCheck = (key: string) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const completedCount = Object.values(checklist).filter(Boolean).length;
  const totalItems = Object.keys(checklist).length;

  return (
    <div class="space-y-6">
      {/* Header */}
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider mb-1">
            <LifeBuoy class="w-4 h-4" />
            OFFICIAL NDMA / SDMA CITIZEN SURVIVAL PROTOCOL
          </div>
          <h2 class="text-xl font-bold text-white">
            Landslide Preparedness & Emergency Action Guide
          </h2>
          <p class="text-xs sm:text-sm text-slate-400 max-w-2xl mt-1">
            Crucial steps to take before the monsoon, during intense hillside rainfall, and immediate survival actions if a slope begins to slip.
          </p>
        </div>

        <button
          onClick={() => window.print()}
          class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-2 border border-slate-700 shrink-0 cursor-pointer"
        >
          <Printer class="w-4 h-4" />
          <span>Print / Save Offline PDF</span>
        </button>
      </div>

      {/* Emergency Go-Bag Checklist */}
      <div class="bg-indigo-950/40 border border-indigo-900/60 rounded-2xl p-6 shadow-xl space-y-4">
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 class="text-base font-bold text-white flex items-center gap-2">
              <CheckSquare class="w-5 h-5 text-indigo-400" />
              <span>72-Hour Monsoon Emergency Grab Bag Checklist</span>
            </h3>
            <p class="text-xs text-slate-400 mt-0.5">
              Keep this packed bag ready near your house exit during heavy rain warnings in hill districts.
            </p>
          </div>
          <div class="px-3 py-1 rounded-full bg-indigo-950 border border-indigo-700 text-indigo-300 text-xs font-mono font-bold">
            Readiness: {completedCount} of {totalItems} Packed ({Math.round((completedCount / totalItems) * 100)}%)
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
          {[
            { key: 'water', label: 'Packaged Drinking Water (2 Liters/person)' },
            { key: 'torch', label: 'Waterproof LED Torch & Extra Batteries' },
            { key: 'whistle', label: 'Emergency Sound Whistle (Signal Rescuers)' },
            { key: 'firstaid', label: 'First Aid Kit with Antiseptic & Bandages' },
            { key: 'rations', label: 'Dry Non-Perishable Food (Nuts, Biscuits)' },
            { key: 'powerbank', label: 'Charged Mobile Phone Power Bank' },
            { key: 'documents', label: 'ID Proofs in Waterproof Plastic Pouch' },
            { key: 'medicines', label: 'Essential Daily Prescription Medicines' }
          ].map((item) => {
            const isChecked = checklist[item.key];
            return (
              <div
                key={item.key}
                onClick={() => toggleCheck(item.key)}
                class={`p-3 rounded-xl border flex items-center gap-2.5 transition cursor-pointer select-none ${
                  isChecked
                    ? 'bg-indigo-950/60 border-indigo-500/80 text-white'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                {isChecked ? (
                  <CheckSquare class="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <Square class="w-4 h-4 text-slate-500 shrink-0" />
                )}
                <span class="text-xs font-medium leading-snug">{item.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3 Survival Phases: Before, During, After */}
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Phase 1: Before */}
        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div class="flex items-center gap-2 text-cyan-400 font-bold text-sm">
            <Lightbulb class="w-5 h-5" />
            <h3>Phase 1: Before Heavy Rains</h3>
          </div>
          <ul class="space-y-2 text-xs text-slate-300 leading-relaxed list-disc list-inside">
            <li>Check surface drains around your house to ensure rainwater flows freely without saturating backfilled cut slopes.</li>
            <li>Plant deep-root native grasses (like Vetiver) and bamboo along vulnerable steep terrace edges.</li>
            <li>Agree on an evacuation meeting point with family uphill from local riverbeds and gullies.</li>
            <li>Monitor local weather bulletins and District Disaster Authority (DDMA) social channels.</li>
          </ul>
        </div>

        {/* Phase 2: During */}
        <div class="bg-slate-900 border border-rose-900/60 rounded-2xl p-5 space-y-3 bg-rose-950/10">
          <div class="flex items-center gap-2 text-rose-400 font-bold text-sm">
            <AlertTriangle class="w-5 h-5" />
            <h3>Phase 2: During Slope Movement</h3>
          </div>
          <ul class="space-y-2 text-xs text-slate-300 leading-relaxed list-disc list-inside">
            <li><strong>Evacuate immediately</strong> if you hear trees snapping or deep rumbling sounds. Never wait to gather property.</li>
            <li>Move <strong>perpendicular (laterally)</strong> away from the slide path. Debris flows accelerate in valley centers.</li>
            <li>Avoid river valleys and low-lying bridges during intense rainfall; mudflows can cause flash floods without warning.</li>
            <li>If trapped indoors, curl into a tight ball under heavy sturdy furniture and cover your head with your arms.</li>
          </ul>
        </div>

        {/* Phase 3: After */}
        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div class="flex items-center gap-2 text-emerald-400 font-bold text-sm">
            <ShieldAlert class="w-5 h-5" />
            <h3>Phase 3: After the Landslide</h3>
          </div>
          <ul class="space-y-2 text-xs text-slate-300 leading-relaxed list-disc list-inside">
            <li>Stay away from the slide area. Secondary slides often occur hours after the initial collapse.</li>
            <li>Check for trapped or injured persons near the slide edge without entering the direct hazard zone.</li>
            <li>Listen to battery-operated radio or phone alerts for official road opening advisories.</li>
            <li>Report downed power lines or broken water pipes immediately to district authorities.</li>
          </ul>
        </div>
      </div>

      {/* Warning Signs Guide */}
      <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 class="text-base font-bold text-white flex items-center gap-2">
          <AlertTriangle class="w-5 h-5 text-amber-400" />
          <span>Recognizing Early Warning Signs on Hill Slopes</span>
        </h3>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {LANDSLIDE_SIGNS_GUIDE.map((section, idx) => (
            <div key={idx} class="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <h4 class="font-bold text-cyan-400 uppercase tracking-wider text-xs font-mono">
                {section.category}
              </h4>
              <ul class="space-y-1.5 text-slate-300 leading-relaxed list-disc list-inside">
                {section.items.map((it, i) => (
                  <li key={i}>{it}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Emergency Helplines Directory */}
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 class="text-base font-bold text-white flex items-center gap-2">
          <PhoneCall class="w-5 h-5 text-rose-400" />
          <span>National & Regional Emergency Helplines (Click to Call)</span>
        </h3>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {EMERGENCY_HELPLINES.map((hl) => (
            <a
              key={hl.number}
              href={`tel:${hl.number.replace(/[^0-9]/g, '')}`}
              class="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition flex items-center justify-between gap-3 group"
            >
              <div>
                <h4 class="font-bold text-xs text-white group-hover:text-rose-400 transition">
                  {hl.service}
                </h4>
                <p class="text-xs text-slate-400 mt-0.5">
                  {hl.description}
                </p>
              </div>
              <span class="font-mono font-bold text-cyan-400 text-sm px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 shrink-0">
                {hl.number}
              </span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};
