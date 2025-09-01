import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface AccessibilityContextType {
  theme: Theme;
  fontScale: number;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
  increaseFont: () => void;
  decreaseFont: () => void;
  setFontScale: (n: number) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

const STORAGE_THEME_KEY = "vc:theme";
const STORAGE_FONT_KEY = "vc:fontScale";

const MIN_SCALE = 0.8;
const MAX_SCALE = 1.6;
const STEP = 0.125;

export const useAccessibility = () => {
  const ctx = useContext(AccessibilityContext);
  if (!ctx) throw new Error("useAccessibility must be used within AccessibilityProvider");
  return ctx;
};

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>("light");
  const [fontScale, setFontScaleState] = useState<number>(1);

  // Apply theme to documentElement
  const applyTheme = (t: Theme) => {
    try {
      if (t === "dark") document.documentElement.classList.add("dark");
      else document.documentElement.classList.remove("dark");
      localStorage.setItem(STORAGE_THEME_KEY, t);
      dispatchChange(t, fontScale);
    } catch (e) {
      // ignore storage errors
    }
  };

  const applyFontScale = (scale: number) => {
    try {
      const normalized = Math.min(MAX_SCALE, Math.max(MIN_SCALE, Number(scale) || 1));
      document.documentElement.style.setProperty("--vc-font-scale", String(normalized));
      localStorage.setItem(STORAGE_FONT_KEY, String(normalized));
      dispatchChange(theme, normalized);
    } catch (e) {
      // ignore storage errors
    }
  };

  const dispatchChange = (t: Theme, scale: number) => {
    try {
      const ev = new CustomEvent("vc:accessibility-changed", { detail: { theme: t, fontScale: scale } });
      window.dispatchEvent(ev);
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    // initialize from storage
    try {
      const storedTheme = localStorage.getItem(STORAGE_THEME_KEY) as Theme | null;
      const storedScaleRaw = localStorage.getItem(STORAGE_FONT_KEY);
      const storedScale = storedScaleRaw ? parseFloat(storedScaleRaw) : undefined;

      if (storedTheme === "dark") {
        setThemeState("dark");
        document.documentElement.classList.add("dark");
      } else {
        setThemeState("light");
        document.documentElement.classList.remove("dark");
      }

      if (typeof storedScale === "number" && !isNaN(storedScale)) {
        setFontScaleState(storedScale);
        document.documentElement.style.setProperty("--vc-font-scale", String(storedScale));
      } else {
        document.documentElement.style.setProperty("--vc-font-scale", String(1));
      }
    } catch (e) {
      // localStorage not available or other errors -> fallback to defaults
      document.documentElement.style.setProperty("--vc-font-scale", String(1));
      document.documentElement.classList.remove("dark");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setThemeState(next);
    applyTheme(next);
  };

  const setTheme = (t: Theme) => {
    setThemeState(t);
    applyTheme(t);
  };

  const increaseFont = () => {
    const next = Math.min(MAX_SCALE, +(Math.round((fontScale + STEP) * 1000) / 1000).toFixed(3));
    setFontScaleState(next);
    applyFontScale(next);
  };

  const decreaseFont = () => {
    const next = Math.max(MIN_SCALE, +(Math.round((fontScale - STEP) * 1000) / 1000).toFixed(3));
    setFontScaleState(next);
    applyFontScale(next);
  };

  const setFontScale = (n: number) => {
    const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, n));
    setFontScaleState(next);
    applyFontScale(next);
  };

  const value: AccessibilityContextType = {
    theme,
    fontScale,
    toggleTheme,
    setTheme,
    increaseFont,
    decreaseFont,
    setFontScale,
  };

  return <AccessibilityContext.Provider value={value}>{children}</AccessibilityContext.Provider>;
};

export default AccessibilityContext;
