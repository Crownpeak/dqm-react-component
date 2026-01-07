/**
 * AISettingsDialog Component
 *
 * Dialog for configuring AI translation and summary settings.
 * Uses OpenAI (ChatGPT) backend for all AI features.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
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

  // OpenAI settings
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
  /** Effective model ID being used */
  aiModelIdEffective: string;

  // Translation state
  /** Current translation state */
  translationState: 'disabled' | 'initializing' | 'translating' | 'ready' | 'error';
  /** Translation error message */
  translationError: string | null;
  /** Translation progress info */
  translationProgress: { translatedCheckpoints: number; totalCheckpoints: number } | null;

  // Cache management
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
  openAiApiKey,
  setOpenAiApiKey,
  openAiModel,
  setOpenAiModel,
  openAiBaseUrl,
  setOpenAiBaseUrl,
  aiModelIdEffective,
  translationState,
  translationError,
  translationProgress,
  clearTranslationCache,
  restartTranslation,
  hasAnalysisData,
  openAiSettingsExpanded,
  setOpenAiSettingsExpanded,
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
                onChange={(_, checked) => setTranslationEnabled(checked)}
              />
            }
            label={t('sidebar:translation_enable', { defaultValue: 'Auto-translate DQM results' })}
          />
        </Box>

        <FormControlLabel
          control={
            <Switch
              checked={summaryEnabled}
              onChange={(_, checked) => {
                setSummaryEnabled(checked);
                if (checked) restartSummary();
              }}
            />
          }
          label={t('sidebar:summary_enable', { defaultValue: 'AI summary card' })}
        />

        {/* OpenAI Settings Accordion */}
        <Accordion
          defaultExpanded={summaryEnabled || translationEnabled}
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
                {t('sidebar:openai_info', {
                  defaultValue:
                    'Uses an OpenAI-compatible Chat Completions API. A browser call usually requires a CORS-enabled proxy.',
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

        {/* Status and Progress Section */}
        {(translationEnabled || summaryEnabled) && (
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Typography variant="body2" color="text.secondary">
              {t('sidebar:translation_when', {
                defaultValue:
                  'AI features run automatically after an analysis completes, when you change the UI language, or when you enable them here.',
              })}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {t('sidebar:ai_limitations', {
                defaultValue: 'AI can be wrong or hallucinate – please verify results.',
              })}
            </Typography>

            {translationEnabled && !translationNeeded && (
              <Alert severity="info">
                {t('sidebar:translation_not_needed', {
                  defaultValue: 'UI language is English; translation is not needed.',
                })}
              </Alert>
            )}

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
                <LinearProgress variant="indeterminate" />
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
              justifyContent="flex-end"
              alignItems="center"
              gap={1}
              flexWrap="wrap"
            >
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
