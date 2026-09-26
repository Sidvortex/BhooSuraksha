import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Landmark } from 'lucide-react';

export const LanguageChooserModal: React.FC = () => {
  const { hasChosenLanguage, setLanguage, t } = useLanguage();

  if (hasChosenLanguage) return null;

  return (
    <div class="fixed inset-0 z-[3000] flex items-center justify-center bg-black/70 px-4">
      <div class="w-full max-w-sm bg-slate-950 border border-slate-800 rounded-2xl p-6 text-center">
        <div class="w-12 h-12 rounded-xl bg-teal-700 flex items-center justify-center mx-auto mb-3">
          <Landmark class="w-6 h-6 text-white" />
        </div>
        <h2 class="text-white font-semibold mb-1">{t('lang.choose')}</h2>
        <p class="text-xs text-slate-400 mb-5">{t('lang.chooseSub')}</p>

        <div class="grid grid-cols-2 gap-3">
          <button
            id="btn-choose-lang-hi"
            onClick={() => setLanguage('hi')}
            class="p-4 rounded-xl border border-slate-700 hover:border-teal-600 bg-slate-900 transition cursor-pointer"
          >
            <span class="block text-white font-medium">हिंदी</span>
            <span class="block text-xs text-slate-400">स्वागत है</span>
          </button>
          <button
            id="btn-choose-lang-en"
            onClick={() => setLanguage('en')}
            class="p-4 rounded-xl border border-blue-600 bg-slate-900 transition cursor-pointer"
          >
            <span class="block text-white font-medium">English</span>
            <span class="block text-xs text-slate-400">Welcome</span>
          </button>
        </div>
      </div>
    </div>
  );
};
