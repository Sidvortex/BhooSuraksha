import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

interface Crumb { label: string; to?: string }

/** Page title + breadcrumb band, the pattern gov portals put under the nav. */
export const PageBanner: React.FC<{ title: string; crumbs: Crumb[] }> = ({ title, crumbs }) => (
  <div class="bg-white border-b border-slate-800">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
      <h1 class="text-xl font-semibold text-gov-navy border-l-4 border-gov-saffron pl-3">{title}</h1>
      <nav aria-label="Breadcrumb" class="flex items-center flex-wrap text-sm text-slate-400">
        <Link to="/" class="text-blue-600 hover:underline">Home</Link>
        {crumbs.map((c) => (
          <span key={c.label} class="flex items-center">
            <ChevronRight class="w-3.5 h-3.5 mx-1" />
            {c.to ? <Link to={c.to} class="text-blue-600 hover:underline">{c.label}</Link> : <span>{c.label}</span>}
          </span>
        ))}
      </nav>
    </div>
  </div>
);
