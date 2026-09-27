import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Language = 'en' | 'hi';

const STORAGE_KEY = 'bhoosuraksha_language';

/**
 * Translation dictionary. Scope note: this covers navigation, headers,
 * and the highest-visibility labels/copy — not every string in the app.
 * Translating the full app (every form label, every helper sentence
 * across ~30 components) is a much larger effort than wiring the
 * mechanism; this is a real, working translation of the parts a visitor
 * sees first, with the mechanism (useLanguage/t()) ready to extend.
 * Untranslated strings render in English regardless of language setting.
 */
const DICTIONARY: Record<string, { en: string; hi: string }> = {
  'nav.home': { en: 'Home', hi: 'मुखपृष्ठ' },
  'nav.citizenServices': { en: 'Citizen Services', hi: 'नागरिक सेवाएं' },
  'nav.login': { en: 'Login', hi: 'लॉगिन' },
  'nav.logout': { en: 'Logout', hi: 'लॉगआउट' },
  'nav.changePortal': { en: 'Change Portal', hi: 'पोर्टल बदलें' },
  'nav.sitemap': { en: 'Sitemap', hi: 'साइटमैप' },
  'nav.contactUs': { en: 'Contact us', hi: 'संपर्क करें' },
  'nav.feedback': { en: 'Feedback', hi: 'प्रतिक्रिया' },
  'nav.about': { en: 'About', hi: 'परिचय' },
  'nav.resources': { en: 'Resources', hi: 'संसाधन' },
  'nav.emergency': { en: 'Emergency Contacts', hi: 'आपातकालीन संपर्क' },
  'nav.authorityLogin': { en: 'Authority Login', hi: 'प्राधिकरण लॉगिन' },

  'brand.name': { en: 'BhooSuraksha', hi: 'भूसुरक्षा' },
  'brand.tagline': { en: 'Landslide Risk Monitoring & Early Warning', hi: 'भूस्खलन जोखिम निगरानी एवं पूर्व चेतावनी' },
  'brand.disclaimer': { en: 'A student initiative · Not an official Government of India website', hi: 'एक छात्र पहल · यह भारत सरकार की आधिकारिक वेबसाइट नहीं है' },

  'citizen.safeStatus': { en: 'My Safety Radar', hi: 'मेरी सुरक्षा स्थिति' },
  'citizen.nearMe': { en: 'Near Me', hi: 'मेरे नज़दीक' },
  'citizen.routes': { en: 'Highway Corridors', hi: 'राजमार्ग गलियारे' },
  'citizen.reportHazard': { en: 'Report Ground Hazard', hi: 'खतरे की सूचना दें' },
  'citizen.shelters': { en: 'Evacuation Shelters', hi: 'निकासी आश्रय' },
  'citizen.guidelines': { en: 'Safety Protocols', hi: 'सुरक्षा दिशानिर्देश' },

  'auth.dashboard': { en: 'Authority Dashboard', hi: 'प्राधिकरण डैशबोर्ड' },
  'auth.username': { en: 'Username', hi: 'उपयोगकर्ता नाम' },
  'auth.password': { en: 'Password', hi: 'पासवर्ड' },
  'auth.signIn': { en: 'Sign in', hi: 'साइन इन करें' },

  'lang.choose': { en: 'Choose your language', hi: 'अपनी भाषा चुनें' },
  'lang.chooseSub': { en: 'You can change this any time from the top bar.', hi: 'आप इसे शीर्ष बार से कभी भी बदल सकते हैं।' },
  'lang.english': { en: 'English', hi: 'अंग्रे़जी' },
  'lang.hindi': { en: 'Hindi', hi: 'हिंदी' },

  'footer.builtBy': { en: 'A regional disaster-preparedness initiative', hi: 'एक क्षेत्रीय आपदा-सुरक्षा पहल' },
};

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof DICTIONARY) => string;
  hasChosenLanguage: boolean;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(
    () => (localStorage.getItem(STORAGE_KEY) as Language) || 'en'
  );
  const [hasChosenLanguage, setHasChosenLanguage] = useState<boolean>(
    () => localStorage.getItem(STORAGE_KEY) !== null
  );

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    setHasChosenLanguage(true);
    localStorage.setItem(STORAGE_KEY, lang);
  };

  const t = (key: keyof typeof DICTIONARY): string => {
    const entry = DICTIONARY[key];
    if (!entry) return String(key);
    return entry[language];
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, hasChosenLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within a LanguageProvider');
  return ctx;
}
