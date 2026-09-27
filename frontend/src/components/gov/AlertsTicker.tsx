/**
 * "Latest Alerts" scrolling strip, the news-ticker pattern common on
 * government portals. Pulls live alerts from the backend (falls back to
 * demo data via api.getAlerts). Pauses on hover; static when the user
 * has "Reduce Motion" on or prefers reduced motion at the OS level.
 */
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { AlertNotification } from '../../types/landslide';

export const AlertsTicker: React.FC = () => {
  const [alerts, setAlerts] = useState<AlertNotification[]>([]);

  useEffect(() => {
    api.getAlerts().then(setAlerts).catch(() => setAlerts([]));
  }, []);

  const items = alerts.length
    ? alerts.map((a) => `${a.risk_level.replace('_', ' ')} risk — ${a.locationName}, ${a.district} (${a.state}): ${Math.round(a.risk_probability * 100)}% probability`)
    : ['No active landslide alerts right now. Monsoon season (June–September) carries the highest risk — review the safety guidelines.'];

  return (
    <div class="flex items-stretch bg-white border-b border-slate-800 text-sm">
      <span class="shrink-0 bg-red-600 text-white font-semibold px-4 py-2 flex items-center">
        Latest Alerts
      </span>
      <div class="ticker-viewport relative flex-1 overflow-hidden flex items-center">
        <div class="ticker-track flex gap-12 whitespace-nowrap pl-6">
          {[...items, ...items].map((text, i) => (
            <Link key={i} to="/citizen/safe-status" class="text-slate-200 hover:text-blue-600 hover:underline">
              <span class="text-gov-saffron mr-2">●</span>{text}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};
