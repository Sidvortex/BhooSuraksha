import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useA11y } from '../context/A11yContext';
import {
  Github,
  BookOpen,
  Accessibility,
  Contrast,
  Type,
  MousePointer2,
  Link2,
  SpellCheck2,
  AlignJustify,
  MoveHorizontal,
  Wind,
  RotateCcw,
} from 'lucide-react';

/** Real links for the project — update these to your actual repo/docs. */
const REPO_URL = 'https://github.com/your-org/bhoosuraksha';
const DOCS_URL = 'https://github.com/your-org/bhoosuraksha#readme';

export const TopUtilityBar: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const a11y = useA11y();
  const [a11yOpen, setA11yOpen] = useState(false);
  const a11yRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (a11yRef.current && !a11yRef.current.contains(e.target as Node)) setA11yOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const toggleButtons: { key: Parameters<typeof a11y.toggle>[0]; label: string; icon: React.ReactNode }[] = [
    { key: 'highContrast', label: 'High Contrast', icon: <Contrast class="w-3.5 h-3.5" /> },
    { key: 'bigCursor', label: 'Big Cursor', icon: <MousePointer2 class="w-3.5 h-3.5" /> },
    { key: 'highlightLinks', label: 'Highlight Links', icon: <Link2 class="w-3.5 h-3.5" /> },
    { key: 'dyslexiaFont', label: 'Reading-Friendly Font', icon: <SpellCheck2 class="w-3.5 h-3.5" /> },
    { key: 'extraLineHeight', label: 'Extra Line Height', icon: <AlignJustify class="w-3.5 h-3.5" /> },
    { key: 'extraLetterSpacing', label: 'Extra Letter Spacing', icon: <MoveHorizontal class="w-3.5 h-3.5" /> },
    { key: 'reduceMotion', label: 'Reduce Motion', icon: <Wind class="w-3.5 h-3.5" /> },
  ];

  return (
    <>
      {/* Real accessibility feature: invisible until focused via keyboard Tab */}
      <a href="#main-content" class="skip-to-content">
        Skip to main content
      </a>

      <div class="hidden sm:flex items-center justify-between gap-4 px-6 py-1.5 bg-slate-950 text-xs text-slate-400 border-b border-slate-800 relative z-[1600]">
        <div class="flex items-center gap-3">
          <button
            id="btn-lang-en"
            onClick={() => setLanguage('en')}
            class={`cursor-pointer ${language === 'en' ? 'text-white font-medium' : 'hover:text-slate-200'}`}
          >
            English
          </button>
          <span class="text-slate-700">|</span>
          <button
            id="btn-lang-hi"
            onClick={() => setLanguage('hi')}
            class={`cursor-pointer ${language === 'hi' ? 'text-white font-medium' : 'hover:text-slate-200'}`}
          >
            हिंदी
          </button>
          <span class="text-slate-700">|</span>
          <Link to="/sitemap" class="hover:text-slate-200">{t('nav.sitemap')}</Link>
          <span class="text-slate-700">|</span>
          <Link to="/contact" class="hover:text-slate-200">{t('nav.contactUs')}</Link>
          <span class="text-slate-700">|</span>
          <Link to="/feedback" class="hover:text-slate-200">{t('nav.feedback')}</Link>
        </div>

        <div class="flex items-center gap-3">
          <a href={DOCS_URL} target="_blank" rel="noopener noreferrer" class="hover:text-slate-200 flex items-center gap-1">
            <BookOpen class="w-3.5 h-3.5" /> Docs
          </a>
          <a href={REPO_URL} target="_blank" rel="noopener noreferrer" class="hover:text-slate-200 flex items-center gap-1">
            <Github class="w-3.5 h-3.5" /> Source
          </a>
          <span class="text-slate-700">|</span>
          <div class="flex items-center gap-1">
            <button onClick={a11y.decreaseFont} class="hover:text-slate-200 cursor-pointer">A-</button>
            <button onClick={a11y.resetFont} class="hover:text-slate-200 cursor-pointer">A</button>
            <button onClick={a11y.increaseFont} class="hover:text-slate-200 cursor-pointer font-medium">A+</button>
          </div>
          <span class="text-slate-700">|</span>

          {/* Accessibility tools: a normal-flow dropdown anchored here,
              not a viewport-fixed floating button - fixed positioning
              risked colliding with the Authority sidebar or a map's own
              overlay controls depending on which page was showing. */}
          <div class="relative" ref={a11yRef}>
            <button
              id="btn-accessibility-toolbar"
              onClick={() => setA11yOpen((v) => !v)}
              class={`flex items-center gap-1 cursor-pointer ${a11yOpen ? 'text-white' : 'hover:text-slate-200'}`}
              title="Accessibility tools"
            >
              <Accessibility class="w-3.5 h-3.5" /> Accessibility
            </button>

            {a11yOpen && (
              <div class="absolute right-0 top-full mt-2 w-64 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl p-3 text-left">
                <div class="space-y-1">
                  {toggleButtons.map((btn) => (
                    <button
                      key={btn.key}
                      onClick={() => a11y.toggle(btn.key)}
                      class={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition cursor-pointer ${
                        a11y[btn.key] ? 'bg-blue-700 text-white' : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {btn.icon}
                      <span>{btn.label}</span>
                    </button>
                  ))}
                </div>
                <button
                  onClick={a11y.resetAll}
                  class="w-full flex items-center justify-center gap-1.5 mt-2 px-2.5 py-1.5 rounded-lg text-xs bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                >
                  <RotateCcw class="w-3.5 h-3.5" /> Reset all
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
