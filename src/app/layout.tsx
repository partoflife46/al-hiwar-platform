/**
 * Next.js App Router view module for `/`.
 * Renders bilingual EN/FR interface states and connects UI interactions to platform hooks.
 * @module app/layout
 * @exports metadata, viewport, RootLayout
 */

import type { Metadata, Viewport } from 'next';
import './globals.css';
import { PlatformNav } from '@/components/layout/platform-nav';
import { PlatformFooter } from '@/components/layout/platform-footer';
import { LanguageProvider } from '@/lib/context/language-context';

/**
 * Constant definition for metadata.
 */
export const metadata: Metadata = {
  title: "Al Hiwar Digital Da'wah & Learning Platform",
  description:
    "Verified Islamic dialogue, certified consultations, and structured learning academy by Al Hiwar Digital Da'wah & Learning Platform.",
};

/**
 * Constant definition for viewport.
 */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  interactiveWidget: 'resizes-content',
  themeColor: '#FFFFFF',
};

/**
 * Renders the root layout interface component.
 * @param props - Destructured input containing children.
 * @returns Rendered JSX element tree.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap"
        />
      </head>
      <body className="min-h-dvh bg-[#F8FAFC] text-[#082233] antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded-lg focus:bg-[#006C9C] focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-white focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#BC9C5C]"
        >
          Skip to main content
        </a>
        <LanguageProvider>
          <PlatformNav />
          <main
            id="main-content"
            tabIndex={-1}
            className="min-h-[calc(100dvh-4rem)] pb-[env(safe-area-inset-bottom,0px)] outline-none"
          >
            {children}
          </main>
          <PlatformFooter />
        </LanguageProvider>
      </body>
    </html>
  );
}
