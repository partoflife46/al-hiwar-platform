/**
 * Tailwind CSS design system configuration for the Al-Hiwar Platform.
 * Defines brand color tokens (Primary Blue, Warm Gold, Deep Navy, Soft Surfaces),
 * content scanning paths across App Router pages and components, and custom utilities.
 * @module tailwind.config
 */

import type { Config } from 'tailwindcss';

const config: Config = {
  future: {
    hoverOnlyWhenSupported: true,
  },
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#006C9C',
          deep: '#005072',
        },
        'primary-deep': '#005072',
        secondary: {
          DEFAULT: '#1C7890',
        },
        accent: {
          DEFAULT: '#BC9C5C',
          light: '#D8BC7C',
          legible: '#8A672B',
        },
        'accent-light': '#D8BC7C',
        midnight: '#082233',
        emerald: '#0D7A5F',
        background: '#FFFFFF',
        surface: '#F8FAFC',
        muted: '#5F7383',
        border: '#E2E8F0',
        success: '#0D7A5F',
        warning: '#D97706',
        destructive: '#DC2626',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        arabic: ['var(--font-arabic)', 'Amiri', 'Noto Naskh Arabic', 'serif'],
      },
      borderRadius: {
        card: '16px',
        inner: '8px',
        control: '10px',
      },
      transitionTimingFunction: {
        'ease-out-strong': 'cubic-bezier(0.23, 1, 0.32, 1)',
        'ease-in-out-smooth': 'cubic-bezier(0.77, 0, 0.175, 1)',
        'ease-drawer': 'cubic-bezier(0.32, 0.72, 0, 1)',
      },
    },
  },
  plugins: [],
};

export default config;
