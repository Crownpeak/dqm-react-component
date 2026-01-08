'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import { 
  Play, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  BarChart3,
  ArrowRight
} from 'lucide-react';

interface DemoSectionProps {
  onOpenDemo: () => void;
}

export function DemoSection({ onOpenDemo }: DemoSectionProps) {
  const { t } = useTranslation('common');
  
  return (
    <section id="demo" className="py-24 bg-white dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <Badge variant="secondary" className="mb-4">
            <Play className="h-3 w-3 mr-1" />
            {t('demo.title')}
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-slate-900 dark:text-white">
            {t('demo.title')}
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              {t('demo.subtitle')}
            </span>
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
            {t('demo.description')}
          </p>
        </motion.div>

        {/* Demo Preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative max-w-5xl mx-auto"
        >
          {/* Browser Frame */}
          <div className="rounded-2xl overflow-hidden bg-slate-900 shadow-2xl border border-slate-700">
            {/* Browser Header */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-700 bg-slate-800">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
              <div className="flex-1 mx-4">
                <div className="bg-slate-700 rounded-md px-4 py-1.5 text-sm text-slate-400 max-w-md mx-auto text-center">
                  https://your-website.com/page
                </div>
              </div>
            </div>

            {/* Browser Content */}
            <div className="relative aspect-video bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 p-8">
              {/* Mock Website Content */}
              <div className="h-full bg-white dark:bg-slate-900 rounded-lg shadow-lg p-6 overflow-hidden">
                <div className="space-y-4">
                  <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                  <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-full" />
                  <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-5/6" />
                  <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-4/6" />
                  <div className="grid grid-cols-3 gap-4 mt-6">
                    <div className="h-24 bg-slate-100 dark:bg-slate-800 rounded" />
                    <div className="h-24 bg-slate-100 dark:bg-slate-800 rounded" />
                    <div className="h-24 bg-slate-100 dark:bg-slate-800 rounded" />
                  </div>
                </div>
              </div>

              {/* DQM Widget Preview (Sidebar Mockup) */}
              <div className="absolute right-0 top-0 bottom-0 w-80 bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-700 p-4 transform translate-x-1/2 opacity-50">
                <div className="h-full flex flex-col">
                  <div className="h-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg mb-4" />
                  <div className="space-y-3 flex-1">
                    <div className="h-20 bg-slate-100 dark:bg-slate-800 rounded" />
                    <div className="h-16 bg-slate-100 dark:bg-slate-800 rounded" />
                    <div className="h-16 bg-slate-100 dark:bg-slate-800 rounded" />
                  </div>
                </div>
              </div>

              {/* CTA Overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-sm">
                <Button 
                  size="lg"
                  onClick={onOpenDemo}
                  className="hover:cursor-pointer text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-all group"
                >
                  <Play className="h-6 w-6 mr-2 group-hover:scale-110 transition-transform" />
                  {t('demo.button')}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 max-w-4xl mx-auto"
        >
          <Card className="text-center p-6 border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950">
            <CardContent className="p-0">
              <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-3xl font-bold text-green-700 dark:text-green-400">16</p>
              <p className="text-sm text-green-600 dark:text-green-500">{t('demo.stats.passed')}</p>
            </CardContent>
          </Card>
          <Card className="text-center p-6 border-yellow-200 dark:border-yellow-900 bg-yellow-50 dark:bg-yellow-950">
            <CardContent className="p-0">
              <AlertTriangle className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
              <p className="text-3xl font-bold text-yellow-700 dark:text-yellow-400">3</p>
              <p className="text-sm text-yellow-600 dark:text-yellow-500">{t('demo.stats.warnings')}</p>
            </CardContent>
          </Card>
          <Card className="text-center p-6 border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950">
            <CardContent className="p-0">
              <XCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
              <p className="text-3xl font-bold text-red-700 dark:text-red-400">1</p>
              <p className="text-sm text-red-600 dark:text-red-500">{t('demo.stats.errors')}</p>
            </CardContent>
          </Card>
          <Card className="text-center p-6 border-indigo-200 dark:border-indigo-900 bg-indigo-50 dark:bg-indigo-950">
            <CardContent className="p-0">
              <BarChart3 className="h-8 w-8 text-indigo-600 mx-auto mb-2" />
              <p className="text-3xl font-bold text-indigo-700 dark:text-indigo-400">87%</p>
              <p className="text-sm text-indigo-600 dark:text-indigo-500">{t('demo.stats.totalScore')}</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
