import React, { useState } from 'react';
import { Info, X, Landmark } from 'lucide-react';

const TEAM = [
  'Member 1',
  'Member 2',
  'Member 3',
  'Member 4',
  'Member 5',
  'Member 6',
];

export const AboutCredits: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        id="btn-about-credits"
        onClick={() => setIsOpen(true)}
        class="fixed bottom-5 left-5 z-[2000] w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white flex items-center justify-center shadow-lg transition cursor-pointer"
        title="About this project"
      >
        <Info class="w-4 h-4" />
      </button>

      {isOpen && (
        <div class="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 px-4">
          <div class="w-full max-w-sm bg-slate-950 border border-slate-800 rounded-2xl p-5 relative">
            <button
              onClick={() => setIsOpen(false)}
              class="absolute top-3 right-3 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X class="w-4 h-4" />
            </button>

            <div class="flex items-center gap-2.5 mb-3">
              <div class="w-9 h-9 rounded-lg bg-teal-700 flex items-center justify-center shrink-0">
                <Landmark class="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <h2 class="text-sm font-semibold text-white">A Regional Disaster-Preparedness Initiative</h2>
                <p class="text-xs text-slate-400">BhooSuraksha</p>
              </div>
            </div>

            <p class="text-xs text-slate-300 leading-relaxed mb-4">
              Built as a student initiative to demonstrate landslide early-warning
              monitoring for India's North Eastern Region and neighboring
              hill districts, combining open disaster-event data with a live
              risk dashboard.
            </p>

            <div class="border-t border-slate-800 pt-3">
              <span class="text-xs font-semibold text-slate-400 block mb-2">Project Team</span>
              <ul class="grid grid-cols-2 gap-1.5 text-xs text-slate-300">
                {TEAM.map((name) => (
                  <li key={name} class="bg-slate-900 rounded-lg px-2.5 py-1.5">{name}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
