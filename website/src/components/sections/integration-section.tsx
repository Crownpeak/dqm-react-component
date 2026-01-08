'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { 
  Code2, 
  Copy, 
  Check,
  Terminal,
  FileCode,
  Globe
} from 'lucide-react';

type CodeExampleKey = 'react' | 'backend' | 'widget' | 'ai';

interface CodeExample {
  tabKey: CodeExampleKey;
  language: string;
  getCode: (t: (key: string) => string) => string;
}

const codeExamples: CodeExample[] = [
  {
    tabKey: 'react',
    language: 'tsx',
    getCode: () => `import { DQMSidebar } from '@crownpeak/dqm-react-component';
import { useState } from 'react';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <YourApp />
      <DQMSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpen={() => setSidebarOpen(true)}
        config={{
          apiKey: process.env.REACT_APP_DQM_API_KEY,
          websiteId: process.env.REACT_APP_DQM_WEBSITE_ID,
        }}
      />
    </>
  );
}`
  },
  {
    tabKey: 'backend',
    language: 'tsx',
    getCode: (t) => `import { DQMSidebar } from '@crownpeak/dqm-react-component';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <DQMSidebar
      open={sidebarOpen}
      onClose={() => setSidebarOpen(false)}
      onOpen={() => setSidebarOpen(true)}
      config={{
        // ${t('integration.codeComments.secureServerSide')}
        authBackendUrl: 'https://api.yourcompany.com',
        useLocalStorage: true,
      }}
      onAuthSuccess={(creds) => {
        console.log('Authenticated:', creds.sessionType);
      }}
    />
  );
}`
  },
  {
    tabKey: 'widget',
    language: 'html',
    getCode: (t) => `<!-- ${t('integration.codeComments.forCms')} -->
<script src="https://unpkg.com/@crownpeak/dqm-react-component/dist/dqm-widget.iife.js"></script>
<script>
  window.DQMWidget.loadDQMWidget({
    config: {
      websiteId: 'your-website-id',
      apiKey: 'your-api-key',
      // ${t('integration.codeComments.aiTranslation')}
      translationConfig: {
        enabled: true,
        targetLanguage: 'de',
        provider: 'openai'
      }
    }
  });
</script>`
  },
  {
    tabKey: 'ai',
    language: 'tsx',
    getCode: (t) => `import { DQMSidebar } from '@crownpeak/dqm-react-component';

<DQMSidebar
  open={sidebarOpen}
  onClose={() => setSidebarOpen(false)}
  onOpen={() => setSidebarOpen(true)}
  config={{
    apiKey: 'your-dqm-api-key',
    websiteId: 'your-website-id',
    
    // ${t('integration.codeComments.aiTranslation')} (OpenAI)
    translationConfig: {
      enabled: true,
      targetLanguage: 'de',
      provider: 'openai',
      openaiApiKey: process.env.OPENAI_API_KEY,
      model: 'gpt-4-turbo'
    },
    
    // ${t('integration.codeComments.aiSummary')}
    summaryConfig: {
      enabled: true,
      provider: 'openai',
      openaiApiKey: process.env.OPENAI_API_KEY
    }
  }}
/>`
  }
];

export function IntegrationSection() {
  const { t } = useTranslation('common');
  const [copiedTab, setCopiedTab] = useState<string | null>(null);

  const copyCode = async (tab: string, code: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedTab(tab);
    setTimeout(() => setCopiedTab(null), 2000);
  };

  return (
    <section id="integration" className="py-24 bg-slate-50 dark:bg-slate-900">
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
            <Code2 className="h-3 w-3 mr-1" />
            {t('integration.title')}
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-slate-900 dark:text-white">
            {t('integration.title')}
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              {t('integration.subtitle')}
            </span>
          </h2>
        </motion.div>

        {/* Installation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="max-w-4xl mx-auto mb-12"
        >
          <Card className="bg-slate-900 border-slate-700">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <Terminal className="h-4 w-4" />
                {t('integration.installation')}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between bg-slate-800 rounded-lg p-4">
                <code className="text-green-400 font-mono text-sm">
                  npm install @crownpeak/dqm-react-component
                </code>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => copyCode('install', 'npm install @crownpeak/dqm-react-component')}
                  className="text-slate-400 hover:text-white"
                  aria-label={copiedTab === 'install' ? t('integration.copied') : t('integration.copy')}
                >
                  {copiedTab === 'install' ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Code Examples */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="max-w-4xl mx-auto"
        >
          <Tabs defaultValue="react" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="react" className="flex items-center gap-2">
                <FileCode className="h-4 w-4" />
                <span className="hidden sm:inline">React</span>
              </TabsTrigger>
              <TabsTrigger value="backend" className="flex items-center gap-2">
                <Terminal className="h-4 w-4" />
                <span className="hidden sm:inline">Backend</span>
              </TabsTrigger>
              <TabsTrigger value="widget" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                <span className="hidden sm:inline">Widget</span>
              </TabsTrigger>
              <TabsTrigger value="ai" className="flex items-center gap-2">
                <span className="hidden sm:inline">AI</span>
              </TabsTrigger>
            </TabsList>

            {codeExamples.map((example) => {
              const code = example.getCode(t);
              return (
                <TabsContent key={example.tabKey} value={example.tabKey}>
                  <Card className="bg-slate-900 border-slate-700 overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between py-3 px-4 border-b border-slate-700 bg-slate-800">
                      <div className="flex items-center gap-3">
                        <div className="flex gap-1.5">
                          <div className="w-3 h-3 rounded-full bg-red-500/80" />
                          <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                          <div className="w-3 h-3 rounded-full bg-green-500/80" />
                        </div>
                        <span className="text-sm text-slate-400 font-mono">
                          {t(`integration.tabs.${example.tabKey}`)}
                        </span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => copyCode(example.tabKey, code)}
                        className="text-slate-400 hover:text-white"
                      >
                        {copiedTab === example.tabKey ? (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            {t('integration.copied')}
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4 mr-2" />
                            {t('integration.copy')}
                          </>
                        )}
                      </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                      <pre className="p-4 overflow-x-auto text-sm">
                        <code className="text-slate-300 font-mono whitespace-pre">
                          {code}
                        </code>
                      </pre>
                    </CardContent>
                  </Card>
                </TabsContent>
              );
            })}
          </Tabs>
        </motion.div>

        {/* Documentation Link */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center mt-12"
        >
          <Button variant="outline" size="lg" asChild>
            <a 
              href="https://github.com/Crownpeak/dqm-react-component/wiki" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <FileCode className="h-5 w-5 mr-2" />
              {t('integration.fullDocs')}
            </a>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
