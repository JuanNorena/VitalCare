import { useTranslation } from 'react-i18next';
import { useCallback } from 'react';

export function useLanguage() {
  const { i18n } = useTranslation();

  const changeLanguage = useCallback((language: 'es' | 'en') => {
    i18n.changeLanguage(language);
    localStorage.setItem('i18nextLng', language);
  }, [i18n]);

  return {
    currentLanguage: i18n.language,
    changeLanguage,
    isSpanish: i18n.language.startsWith('es'),
    isEnglish: i18n.language.startsWith('en'),
  };
}
