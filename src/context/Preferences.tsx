import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { L, Lang } from '../i18n/types';
import { ui, type UIStrings } from '../i18n/ui';

export type Theme = 'dark' | 'light';

interface Preferences {
  lang: Lang;
  dir: 'rtl' | 'ltr';
  theme: Theme;
  /** Effective motion state (user choice, falling back to OS "reduce motion"). */
  motion: boolean;
  t: UIStrings;
  tr: (value: L) => string;
  toggleLang: () => void;
  toggleTheme: () => void;
  toggleMotion: () => void;
}

const KEYS = { lang: 'as-lang', theme: 'as-theme', motion: 'as-motion' } as const;

const PreferencesContext = createContext<Preferences | null>(null);

const read = (key: string) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};
const write = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage unavailable (private mode) — preference just won't persist */
  }
};

function initialLang(): Lang {
  const q = new URLSearchParams(window.location.search).get('lang');
  if (q === 'en' || q === 'ar') return q;
  return read(KEYS.lang) === 'en' ? 'en' : 'ar';
}

const reducedMotionQuery = () => window.matchMedia('(prefers-reduced-motion: reduce)');

let themeSwitchTimer = 0;

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(initialLang);
  const [theme, setTheme] = useState<Theme>(() => (read(KEYS.theme) === 'light' ? 'light' : 'dark'));
  const [motionChoice, setMotionChoice] = useState<string | null>(() => read(KEYS.motion));
  const [osReduced, setOsReduced] = useState(() => reducedMotionQuery().matches);

  useEffect(() => {
    const mq = reducedMotionQuery();
    const onChange = () => setOsReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const motion = motionChoice ? motionChoice === 'on' : !osReduced;
  const t = ui[lang];
  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  // Language → <html>, title, meta, URL
  useEffect(() => {
    const html = document.documentElement;
    html.lang = lang;
    html.dir = dir;
    document.title = t.meta.title;
    document.querySelector('meta[name="description"]')?.setAttribute('content', t.meta.description);
    write(KEYS.lang, lang);

    const url = new URL(window.location.href);
    if (lang === 'en') url.searchParams.set('lang', 'en');
    else url.searchParams.delete('lang');
    window.history.replaceState(window.history.state, '', url);
  }, [lang, dir, t]);

  // Theme → <html data-theme>, browser UI color
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#0c1220' : '#f4f3ef');
    write(KEYS.theme, theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.dataset.motion = motion ? 'on' : 'off';
  }, [motion]);

  const tr = useCallback((value: L) => value[lang], [lang]);
  const toggleLang = useCallback(() => setLang((l) => (l === 'ar' ? 'en' : 'ar')), []);
  const toggleTheme = useCallback(() => {
    // Briefly enable smooth color transitions on the whole page (skipped when motion is off).
    if (motion) {
      const html = document.documentElement;
      html.classList.add('theme-switching');
      window.clearTimeout(themeSwitchTimer);
      themeSwitchTimer = window.setTimeout(() => html.classList.remove('theme-switching'), 650);
    }
    setTheme((v) => (v === 'dark' ? 'light' : 'dark'));
  }, [motion]);
  const toggleMotion = useCallback(() => {
    const next = motion ? 'off' : 'on';
    write(KEYS.motion, next);
    setMotionChoice(next);
  }, [motion]);

  const value = useMemo<Preferences>(
    () => ({ lang, dir, theme, motion, t, tr, toggleLang, toggleTheme, toggleMotion }),
    [lang, dir, theme, motion, t, tr, toggleLang, toggleTheme, toggleMotion],
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePrefs() {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error('usePrefs must be used inside <PreferencesProvider>');
  return ctx;
}
