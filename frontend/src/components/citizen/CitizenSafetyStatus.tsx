/**
 * Citizen Safety Status & Local Danger Radar
 * Informs residents and travelers if they are within or near an active landslide danger zone
 */

import React, { useState } from 'react';
import { MonitoredLocation, NerState } from '../../types/landslide';
import { 
  ShieldCheck, 
  AlertTriangle, 
  ShieldAlert, 
  MapPin, 
  CloudRain, 
  Droplets, 
  Compass, 
  PhoneCall, 
  Volume2, 
  VolumeX, 
  Navigation, 
  Clock, 
  Info,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

interface CitizenSafetyStatusProps {
  locations: MonitoredLocation[];
  selectedDistrict: string;
  selectedState: NerState;
  onSelectDistrict: (district: string, state: NerState) => void;
  onNavigateToTab: (tab: any) => void;
}

export const CitizenSafetyStatus: React.FC<CitizenSafetyStatusProps> = ({
  locations,
  selectedDistrict,
  selectedState,
  onSelectDistrict,
  onNavigateToTab
}) => {
  const [isPlayingSiren, setIsPlayingSiren] = useState(false);

  // Find monitoring locations for the selected district or state
  const districtLocations = locations.filter(
    l => l.district.toLowerCase() === selectedDistrict.toLowerCase() || l.state === selectedState
  );
  
  // Highest risk location in user's zone
  const highestRiskZone = districtLocations.length > 0 
    ? districtLocations.reduce((max, curr) => curr.risk_probability > max.risk_probability ? curr : max, districtLocations[0])
    : locations[0];

  const riskProb = highestRiskZone ? highestRiskZone.risk_probability : 0.25;
  const isCritical = riskProb >= 0.85;
  const isHigh = riskProb >= 0.70 && riskProb < 0.85;
  const isModerate = riskProb >= 0.50 && riskProb < 0.70;
  const isSafe = riskProb < 0.50;

  // Simulate audio siren using Web Audio API (gentle high-low warning sweep)
  const toggleAudioWarning = () => {
    if (isPlayingSiren) {
      setIsPlayingSiren(false);
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.4);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.8);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 1.2);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 1.6);

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 2.0);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      setIsPlayingSiren(true);
      osc.stop(ctx.currentTime + 2.0);

      setTimeout(() => {
        setIsPlayingSiren(false);
      }, 2100);
    } catch (e) {
      console.warn('Audio alert unavailable in container environment', e);
      setIsPlayingSiren(false);
    }
  };

  // Popular towns in NER to test quick location switching
  const popularTowns: { name: string; district: string; state: NerState }[] = [
    { name: 'Itanagar / Papum Pare', district: 'Papum Pare', state: 'Arunachal Pradesh' },
    { name: 'Gangtok & Pakyong', district: 'Pakyong', state: 'Sikkim' },
    { name: 'Shillong / Umiam', district: 'East Khasi Hills', state: 'Meghalaya' },
    { name: 'Aizawl North', district: 'Aizawl', state: 'Mizoram' },
    { name: 'Kohima / Dzükou', district: 'Kohima', state: 'Nagaland' },
    { name: 'Imphal Valley & Hills', district: 'Imphal West', state: 'Manipur' },
    { name: 'Guwahati Outskirts', district: 'Kamrup Metropolitan', state: 'Assam' }
  ];

  return (
    <div class="space-y-6">
      {/* 1. Quick Location Picker Strip */}
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <div class="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <MapPin class="w-5 h-5" />
          </div>
          <div>
            <span class="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
              YOUR MONITORED LOCATION
            </span>
            <h2 class="text-lg font-extrabold text-white flex items-center gap-2">
              {selectedDistrict}, {selectedState}
              <span class="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono font-normal">
                Active Station Nearby
              </span>
            </h2>
          </div>
        </div>

        {/* Quick Town Pills */}
        <div class="flex items-center gap-2 flex-wrap">
          <span class="text-xs text-slate-400 font-medium">Switch Location:</span>
          {popularTowns.slice(0, 4).map((town) => {
            const isCurr = town.district === selectedDistrict && town.state === selectedState;
            return (
              <button
                key={town.name}
                onClick={() => onSelectDistrict(town.district, town.state)}
                class={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  isCurr
                    ? 'bg-teal-700 text-white'
                    : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700'
                }`}
              >
                {town.name.split('/')[0]}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Main Safety Status Hero Card */}
      <div className={`relative overflow-hidden rounded-3xl border p-6 sm:p-8 shadow-2xl transition-all ${
        isCritical
          ? 'bg-red-950/90 border-red-600/80'
          : isHigh
          ? 'bg-amber-950/80 border-amber-500/70'
          : isModerate
          ? 'bg-sky-950/80 border-sky-500/60'
          : 'bg-emerald-950/80 border-emerald-500/60'
      }`}>
        {/* Background decorative watermark */}
        <div class="absolute -right-8 -bottom-8 opacity-10 pointer-events-none">
          {isCritical || isHigh ? (
            <AlertTriangle class="w-72 h-72 text-red-400" />
          ) : (
            <ShieldCheck class="w-72 h-72 text-emerald-400" />
          )}
        </div>

        <div class="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div class="space-y-3 max-w-2xl">
            {/* Status Badge */}
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider border">
              {isCritical ? (
                <span class="flex items-center gap-1.5 text-red-300 bg-red-950/90 border-red-500/60 px-3 py-1 rounded-full">
                  <span class="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                  CRITICAL DANGER: ACTIVE GEOFENCE WARNING
                </span>
              ) : isHigh ? (
                <span class="flex items-center gap-1.5 text-amber-300 bg-amber-950/90 border-amber-500/60 px-3 py-1 rounded-full">
                  <AlertTriangle class="w-3.5 h-3.5 text-amber-400" />
                  HIGH HAZARD WATCH: HEAVY RAIN THREAT
                </span>
              ) : isModerate ? (
                <span class="flex items-center gap-1.5 text-sky-300 bg-sky-950/90 border-sky-500/60 px-3 py-1 rounded-full">
                  <Info class="w-3.5 h-3.5 text-sky-400" />
                  MODERATE ADVISORY: PERSISTENT DRIZZLE
                </span>
              ) : (
                <span class="flex items-center gap-1.5 text-emerald-300 bg-emerald-950/90 border-emerald-500/60 px-3 py-1 rounded-full">
                  <ShieldCheck class="w-3.5 h-3.5 text-emerald-400" />
                  SAFE STATUS: LOW RISK DETECTED
                </span>
              )}
            </div>

            <h1 class="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
              {isCritical
                ? 'Imminent Landslide Risk in Your Sector – Evacuate Vulnerable Slopes'
                : isHigh
                ? 'Heightened Slope Saturation – Avoid Hill Roads & Cut Slopes'
                : isModerate
                ? 'Moderate Slope Movement Vulnerability – Stay Vigilant'
                : 'Current Sector Conditions Are Stable – No Immediate Threat'}
            </h1>

            <p class="text-sm sm:text-base text-slate-300 leading-relaxed">
              {isCritical
                ? `Automated disaster algorithms indicate an ${Math.round(riskProb * 100)}% slope failure probability near ${highestRiskZone?.name || selectedDistrict}. Geofence danger perimeter is active. Residents in non-reinforced structures should proceed toward designated community shelters.`
                : isHigh
                ? `Heavy localized rainfall (${highestRiskZone?.parameters.rainfall_24h || 140}mm in past 24h) has elevated soil moisture to ${highestRiskZone?.parameters.soil_moisture || 80}%. High probability of debris rolls, roadside rockfall, and localized mudslides.`
                : isModerate
                ? `Intermittent precipitation recorded. Slopes exhibit moderate moisture retention. Maintain standard caution if traveling along mountain passes or river ravines.`
                : `Environmental sensors report normal pore pressures and minimal rainfall accumulation in ${selectedDistrict}. All arterial corridors are operating normally.`}
            </p>

            {/* Live Environmental Badges */}
            {highestRiskZone && (
              <div class="flex flex-wrap items-center gap-3 pt-2">
                <div class="px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-2 text-xs">
                  <CloudRain class="w-4 h-4 text-cyan-400" />
                  <span class="text-slate-400 font-mono">24h Rainfall:</span>
                  <span class="font-mono font-bold text-white">{highestRiskZone.parameters.rainfall_24h} mm</span>
                </div>
                <div class="px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-2 text-xs">
                  <Droplets class="w-4 h-4 text-sky-400" />
                  <span class="text-slate-400 font-mono">Soil Moisture:</span>
                  <span class="font-mono font-bold text-white">{highestRiskZone.parameters.soil_moisture}%</span>
                </div>
                <div class="px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-2 text-xs">
                  <Compass class="w-4 h-4 text-amber-400" />
                  <span class="text-slate-400 font-mono">Slope Angle:</span>
                  <span class="font-mono font-bold text-white">{highestRiskZone.parameters.slope}°</span>
                </div>
                <div class="px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-2 text-xs">
                  <Navigation class="w-4 h-4 text-rose-400" />
                  <span class="text-slate-400 font-mono">Geofence Radius:</span>
                  <span class="font-mono font-bold text-white">{highestRiskZone.geofence_radius_km || 3.5} km</span>
                </div>
              </div>
            )}
          </div>

          {/* Action Hub (Right Column) */}
          <div class="flex flex-col gap-3 w-full md:w-64 shrink-0">
            {/* Siren / Warning Sound Test */}
            <button
              onClick={toggleAudioWarning}
              class={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition border shadow-lg cursor-pointer ${
                isPlayingSiren
                  ? 'bg-red-600 text-white border-red-400 animate-pulse'
                  : 'bg-slate-900/90 hover:bg-slate-800 text-slate-200 border-slate-700'
              }`}
            >
              {isPlayingSiren ? <VolumeX class="w-4 h-4" /> : <Volume2 class="w-4 h-4 text-amber-400" />}
              <span>{isPlayingSiren ? 'Emergency Siren Active...' : 'Play Audio Warning Siren'}</span>
            </button>

            {/* Find Nearest Shelter Button */}
            <button
              onClick={() => onNavigateToTab('shelters')}
              class="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-between transition shadow-lg cursor-pointer"
            >
              <span>Nearest Relief Shelter</span>
              <ChevronRight class="w-4 h-4" />
            </button>

            {/* Check Highway Routes */}
            <button
              onClick={() => onNavigateToTab('routes')}
              class="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-between border border-slate-700 transition cursor-pointer"
            >
              <span>Check Highway Road Status</span>
              <ChevronRight class="w-4 h-4" />
            </button>

            {/* Report Hazard on Ground */}
            <button
              onClick={() => onNavigateToTab('report-hazard')}
              class="w-full py-3 px-4 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 font-bold text-xs flex items-center justify-between transition cursor-pointer"
            >
              <span>Report Crack or Rockfall</span>
              <ChevronRight class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Three Essential Citizen Action Pillars */}
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: What to do right now */}
        <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div class="flex items-center gap-2 text-rose-400 font-bold text-sm">
            <ShieldAlert class="w-4 h-4" />
            <h3>Action Advisory For You</h3>
          </div>
          <p class="text-xs text-slate-300 leading-relaxed">
            {isCritical
              ? 'Stay awake and tuned to emergency broadcasts. Keep footwear, torches, phone charger, and emergency water bottle next to your bed or exit door.'
              : isHigh
              ? 'Do not walk along steep roadside slopes or under fresh highway cuts. If driving, avoid stopping underneath loose shale cliffs.'
              : 'Keep emergency contact numbers saved offline. Report any new surface cracks or tilting poles to the community dashboard.'}
          </p>
          <button
            onClick={() => onNavigateToTab('guidelines')}
            class="text-xs font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
          >
            Full Emergency Survival Protocol →
          </button>
        </div>

        {/* Card 2: 1-Tap Emergency SOS */}
        <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div class="flex items-center gap-2 text-amber-400 font-bold text-sm">
            <PhoneCall class="w-4 h-4" />
            <h3>Official Emergency Helplines</h3>
          </div>
          <div class="space-y-1.5 text-xs">
            <div class="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800">
              <span class="text-slate-300">National Disaster (NDMA)</span>
              <a href="tel:1078" class="font-mono font-bold text-cyan-400 hover:underline">1078 (Toll Free)</a>
            </div>
            <div class="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800">
              <span class="text-slate-300">State Disaster (SDRF)</span>
              <a href="tel:1070" class="font-mono font-bold text-emerald-400 hover:underline">1070</a>
            </div>
            <div class="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800">
              <span class="text-slate-300">Emergency Police / Rescue</span>
              <a href="tel:112" class="font-mono font-bold text-rose-400 hover:underline">112</a>
            </div>
          </div>
        </div>

        {/* Card 3: Free Citizen SMS Broadcasts */}
        <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div class="flex items-center gap-2 text-cyan-400 font-bold text-sm">
            <Clock class="w-4 h-4" />
            <h3>Early Warning Alerts On Mobile</h3>
          </div>
          <p class="text-xs text-slate-300 leading-relaxed">
            Register your district to receive automated SMS and WhatsApp warnings when rainfall crosses danger thresholds in your sector.
          </p>
          <button
            onClick={() => onNavigateToTab('sms-alerts')}
            class="w-full py-2 px-3 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Configure Free SMS Alerts</span>
            <ChevronRight class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
