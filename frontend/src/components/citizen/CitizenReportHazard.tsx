/**
 * Citizen Crowdsourced Hazard Reporter
 * Enables residents & travelers to report cracks, rockfall, springs, or road blocks
 */

import React, { useState } from 'react';
import { 
  CitizenIncidentReport, 
  CitizenHazardType, 
  NerState 
} from '../../types/landslide';
import { 
  AlertTriangle, 
  Send, 
  Camera, 
  MapPin, 
  CheckCircle, 
  ThumbsUp, 
  Clock, 
  ShieldCheck, 
  Activity, 
  Flame, 
  Droplet, 
  TreePine, 
  Car 
} from 'lucide-react';

interface CitizenReportHazardProps {
  reports: CitizenIncidentReport[];
  onSubmitReport: (newReport: CitizenIncidentReport) => void;
  onUpvoteReport: (reportId: string) => void;
  prefillLocation?: string;
}

export const CitizenReportHazard: React.FC<CitizenReportHazardProps> = ({
  reports,
  onSubmitReport,
  onUpvoteReport,
  prefillLocation
}) => {
  const [reporterName, setReporterName] = useState('');
  const [reporterPhone, setReporterPhone] = useState('');
  const [locationName, setLocationName] = useState(prefillLocation || '');
  const [nearestLandmark, setNearestLandmark] = useState('');
  const [state, setState] = useState<NerState>('Arunachal Pradesh');
  const [district, setDistrict] = useState('Papum Pare');
  const [hazardType, setHazardType] = useState<CitizenHazardType>('GROUND_CRACK');
  const [severity, setSeverity] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('HIGH');
  const [description, setDescription] = useState('');
  const [hasSimulatedPhoto, setHasSimulatedPhoto] = useState(true);
  const [submittedNotice, setSubmittedNotice] = useState(false);

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

  const hazardOptions: { type: CitizenHazardType; label: string; icon: React.ReactNode; desc: string }[] = [
    { type: 'GROUND_CRACK', label: 'Ground Crack / Fissure', icon: <Activity class="w-4 h-4 text-amber-400" />, desc: 'Visible tension cracks opening on slopes or road' },
    { type: 'ROCKFALL', label: 'Falling Stones / Rockfall', icon: <Flame class="w-4 h-4 text-rose-400" />, desc: 'Pebbles or boulders rolling down cut slope' },
    { type: 'MUDDY_SPRING', label: 'Muddy Water Seepage', icon: <Droplet class="w-4 h-4 text-cyan-400" />, desc: 'Sudden brown muddy spring emerging from dry ground' },
    { type: 'TILTING_TREES', label: 'Tilting Trees / Poles', icon: <TreePine class="w-4 h-4 text-emerald-400" />, desc: 'Fences, trees or electric poles leaning downhill' },
    { type: 'ROAD_BLOCKED', label: 'Road / Culvert Blocked', icon: <Car class="w-4 h-4 text-red-400" />, desc: 'Debris or mud blocking vehicle passage' },
    { type: 'SLOPE_COLLAPSE', label: 'Active Slope Failure', icon: <AlertTriangle class="w-4 h-4 text-red-500" />, desc: 'Imminent or active mass soil collapse' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationName.trim() || !description.trim()) return;

    const newReport: CitizenIncidentReport = {
      id: `cit-rep-${Date.now()}`,
      reporterName: reporterName.trim() || 'Anonymous Citizen',
      reporterPhone: reporterPhone.trim() || '+91 Confidential',
      locationName: locationName.trim(),
      district: district.trim() || 'Local District',
      state,
      hazardType,
      severity,
      description: description.trim(),
      nearestLandmark: nearestLandmark.trim() || 'Near local road junction',
      timestamp: 'Just now',
      timeAgo: 'Just now',
      status: 'PENDING_REVIEW',
      photoDescription: hasSimulatedPhoto ? 'Geotagged slope photograph attached (Verified GPS coordinates)' : undefined,
      upvotes: 1
    };

    onSubmitReport(newReport);
    setSubmittedNotice(true);
    setDescription('');
    setLocationName('');
    setNearestLandmark('');

    setTimeout(() => {
      setSubmittedNotice(false);
    }, 6000);
  };

  return (
    <div class="space-y-6">
      {/* Title & Introduction */}
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 text-xs font-mono text-rose-400 font-bold uppercase tracking-wider mb-1">
            <AlertTriangle class="w-4 h-4" />
            COMMUNITY EARLY WARNING NETWORK
          </div>
          <h2 class="text-xl font-bold text-slate-50">
            Report Hillside Cracks, Mudflow, or Slope Movement
          </h2>
          <p class="text-xs sm:text-sm text-slate-400 max-w-2xl mt-1">
            Your on-ground observations directly empower District Disaster Authorities (DDMA), SDRF teams, and neighborhood safety groups to prevent loss of life.
          </p>
        </div>

        <div class="px-3.5 py-2 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs font-mono">
          <span>Active Community Submissions: <strong class="text-slate-50">{reports.length} Reports</strong></span>
        </div>
      </div>

      {submittedNotice && (
        <div class="p-4 rounded-xl bg-emerald-950/90 border border-emerald-600 text-emerald-200 text-xs flex items-center gap-3 shadow-lg animate-fadeIn">
          <CheckCircle class="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <strong class="font-bold">Hazard Report Successfully Registered!</strong>
            <p class="text-slate-300 mt-0.5">
              The report has been dispatched to local disaster management teams and pinned on the regional risk map for verification.
            </p>
          </div>
        </div>
      )}

      {/* Main Grid: Form (Left) + Community Stream (Right) */}
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Reporting Form (7 cols) */}
        <div class="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
          <h3 class="text-base font-bold text-slate-50 flex items-center gap-2">
            <span>Submit New Hazard Observation</span>
            <span class="text-xs font-mono font-normal text-slate-400">Step 1 of 1</span>
          </h3>

          <form onSubmit={handleSubmit} class="space-y-4 text-xs">
            {/* 1. Hazard Type Picker */}
            <div class="space-y-1.5">
              <label class="font-semibold text-slate-300">
                What did you observe on the slope or road? *
              </label>
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {hazardOptions.map((opt) => (
                  <button
                    type="button"
                    key={opt.type}
                    onClick={() => setHazardType(opt.type)}
                    class={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                      hazardType === opt.type
                        ? 'bg-rose-950/80 border-rose-500 text-slate-50 shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div class="flex items-center gap-1.5 font-bold mb-1">
                      {opt.icon}
                      <span class="text-xs truncate">{opt.label}</span>
                    </div>
                    <span class="text-xs text-slate-400 line-clamp-2 leading-tight">
                      {opt.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. State and District */}
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="font-semibold text-slate-300 block mb-1">State *</label>
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value as NerState)}
                  class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-50 focus:outline-none focus:border-rose-500"
                >
                  {nerStates.map(st => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              <div>
                <label class="font-semibold text-slate-300 block mb-1">District / Sub-Division *</label>
                <input
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder="e.g. Papum Pare, Pakyong, East Khasi Hills"
                  class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-50 placeholder-slate-500 focus:outline-none focus:border-rose-500"
                  required
                />
              </div>
            </div>

            {/* 3. Location and Landmark */}
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="font-semibold text-slate-300 block mb-1">Specific Location / Road Sector *</label>
                <input
                  type="text"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="e.g. KM 34 on Highway, Nirjuli Hilltop, Upper Shillong"
                  class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-50 placeholder-slate-500 focus:outline-none focus:border-rose-500"
                  required
                />
              </div>

              <div>
                <label class="font-semibold text-slate-300 block mb-1">Nearest Landmark or Milestone</label>
                <input
                  type="text"
                  value={nearestLandmark}
                  onChange={(e) => setNearestLandmark(e.target.value)}
                  placeholder="e.g. Near petrol pump, culvert #14, church compound"
                  class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-50 placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            {/* 4. Severity Assessment */}
            <div>
              <label class="font-semibold text-slate-300 block mb-1">Severity / Threat Urgency *</label>
              <div class="grid grid-cols-4 gap-2">
                {[
                  { id: 'LOW', label: 'Low (Slow Creep)', color: 'text-emerald-400 border-emerald-800' },
                  { id: 'MEDIUM', label: 'Medium (Widening)', color: 'text-amber-400 border-amber-800' },
                  { id: 'HIGH', label: 'High (Immediate Danger)', color: 'text-orange-400 border-orange-800' },
                  { id: 'CRITICAL', label: 'Critical (Active Failure)', color: 'text-red-400 border-red-800' }
                ].map((s) => (
                  <button
                    type="button"
                    key={s.id}
                    onClick={() => setSeverity(s.id as any)}
                    class={`p-2 rounded-xl border text-center transition cursor-pointer ${
                      severity === s.id
                        ? 'bg-slate-800 text-slate-50 font-bold border-rose-500'
                        : 'bg-slate-950/80 text-slate-400 border-slate-800'
                    }`}
                  >
                    <span class="text-xs block">{s.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 5. Detailed Description */}
            <div>
              <label class="font-semibold text-slate-300 block mb-1">
                Detailed Description (Width of crack, water flow, affected buildings) *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe size of cracks, whether water is bubbling out, whether boulders are falling onto road, any families in immediate downhill path..."
                rows={3}
                class="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-50 placeholder-slate-500 focus:outline-none focus:border-rose-500 leading-relaxed"
                required
              />
            </div>

            {/* 6. Reporter Info & Photo Simulation */}
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label class="font-semibold text-slate-400 block mb-1">Your Name (Optional)</label>
                <input
                  type="text"
                  value={reporterName}
                  onChange={(e) => setReporterName(e.target.value)}
                  placeholder="Leave blank for anonymous report"
                  class="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-50 placeholder-slate-600 focus:outline-none"
                />
              </div>

              <div>
                <label class="font-semibold text-slate-400 block mb-1">Mobile No. (For DDMA confirmation)</label>
                <input
                  type="tel"
                  value={reporterPhone}
                  onChange={(e) => setReporterPhone(e.target.value)}
                  placeholder="+91 98XXX XXXXX"
                  class="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-50 placeholder-slate-600 focus:outline-none"
                />
              </div>
            </div>

            {/* Simulated Photo Checkbox */}
            <div class="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
              <Camera class="w-4 h-4 text-cyan-400" />
              <label class="text-xs text-slate-300 flex-1 cursor-pointer flex items-center justify-between">
                <span>Attach GPS-tagged ground photo</span>
                <input
                  type="checkbox"
                  checked={hasSimulatedPhoto}
                  onChange={(e) => setHasSimulatedPhoto(e.target.checked)}
                  class="rounded bg-slate-800 border-slate-700 text-rose-500 focus:ring-0 cursor-pointer"
                />
              </label>
            </div>

            <button
              type="submit"
              class="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send class="w-4 h-4" />
              <span>Submit Hazard Report to Emergency Network</span>
            </button>
          </form>
        </div>

        {/* Right Column: Live Community Reports Feed (5 cols) */}
        <div class="lg:col-span-5 space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-bold text-slate-50 flex items-center gap-2">
              <ShieldCheck class="w-4 h-4 text-emerald-400" />
              <span>Community Ground Feed</span>
            </h3>
            <span class="text-xs font-mono text-slate-400">
              {reports.length} Verified & Active
            </span>
          </div>

          <div class="space-y-3 max-h-[640px] overflow-y-auto pr-1">
            {reports.map((rep) => (
              <div
                key={rep.id}
                class="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 hover:border-slate-700 transition"
              >
                <div class="flex items-start justify-between gap-2">
                  <div>
                    <div class="flex items-center gap-1.5 text-xs font-mono mb-1">
                      <span class="text-cyan-400 font-bold">{rep.state}</span>
                      <span class="text-slate-600">•</span>
                      <span class="text-slate-400">{rep.district}</span>
                    </div>
                    <h4 class="text-sm font-extrabold text-slate-50">
                      {rep.locationName}
                    </h4>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold uppercase ${
                    rep.status === 'VERIFIED_DISPATCHED'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                      : 'bg-amber-950 text-amber-300 border border-amber-700'
                  }`}>
                    {rep.status === 'VERIFIED_DISPATCHED' ? 'Dispatched' : 'Under Review'}
                  </span>
                </div>

                <div class="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80 text-xs text-slate-300 leading-relaxed">
                  {rep.description}
                </div>

                {rep.nearestLandmark && (
                  <div class="flex items-center gap-1.5 text-xs text-slate-400">
                    <MapPin class="w-3 h-3 text-rose-400 shrink-0" />
                    <span class="truncate">{rep.nearestLandmark}</span>
                  </div>
                )}

                <div class="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <div class="flex items-center gap-1">
                    <Clock class="w-3 h-3" />
                    <span>{rep.timeAgo}</span>
                  </div>

                  <button
                    onClick={() => onUpvoteReport(rep.id)}
                    class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition cursor-pointer"
                  >
                    <ThumbsUp class="w-3 h-3 text-cyan-400" />
                    <span>Confirm ({rep.upvotes || 1})</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
