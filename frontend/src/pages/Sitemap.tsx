import React from 'react';
import { Link } from 'react-router-dom';
import { GovNav } from '../components/GovNav';
import { PageBanner } from '../components/gov/PageBanner';

const SECTIONS: { title: string; links: { label: string; to: string }[] }[] = [
  {
    title: 'Public site',
    links: [
      { label: 'Home / Safety status by district', to: '/citizen/safe-status' },
      { label: 'Near me (map + emergency contacts)', to: '/citizen/near-me' },
      { label: 'Highway corridor checker', to: '/citizen/routes' },
      { label: 'Report a hazard', to: '/citizen/report-hazard' },
      { label: 'Evacuation shelters', to: '/citizen/shelters' },
      { label: 'Safety guidelines', to: '/citizen/guidelines' },
    ],
  },
  {
    title: 'Authority Command Center (login required)',
    links: [
      { label: 'Dashboard', to: '/authority/dashboard' },
      { label: 'Live monitoring', to: '/authority/monitoring' },
      { label: 'Risk map', to: '/authority/risk-map' },
      { label: 'Alerts & citizen reports', to: '/authority/alerts' },
      { label: 'Analytics', to: '/authority/analytics' },
      { label: 'Reports', to: '/authority/reports' },
      { label: 'Settings', to: '/authority/settings' },
    ],
  },
  {
    title: 'General',
    links: [
      { label: 'Login', to: '/login' },
      { label: 'Contact us', to: '/contact' },
      { label: 'Feedback', to: '/feedback' },
      { label: 'Sitemap', to: '/sitemap' },
    ],
  },
];

export const Sitemap: React.FC = () => {
  return (
    <div class="flex-1 bg-gov-page text-slate-100">
      <GovNav />
      <PageBanner title="Sitemap" crumbs={[{ label: 'Sitemap' }]} />
      <main id="main-content" class="max-w-2xl mx-auto p-5 sm:p-8 space-y-6">

        {SECTIONS.map((section) => (
          <section key={section.title}>
            <h2 class="text-sm font-medium text-slate-300 mb-2">{section.title}</h2>
            <ul class="bg-slate-950/60 border border-slate-800 rounded-xl divide-y divide-slate-800">
              {section.links.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} class="block px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-900 hover:text-slate-50 transition">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </main>
    </div>
  );
};
