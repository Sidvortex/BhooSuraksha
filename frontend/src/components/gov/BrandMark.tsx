import React from 'react';

/** Original BhooSuraksha mark: a shield over a hill slope. Deliberately
 *  not the State Emblem of India, whose use is restricted by law to
 *  actual government bodies. */
export const BrandMark: React.FC<{ size?: number }> = ({ size = 52 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="BhooSuraksha logo">
    <path d="M32 3 L57 12 V31 C57 46 46 56 32 61 C18 56 7 46 7 31 V12 Z" fill="#0b3068" />
    <path d="M32 7 L53 14.5 V31 C53 43.5 44 52 32 56.5 C20 52 11 43.5 11 31 V14.5 Z" fill="none" stroke="#ff9933" strokeWidth="2" />
    <path d="M13 44 L25 27 L32 36 L39 24 L51 44 Z" fill="#ffffff" />
    <path d="M13 44 L25 27 L29 32 L22 44 Z" fill="#138808" opacity="0.85" />
    <circle cx="44" cy="19" r="3.2" fill="#ff9933" />
  </svg>
);
