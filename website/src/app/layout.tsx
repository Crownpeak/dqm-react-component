import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://crownpeak.github.io/dqm-react-component";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1e293b",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Crownpeak DQM React Component | Digital Quality Management",
    template: "%s | Crownpeak DQM React Component",
  },
  description: "Integrate Digital Quality Management directly into your React application. Real-time analysis for Accessibility, SEO, Content Quality, WCAG compliance, and more. Open source React component by Crownpeak.",
  keywords: [
    "DQM",
    "React Component",
    "Digital Quality Management",
    "Accessibility Testing",
    "WCAG",
    "ADA Compliance",
    "SEO Analysis",
    "Content Quality",
    "Crownpeak",
    "Web Accessibility",
    "React",
    "TypeScript",
    "Open Source",
  ],
  authors: [{ name: "Crownpeak Technology", url: "https://www.crownpeak.com" }],
  creator: "Crownpeak Technology GmbH",
  publisher: "Crownpeak Technology GmbH",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: "Crownpeak DQM React Component",
    description: "Integrate Digital Quality Management directly into your React application. Accessibility, SEO, and Content Quality analysis.",
    type: "website",
    locale: "en_US",
    alternateLocale: ["de_DE", "es_ES"],
    url: siteUrl,
    siteName: "Crownpeak DQM React Component",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Crownpeak DQM React Component - Digital Quality Management",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Crownpeak DQM React Component",
    description: "Integrate Digital Quality Management directly into your React application.",
    images: ["/og-image.png"],
    creator: "@crownpeak",
  },
  alternates: {
    canonical: siteUrl,
  },
  category: "Technology",
};

// JSON-LD Structured Data
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Crownpeak DQM React Component",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Web Browser",
  description: "A React component for integrating Digital Quality Management (DQM) into web applications. Provides real-time accessibility, SEO, and content quality analysis.",
  url: siteUrl,
  author: {
    "@type": "Organization",
    name: "Crownpeak Technology GmbH",
    url: "https://www.crownpeak.com",
  },
  publisher: {
    "@type": "Organization",
    name: "Crownpeak Technology GmbH",
    url: "https://www.crownpeak.com",
    logo: {
      "@type": "ImageObject",
      url: `${siteUrl}/logo_crownpeak.svg`,
    },
  },
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  softwareVersion: "1.2.2",
  programmingLanguage: ["TypeScript", "React"],
  codeRepository: "https://github.com/Crownpeak/dqm-react-component",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
