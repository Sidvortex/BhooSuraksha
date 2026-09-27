import React, { useState } from 'react';
import { Info, X, Landmark } from 'lucide-react';
import { TEAM } from '../data/team';
import { TeamMemberLinks } from './TeamMemberLinks';

export const AboutCredits: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        id="btn-about-credits"
        onClick={() => setIsOpen(true)}
        class="fixed bottom-5 left-5 z-[2000] w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-slate-50 flex items-center justify-center shadow-lg transition cursor-pointer"
        title="About this project"
      >
        <Info class="w-4 h-4" />
      </button>

      {isOpen && (
        <div class="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 px-4" onClick={() => setIsOpen(false)}>
          <div class="w-full max-w-md bg-slate-950 border border-slate-800 rounded-2xl p-5 relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setIsOpen(false)}
              class="absolute top-3 right-3 p-1.5 rounded-lg text-slate-400 hover:text-slate-50 hover:bg-slate-800 transition cursor-pointer"
            >
              <X class="w-4 h-4" />
            </button>

            <div class="flex items-center gap-2.5 mb-3">
              <div class="w-9 h-9 rounded-lg bg-teal-700 flex items-center justify-center shrink-0">
                <Landmark class="w-4 h-4 text-slate-50" />
              </div>
              <div>
                <h2 class="text-sm font-semibold text-slate-50">A Regional Disaster-Preparedness Initiative</h2>
                <p class="text-xs text-slate-400">BhooSuraksha</p>
              </div>
            </div>

            <p class="text-xs text-slate-300 leading-relaxed mb-4">
              Built by a six-member B.Tech CSE (Data Science) student team as a landslide early-warning system for India's North Eastern Region and
              neighbouring hill districts, combining open disaster-event data with a live risk dashboard.
            </p>

            <div class="border-t border-slate-800 pt-3">
              <span class="text-xs font-semibold text-slate-400 block mb-2">Project Team</span>
              <ul class="space-y-1.5">
                {TEAM.map((m) => (
                  <li key={m.name} class="bg-slate-900 rounded-lg px-3 py-2 flex items-center justify-between gap-3">
                    <div class="min-w-0">
                      <span class="text-xs text-slate-200 font-medium block">
                        {m.name}
                        {m.role === 'Project Lead' && (
                          <span class="ml-1.5 px-1.5 py-0.5 rounded bg-teal-900/60 text-teal-300 text-[11px]">Lead</span>
                        )}
                      </span>
                      <span class="text-xs text-slate-500 block truncate">{m.focus}</span>
                    </div>
                    <TeamMemberLinks member={m} />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
