/**
 * Citizen SMS & WhatsApp Early Warning Alerts Configuration
 * Enables residents to subscribe to localized geofence alerts
 */

import React, { useState } from 'react';
import { NerState } from '../../types/landslide';
import { 
  Bell, 
  Smartphone, 
  CheckCircle2, 
  Send, 
  ShieldCheck, 
  MessageSquare, 
  Radio, 
  Info,
  Sparkles,
  Volume2
} from 'lucide-react';

interface SmsAlertsSubscribeProps {
  defaultState?: NerState;
  defaultDistrict?: string;
  onTriggerTestNotification?: (message: string) => void;
}

export const SmsAlertsSubscribe: React.FC<SmsAlertsSubscribeProps> = ({
  defaultState = 'Sikkim',
  defaultDistrict = 'Pakyong',
  onTriggerTestNotification
}) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [state, setState] = useState<NerState>(defaultState);
  const [district, setDistrict] = useState(defaultDistrict);
  const [channel, setChannel] = useState<'SMS' | 'WHATSAPP' | 'VOICE'>('SMS');
  const [isRegistered, setIsRegistered] = useState(false);
  const [simulatedReceivedAlert, setSimulatedReceivedAlert] = useState<string | null>(null);

  const nerStates: NerState[] = [
    'Arunachal Pradesh',
    'Assam',
    'Meghalaya',
    'Manipur',
    'Mizoram',
    'Nagaland',
    'Tripura',
    'Sikkim'
  ];

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber || phoneNumber.length < 10) return;
    setIsRegistered(true);
  };

  const handleSimulateBroadcast = () => {
    const sampleAlert = `🚨 [EMERGENCY CITIZEN WARNING - SDMA / NER LANDSLIDEGUARD]\nLocation: ${district}, ${state}\nSeverity: HIGH RISK (Automated Geofence >= 70%)\nNotice: Cumulative 24h rainfall has reached critical saturation. Avoid highway cut-slopes and stay alert for rumbling sounds. In emergency dial 1070 or 112.`;
    
    setSimulatedReceivedAlert(sampleAlert);

    if (onTriggerTestNotification) {
      onTriggerTestNotification(`Simulated early warning dispatched to ${phoneNumber || '+91-XXXXX-XXXXX'}`);
    }
  };

  return (
    <div class="space-y-6">
      {/* Header */}
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider mb-1">
            <Smartphone class="w-4 h-4" />
            FREE CITIZEN EARLY WARNING DISPATCH
          </div>
          <h2 class="text-xl font-bold text-white">
            Register for Instant Landslide Danger Broadcasts
          </h2>
          <p class="text-xs sm:text-sm text-slate-400 max-w-2xl mt-1">
            Receive automated SMS, WhatsApp, and voice call alerts directly on your phone whenever rainfall or predicted slope risk exceeds safety thresholds in your area.
          </p>
        </div>

        <div class="px-3 py-1.5 rounded-xl bg-cyan-950/60 border border-cyan-800 text-cyan-300 text-xs font-mono">
          <span>Common Alerting Protocol (CAP) Enabled</span>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Subscription Form (7 cols) */}
        <div class="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
          <h3 class="text-base font-bold text-white flex items-center gap-2">
            <Bell class="w-4 h-4 text-cyan-400" />
            <span>Alert Preferences for Your Household</span>
          </h3>

          {isRegistered ? (
            <div class="p-5 rounded-2xl bg-emerald-950/80 border border-emerald-600 space-y-3">
              <div class="flex items-center gap-2 text-emerald-300 font-bold text-sm">
                <CheckCircle2 class="w-5 h-5 text-emerald-400" />
                <span>Subscription Active & Verified!</span>
              </div>
              <p class="text-xs text-slate-300 leading-relaxed">
                Your number <strong class="text-white font-mono">{phoneNumber}</strong> will receive prioritized early warning alerts for <strong class="text-white">{district}, {state}</strong> whenever risk probability exceeds 70%.
              </p>
              <div class="pt-2 flex items-center gap-3">
                <button
                  onClick={handleSimulateBroadcast}
                  class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow cursor-pointer"
                >
                  <Send class="w-3.5 h-3.5" />
                  <span>Test Sample Phone Alert Now</span>
                </button>
                <button
                  onClick={() => setIsRegistered(false)}
                  class="text-xs text-slate-400 hover:text-white underline cursor-pointer"
                >
                  Edit Settings
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubscribe} class="space-y-4 text-xs">
              <div>
                <label class="font-semibold text-slate-300 block mb-1">
                  Your Mobile Number *
                </label>
                <div class="flex items-center gap-2">
                  <span class="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-400 font-mono">
                    +91
                  </span>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="98765 43210"
                    maxLength={10}
                    class="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                    required
                  />
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="font-semibold text-slate-300 block mb-1">State *</label>
                  <select
                    value={state}
                    onChange={(e) => setState(e.target.value as NerState)}
                    class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    {nerStates.map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label class="font-semibold text-slate-300 block mb-1">District / Town *</label>
                  <input
                    type="text"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="e.g. Pakyong, Papum Pare, Aizawl"
                    class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label class="font-semibold text-slate-300 block mb-1">Preferred Channel *</label>
                <div class="grid grid-cols-3 gap-2">
                  {[
                    { id: 'SMS', label: 'Direct SMS', icon: <MessageSquare class="w-3.5 h-3.5" /> },
                    { id: 'WHATSAPP', label: 'WhatsApp', icon: <Smartphone class="w-3.5 h-3.5" /> },
                    { id: 'VOICE', label: 'Voice IVR Call', icon: <Volume2 class="w-3.5 h-3.5" /> }
                  ].map((ch) => (
                    <button
                      type="button"
                      key={ch.id}
                      onClick={() => setChannel(ch.id as any)}
                      class={`p-2.5 rounded-xl border flex items-center justify-center gap-2 transition cursor-pointer ${
                        channel === ch.id
                          ? 'bg-cyan-950/80 border-cyan-500 text-white font-bold'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {ch.icon}
                      <span>{ch.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div class="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-400 space-y-1">
                <div class="flex items-center gap-1.5 text-cyan-400 font-semibold">
                  <ShieldCheck class="w-3.5 h-3.5" />
                  <span>Privacy & Zero Spam Guarantee:</span>
                </div>
                <p>
                  Your phone number is strictly restricted to emergency safety dispatches triggered by automated geological models or official district orders.
                </p>
              </div>

              <button
                type="submit"
                class="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Bell class="w-4 h-4" />
                <span>Activate Free Early Warning Alert Subscription</span>
              </button>
            </form>
          )}
        </div>

        {/* Right Column: Simulated Phone Screen Preview (5 cols) */}
        <div class="lg:col-span-5 flex flex-col justify-center items-center">
          <div class="w-full max-w-sm rounded-[32px] border-4 border-slate-700 bg-slate-950 p-4 shadow-2xl relative overflow-hidden">
            {/* Phone speaker notch */}
            <div class="w-24 h-4 bg-slate-800 rounded-full mx-auto mb-4"></div>

            <div class="text-center pb-3 border-b border-slate-800">
              <span class="text-xs font-mono text-slate-400">EMERGENCY BROADCAST SIMULATOR</span>
              <h4 class="text-xs font-bold text-white mt-0.5">Mobile Notification Feed</h4>
            </div>

            <div class="py-4 space-y-3 min-h-[260px] flex flex-col justify-center">
              {simulatedReceivedAlert ? (
                <div class="p-3.5 rounded-2xl bg-red-950/90 border border-red-500 text-slate-100 space-y-2 text-xs shadow-xl animate-bounce">
                  <div class="flex items-center justify-between">
                    <span class="font-bold text-red-300 flex items-center gap-1">
                      <Radio class="w-3.5 h-3.5 animate-pulse" />
                      EMERGENCY ALERT
                    </span>
                    <span class="text-xs text-slate-400 font-mono">Just Now</span>
                  </div>
                  <pre class="whitespace-pre-wrap font-sans text-xs leading-relaxed text-slate-200">
                    {simulatedReceivedAlert}
                  </pre>
                  <div class="pt-1 border-t border-red-900/60 flex items-center justify-between text-xs text-red-300">
                    <span>CAP Broadcast ID: #NER-7049</span>
                    <button
                      onClick={() => setSimulatedReceivedAlert(null)}
                      class="text-white hover:underline cursor-pointer"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ) : (
                <div class="text-center p-6 text-slate-500 space-y-2">
                  <Smartphone class="w-10 h-10 mx-auto text-slate-600" />
                  <p class="text-xs">
                    Click <strong>"Test Sample Phone Alert"</strong> above to preview the automated emergency alert format sent to residents.
                  </p>
                </div>
              )}
            </div>

            <div class="w-28 h-1 bg-slate-700 rounded-full mx-auto mt-2"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
