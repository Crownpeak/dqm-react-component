import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  AlertTitle,
  Stack,
} from '@mui/material';
import type { ErrorBoundaryProps } from './types';

/**
 * ErrorBoundary
 * Catches render / lifecycle errors in the React tree below.
 * Provides a user friendly fallback UI and a way to inspect details.
 * Async errors (event handlers, promises) must be caught manually.
 */

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error | null;
  errorInfo?: React.ErrorInfo | null;
  showDetails: boolean;
  errorId?: string;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false,
    errorId: undefined,
  };

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error }; // trigger fallback UI
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const errorId = this.generateErrorId();
    this.setState({ errorInfo, errorId });
    // Placeholder for remote logging.
    this.logErrorToService(error, errorInfo, errorId);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    if (this.state.hasError && this.props.resetKeys && prevProps.resetKeys) {
      const changed = this.props.resetKeys.some((value, idx) => value !== prevProps.resetKeys![idx]);
      if (changed) {
        this.reset();
      }
    }
  }

  private reset() {
    this.setState({ hasError: false, error: null, errorInfo: null, showDetails: false, errorId: undefined });
  }

  private generateErrorId(): string {
    return 'ERR-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
  }

  private logErrorToService(error: Error, info: React.ErrorInfo, errorId?: string) {
    // Implement real remote logging here (e.g. Sentry, Datadog, Logtail, etc.)
    // Keep PII considerations in mind.
    console.error('[ErrorBoundary] Captured error', { errorId, error, info });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleToggleDetails = () => {
    this.setState((s) => ({ showDetails: !s.showDetails }));
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const { error, errorInfo, showDetails, errorId } = this.state;

    return (
      <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
        <Card>
          <CardContent>
            <Alert severity="error" sx={{ mb: 2 }}>
              <AlertTitle>Unexpected error</AlertTitle>
              <Typography variant="body2" sx={{ mb: 1 }}>
                The application couldn't load this view.
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Please try the following (in this order):
              </Typography>
              <Box component="ol" sx={{ mt: 1, mb: 1, pl: 2.5 }}>
                <li>Wait a few seconds and try again.</li>
                <li>Click "Reload".</li>
                <li>If this happens again, contact support and include the error ID.</li>
              </Box>
              {errorId && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  <strong>Error ID:</strong> {errorId}
                </Typography>
              )}
            </Alert>

            <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
              <Button onClick={this.handleReload} variant="contained" color="primary">
                Reload
              </Button>
              <Button onClick={this.handleToggleDetails} variant="outlined">
                {showDetails ? 'Hide details' : 'Show details'}
              </Button>
            </Stack>

            {showDetails && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Error information
                </Typography>
                <Box
                  component="pre"
                  sx={{
                    whiteSpace: 'pre-wrap',
                    backgroundColor: '#f6f6f7',
                    p: 1.5,
                    borderRadius: 1,
                    maxHeight: 300,
                    overflow: 'auto',
                    fontSize: 12,
                    fontFamily: 'monospace',
                  }}
                >
{error?.toString()}\n\n{errorInfo?.componentStack}
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
    );
  }
}

/**
 * Simple helper to wrap children with ErrorBoundary while computing reset keys.
 * Can be used in layouts where hooks are available.
 */
export const withErrorBoundary = (children: React.ReactNode, resetKeys?: unknown[]) => (
  <ErrorBoundary resetKeys={resetKeys}>{children}</ErrorBoundary>
);
