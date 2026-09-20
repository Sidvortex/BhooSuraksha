/**
 * Citizen & Traveler Safety Portal
 * Public-facing interface for residents, commuters, and tourists across Northeast India
 */

import React, { useState } from 'react';
import { 
  MonitoredLocation, 
  CitizenIncidentReport, 
  HighwayCorridor, 
  EmergencyReliefShelter, 
  CitizenNavTab, 
  NerState 
} from '../../types/landslide';
import { 
  INITIAL_HIGHWAY_CORRIDORS, 
  INITIAL_RELIEF_SHELTERS 
} from '../../data/citizenData';

import { CitizenSafetyStatus } from './CitizenSafetyStatus';
import { HighwayCorridorChecker } from './HighwayCorridorChecker';
import { CitizenReportHazard } from './CitizenReportHazard';
import { ReliefSheltersView } from './ReliefSheltersView';
import { SafetyGuidelinesView } from './SafetyGuidelinesView';
import { SmsAlertsSubscribe } from './SmsAlertsSubscribe';

import { 
  ShieldCheck, 
  Car, 
  AlertTriangle, 
  Building2, 
  LifeBuoy, 
  Smartphone, 
  PhoneCall, 
  AlertOctagon
} from 'lucide-react';

interface CitizenPortalProps {
  locations: MonitoredLocation[];
  citizenReports: CitizenIncidentReport[];
  onSubmitCitizenReport: (report: CitizenIncidentReport) => void;
  onUpvoteCitizenReport: (reportId: string) => void;
  selectedLocation?: MonitoredLocation | null;
}

export const CitizenPortal: React.FC<CitizenPortalProps> = ({
  locations,
  citizenReports,
  onSubmitCitizenReport,
  onUpvoteCitizenReport,
  selectedLocation
}) => {
  const [activeCitizenTab, setActiveCitizenTab] = useState<CitizenNavTab>('safe-status');
  const [selectedState, setSelectedState] = useState<NerState>(selectedLocation?.state || 'Sikkim');
  const [selectedDistrict, setSelectedDistrict] = useState<string>(selectedLocation?.district || 'Pakyong');
  const [highwayCorridors, setHighwayCorridors] = useState<HighwayCorridor[]>(INITIAL_HIGHWAY_CORRIDORS);
  const [prefillHazardLocation, setPrefillHazardLocation] = useState<string>('');

  const citizenTabs: { id: CitizenNavTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'safe-status', label: 'My Safety Radar', icon: <ShieldCheck class="w-4 h-4" /> },
    { id: 'routes', label: 'Highway Corridors', icon: <Car class="w-4 h-4" />, badge: highwayCorridors.filter(h => h.status === 'BLOCKED' || h.status === 'RESTRICTED').length },
    { id: 'report-hazard', label: 'Report Ground Hazard', icon: <AlertTriangle class="w-4 h-4" />, badge: citizenReports.length },
    { id: 'shelters', label: 'Evacuation Shelters', icon: <Building2 class="w-4 h-4" /> },
    { id: 'guidelines', label: 'Safety Protocols', icon: <LifeBuoy class="w-4 h-4" /> },
    { id: 'sms-alerts', label: 'Phone SMS Alerts', icon: <Smartphone class="w-4 h-4" /> }
  ];

  const handleReportBlockage = (highwayName: string) => {
    setPrefillHazardLocation(highwayName);
    setActiveCitizenTab('report-hazard');
  };

  return (
    <div class="space-y-6">
      {/* Citizen Navigation Sub-Header */}
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-2.5 flex flex-wrap items-center gap-3">
        {/* Navigation Tabs */}
        <div class="flex items-center gap-1.5 overflow-x-auto w-full pb-1">
          {citizenTabs.map((tab) => {
            const isActive = activeCitizenTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`citizen-tab-${tab.id}`}
                onClick={() => setActiveCitizenTab(tab.id)}
                class={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-teal-700 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span class={`px-1.5 py-0.2 rounded-full text-xs font-semibold ${
                    isActive ? 'bg-white text-teal-700' : 'bg-teal-600 text-white'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Tab Content */}
      {activeCitizenTab === 'safe-status' && (
        <CitizenSafetyStatus
          locations={locations}
          selectedDistrict={selectedDistrict}
          selectedState={selectedState}
          onSelectDistrict={(dist, st) => {
            setSelectedDistrict(dist);
            setSelectedState(st);
          }}
          onNavigateToTab={(tab) => setActiveCitizenTab(tab)}
        />
      )}

      {activeCitizenTab === 'routes' && (
        <HighwayCorridorChecker
          corridors={highwayCorridors}
          onReportBlockage={handleReportBlockage}
        />
      )}

      {activeCitizenTab === 'report-hazard' && (
        <CitizenReportHazard
          reports={citizenReports}
          onSubmitReport={(newRep) => {
            onSubmitCitizenReport(newRep);
          }}
          onUpvoteReport={onUpvoteCitizenReport}
          prefillLocation={prefillHazardLocation}
        />
      )}

      {activeCitizenTab === 'shelters' && (
        <ReliefSheltersView shelters={INITIAL_RELIEF_SHELTERS} />
      )}

      {activeCitizenTab === 'guidelines' && (
        <SafetyGuidelinesView />
      )}

      {activeCitizenTab === 'sms-alerts' && (
        <SmsAlertsSubscribe
          defaultState={selectedState}
          defaultDistrict={selectedDistrict}
        />
      )}

      {/* Persistent Emergency SOS Strip at bottom of Citizen Panel */}
      <div class="bg-red-950/80 border border-red-800/60 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <div class="p-2 rounded-xl bg-red-600 text-white animate-pulse">
            <PhoneCall class="w-5 h-5" />
          </div>
          <div>
            <h4 class="text-sm font-extrabold text-white">
              Immediate Landslide Emergency or Trapped Citizens?
            </h4>
            <p class="text-xs text-slate-300">
              Call Disaster Toll-Free: <a href="tel:1078" class="font-mono font-bold text-cyan-400 hover:underline">1078 (NDMA)</a> or <a href="tel:112" class="font-mono font-bold text-rose-400 hover:underline">112 (Emergency Rescue)</a>
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <a
            href="tel:112"
            class="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs rounded-xl shadow-lg transition flex items-center gap-2 cursor-pointer"
          >
            <PhoneCall class="w-4 h-4" />
            <span>Call 112 Emergency</span>
          </a>
          <button
            onClick={() => setActiveCitizenTab('shelters')}
            class="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition cursor-pointer"
          >
            Find Shelter
          </button>
        </div>
      </div>
    </div>
  );
};
