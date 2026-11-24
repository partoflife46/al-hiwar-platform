import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardInner } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

describe('Islamic University of Madinah Design System (Task 1.2)', () => {
  it('defines official IU Madinah brand tokens, font smoothing, concentric radii, and reduced-motion in globals.css', () => {
    const cssPath = path.resolve(process.cwd(), 'src/app/globals.css');
    const cssContent = fs.readFileSync(cssPath, 'utf-8');

    expect(cssContent).toContain('--primary: #006C9C');
    expect(cssContent).toContain('--primary-deep: #005072');
    expect(cssContent).toContain('--secondary: #1C7890');
    expect(cssContent).toContain('--accent: #BC9C5C');
    expect(cssContent).toContain('--accent-light: #D8BC7C');
    expect(cssContent).toContain('--text-primary: #082233');
    expect(cssContent).toContain('--success: #0D7A5F');
    expect(cssContent).toContain('-webkit-font-smoothing: antialiased');
    expect(cssContent).toContain('prefers-reduced-motion: reduce');
  });

  it('renders Button with official variants, 44px minimum height, and tactile active:scale-[0.96] feedback', () => {
    const primaryHtml = renderToStaticMarkup(
      React.createElement(Button, { variant: 'primary' }, 'Start Dialogue')
    );
    expect(primaryHtml).toContain('#006C9C');
    expect(primaryHtml).toContain('active:scale-[0.96]');
    expect(primaryHtml).toContain('transition-transform');
    expect(primaryHtml).toContain('duration-100');
    expect(primaryHtml).toContain('ease-out');
    expect(primaryHtml).toContain('h-[44px]');

    const accentHtml = renderToStaticMarkup(
      React.createElement(Button, { variant: 'accent' }, 'Declare Shahadah')
    );
    expect(accentHtml).toContain('#BC9C5C');
    expect(accentHtml).toContain('active:scale-[0.96]');

    const destructiveHtml = renderToStaticMarkup(
      React.createElement(Button, { variant: 'destructive' }, 'Revoke')
    );
    expect(destructiveHtml).toContain('#DC2626');
  });

  it('renders Card with concentric outer rounded-2xl (16px), inner rounded-lg (8px), and optional faceted low-poly header accent', () => {
    const cardHtml = renderToStaticMarkup(
      React.createElement(
        Card,
        { faceted: true },
        React.createElement(
          CardHeader,
          null,
          React.createElement(CardTitle, null, 'Lesson 1: Pillars of Islam')
        ),
        React.createElement(
          CardContent,
          null,
          React.createElement(CardInner, null, 'Inner concentric container')
        )
      )
    );

    expect(cardHtml).toContain('rounded-2xl');
    expect(cardHtml).toContain('rounded-lg');
    expect(cardHtml).toContain('data-faceted="true"');
  });

  it('renders Input with 44px height, #006C9C focus ring, and #DC2626 error state', () => {
    const normalHtml = renderToStaticMarkup(
      React.createElement(Input, { placeholder: 'Enter email' })
    );
    expect(normalHtml).toContain('h-[44px]');
    expect(normalHtml).toContain('focus:border-[#006C9C]');

    const errorHtml = renderToStaticMarkup(
      React.createElement(Input, { error: 'Must be 18 or older' })
    );
    expect(errorHtml).toContain('border-[#DC2626]');
    expect(errorHtml).toContain('Must be 18 or older');
  });

  it('renders Badge variants for roles, approval status, and lock states', () => {
    const approvedBadge = renderToStaticMarkup(
      React.createElement(Badge, { variant: 'approved' }, 'Approved')
    );
    expect(approvedBadge).toContain('#0D7A5F');

    const goldBadge = renderToStaticMarkup(
      React.createElement(Badge, { variant: 'gold' }, 'Dialogist')
    );
    expect(goldBadge).toContain('#BC9C5C');
  });
});
