'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import { 
  Bot, 
  BarChart3, 
  Shield, 
  Highlighter, 
  Lock, 
  Globe, 
  Package,
  Sparkles,
  Accessibility,
  Search,
  FileText,
  Zap,
  Server,
  LucideIcon
} from 'lucide-react';

type FeatureKey = 'translation' | 'qualityAnalysis' | 'accessibility' | 'errorHighlighting' | 'secureAuth' | 'multilingual' | 'widgetBundle' | 'mcpServer';
type CategoryKey = 'accessibility' | 'seo' | 'content' | 'performance';

interface FeatureConfig {
  icon: LucideIcon;
  key: FeatureKey;
  badge: string | null;
  badgeColor?: string;
  gradient: string;
  link?: string;
}

interface CategoryConfig {
  icon: LucideIcon;
  key: CategoryKey;
  color: string;
}

const featureConfigs: FeatureConfig[] = [
  {
    icon: Bot,
    key: 'translation',
    badge: 'translation',
    badgeColor: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white',
    gradient: 'from-purple-500/20 to-pink-500/20'
  },
  {
    icon: BarChart3,
    key: 'qualityAnalysis',
    badge: null,
    gradient: 'from-blue-500/20 to-cyan-500/20'
  },
  {
    icon: Shield,
    key: 'accessibility',
    badge: 'WCAG 2.1',
    badgeColor: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    gradient: 'from-green-500/20 to-emerald-500/20'
  },
  {
    icon: Highlighter,
    key: 'errorHighlighting',
    badge: null,
    gradient: 'from-orange-500/20 to-red-500/20'
  },
  {
    icon: Lock,
    key: 'secureAuth',
    badge: null,
    gradient: 'from-slate-500/20 to-zinc-500/20'
  },
  {
    icon: Globe,
    key: 'multilingual',
    badge: 'i18n',
    badgeColor: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300',
    gradient: 'from-indigo-500/20 to-violet-500/20'
  },
  {
    icon: Package,
    key: 'widgetBundle',
    badge: null,
    gradient: 'from-amber-500/20 to-yellow-500/20'
  },
  {
    icon: Server,
    key: 'mcpServer',
    badge: 'MCP',
    badgeColor: 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white',
    gradient: 'from-cyan-500/20 to-blue-500/20',
    link: 'https://github.com/Crownpeak/dqm-react-component/wiki/MCP-Server-Integration'
  }
];

const categoryConfigs: CategoryConfig[] = [
  { icon: Accessibility, key: 'accessibility', color: 'text-green-500' },
  { icon: Search, key: 'seo', color: 'text-blue-500' },
  { icon: FileText, key: 'content', color: 'text-purple-500' },
  { icon: Zap, key: 'performance', color: 'text-yellow-500' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export function FeaturesSection() {
  const { t } = useTranslation('common');
  
  return (
    <section id="features" className="py-24 bg-slate-50 dark:bg-slate-900">
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
            <Sparkles className="h-3 w-3 mr-1" />
            {t('features.title')}
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-slate-900 dark:text-white">
            {t('features.title')}
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              {t('features.subtitle')}
            </span>
          </h2>
        </motion.div>

        {/* Category Pills */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-wrap justify-center gap-4 mb-16"
        >
          {categoryConfigs.map((category) => (
            <div
              key={category.key}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 rounded-full shadow-sm border border-slate-200 dark:border-slate-700"
            >
              <category.icon className={`h-5 w-5 ${category.color}`} />
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {t(`features.categories.${category.key}`)}
              </span>
            </div>
          ))}
        </motion.div>

        {/* Features Grid - Bento Style */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr"
        >
          {featureConfigs.map((feature, index) => {
            const CardWrapper = feature.link ? 'a' : 'div';
            const cardProps = feature.link ? { 
              href: feature.link, 
              target: '_blank', 
              rel: 'noopener noreferrer',
              'aria-label': t(`features.items.${feature.key}.title`) + ' - Open documentation'
            } : {};
            
            return (
            <motion.div
              key={feature.key}
              variants={itemVariants}
              className={(index === 0 ? 'lg:col-span-2' : '')}
            >
              <CardWrapper {...cardProps} style={{ height: '100%' }}>
              <Card className={`h-full border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br ${feature.gradient} bg-white dark:bg-slate-800 overflow-hidden group ${feature.link ? 'cursor-pointer' : ''}`} style={{ height: 100 + '%' }}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <feature.icon className="h-6 w-6 text-slate-700 dark:text-slate-200" />
                    </div>
                    {feature.badge && (
                      <Badge className={feature.badgeColor || 'bg-slate-100 text-slate-700'}>
                        {feature.badge === 'translation' ? t('features.items.translation.badge') : feature.badge}
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-xl text-slate-900 dark:text-white">
                    {t(`features.items.${feature.key}.title`)}
                  </CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-400 text-base">
                    {t(`features.items.${feature.key}.description`)}
                  </CardDescription>
                </CardHeader>
                {index === 0 && (
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">GPT-5.2</Badge>
                      <Badge variant="outline">{t('features.items.translation.tags.autoDetect')}</Badge>
                      <Badge variant="outline">{t('features.items.translation.tags.summary')}</Badge>
                      <Badge variant="outline">{t('features.items.translation.tags.contextual')}</Badge>
                    </div>
                  </CardContent>
                )}
              </Card>
              </CardWrapper>
            </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
