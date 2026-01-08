import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  // Static export for GitHub Pages
  output: 'export',
  
  // Base path for GitHub Pages (repository name)
  // Wird automatisch von GitHub Actions gesetzt, oder manuell konfiguriert
  basePath: isProd ? process.env.NEXT_PUBLIC_BASE_PATH || '' : '',
  
  // Asset prefix for proper asset loading on GitHub Pages
  assetPrefix: isProd ? process.env.NEXT_PUBLIC_BASE_PATH || '' : '',
  
  // Disable image optimization for static export
  images: {
    unoptimized: true,
  },
  
  // Trailing slash for better compatibility with static hosting
  trailingSlash: true,
};

export default nextConfig;
