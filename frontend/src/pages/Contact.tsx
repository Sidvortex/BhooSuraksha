import React from 'react';
import { Link } from 'react-router-dom';
import { GovNav } from '../components/GovNav';
import { EMERGENCY_HELPLINES } from '../data/citizenData';
import { PhoneCall, Mail, Github, Linkedin } from 'lucide-react';

/** Placeholder team contact links — replace with your real ones. */
const TEAM_CONTACTS = [
  { name: 'Member 1', email: 'member1@example.com', github: '', linkedin: '' },
  { name: 'Member 2', email: 'member2@example.com', github: '', linkedin: '' },
  { name: 'Member 3', email: 'member3@example.com', github: '', linkedin: '' },
  { name: 'Member 4', email: 'member4@example.com', github: '', linkedin: '' },
  { name: 'Member 5', email: 'member5@example.com', github: '', linkedin: '' },
  { name: 'Member 6', email: 'member6@example.com', github: '', linkedin: '' },
];

export const Contact: React.FC = () => {
  return (
    <div class="min-h-screen bg-slate-900 text-slate-100">
      <GovNav />
      <main id="main-content" class="max-w-2xl mx-auto p-5 sm:p-8 space-y-6">
        <div>
          <h1 class="text-lg font-semibold text-white mb-1">Contact Us</h1>
          <p class="text-sm text-slate-400">
            For an active landslide emergency, use the helplines below — they reach real
            responders. For anything about the project itself (bugs, data, collaboration),
            reach the team directly or use the <Link to="/feedback" class="text-teal-400 hover:underline">Feedback</Link> form.
          </p>
        </div>

        <section class="bg-slate-950/60 border border-slate-800 rounded-xl p-5">
          <h2 class="text-sm font-medium text-white flex items-center gap-2 mb-3">
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
                <span class="text-white font-mono font-medium">{hl.number}</span>
              </a>
            ))}
          </div>
        </section>

        <section class="bg-slate-950/60 border border-slate-800 rounded-xl p-5">
          <h2 class="text-sm font-medium text-white mb-1">Project Team</h2>
          <p class="text-xs text-slate-500 mb-3">
            Placeholder contact details — the project owner should replace these with the real team's info.
          </p>
          <div class="grid sm:grid-cols-2 gap-2">
            {TEAM_CONTACTS.map((m) => (
              <div key={m.name} class="bg-slate-900 rounded-lg px-3 py-2.5 text-xs">
                <span class="text-slate-200 font-medium block mb-1">{m.name}</span>
                <div class="flex items-center gap-3 text-slate-500">
                  <a href={`mailto:${m.email}`} class="hover:text-slate-300 flex items-center gap-1">
                    <Mail class="w-3 h-3" /> Email
                  </a>
                  <span class="flex items-center gap-1 opacity-50"><Github class="w-3 h-3" /> GitHub</span>
                  <span class="flex items-center gap-1 opacity-50"><Linkedin class="w-3 h-3" /> LinkedIn</span>
                </div>
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
