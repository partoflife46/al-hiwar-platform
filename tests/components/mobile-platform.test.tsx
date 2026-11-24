import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor, act } from '@testing-library/react';
import fs from 'fs';
import path from 'path';
import tailwindConfig from '../../tailwind.config';
import { PlatformNav } from '@/components/layout/platform-nav';
import { LanguageProvider } from '@/lib/context/language-context';

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...rest
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: any;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

describe('Mobile-Native Platform Layer & Responsive Navigation', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          ok: true,
          data: {
            userId: 'visitor',
            email: 'visitor@example.com',
            firstName: 'Visitor',
            surname: 'Guest',
            role: 'VISITOR',
            preferredLanguage: 'en',
            token: '',
          },
        }),
    }) as any;
  });

  afterEach(() => {
    cleanup();
    global.fetch = originalFetch;
  });

  it('enables Tailwind v3 hoverOnlyWhenSupported to prevent sticky hover on touch screens', () => {
    const future = tailwindConfig.future as
      | { hoverOnlyWhenSupported?: boolean }
      | undefined;
    expect(future?.hoverOnlyWhenSupported).toBe(true);
  });

  it('defines mobile-native CSS baseline declarations in globals.css', () => {
    const css = fs.readFileSync(
      path.resolve(process.cwd(), 'src/app/globals.css'),
      'utf-8'
    );

    expect(css).toContain('-webkit-tap-highlight-color: transparent');
    expect(css).toContain('-webkit-text-size-adjust: 100%');
    expect(css).toContain('overscroll-behavior: none');
    expect(css).toContain('touch-action: manipulation');
    expect(css).toContain('@media (pointer: coarse)');
    expect(css).toContain('font-size: 16px');
  });

  it('toggles the mobile navigation drawer cleanly from the hamburger button', async () => {
    render(
      <LanguageProvider>
        <PlatformNav />
      </LanguageProvider>
    );

    await act(async () => {
      await Promise.resolve();
    });

    const toggle = screen.getByRole('button', { name: 'Toggle navigation menu' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(document.getElementById('mobile-primary-nav')).toBeNull();

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(document.getElementById('mobile-primary-nav')).not.toBeNull();

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(document.getElementById('mobile-primary-nav')).toBeNull();
  });
});
