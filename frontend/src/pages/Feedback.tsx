import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { GovNav } from '../components/GovNav';
import { PageBanner } from '../components/gov/PageBanner';
import { Send, CheckCircle2 } from 'lucide-react';
import { getBackendUrl } from '../utils/backendUrl';
import { waitForServer } from '../utils/serverWake';

const CATEGORIES = ['Bug report', 'Feature suggestion', 'Data accuracy concern', 'General feedback'];

export const Feedback: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const backendUrl = getBackendUrl();
    if (!backendUrl) {
      setStatus('error');
      setErrorMsg('No backend URL configured. Set one on the Login page or in Settings.');
      return;
    }
    setStatus('sending');
    try {
      await waitForServer(); // free hosting may be asleep: wait for the wake-up ping
      const res = await fetch(`${backendUrl}/api/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name || undefined, email: email || undefined, category, message }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.detail || `Request failed (${res.status})`);
      }
      setStatus('done');
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Failed to submit feedback');
    }
  };

  return (
    <div class="flex-1 bg-gov-page text-slate-100">
      <GovNav />
      <PageBanner title="Feedback" crumbs={[{ label: 'Feedback' }]} />
      <main id="main-content" class="max-w-xl mx-auto p-5 sm:p-8">
        <p class="text-sm text-slate-400 mb-5">
          Found a bug, have a suggestion, or spotted something inaccurate? Tell us — this goes
          straight to a real database the project team reviews, not a black hole.
        </p>

        {status === 'done' ? (
          <div class="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-start gap-3">
            <CheckCircle2 class="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div class="text-sm text-slate-300">
              <span class="text-slate-50 font-medium block mb-1">Thanks — received.</span>
              We don't have a way to reply unless you left an email.
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} class="bg-slate-950/60 border border-slate-800 rounded-xl p-5 space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="text-xs font-semibold text-slate-300 block mb-1">Name (optional)</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  class="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg p-2.5 outline-none focus:border-teal-600"
                />
              </div>
              <div>
                <label class="text-xs font-semibold text-slate-300 block mb-1">Email (optional)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  class="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg p-2.5 outline-none focus:border-teal-600"
                />
              </div>
            </div>

            <div>
              <label class="text-xs font-semibold text-slate-300 block mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                class="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg p-2.5 outline-none cursor-pointer"
              >
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label class="text-xs font-semibold text-slate-300 block mb-1">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={5}
                class="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg p-2.5 outline-none focus:border-teal-600 resize-none"
              />
            </div>

            {status === 'error' && (
              <div class="text-xs text-red-300 bg-red-950/40 border border-red-900 rounded-lg p-2.5">{errorMsg}</div>
            )}

            <button
              type="submit"
              disabled={status === 'sending'}
              class="w-full flex items-center justify-center gap-2 py-2.5 bg-teal-700 hover:bg-teal-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition cursor-pointer"
            >
              <Send class="w-4 h-4" />
              {status === 'sending' ? 'Sending...' : 'Submit feedback'}
            </button>
            <p class="text-xs text-slate-500 text-center">Limited to 5 submissions per hour to prevent spam.</p>
          </form>
        )}

        <Link to="/" class="block text-center text-xs text-slate-400 hover:text-slate-200 mt-5">
          &larr; Back to home
        </Link>
      </main>
    </div>
  );
};
