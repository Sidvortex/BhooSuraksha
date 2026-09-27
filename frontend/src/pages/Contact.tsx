import React from 'react';
import { Link } from 'react-router-dom';
import { GovNav } from '../components/GovNav';
import { PageBanner } from '../components/gov/PageBanner';
import { EMERGENCY_HELPLINES } from '../data/citizenData';
import { PhoneCall } from 'lucide-react';
import { TEAM } from '../data/team';
import { TeamMemberLinks } from '../components/TeamMemberLinks';



export const Contact: React.FC = () => {
  return (
    <div class="flex-1 bg-gov-page text-slate-100">
      <GovNav />
      <PageBanner title="Contact Us & Emergency Helplines" crumbs={[{ label: 'Contact Us' }]} />
      <main id="main-content" class="max-w-2xl mx-auto p-5 sm:p-8 space-y-6">
        <div>
          <p class="text-sm text-slate-400">
            For an active landslide emergency, use the helplines below — they reach real
            responders. For anything about the project itself (bugs, data, collaboration),
            reach the team directly or use the <Link to="/feedback" class="text-teal-400 hover:underline">Feedback</Link> form.
          </p>
        </div>

        <section class="bg-slate-950/60 border border-slate-800 rounded-xl p-5">
          <h2 class="text-sm font-medium text-slate-50 flex items-center gap-2 mb-3">
            <PhoneCall class="w-4 h-4 text-red-400" />
            Emergency Helplines
          </h2>
          <div class="grid sm:grid-cols-2 gap-2">
            {EMERGENCY_HELPLINES.map((hl) => (
              <a
                key={hl.service}
                href={`tel:${hl.number}`}
                class="flex items-center justify-between bg-slate-900 rounded-lg px-3 py-2 text-xs hover:bg-slate-800 transition"
              >
                <div>
                  <span class="text-slate-200 block">{hl.service}</span>
                  <span class="text-slate-500">{hl.description}</span>
                </div>
                <span class="text-slate-50 font-mono font-medium">{hl.number}</span>
              </a>
            ))}
          </div>
        </section>

        <section class="bg-slate-950/60 border border-slate-800 rounded-xl p-5">
          <h2 class="text-sm font-medium text-slate-50 mb-1">Project Team</h2>
          <p class="text-xs text-slate-500 mb-3">
            Reach the team directly for bugs, data questions, or collaboration.
          </p>
          <div class="grid sm:grid-cols-2 gap-2">
            {TEAM.map((m) => (
              <div key={m.name} class="bg-slate-900 rounded-lg px-3 py-2.5 text-xs">
                <span class="text-slate-200 font-medium block">
                  {m.name}{m.role === 'Project Lead' ? ' · Project Lead' : ''}
                </span>
                <span class="text-slate-500 block mb-1.5">{m.focus}</span>
                <TeamMemberLinks member={m} />
              </div>
            ))}
          </div>
        </section>

        <Link to="/" class="block text-center text-xs text-slate-400 hover:text-slate-200">
          &larr; Back to home
        </Link>
      </main>
    </div>
  );
};
