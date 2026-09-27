/**
 * Compact "Subscribe for Alerts" section — embedded within the Safety
 * Status page rather than being its own destination. Previously this was
 * a large standalone panel with fake "Common Alerting Protocol enabled"
 * claims and a simulated test-broadcast button; this is the honest,
 * right-sized version: a phone number, a district, a subscribe button.
 *
 * Not wired to a live SMS provider yet — see backend/alerts_dispatch.py
 * and SETUP.md for what's needed to make this send real messages.
 */
import React, { useState } from 'react';
import { NerState } from '../../types/landslide';
import { BellRing, CheckCircle2 } from 'lucide-react';

interface SubscribeForAlertsProps {
  defaultState?: NerState;
  defaultDistrict?: string;
}

const NER_STATES: NerState[] = [
  'Arunachal Pradesh', 'Assam', 'Meghalaya', 'Manipur',
  'Mizoram', 'Nagaland', 'Tripura', 'Sikkim'
];

export const SubscribeForAlerts: React.FC<SubscribeForAlertsProps> = ({
  defaultState = 'Sikkim',
  defaultDistrict = ''
}) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [state, setState] = useState<NerState>(defaultState);
  const [district, setDistrict] = useState(defaultDistrict);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneNumber.trim().length < 10) return;
    setIsSubscribed(true);
  };

  if (isSubscribed) {
    return (
      <div class="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-start gap-3">
        <CheckCircle2 class="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div class="text-xs text-slate-300">
          <span class="text-slate-50 font-medium block mb-0.5">You're on the list</span>
          {phoneNumber} will be notified for {district ? `${district}, ` : ''}{state} once alert
          delivery is connected (see the note below).
        </div>
      </div>
    );
  }

  return (
    <div class="bg-slate-900 border border-slate-800 rounded-xl p-4">
      <h3 class="text-sm font-medium text-slate-50 flex items-center gap-2 mb-1">
        <BellRing class="w-4 h-4 text-teal-400" />
        Subscribe for Alerts
      </h3>
      <p class="text-xs text-slate-400 mb-3">
        Get notified if risk rises sharply in your district. Free, no account needed.
      </p>

      <form onSubmit={handleSubscribe} class="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <input
          id="subscribe-phone"
          type="tel"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder="Phone number"
          required
          class="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg p-2.5 outline-none focus:border-teal-600 sm:col-span-1"
        />
        <select
          value={state}
          onChange={(e) => setState(e.target.value as NerState)}
          class="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg p-2.5 outline-none cursor-pointer"
        >
          {NER_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <input
          type="text"
          value={district}
          onChange={(e) => setDistrict(e.target.value)}
          placeholder="District (optional)"
          class="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg p-2.5 outline-none focus:border-teal-600"
        />
        <button
          type="submit"
          class="sm:col-span-3 py-2 bg-teal-700 hover:bg-teal-600 text-white text-xs font-medium rounded-lg transition cursor-pointer"
        >
          Subscribe
        </button>
      </form>

      <p class="text-xs text-slate-500 mt-2.5">
        Not yet connected to a live SMS provider — this saves your preference in the demo.
        Real delivery needs an SMS/push integration (see the project's SETUP guide).
      </p>
    </div>
  );
};
