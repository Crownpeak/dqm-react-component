/**
 * HighlightModal Component
 *
 * Modal dialog for displaying highlighted errors in browser and source views.
 * Supports navigation between highlights and checkpoint information display.
 */
import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Skeleton,
  Tab,
  Tabs,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  Close as CloseIcon,
  OpenInNew as OpenInNewIcon,
  Replay as ReplayIcon,
} from '@mui/icons-material';
import type { AnalysisData } from '../../types';
import { BrowserViewRenderer, SafeParsedHtml, ShadowDOMRenderer } from '../renderers';
import { sanitizeHtmlDocument } from '../../utils/sanitizeHtmlDocument';

export interface HighlightModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Current checkpoint being displayed */
  checkpoint: AnalysisData['checkpoints'][0] | null;
  /** HTML content to display */
  highlightedContent: string;
  /** Current view mode (browser or source) */
  viewMode: 'browser' | 'source';
  /** Callback when view mode changes */
  onViewModeChange: (mode: 'browser' | 'source') => void;
  /** Total number of highlights found */
  totalHighlights: number;
  /** Current highlight index (1-based) */
  currentHighlight: number;
  /** Currently visible highlight index (1-based, from scroll tracking) */
  visibleHighlight: number;
  /** Callback when navigating to prev/next highlight */
  onNavigate: (direction: 'prev' | 'next') => void;
  /** Callback when reload button is clicked */
  onReload: () => void;
  /** Whether content is loading */
  isLoading: boolean;
  /** Whether scripts are disabled in browser view */
  scriptsDisabled: boolean;
  /** Callback to toggle scripts */
  onScriptsToggle: () => void;
  /** Callback when highlights are found in content */
  onHighlightsFound: (count: number) => void;
  /** Callback when visible highlight changes (passive scroll tracking) */
  onVisibleHighlightChange: (index: number) => void;
  /** Click indicator for triggering scroll */
  clickedIndicator: number;
  /** Whether auto-scroll to first has occurred */
  hasAutoScrolled: boolean;
  /** Shadow DOM mode for MUI components */
  shadowDomMode?: boolean;
}

export const HighlightModal: React.FC<HighlightModalProps> = ({
  open,
  onClose,
  checkpoint,
  highlightedContent,
  viewMode,
  onViewModeChange,
  totalHighlights,
  currentHighlight,
  visibleHighlight,
  onNavigate,
  onReload,
  isLoading,
  scriptsDisabled,
  onScriptsToggle,
  onHighlightsFound,
  onVisibleHighlightChange,
  clickedIndicator,
  hasAutoScrolled,
  shadowDomMode,
}) => {
  const { t } = useTranslation(['sidebar']);
  const contentBoxRef = useRef<HTMLDivElement>(null);

  const handleOpenInNewTab = () => {
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      try {
        newWindow.opener = null;
      } catch {
        // ignore
      }
      const safeHtml = sanitizeHtmlDocument(highlightedContent, { allowScripts: false });
      newWindow.document.open();
      newWindow.document.write(safeHtml);
      newWindow.document.close();

      // Add scrollIntoView functionality for highlights in the new tab
      setTimeout(() => {
        const highlightSelectors = [
          '.astHighlightFull',
          '.astHighlightStart',
          '.astHighlightMiddle',
          '.astHighlightEnd',
          '.astError',
        ];

        const highlights = newWindow.document.querySelectorAll(highlightSelectors.join(', '));

        if (highlights.length > 0) {
          const firstHighlight = highlights[0] as HTMLElement;
          firstHighlight.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });
          firstHighlight.classList.add('animate');

          setTimeout(() => {
            firstHighlight.classList.remove('animate');
          }, 800);
        }
      }, 500);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xl"
      fullWidth
      PaperProps={{
        style: {
          borderRadius: 12,
          padding: 24,
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 24px',
          borderBottom: '1px solid #e0e0e0',
        }}
      >
        <Typography variant="h6" fontWeight={700} color="text.primary">
          {t('sidebar:highlighted_errors')}
        </Typography>
        <IconButton
          onClick={onClose}
          sx={{
            color: 'text.secondary',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.04)',
            },
          }}
          aria-label={t('sidebar:close')}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ padding: '16px 24px', borderBottom: 'none' }}>
        <Box flexDirection="row" display="flex" gap={2}>
          {/* Checkpoint Information Panel */}
          {checkpoint && (
            <Box
              width="20%"
              sx={{
                maxHeight: 'calc(100vh - 300px)',
                height: 'calc(100vh - 300px)',
                overflowY: 'auto',
              }}
            >
              <Typography variant="h6" component="div" fontWeight={600} mb={2}>
                {checkpoint.name}
              </Typography>
              <Box display="flex" gap={1} mb={2} flexWrap="wrap">
                {checkpoint.colors && (
                  <Chip
                    label={checkpoint.category}
                    size="medium"
                    sx={{
                      backgroundColor: checkpoint.colors.bg,
                      color: checkpoint.colors.text,
                      fontWeight: 600,
                      fontSize: '1rem',
                    }}
                  />
                )}
                {checkpoint.topics?.map((topic) => (
                  <Chip
                    key={topic}
                    label={topic}
                    size="medium"
                    variant="outlined"
                    sx={{ fontSize: '1rem' }}
                  />
                ))}
              </Box>
              <Box sx={{ fontSize: '0.95rem', lineHeight: 1.6 }}>
                <SafeParsedHtml html={checkpoint.description || ''} />
              </Box>
            </Box>
          )}

          {/* Content Area */}
          {isLoading || !highlightedContent ? (
            <LoadingSkeleton />
          ) : (
            <Box
              ref={contentBoxRef}
              sx={{
                backgroundColor: '#fff',
                border: '1px solid #e0e0e0',
                borderRadius: 2,
                padding: 2,
                pt: 0,
                marginTop: 0,
                height: 'calc(100vh - 300px)',
                maxHeight: 'calc(100vh - 300px)',
                overflow: 'auto',
                width: checkpoint ? '80%' : '100%',
              }}
            >
              {/* Tabs and Navigation */}
              <Box
                sx={{
                  position: 'sticky',
                  top: 0,
                  zIndex: 10,
                  backgroundColor: '#fff',
                  borderBottom: 1,
                  borderColor: 'divider',
                  mb: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Tabs
                  value={viewMode}
                  onChange={(_, newValue) => onViewModeChange(newValue)}
                  sx={{
                    '& .MuiTab-root': {
                      textTransform: 'none',
                      fontWeight: 600,
                      fontSize: '0.95rem',
                    },
                  }}
                >
                  <Tab
                    label={t('sidebar:browser_view')}
                    value="browser"
                    sx={{
                      display: checkpoint?.canHighlight.page ? 'inline-flex' : 'none',
                    }}
                  />
                  <Tab
                    label={t('sidebar:source_view')}
                    value="source"
                    sx={{
                      display: checkpoint?.canHighlight.source ? 'inline-flex' : 'none',
                    }}
                  />
                </Tabs>

                <NavigationControls
                  totalHighlights={totalHighlights}
                  currentHighlight={currentHighlight}
                  visibleHighlight={visibleHighlight}
                  onNavigate={onNavigate}
                  onReload={onReload}
                  onOpenInNewTab={handleOpenInNewTab}
                  viewMode={viewMode}
                  scriptsDisabled={scriptsDisabled}
                  onScriptsToggle={onScriptsToggle}
                />
              </Box>

              {/* Content Renderer */}
              <Box sx={{ minHeight: 400 }}>
                {viewMode === 'browser' ? (
                  <BrowserViewRenderer
                    html={highlightedContent}
                    currentHighlight={currentHighlight}
                    clickedIndicator={clickedIndicator}
                    onHighlightsFound={onHighlightsFound}
                    onVisibleHighlightChange={onVisibleHighlightChange}
                    scriptsDisabled={scriptsDisabled}
                  />
                ) : (
                  <ShadowDOMRenderer
                    html={highlightedContent}
                    onHighlightsFound={onHighlightsFound}
                    currentHighlight={currentHighlight}
                    shouldAutoScrollToFirst={!hasAutoScrolled}
                    clickedIndicator={clickedIndicator}
                    onVisibleHighlightChange={onVisibleHighlightChange}
                    scrollContainerRef={contentBoxRef}
                  />
                )}
              </Box>
            </Box>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

/** Loading skeleton for content area */
const LoadingSkeleton: React.FC = () => {
  const { t } = useTranslation('sidebar');
  return (
  <Box
    sx={{
      backgroundColor: '#fff',
      border: '1px solid #e0e0e0',
      borderRadius: 2,
      padding: 2,
      pt: 0,
      marginTop: 0,
      width: '80%',
    }}
  >
    <Box
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        backgroundColor: '#fff',
        borderBottom: 1,
        borderColor: 'divider',
        mb: 2,
        py: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <Box display="flex" gap={2} alignItems="center">
        <Skeleton variant="rectangular" width={130} height={40} sx={{ borderRadius: 1 }} />
        <Skeleton variant="rectangular" width={120} height={40} sx={{ borderRadius: 1 }} />
      </Box>
      <Box display="flex" gap={1} alignItems="center" mr={2}>
        <Skeleton variant="rectangular" width={60} height={24} sx={{ borderRadius: 1 }} />
        <Skeleton variant="circular" width={32} height={32} />
        <Skeleton variant="circular" width={32} height={32} />
        <Skeleton variant="circular" width={32} height={32} />
        <Skeleton variant="circular" width={32} height={32} />
      </Box>
    </Box>

    <Box sx={{ minHeight: 400 }}>
      <Box display="flex" alignItems="center" justifyContent="center" height={400}>
        <Box textAlign="center">
          <CircularProgress size={48} sx={{ color: '#c653ff', mb: 2 }} />
          <Typography variant="body2" color="text.secondary">
            {t('sidebar:loading_views')}
          </Typography>
        </Box>
      </Box>
    </Box>
  </Box>
  );
};

/** Navigation controls for highlight navigation */
interface NavigationControlsProps {
  totalHighlights: number;
  currentHighlight: number;
  visibleHighlight: number;
  onNavigate: (direction: 'prev' | 'next') => void;
  onReload: () => void;
  onOpenInNewTab: () => void;
  viewMode: 'browser' | 'source';
  scriptsDisabled: boolean;
  onScriptsToggle: () => void;
}

const NavigationControls: React.FC<NavigationControlsProps> = ({
  totalHighlights,
  currentHighlight,
  visibleHighlight,
  onNavigate,
  onReload,
  onOpenInNewTab,
  viewMode,
  scriptsDisabled,
  onScriptsToggle,
}) => {
  const { t } = useTranslation('sidebar');
  return (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 2 }}>
    {totalHighlights > 0 && (
      <>
        <Typography
          variant="body2"
          sx={{
            color: 'text.secondary',
            fontWeight: 600,
            fontSize: '0.875rem',
            minWidth: '60px',
            textAlign: 'center',
          }}
        >
          {t('sidebar:x_of_y', {
            current: visibleHighlight || currentHighlight || 1,
            total: totalHighlights,
          })}
        </Typography>
        <IconButton
          size="small"
          onClick={() => onNavigate('prev')}
          disabled={totalHighlights === 0}
          sx={{ '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' } }}
          aria-label={t('sidebar:prev_highlight')}
        >
          <ArrowBackIcon fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          onClick={() => onNavigate('next')}
          disabled={totalHighlights === 0}
          sx={{ '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' } }}
          aria-label={t('sidebar:next_highlight')}
        >
          <ArrowForwardIcon fontSize="small" />
        </IconButton>
      </>
    )}
    <IconButton
      size="small"
      onClick={onReload}
      sx={{ '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' } }}
      aria-label={t('sidebar:reload_highlights')}
    >
      <ReplayIcon fontSize="small" />
    </IconButton>
    <Tooltip title={t('sidebar:open_in_new_tab')} placement="top">
      <IconButton
        size="small"
        onClick={onOpenInNewTab}
        sx={{ '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' } }}
        aria-label={t('sidebar:open_in_new_tab')}
      >
        <OpenInNewIcon fontSize="small" />
      </IconButton>
    </Tooltip>
    {viewMode === 'browser' && (
      <Tooltip
        title={scriptsDisabled ? t('sidebar:enable_js') : t('sidebar:disable_js')}
        placement="top"
      >
        <IconButton
          size="small"
          onClick={onScriptsToggle}
          sx={{
            color: scriptsDisabled ? 'text.secondary' : 'primary.main',
            '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
          }}
          aria-label={scriptsDisabled ? t('sidebar:enable_js') : t('sidebar:disable_js')}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M16 18L22 12L16 6" />
            <path d="M8 6L2 12L8 18" />
          </svg>
        </IconButton>
      </Tooltip>
    )}
  </Box>
  );
};

export default HighlightModal;
