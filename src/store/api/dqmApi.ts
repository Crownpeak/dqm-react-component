/**
 * DQM API - RTK Query API Definition
 *
 * Handles all DQM API interactions with automatic caching, polling, and error handling.
 * @see https://redux-toolkit.js.org/rtk-query/overview
 */
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { AnalysisData, Checkpoint } from '../../types';
import { getCategoryColor } from '../../utils/colors/GenerateCategoryColors';

/** Default DQM API endpoint */
const DEFAULT_API_ENDPOINT = 'https://api.crownpeak.net/dqm-cms/v1';

/** API response for asset creation */
export interface CreateAssetResponse {
  assetId: string;
}

/** API response for asset status (polling) */
export interface AssetStatusResponse {
  assetId: string;
  analysisState: 'analyzing' | 'completed' | 'error';
  created: string;
  siteName: string;
  totalCheckpoints: number;
  totalErrors: number;
  checkpoints: Checkpoint[];
  errorMessage?: string;
}

/** Transformed analysis data with grouped categories */
export interface TransformedAnalysisData extends AnalysisData {
  analysisState: 'analyzing' | 'completed' | 'error';
  groupedCategories: [string, Checkpoint[]][];
  qualityScore: number;
}

/** API response for highlighted content */
export interface HighlightResponse {
  html: string;
  checkpointId?: string;
}

/** Request parameters for creating an asset */
export interface CreateAssetRequest {
  html: string;
  url?: string;
  websiteId: string;
  apiKey: string;
  apiEndpoint?: string;
}

/** Request parameters for fetching asset status */
export interface GetAssetRequest {
  assetId: string;
  websiteId: string;
  apiKey: string;
  apiEndpoint?: string;
}

/** Request parameters for fetching highlights */
export interface GetHighlightRequest {
  assetId: string;
  checkpointId: string;
  websiteId: string;
  apiKey: string;
  apiEndpoint?: string;
}

/** Request parameters for fetching all highlights */
export interface GetAllHighlightsRequest {
  assetId: string;
  websiteId: string;
  apiKey: string;
  apiEndpoint?: string;
}

/**
 * Build headers for DQM API requests
 */
const buildHeaders = (apiKey: string): HeadersInit => ({
  'Content-Type': 'application/json',
  'x-api-key': apiKey,
});

/**
 * DQM API slice using RTK Query
 */
export const dqmApi = createApi({
  reducerPath: 'dqmApi',
  baseQuery: fetchBaseQuery({
    baseUrl: DEFAULT_API_ENDPOINT,
  }),
  tagTypes: ['Asset', 'Highlight'],
  endpoints: (builder) => ({
    /**
     * Create a new asset for analysis
     * POST /assets
     */
    createAsset: builder.mutation<CreateAssetResponse, CreateAssetRequest>({
      query: ({ html, url, websiteId, apiKey, apiEndpoint }) => ({
        url: `${apiEndpoint || DEFAULT_API_ENDPOINT}/assets`,
        method: 'POST',
        headers: buildHeaders(apiKey),
        body: {
          html,
          url: url || window.location.href,
          websiteId,
        },
        params: {
          apiKey, // Also as query param for compatibility
        },
      }),
      invalidatesTags: ['Asset'],
    }),

    /**
     * Get asset analysis status
     * GET /assets/{assetId}
     *
     * Use with polling to wait for analysis completion:
     * ```tsx
     * const { data } = useGetAssetQuery(params, {
     *   pollingInterval: data?.analysisState === 'completed' ? 0 : 2000,
     * });
     * ```
     */
    getAsset: builder.query<TransformedAnalysisData, GetAssetRequest>({
      query: ({ assetId, websiteId, apiKey, apiEndpoint }) => ({
        url: `${apiEndpoint || DEFAULT_API_ENDPOINT}/assets/${assetId}`,
        headers: buildHeaders(apiKey),
        params: {
          websiteId,
          apiKey,
        },
      }),
      transformResponse: (response: AssetStatusResponse): TransformedAnalysisData => {
        // Group checkpoints by category and assign colors
        const categories = (response.checkpoints || []).reduce((acc, checkpoint) => {
          if (!acc[checkpoint.category]) {
            acc[checkpoint.category] = [];
          }
          acc[checkpoint.category].push(checkpoint);
          return acc;
        }, {} as Record<string, Checkpoint[]>);

        // Assign colors to each checkpoint
        const categoryNames = Object.keys(categories);
        Object.entries(categories).forEach(([category, checkpoints]) => {
          checkpoints.forEach((cp) => {
            cp.colors = getCategoryColor(category, categoryNames);
          });
        });

        const groupedCategories = Object.entries(categories);
        const qualityScore = response.totalCheckpoints > 0
          ? Math.round(((response.totalCheckpoints - response.totalErrors) / response.totalCheckpoints) * 100)
          : 0;

        return {
          assetId: response.assetId,
          analysisState: response.analysisState,
          created: response.created,
          siteName: response.siteName,
          totalCheckpoints: response.totalCheckpoints,
          totalErrors: response.totalErrors,
          checkpoints: response.checkpoints || [],
          groupedCategories,
          qualityScore,
        };
      },
      providesTags: (result, error, { assetId }) => [{ type: 'Asset', id: assetId }],
    }),

    /**
     * Get highlighted HTML for a specific checkpoint
     * GET /assets/{assetId}/pagehighlight/{checkpointId}
     */
    getHighlight: builder.query<HighlightResponse, GetHighlightRequest>({
      query: ({ assetId, checkpointId, websiteId, apiKey, apiEndpoint }) => ({
        url: `${apiEndpoint || DEFAULT_API_ENDPOINT}/assets/${assetId}/pagehighlight/${checkpointId}`,
        headers: buildHeaders(apiKey),
        params: {
          websiteId,
          apiKey,
        },
      }),
      transformResponse: (response: { html: string }, meta, arg) => ({
        html: response.html,
        checkpointId: arg.checkpointId,
      }),
      providesTags: (result, error, { assetId, checkpointId }) => [
        { type: 'Highlight', id: `${assetId}-${checkpointId}` },
      ],
    }),

    /**
     * Get highlighted HTML for all errors
     * GET /assets/{assetId}/pagehighlight/all
     */
    getAllHighlights: builder.query<HighlightResponse, GetAllHighlightsRequest>({
      query: ({ assetId, websiteId, apiKey, apiEndpoint }) => ({
        url: `${apiEndpoint || DEFAULT_API_ENDPOINT}/assets/${assetId}/pagehighlight/all`,
        headers: buildHeaders(apiKey),
        params: {
          websiteId,
          apiKey,
        },
      }),
      transformResponse: (response: { html: string }) => ({
        html: response.html,
      }),
      providesTags: (result, error, { assetId }) => [
        { type: 'Highlight', id: `${assetId}-all` },
      ],
    }),

    /**
     * Get highlighted HTML for a checkpoint with source option
     * GET /assets/{assetId}/errors/{checkpointId}
     */
    getCheckpointHighlight: builder.query<
      string,
      GetHighlightRequest & { highlightSource?: boolean }
    >({
      query: ({ assetId, checkpointId, websiteId, apiKey, apiEndpoint, highlightSource = false }) => ({
        url: `${apiEndpoint || DEFAULT_API_ENDPOINT}/assets/${assetId}/errors/${checkpointId}`,
        headers: buildHeaders(apiKey),
        params: {
          websiteId,
          apiKey,
          highlightSource,
        },
        responseHandler: 'text', // Return raw HTML
      }),
      providesTags: (result, error, { assetId, checkpointId, highlightSource }) => [
        { type: 'Highlight', id: `${assetId}-${checkpointId}-${highlightSource ? 'source' : 'browser'}` },
      ],
    }),
  }),
});

// Export hooks for components
export const {
  useCreateAssetMutation,
  useGetAssetQuery,
  useLazyGetAssetQuery,
  useGetHighlightQuery,
  useLazyGetHighlightQuery,
  useGetAllHighlightsQuery,
  useLazyGetAllHighlightsQuery,
  useGetCheckpointHighlightQuery,
  useLazyGetCheckpointHighlightQuery,
} = dqmApi;

// Export reducer for store configuration
export default dqmApi;
