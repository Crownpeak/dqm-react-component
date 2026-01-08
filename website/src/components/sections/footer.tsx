'use client';

import React from 'react';
import { Separator } from '@/components/ui/separator';
import { useTranslation } from 'react-i18next';
import { 
  Github, 
  BookOpen, 
  ExternalLink,
  Heart,
  Cookie
} from 'lucide-react';
import Image from 'next/image';
import * as CookieConsent from 'vanilla-cookieconsent';

export function Footer() {
  const { t } = useTranslation('common');

  const links = {
    product: [
      { key: 'features', href: '#features' },
      { key: 'demo', href: '#demo' },
      { key: 'integration', href: '#integration' },
    ],
    resources: [
      { key: 'docs', href: 'https://github.com/Crownpeak/dqm-react-component/wiki', external: true },
      { key: 'github', href: 'https://github.com/Crownpeak/dqm-react-component', external: true },
      { key: 'npm', href: 'https://www.npmjs.com/package/@crownpeak/dqm-react-component', external: true },
    ],
    company: [
      { key: 'website', href: 'https://www.crownpeak.com', external: true },
      { key: 'dqmPlatform', href: 'https://www.crownpeak.com/products/digital-quality-management', external: true },
      { key: 'support', href: 'https://www.crownpeak.com/support', external: true },
    ],
    legal: [
      { key: 'imprint', href: 'https://www.crownpeak.com/richtlinien/impressum/', external: true },
      { key: 'privacy', href: 'https://www.crownpeak.com/richtlinien/datenschutzerklaerung/', external: true },
      { key: 'cookieSettings', href: '#', external: false, isCookieSettings: true },
    ],
  };
  
  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <Image className="rounded-xs" src="crownpeak_icon.png" alt="DQM React Logo" width={40} height={40} />  
              <div>
                <p className="font-bold text-white">DQM React</p>
                <p className="text-xs text-slate-400">by Crownpeak</p>
              </div>
            </div>
            <p className="text-sm text-slate-400 mb-4">
              {t('footer.description')}
            </p>
            <div className="flex items-center gap-4">
              <a 
                href="https://github.com/Crownpeak/dqm-react-component" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
                aria-label="GitHub Repository"
              >
                <Github className="h-5 w-5" />
              </a>
              <a 
                href="https://www.npmjs.com/package/@crownpeak/dqm-react-component" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
                aria-label="NPM Package"
              >
                <BookOpen className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="font-semibold text-white mb-4">{t('footer.columns.product')}</h3>
            <ul className="space-y-3">
              {links.product.map((link) => (
                <li key={link.key}>
                  <a 
                    href={link.href}
                    className="hover:text-white transition-colors text-sm"
                  >
                    {t(`footer.navigation.${link.key}`)}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h3 className="font-semibold text-white mb-4">{t('footer.columns.resources')}</h3>
            <ul className="space-y-3">
              {links.resources.map((link) => (
                <li key={link.key}>
                  <a 
                    href={link.href}
                    target={link.external ? '_blank' : undefined}
                    rel={link.external ? 'noopener noreferrer' : undefined}
                    className="hover:text-white transition-colors text-sm inline-flex items-center gap-1"
                  >
                    {t(`footer.links.${link.key}`)}
                    {link.external && <ExternalLink className="h-3 w-3" />}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="font-semibold text-white mb-4">Crownpeak</h3>
            <ul className="space-y-3">
              {links.company.map((link) => (
                <li key={link.key}>
                  <a 
                    href={link.href}
                    target={link.external ? '_blank' : undefined}
                    rel={link.external ? 'noopener noreferrer' : undefined}
                    className="hover:text-white transition-colors text-sm inline-flex items-center gap-1"
                  >
                    {t(`footer.links.${link.key}`)}
                    {link.external && <ExternalLink className="h-3 w-3" />}
                  </a>
                </li>
              ))}
              {/* Legal Links */}
              <li className="pt-2 border-t border-slate-800">
                <ul className="space-y-3 pt-2">
                  {links.legal.map((link) => (
                    <li key={link.key}>
                      {'isCookieSettings' in link && link.isCookieSettings ? (
                        <button
                          type="button"
                          onClick={() => CookieConsent.showPreferences()}
                          className="hover:text-white transition-colors text-sm inline-flex items-center gap-1 cursor-pointer bg-transparent border-none p-0 text-slate-300"
                        >
                          <Cookie className="h-3 w-3" />
                          {t(`footer.links.${link.key}`)}
                        </button>
                      ) : (
                        <a 
                          href={link.href}
                          target={link.external ? '_blank' : undefined}
                          rel={link.external ? 'noopener noreferrer' : undefined}
                          className="hover:text-white transition-colors text-sm inline-flex items-center gap-1"
                        >
                          {t(`footer.links.${link.key}`)}
                          {link.external && <ExternalLink className="h-3 w-3" />}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="bg-slate-800" />

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between pt-8 gap-4">
          <p className="text-sm text-slate-400">
            {t('footer.copyright')}
          </p>
          <p className="text-sm text-slate-400 flex items-center gap-1">
            {t('footer.madeWith')} <Heart className="h-4 w-4 text-red-500" /> {t('footer.byTeam')}
          </p>
        </div>
      </div>
    </footer>
  );
}
