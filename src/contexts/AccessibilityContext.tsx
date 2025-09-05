import React, { createContext, useContext, useEffect, useState } from 'react';

type AccessibilityState = {
  dark: boolean;
  fontScale: number;
  toggleDark: () => void;
  setDark: (v: boolean) => void;
  increaseFont: () => void;
  decreaseFont: () => void;
  reset: () => void;
};

const ACCESS_KEY_DARK = 'vc:dark';
const ACCESS_KEY_FONT = 'vc:fontScale';

const defaultState = {
  dark: false,
  fontScale: 1,
};

const AccessibilityContext = createContext<AccessibilityState | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [dark, setDarkState] = useState<boolean>(() => {
    try {
      const v = localStorage.getItem(ACCESS_KEY_DARK);
      if (v === '1') return true;
      if (v === '0') return false;
    } catch (e) {}
    // fallback to system preference
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [fontScale, setFontScale] = useState<number>(() => {
    try {
      const v = localStorage.getItem(ACCESS_KEY_FONT);
      if (v) return Number(v);
    } catch (e) {}
    return defaultState.fontScale;
  });

  // Sync class on root and css var
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    try { localStorage.setItem(ACCESS_KEY_DARK, dark ? '1' : '0'); } catch (e) {}
  }, [dark]);

  useEffect(() => {
    const clamped = Math.max(0.8, Math.min(1.6, fontScale));
    document.documentElement.style.setProperty('--vc-font-scale', String(clamped));
    try { localStorage.setItem(ACCESS_KEY_FONT, String(clamped)); } catch (e) {}
  }, [fontScale]);

  // storage event sync across tabs
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === ACCESS_KEY_DARK) setDarkState(e.newValue === '1');
      if (e.key === ACCESS_KEY_FONT) setFontScale(e.newValue ? Number(e.newValue) : defaultState.fontScale);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const toggleDark = () => setDarkState(d => !d);
  const setDark = (v: boolean) => setDarkState(v);
  const increaseFont = () => setFontScale(s => Math.min(1.6, +(s + 0.1).toFixed(2)));
  const decreaseFont = () => setFontScale(s => Math.max(0.8, +(s - 0.1).toFixed(2)));
  const reset = () => {
    setDarkState(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setFontScale(defaultState.fontScale);
  };

  return (
    <AccessibilityContext.Provider value={{ dark, fontScale, toggleDark, setDark, increaseFont, decreaseFont, reset }}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const ctx = useContext(AccessibilityContext);
  if (!ctx) throw new Error('useAccessibility must be used within AccessibilityProvider');
  return ctx;
}

export default AccessibilityContext;
