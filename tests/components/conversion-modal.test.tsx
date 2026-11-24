import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ConversionModal } from '@/components/dialogue/conversion-modal';
import {
  COUNTRIES,
  COUNTRY_DIAL_CODES,
  applyCountryDialCode,
} from '@/lib/constants/countries';

describe('ConversionModal Component (Task 3.2)', () => {
  const defaultProps = {
    isOpen: true,
    seekerId: 'user-seeker-1',
    seekerName: 'Jean-Luc',
    onSubmitProfile: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders celebratory modal with Basmalah, gold styling, and seeker name', () => {
    render(<ConversionModal {...defaultProps} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ/)).toBeInTheDocument();
    expect(
      screen.getByText(/Mabrooq! Welcome to Islam, Jean-Luc!/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Mandatory Post-Conversion Profile/)
    ).toBeInTheDocument();
  });

  it('validates mandatory fields: Nationality, Gender, and Phone Number', async () => {
    const mockSubmit = vi.fn();
    render(<ConversionModal {...defaultProps} onSubmitProfile={mockSubmit} />);

    const submitBtn = screen.getByRole('button', {
      name: /complete profile & unlock academy/i,
    });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/nationality is required for institutional certification/i)
      ).toBeInTheDocument();
      expect(screen.getByText(/please select your gender/i)).toBeInTheDocument();
      expect(
        screen.getByText(/a valid phone number is required/i)
      ).toBeInTheDocument();
    });

    expect(mockSubmit).not.toHaveBeenCalled();
  });

  it('submits profile when all 3 fields are properly populated', async () => {
    const mockSubmit = vi.fn().mockResolvedValue(undefined);
    render(<ConversionModal {...defaultProps} onSubmitProfile={mockSubmit} />);

    // Fill nationality
    const nationalityInput = screen.getByLabelText(/nationality/i);
    fireEvent.change(nationalityInput, { target: { value: 'France' } });

    // Select gender
    const maleBtn = screen.getByRole('button', { name: /brother \(male\)/i });
    fireEvent.click(maleBtn);

    // Fill phone number
    const phoneInput = screen.getByLabelText(/phone number/i);
    fireEvent.change(phoneInput, { target: { value: '+33 6 12 34 56 78' } });

    // Submit form
    const submitBtn = screen.getByRole('button', {
      name: /complete profile & unlock academy/i,
    });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith({
        nationality: 'France',
        gender: 'MALE',
        phoneNumber: '+33 6 12 34 56 78',
      });
    });
  });

  it('enforces non-dismissible gating: pressing Escape key does not close modal', () => {
    const { container } = render(<ConversionModal {...defaultProps} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });

    // Modal remains in document
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/Mabrooq! Welcome to Islam, Jean-Luc!/)).toBeInTheDocument();
  });

  it('displays Academy enrollment confirmation and navigation CTA upon successful profile completion', async () => {
    const mockSubmit = vi.fn().mockResolvedValue(undefined);
    const mockNavigate = vi.fn();

    render(
      <ConversionModal
        {...defaultProps}
        onSubmitProfile={mockSubmit}
        onNavigateToAcademy={mockNavigate}
      />
    );

    fireEvent.change(screen.getByLabelText(/nationality/i), {
      target: { value: 'United Kingdom' },
    });
    fireEvent.click(screen.getByRole('button', { name: /brother \(male\)/i }));
    fireEvent.change(screen.getByLabelText(/phone number/i), {
      target: { value: '+44 7700 900412' },
    });

    fireEvent.click(
      screen.getByRole('button', { name: /complete profile & unlock academy/i })
    );

    await waitFor(() => {
      expect(screen.getByText(/you are now officially enrolled!/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /enter academy \(module 1\)/i })).toBeInTheDocument();
    });

    const enterAcademyBtn = screen.getByRole('button', {
      name: /enter academy \(module 1\)/i,
    });
    fireEvent.click(enterAcademyBtn);
    expect(mockNavigate).toHaveBeenCalled();
  });

  it('automatically updates phone calling code when selecting or changing countries', () => {
    for (const c of COUNTRIES) {
      expect(COUNTRY_DIAL_CODES[c]).toMatch(/^\+\d+$/);
    }

    expect(applyCountryDialCode("Côte d'Ivoire", '')).toBe('+225 ');
    expect(applyCountryDialCode('France', '+2250506934891', "Côte d'Ivoire")).toBe(
      '+33 0506934891'
    );
    expect(applyCountryDialCode('Indonesia', '+33 612345678', 'France')).toBe(
      '+62 612345678'
    );

    render(<ConversionModal {...defaultProps} />);

    const countrySelect = screen.getByLabelText(/nationality/i) as HTMLSelectElement;
    const phoneInput = screen.getByLabelText(/phone number/i) as HTMLInputElement;

    fireEvent.change(countrySelect, { target: { value: "Côte d'Ivoire" } });
    expect(phoneInput.value).toBe('+225 ');

    fireEvent.change(phoneInput, { target: { value: '+225 0506934891' } });
    fireEvent.change(countrySelect, { target: { value: 'Indonesia' } });
    expect(phoneInput.value).toBe('+62 0506934891');
  });
});
