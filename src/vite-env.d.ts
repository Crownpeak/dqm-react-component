/// <reference types="vite/client" />

// SVG imports as React components (Vite specific)
declare module '*.svg?react' {
  import React from 'react';
  const SVGComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
  export default SVGComponent;
}

// SVG imports as URLs
declare module '*.svg' {
  const content: string;
  export default content;
}

