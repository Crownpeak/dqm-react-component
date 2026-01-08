'use client';

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Languages } from 'lucide-react';
import { useAppDispatch } from '@/store/hooks';
import { setLocale } from '@/store/slices/localeSlice';
import type { SupportedLocale } from '@/i18n/config';
import * as CookieConsent from "vanilla-cookieconsent";
import { i18n as dqmI18n, useAIEngine, useAI } from '@crownpeak/dqm-react-component';

const LANGUAGE_FLAGS = {
  en: '🇬🇧',
  de: '🇩🇪',
  es: '🇪🇸',
} as const;

const LANGUAGE_NAMES = {
  en: 'English',
  de: 'Deutsch',
  es: 'Español',
} as const;

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation('common');
  const dispatch = useAppDispatch();
  const currentLocale = i18n.language as SupportedLocale;
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    // Sync DQM language on mount
    const locale = currentLocale;
    if (dqmI18n && dqmI18n.language !== locale) {
      dqmI18n.changeLanguage(locale);
      CookieConsent.setLanguage(locale);
      i18n.changeLanguage(locale);
    }
  }, [currentLocale])

  // Track scroll position to change colors when leaving hero section
  useEffect(() => {
    const handleScroll = () => {
      // Hero section is roughly 100vh, so we switch at ~90% of viewport height
      const heroHeight = window.innerHeight * 0.9;
      setIsScrolled(window.scrollY > heroHeight);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Check initial position
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Sync i18n language changes with Redux and DQM
  useEffect(() => {
    const handleLanguageChange = async (lng: string) => {
      const locale = lng as SupportedLocale;
      dispatch(setLocale(locale));
      
      // Sync with DQM component
      if (typeof window !== 'undefined') {
        localStorage.setItem('dqm_locale', locale);
        
        // Import and sync DQM's i18n instance
        try {
          if (dqmI18n && dqmI18n.language != locale) {
            dqmI18n.changeLanguage(locale);
            CookieConsent.setLanguage(locale);
          }
        } catch (error) {
          console.warn('Could not sync language with DQM component:', error);
        }
      }
    };

    const handleDqmLanguageChange = (lng: string) => {
      console.log('DQM Language changed to:', lng);
      const locale = lng as SupportedLocale;
      if (i18n.language !== locale) {
        i18n.changeLanguage(locale);
        dispatch(setLocale(locale));
      }
    };

    dqmI18n.on('languageChanged', handleDqmLanguageChange);
    i18n.on('languageChanged', handleLanguageChange);
    return () => {
      dqmI18n.off('languageChanged', handleDqmLanguageChange);
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n, dispatch]);

  const changeLanguage = (locale: SupportedLocale) => {
    i18n.changeLanguage(locale);
  };

  const getNextLanguage = (): SupportedLocale => {
    const languages: SupportedLocale[] = ['en', 'de', 'es'];
    const currentIndex = languages.indexOf(currentLocale);
    const nextIndex = (currentIndex + 1) % languages.length;
    return languages[nextIndex];
  };

  const cycleLanguage = () => {
    const nextLang = getNextLanguage();
    changeLanguage(nextLang);
  };

  return (
    <div className="fixed top-6 right-6 z-50 flex items-center gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={cycleLanguage}
              className={`backdrop-blur transition-all duration-300 ${
                isScrolled
                  ? 'bg-white/90 border-slate-300 hover:bg-white hover:border-slate-400 text-slate-900'
                  : 'bg-black/80 border-slate-700 hover:bg-black hover:border-slate-600 text-white'
              }`}
              aria-label={t('language.select')}
            >
              <Languages className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p className="text-xs">
              {t('language.name')}: {LANGUAGE_NAMES[currentLocale]} {LANGUAGE_FLAGS[currentLocale]}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <div className={`flex items-center gap-1 backdrop-blur border rounded-lg p-1 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/90 border-slate-300'
          : 'bg-black/80 border-slate-700'
      }`}>
        {(['en', 'de', 'es'] as SupportedLocale[]).map((locale) => (
          <Button
            key={locale}
            variant={currentLocale === locale ? 'default' : 'ghost'}
            size="sm"
            onClick={() => changeLanguage(locale)}
            className={`
              text-xs h-8 px-2 transition-all duration-300
              ${currentLocale === locale 
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
                : isScrolled
                  ? 'text-slate-900 hover:bg-slate-200'
                  : 'text-white hover:bg-slate-700'
              }
            `}
            aria-label={`${t('language.select')} ${LANGUAGE_NAMES[locale]}`}
          >
            <span className="mr-1">{LANGUAGE_FLAGS[locale]}</span>
            <span className="font-medium">{locale.toUpperCase()}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
