import React from 'react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup, act } from '@testing-library/react';
import { LanguageProvider, useLanguage } from '@/lib/context/language-context';

function LanguageProbe() {
  const { language, setLanguage } = useLanguage();
  return (
    <div>
      <span data-testid="current-lang">{language}</span>
      <button type="button" onClick={() => setLanguage('fr')}>
        FR
      </button>
      <button type="button" onClick={() => setLanguage('en')}>
        EN
      </button>
    </div>
  );
}

describe('LanguageContext Accessibility (P1 document.documentElement.lang)', () => {
  beforeEach(() => {
    localStorage.clear();
    document.cookie = 'alhiwar_lang=; path=/; max-age=0';
    document.documentElement.lang = 'en';
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
    document.cookie = 'alhiwar_lang=; path=/; max-age=0';
    document.documentElement.lang = 'en';
  });

  it('hydrates saved language from localStorage and syncs document.documentElement.lang', async () => {
    localStorage.setItem('alhiwar_language', 'fr');
    render(
      <LanguageProvider>
        <LanguageProbe />
      </LanguageProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('current-lang')).toHaveTextContent('fr');
      expect(document.documentElement.lang).toBe('fr');
    });
  });

  it('updates document.documentElement.lang when toggling EN <-> FR and on external event', async () => {
    render(
      <LanguageProvider>
        <LanguageProbe />
      </LanguageProvider>
    );

    expect(document.documentElement.lang).toBe('en');

    fireEvent.click(screen.getByRole('button', { name: 'FR' }));
    await waitFor(() => {
      expect(screen.getByTestId('current-lang')).toHaveTextContent('fr');
      expect(document.documentElement.lang).toBe('fr');
    });

    fireEvent.click(screen.getByRole('button', { name: 'EN' }));
    await waitFor(() => {
      expect(screen.getByTestId('current-lang')).toHaveTextContent('en');
      expect(document.documentElement.lang).toBe('en');
    });

    act(() => {
      window.dispatchEvent(new CustomEvent('alhiwar:language-changed', { detail: 'fr' }));
    });
    await waitFor(() => {
      expect(document.documentElement.lang).toBe('fr');
    });
  });
});
