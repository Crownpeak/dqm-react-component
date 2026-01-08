'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowRight, 
  Github, 
  Sparkles, 
  Play,
  Shield,
  Zap
} from 'lucide-react';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';

interface HeroSectionProps {
  onOpenDemo: () => void;
}

export function HeroSection({ onOpenDemo }: HeroSectionProps) {
  const { t } = useTranslation('common');
  
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950" />
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-conic from-indigo-500/10 via-purple-500/10 to-indigo-500/10 rounded-full blur-2xl opacity-50" />
      </div>

      {/* Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}
      />

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Version Badge */}
          <Badge 
            variant="secondary" 
            className="mb-6 bg-indigo-500/20 text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/30 transition-colors"
          >
            <Sparkles className="h-3 w-3 mr-1" />
            {t('hero.badge')}
          </Badge>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-5xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-200 to-purple-200"
        >
          <span className="inline-flex gap-2 items-center justify-center">
            <Image src="/logo_crownpeak.svg" alt="Crownpeak Logo" width={350} height={100} style={{top: 10, position: 'relative'}} />
            {t('hero.title')}
          </span>
          <br />
          <span className="text-4xl md:text-6xl">{t('hero.subtitle')}</span>
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-xl md:text-2xl text-slate-300 mb-8 max-w-3xl mx-auto leading-relaxed"
          dangerouslySetInnerHTML={{ __html: t('hero.description') }}
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
        >
          <Button 
            size="lg" 
            onClick={onOpenDemo}
            className="text-white hover:cursor-pointer bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-lg px-8 py-6 group"
          >
            <Play className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
            {t('hero.demoButton')}
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            className="bg-black border-slate-700 text-white hover:bg-slate-900 hover:border-slate-600 text-lg px-8 py-6"
            asChild
          >
            <a href="https://github.com/Crownpeak/dqm-react-component" target="_blank" rel="noopener noreferrer">
              <Github className="h-5 w-5 mr-2" />
              {t('hero.githubButton')}
            </a>
          </Button>
        </motion.div>

        {/* Feature Highlights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-400"
        >
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-green-400" />
            <span>{t('hero.features.accessibility')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-yellow-400" />
            <span>{t('hero.features.performance')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-400" />
            <span>{t('hero.features.secure')}</span>
          </div>
        </motion.div>

        {/* Code Preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-12 mb-6 max-w-2xl mx-auto"
        >
          <div className="relative rounded-xl overflow-hidden bg-slate-900/80 backdrop-blur border border-slate-700/50 shadow-2xl">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-700/50 bg-slate-800/50">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
              <span className="ml-4 text-xs text-slate-400 font-mono">App.tsx</span>
            </div>
            <pre className="p-6 text-left text-sm overflow-x-auto">
              <code className="text-slate-300">
                <span className="text-purple-400">import</span>{' '}
                <span className="text-slate-100">{'{ DQMSidebar }'}</span>{' '}
                <span className="text-purple-400">from</span>{' '}
                <span className="text-green-400">&apos;@crownpeak/dqm-react-component&apos;</span>;
                {'\n\n'}
                <span className="text-purple-400">function</span>{' '}
                <span className="text-yellow-300">App</span>() {'{'}
                {'\n  '}
                <span className="text-purple-400">return</span> (
                {'\n    '}
                <span className="text-slate-400">{'<'}</span>
                <span className="text-indigo-400">DQMSidebar</span>
                {'\n      '}
                <span className="text-sky-300">open</span>=<span className="text-slate-100">{'{sidebarOpen}'}</span>
                {'\n      '}
                <span className="text-sky-300">onClose</span>=<span className="text-slate-100">{'{() => setSidebarOpen(false)}'}</span>
                {'\n      '}
                <span className="text-sky-300">onOpen</span>=<span className="text-slate-100">{'{() => setSidebarOpen(true)}'}</span>
                {'\n    '}
                <span className="text-slate-400">/{'>'}</span>
                {'\n  '}
                );
                {'\n'}
                {'}'}
              </code>
            </pre>
          </div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <div className="flex flex-col items-center gap-2 text-slate-400">
            <span className="text-xs">{t('hero.scrollHint', { defaultValue: 'Scroll for more' })}</span>
            <div className="w-6 h-10 border-2 border-slate-500 rounded-full flex justify-center">
              <div className="w-1.5 h-3 bg-slate-400 rounded-full mt-2 animate-bounce" />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
