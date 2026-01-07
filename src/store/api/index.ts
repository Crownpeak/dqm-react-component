/**
 * RTK Query API exports
 */
export {
  dqmApi,
  useCreateAssetMutation,
  useGetAssetQuery,
  useLazyGetAssetQuery,
  useGetHighlightQuery,
  useLazyGetHighlightQuery,
  useGetAllHighlightsQuery,
  useLazyGetAllHighlightsQuery,
} from './dqmApi';

export type {
  CreateAssetRequest,
  CreateAssetResponse,
  GetAssetRequest,
  AssetStatusResponse,
  GetHighlightRequest,
  GetAllHighlightsRequest,
  HighlightResponse,
} from './dqmApi';
