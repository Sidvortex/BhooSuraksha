/**
 * Early Warning Banner - Prominently displayed when critical or high risks occur
 */

import React, { useState } from 'react';
import { AlertNotification } from '../types/landslide';
import { ShieldAlert, AlertOctagon, ChevronRight, X, PhoneCall } from 'lucide-react';

interface EarlyWarningBannerProps {
  criticalAlert: AlertNotification | null;
  onSelectAlertLocation: (locationId: string) => void;
}

export const EarlyWarningBanner: React.FC<EarlyWarningBannerProps> = ({
  criticalAlert,
  onSelectAlertLocation
}) => {
  const [dismissed, setDismissed] = useState(false);

  if (!criticalAlert || dismissed) return null;

  return (
    <div 
      id="early-warning-banner"
      class="w-full bg-red-950 border-y border-red-700/80 px-4 py-3 text-white shadow-2xl relative overflow-hidden"
    >
      {/* Animated warning stripe */}
      <div class="absolute -top-10 -bottom-10 left-0 w-32 bg-red-600/20 blur-xl animate-pulse"></div>

      <div class="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3 relative z-10">
        <div class="flex items-center gap-3">
          <div class="p-2 rounded-xl bg-red-600 text-white shadow-lg animate-bounce" style={{ animationDuration: '2s' }}>
            <AlertOctagon class="w-6 h-6" />
          </div>
          <div>
            <div class="flex items-center gap-2">
              <span class="px-2 py-0.5 rounded bg-black/60 border border-red-500 text-xs font-mono font-bold uppercase tracking-widest text-red-300">
                CRITICAL EARLY WARNING ALERT
              </span>
              <span class="text-xs font-mono text-red-200">
                {criticalAlert.timeAgo || criticalAlert.timestamp}
              </span>
            </div>
            <p class="text-sm font-bold text-white mt-0.5">
              {criticalAlert.locationName} ({criticalAlert.district}, {criticalAlert.state}) – Landslide Probability: <strong class="text-amber-300 font-mono text-base">{Math.round(criticalAlert.risk_probability * 100)}%</strong>
            </p>
            <p class="text-xs text-red-200 line-clamp-1 max-w-2xl">
              <strong>Recommended Immediate Action:</strong> {criticalAlert.recommended_actions[0]}
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2 self-end md:self-center">
          <button
            id="btn-inspect-critical-alert"
            onClick={() => onSelectAlertLocation(criticalAlert.locationId)}
            class="px-3.5 py-1.5 bg-white text-red-900 hover:bg-red-50 text-xs font-bold rounded-lg transition shadow-lg flex items-center gap-1 cursor-pointer"
          >
            <span>Inspect Threat Cone</span>
            <ChevronRight class="w-4 h-4" />
          </button>
          <button
            id="btn-dismiss-warning-banner"
            onClick={() => setDismissed(true)}
            class="p-1.5 text-red-300 hover:text-white rounded-lg hover:bg-red-800/40 transition cursor-pointer"
            title="Dismiss temporary banner"
          >
            <X class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
