/**
 * AISettingsDialog Component
 *
 * Dialog for configuring AI translation and summary settings.
 * Supports OpenAI (ChatGPT) and local WebLLM backends.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { logger } from '../../utils/logger';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import {
  AutoAwesome as AutoAwesomeIcon,
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  Replay as ReplayIcon,
} from '@mui/icons-material';
import type { AiBackend, AiModelPreset } from '../../context/ai';
import { isWebGPUSupported } from '../../utils/webllmTranslation';

export interface AISettingsDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when dialog should close */
  onClose: () => void;

  // Translation settings
  /** Whether translation is enabled */
  translationEnabled: boolean;
  /** Callback to set translation enabled */
  setTranslationEnabled: (enabled: boolean) => void;
  /** Translation mode (fast or full) */
  translationMode: 'fast' | 'full';
  /** Callback to set translation mode */
  setTranslationMode: (mode: 'fast' | 'full') => void;
  /** Target language for translation */
  translationTargetLang: string;
  /** Whether translation is needed (UI not in English) */
  translationNeeded: boolean;

  // Summary settings
  /** Whether summary is enabled */
  summaryEnabled: boolean;
  /** Callback to set summary enabled */
  setSummaryEnabled: (enabled: boolean) => void;
  /** Callback to restart summary generation */
  restartSummary: () => void;

  // AI backend settings
  /** Current AI backend (openai or local) */
  aiBackend: AiBackend;
  /** Callback to set AI backend */
  setAiBackend: (backend: AiBackend) => void;
  /** OpenAI API key */
  openAiApiKey: string;
  /** Callback to set OpenAI API key */
  setOpenAiApiKey: (key: string) => void;
  /** OpenAI model name */
  openAiModel: string;
  /** Callback to set OpenAI model */
  setOpenAiModel: (model: string) => void;
  /** OpenAI base URL */
  openAiBaseUrl: string;
  /** Callback to set OpenAI base URL */
  setOpenAiBaseUrl: (url: string) => void;
  /** AI model preset for local backend */
  aiModelPreset: AiModelPreset;
  /** Callback to set AI model preset */
  setAiModelPreset: (preset: AiModelPreset) => void;
  /** Configured model ID from host app */
  configuredModelId?: string;
  /** Effective model ID being used */
  aiModelIdEffective: string;

  // Translation state
  /** Current translation state */
  translationState: 'disabled' | 'initializing' | 'translating' | 'ready' | 'error';
  /** Translation error message */
  translationError: string | null;
  /** Translation progress info */
  translationProgress: { translatedCheckpoints: number; totalCheckpoints: number } | null;
  /** Translation init progress (for local model download) */
  translationInitProgress: { progress: number; text?: string } | null;

  // Cache management
  /** Whether storage is persisted */
  translationStoragePersisted: boolean | null;
  /** Callback to refresh storage state */
  refreshPersistentStorageState: () => Promise<void>;
  /** Callback to clear translation cache */
  clearTranslationCache: () => void;
  /** Callback to restart translation */
  restartTranslation: () => void;

  // Analysis state
  /** Whether analysis data exists */
  hasAnalysisData: boolean;

  // Accordion state
  /** Whether OpenAI settings accordion is expanded */
  openAiSettingsExpanded: boolean;
  /** Callback to set OpenAI settings expanded */
  setOpenAiSettingsExpanded: (expanded: boolean) => void;
  /** Whether local settings accordion is expanded */
  localSettingsExpanded: boolean;
  /** Callback to set local settings expanded */
  setLocalSettingsExpanded: (expanded: boolean) => void;
}

export const AISettingsDialog: React.FC<AISettingsDialogProps> = ({
  open,
  onClose,
  translationEnabled,
  setTranslationEnabled,
  translationMode,
  setTranslationMode,
  translationTargetLang,
  translationNeeded,
  summaryEnabled,
  setSummaryEnabled,
  restartSummary,
  aiBackend,
  setAiBackend,
  openAiApiKey,
  setOpenAiApiKey,
  openAiModel,
  setOpenAiModel,
  openAiBaseUrl,
  setOpenAiBaseUrl,
  aiModelPreset,
  setAiModelPreset,
  configuredModelId,
  aiModelIdEffective,
  translationState,
  translationError,
  translationProgress,
  translationInitProgress,
  translationStoragePersisted,
  refreshPersistentStorageState,
  clearTranslationCache,
  restartTranslation,
  hasAnalysisData,
  openAiSettingsExpanded,
  setOpenAiSettingsExpanded,
  localSettingsExpanded,
  setLocalSettingsExpanded,
}) => {
  const { t } = useTranslation(['sidebar']);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{ style: { borderRadius: 12 } }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box display="flex" alignItems="center" gap={1}>
          <AutoAwesomeIcon />
          <Typography variant="h6" fontWeight={700}>
            {t('sidebar:ai_settings', { defaultValue: 'AI Assistant' })}
          </Typography>
        </Box>
        <IconButton onClick={onClose} aria-label={t('sidebar:close')}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {/* Main toggles */}
        <Box display="flex" alignItems="center" gap={1.5} flexWrap="wrap">
          <FormControlLabel
            control={
              <Switch
                checked={translationEnabled}
                onChange={(_, checked) => {
                  setTranslationEnabled(checked);
                  if (!checked && aiBackend === 'openai') {
                    setLocalSettingsExpanded(false);
                  }
                }}
              />
            }
            label={t('sidebar:translation_enable', { defaultValue: 'Auto-translate DQM results' })}
          />
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel id="dqm-translation-backend-label">
              {t('sidebar:ai_backend_label', { defaultValue: 'Übersetzungs-Backend' })}
            </InputLabel>
            <Select
              labelId="dqm-translation-backend-label"
              value={aiBackend}
              label={t('sidebar:ai_backend_label', { defaultValue: 'Übersetzungs-Backend' })}
              onChange={(e) => {
                const newBackend = e.target.value as AiBackend;
                setAiBackend(newBackend);
                if (newBackend === 'openai') {
                  setLocalSettingsExpanded(false);
                  setOpenAiSettingsExpanded(true);
                } else if (newBackend === 'local') {
                  if (!translationEnabled) setOpenAiSettingsExpanded(false);
                  setLocalSettingsExpanded(true);
                }
              }}
              MenuProps={{ disablePortal: true }}
              size="small"
            >
              <MenuItem value="openai">
                <Box display="flex" alignItems="center" gap={1}>
                  {t('sidebar:ai_backend_api', { defaultValue: 'ChatGPT (API)' })}
                  <Chip
                    size="small"
                    color="success"
                    label="API"
                    sx={{ height: 18, fontSize: '0.65rem' }}
                  />
                </Box>
              </MenuItem>
              <MenuItem value="local">
                <Box display="flex" alignItems="center" gap={1}>
                  {t('sidebar:ai_backend_local', { defaultValue: 'Local' })}
                  <Chip
                    size="small"
                    color="warning"
                    label="Beta"
                    sx={{ height: 18, fontSize: '0.65rem' }}
                  />
                </Box>
              </MenuItem>
            </Select>
          </FormControl>
        </Box>

        <FormControlLabel
          control={
            <Switch
              checked={summaryEnabled}
              onChange={(_, checked) => {
                setSummaryEnabled(checked);
                if (checked) restartSummary();
                if (!checked && aiBackend === 'local') {
                  setOpenAiSettingsExpanded(false);
                }
              }}
            />
          }
          label={t('sidebar:summary_enable', { defaultValue: 'AI summary card' })}
        />

        {/* ChatGPT Settings Accordion */}
        <Accordion
          defaultExpanded={summaryEnabled || aiBackend === 'openai'}
          expanded={openAiSettingsExpanded}
          onChange={(_, expanded) => setOpenAiSettingsExpanded(expanded)}
          sx={{
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            '&:before': { display: 'none' },
          }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box display="flex" alignItems="center" gap={1}>
              <Chip
                size="small"
                color="success"
                label="API"
                sx={{ height: 18, fontSize: '0.65rem' }}
              />
              <Typography fontWeight={700}>
                {t('sidebar:ai_backend_api', { defaultValue: 'ChatGPT (API)' })}
              </Typography>
              {summaryEnabled && (
                <Chip
                  size="small"
                  color="primary"
                  label={t('sidebar:summary_label', { defaultValue: 'Summary' })}
                  sx={{ height: 18, fontSize: '0.65rem' }}
                />
              )}
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Box display="flex" flexDirection="column" gap={1.5}>
              <Alert severity="info" sx={{ mb: 1 }}>
                {t('sidebar:summary_api_only', {
                  defaultValue:
                    'Summaries nutzen immer ChatGPT. Übersetzungen können optional ChatGPT oder lokal nutzen.',
                })}
              </Alert>
              <FormControl fullWidth size="small">
                <InputLabel id="dqm-openai-model-label">
                  {t('sidebar:openai_model', { defaultValue: 'OpenAI model' })}
                </InputLabel>
                <Select
                  labelId="dqm-openai-model-label"
                  value={openAiModel}
                  label={t('sidebar:openai_model', { defaultValue: 'OpenAI model' })}
                  MenuProps={{ disablePortal: true }}
                  onChange={(e) => setOpenAiModel(String(e.target.value))}
                >
                  <MenuItem value="gpt-4o-mini">gpt-4o-mini</MenuItem>
                  <MenuItem value="gpt-4o">gpt-4o</MenuItem>
                  <MenuItem value="gpt-4.1-mini">gpt-4.1-mini</MenuItem>
                  <MenuItem value="gpt-4.1">gpt-4.1</MenuItem>
                </Select>
              </FormControl>
              <Box display="flex" gap={1} flexWrap="wrap">
                <Box flex={1} minWidth={260}>
                  <TextField
                    size="small"
                    fullWidth
                    value={openAiBaseUrl}
                    onChange={(e) => setOpenAiBaseUrl(e.target.value)}
                    label={t('sidebar:openai_base_url', { defaultValue: 'OpenAI base URL' })}
                    placeholder="https://api.openai.com/v1"
                    inputProps={{ spellCheck: false }}
                  />
                </Box>
                <Box flex={1} minWidth={260}>
                  <TextField
                    size="small"
                    fullWidth
                    type="password"
                    value={openAiApiKey}
                    onChange={(e) => setOpenAiApiKey(e.target.value)}
                    label={t('sidebar:openai_api_key', { defaultValue: 'OpenAI API key' })}
                    placeholder="sk-..."
                    inputProps={{ spellCheck: false, autoComplete: 'off' }}
                  />
                </Box>
              </Box>
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Local Settings Accordion */}
        {(translationEnabled || aiBackend === 'local') && (
          <Accordion
            defaultExpanded={aiBackend === 'local'}
            expanded={localSettingsExpanded}
            onChange={(_, expanded) => setLocalSettingsExpanded(expanded)}
            sx={{
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
              '&:before': { display: 'none' },
            }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box display="flex" alignItems="center" gap={1}>
                <Chip
                  size="small"
                  color="warning"
                  label="Beta"
                  sx={{ height: 18, fontSize: '0.65rem' }}
                />
                <Typography fontWeight={700}>
                  {t('sidebar:ai_backend_local', { defaultValue: 'Local' })}
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Box display="flex" flexDirection="column" gap={1.5}>
                <Alert severity="warning" sx={{ mb: 1 }}>
                  {t('sidebar:ai_local_beta', {
                    defaultValue:
                      'Lokale KI (Beta): kann buggy, langsam oder ungenau sein und viel GPU/CPU/RAM verbrauchen. Läuft dafür lokal/datenschutzfreundlich.',
                  })}
                </Alert>
                <FormControl fullWidth size="small">
                  <InputLabel id="dqm-ai-model-label">
                    {t('sidebar:ai_model_label', { defaultValue: 'AI model' })}
                  </InputLabel>
                  <Select
                    labelId="dqm-ai-model-label"
                    value={configuredModelId ? 'configured' : aiModelPreset}
                    label={t('sidebar:ai_model_label', { defaultValue: 'AI model' })}
                    disabled={!!configuredModelId}
                    MenuProps={{ disablePortal: true }}
                    onChange={(e) => setAiModelPreset(e.target.value as AiModelPreset)}
                  >
                    <MenuItem value="fast">
                      {t('sidebar:ai_model_fast', { defaultValue: 'Fast (small, quickest)' })}
                    </MenuItem>
                    <MenuItem value="simple">
                      {t('sidebar:ai_model_simple', { defaultValue: 'Simple (very small)' })}
                    </MenuItem>
                    <MenuItem value="reliable">
                      {t('sidebar:ai_model_reliable', { defaultValue: 'Reliable (balanced)' })}
                    </MenuItem>
                    <MenuItem value="accurate">
                      {t('sidebar:ai_model_accurate', { defaultValue: 'Accurate (stronger, slower)' })}
                    </MenuItem>
                    {configuredModelId && (
                      <MenuItem value="configured">
                        {t('sidebar:ai_model_configured', { defaultValue: 'Configured by host app' })}
                      </MenuItem>
                    )}
                  </Select>
                </FormControl>
                {aiBackend === 'local' && !isWebGPUSupported() && (
                  <Alert severity="warning" sx={{ mt: 1 }}>
                    {t('sidebar:translation_webgpu_required', {
                      defaultValue: 'Translation requires a WebGPU-capable browser.',
                    })}
                  </Alert>
                )}
              </Box>
            </AccordionDetails>
          </Accordion>
        )}

        {aiBackend === 'local' && !isWebGPUSupported() && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            {t('sidebar:translation_webgpu_required', {
              defaultValue: 'Translation requires a WebGPU-capable browser.',
            })}
          </Alert>
        )}

        {/* Status and Progress Section */}
        {(translationEnabled || summaryEnabled) && (
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Typography variant="body2" color="text.secondary">
              {t('sidebar:translation_when', {
                defaultValue:
                  'Translation runs automatically after an analysis completes, when you change the UI language, or when you enable this toggle.',
              })}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {t('sidebar:ai_limitations', {
                defaultValue: 'AI kann sich irren oder halluzinieren – bitte Ergebnisse prüfen.',
              })}
            </Typography>

            {translationEnabled && !translationNeeded && (
              <Alert severity="info">
                {t('sidebar:translation_not_needed', {
                  defaultValue: 'UI language is English; translation is not needed.',
                })}
              </Alert>
            )}

            <Alert severity="info" sx={{ mt: 1 }}>
              {t('sidebar:summary_api_only', {
                defaultValue:
                  'Hinweis: Zusammenfassung nutzt immer ChatGPT (API). Übersetzungen können lokal oder via API laufen.',
              })}
            </Alert>

            <Typography variant="caption" color="text.secondary">
              {t('sidebar:ai_model_hint', {
                defaultValue: 'Model choice affects translation and summary quality/speed.',
              })}
            </Typography>

            <FormControlLabel
              control={
                <Switch
                  checked={translationMode === 'full'}
                  onChange={(_, checked) => setTranslationMode(checked ? 'full' : 'fast')}
                />
              }
              label={t('sidebar:translation_full_power', {
                defaultValue: 'Full translation (may take longer)',
              })}
            />

            <Typography variant="body2" color="text.secondary">
              {t('sidebar:translation_target_lang', {
                defaultValue: 'Target language: {{lang}}',
                lang: translationTargetLang,
              })}
            </Typography>

            {aiModelIdEffective && (
              <Typography variant="caption" color="text.secondary">
                {t('sidebar:translation_model', {
                  defaultValue: 'Model: {{model}}',
                  model: aiModelIdEffective,
                })}
              </Typography>
            )}

            {/* Translation State Indicators */}
            {translationState === 'initializing' && (
              <>
                <Typography variant="body2" fontWeight={600}>
                  {t('sidebar:translation_downloading')}
                </Typography>
                <LinearProgress
                  variant={translationInitProgress ? 'determinate' : 'indeterminate'}
                  value={translationInitProgress ? translationInitProgress.progress * 100 : undefined}
                />
                {translationInitProgress?.text && (
                  <Typography variant="caption" color="text.secondary">
                    {translationInitProgress.text}
                  </Typography>
                )}
              </>
            )}

            {translationState === 'translating' && (
              <>
                <Typography variant="body2" fontWeight={600}>
                  {t('sidebar:translation_translating')}
                </Typography>
                <LinearProgress
                  variant={translationProgress ? 'determinate' : 'indeterminate'}
                  value={
                    translationProgress && translationProgress.totalCheckpoints > 0
                      ? (translationProgress.translatedCheckpoints /
                          translationProgress.totalCheckpoints) *
                        100
                      : undefined
                  }
                />
                {translationProgress && (
                  <Typography variant="caption" color="text.secondary">
                    {t('sidebar:translation_progress', {
                      done: translationProgress.translatedCheckpoints,
                      total: translationProgress.totalCheckpoints,
                    })}
                  </Typography>
                )}
              </>
            )}

            {translationState === 'ready' && (
              <Alert severity="success">{t('sidebar:translation_ready')}</Alert>
            )}

            {translationError && (
              <Alert severity={translationState === 'error' ? 'error' : 'info'}>
                {translationError}
              </Alert>
            )}

            {/* Action Buttons */}
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              gap={1}
              flexWrap="wrap"
            >
              {aiBackend === 'local' && translationStoragePersisted === false ? (
                <Button
                  variant="outlined"
                  onClick={async () => {
                    try {
                      const granted = await (navigator as any).storage?.persist?.();
                      await refreshPersistentStorageState();
                      if (granted !== true) {
                        logger.warn('Persistent storage was not granted');
                      }
                    } catch {
                      logger.error('Failed to request persistent storage');
                    }
                  }}
                  disabled={
                    typeof navigator === 'undefined' || !(navigator as any).storage?.persist
                  }
                  sx={{ textTransform: 'none' }}
                >
                  {t('sidebar:translation_request_persistent_storage')}
                </Button>
              ) : (
                <Box sx={{ width: 1 }} />
              )}
              <Button
                variant="outlined"
                color="warning"
                onClick={clearTranslationCache}
                sx={{ textTransform: 'none' }}
              >
                {t('sidebar:ai_cache_clear')}
              </Button>
              <Button
                variant="outlined"
                startIcon={<ReplayIcon />}
                onClick={restartTranslation}
                disabled={
                  !hasAnalysisData || !translationEnabled || translationState === 'initializing'
                }
                sx={{ textTransform: 'none' }}
              >
                {t('sidebar:translation_restart')}
              </Button>
              <Button
                variant="outlined"
                startIcon={<ReplayIcon />}
                onClick={restartSummary}
                disabled={!hasAnalysisData || !summaryEnabled}
                sx={{ textTransform: 'none' }}
              >
                {t('sidebar:summary_restart')}
              </Button>
              <Button onClick={onClose} sx={{ textTransform: 'none' }}>
                {t('sidebar:close')}
              </Button>
            </Box>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AISettingsDialog;
