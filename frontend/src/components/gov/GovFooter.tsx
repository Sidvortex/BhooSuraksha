import React from 'react';
import { Link } from 'react-router-dom';
import { EMERGENCY_HELPLINES } from '../../data/citizenData';
import { REPO_URL, DOCS_URL, ISRO_LANDSLIDE_ATLAS_URL, NDMA_URL } from '../../data/links';
import { BrandMark } from './BrandMark';

const col = 'text-sm text-white/75 hover:text-white hover:underline block py-1';

export const GovFooter: React.FC = () => (
  <footer class="mt-auto bg-gov-navy-dark text-white">
    <div class="h-1 bg-gov-saffron" />
    <div class="max-w-7xl mx-auto px-4 sm:px-6 py-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
      <div class="lg:col-span-2">
        <div class="flex items-center gap-3 mb-3">
          <BrandMark size={44} />
          <div>
            <div class="font-bold text-lg">भूसुरक्षा | BhooSuraksha</div>
            <div class="text-xs text-white/70">Landslide Risk Monitoring & Early Warning</div>
          </div>
        </div>
        <p class="text-sm text-white/70 leading-relaxed max-w-sm">
          A student-built early-warning system for India's North Eastern Region and neighbouring
          hill districts. Predictions are algorithmic estimates, not official disaster orders —
          always follow instructions from local authorities.
        </p>
      </div>

      <div>
        <h3 class="font-semibold mb-2 text-gov-saffron">Citizen Services</h3>
        <Link to="/citizen/safe-status" class={col}>District safety status</Link>
        <Link to="/citizen/near-me" class={col}>Near me</Link>
        <Link to="/citizen/report-hazard" class={col}>Report a hazard</Link>
        <Link to="/citizen/shelters" class={col}>Evacuation shelters</Link>
        <Link to="/citizen/guidelines" class={col}>Safety guidelines</Link>
      </div>

      <div>
        <h3 class="font-semibold mb-2 text-gov-saffron">Resources</h3>
        <a href={ISRO_LANDSLIDE_ATLAS_URL} target="_blank" rel="noopener noreferrer" class={col}>ISRO Landslide Atlas</a>
        <a href={NDMA_URL} target="_blank" rel="noopener noreferrer" class={col}>NDMA</a>
        <a href={DOCS_URL} target="_blank" rel="noopener noreferrer" class={col}>Documentation</a>
        <a href={REPO_URL} target="_blank" rel="noopener noreferrer" class={col}>Source code</a>
        <Link to="/sitemap" class={col}>Sitemap</Link>
        <Link to="/feedback" class={col}>Feedback</Link>
        <Link to="/contact" class={col}>Contact us</Link>
      </div>

      <div>
        <h3 class="font-semibold mb-2 text-gov-saffron">Emergency Helplines</h3>
        {EMERGENCY_HELPLINES.slice(0, 5).map((h) => (
          <a key={h.service} href={`tel:${h.number}`} class="flex justify-between gap-3 text-sm py-1 text-white/75 hover:text-white">
            <span>{h.service}</span>
            <span class="font-mono font-semibold text-white whitespace-nowrap">{h.number}</span>
          </a>
        ))}
      </div>
    </div>

    <div class="border-t border-white/10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-white/60">
        <span>© {new Date().getFullYear()} BhooSuraksha project team. Not an official Government of India website.</span>
        <span>Data: NASA Global Landslide Catalog · Map data © OpenStreetMap contributors</span>
      </div>
    </div>
  </footer>
);
