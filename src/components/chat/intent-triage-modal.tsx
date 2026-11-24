'use client';

/**
 * Module architecture and API reference for `src/components/chat/intent-triage-modal.tsx`.
 *
 * Exported symbols:
 * - `IntentTriageModalProps` (Interface): intent triage modal props definition.
 * - `IntentTriageModal` (Function): intent triage modal definition.
 *
 * Internal dependencies:
 * - `@/lib/db/types`
 * - `@/components/ui/button`
 * - `@/components/ui/badge`
 *
 * @module components/chat/intent-triage-modal
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

/**
 * UI presentation module for intent triage modal within the chat workspace.
 * Encapsulates accessible markup, bilingual labels, and typed component props.
 * @module components/chat/intent-triage-modal
 * @exports IntentTriageModalProps, IntentTriageModal
 */

import * as React from 'react';
import type { ConsultationIntent, SupportedLanguage } from '@/lib/db/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, HeartHandshake, Globe, X } from 'lucide-react';

/**
 * Type contract defining intent triage modal props.
 * Includes fields/members: isOpen, onClose, onSelectIntent, initialLanguage.
 */
export interface IntentTriageModalProps {
  /** is open property. */
  isOpen: boolean;
  /** Optional on close property. */
  onClose?: () => void;
  /** on select intent property. */
  onSelectIntent: (intent: ConsultationIntent, language: SupportedLanguage) => void;
  /** Optional initial language property. */
  initialLanguage?: SupportedLanguage;
}

/**
 * Renders the intent triage modal interface component.
 * @param props - Destructured input containing isOpen, onClose, onSelectIntent,
 *   initialLanguage.
 * @returns Rendered JSX element tree.
 */
export function IntentTriageModal({
  isOpen,
  onClose,
  onSelectIntent,
  initialLanguage = 'en',
}: IntentTriageModalProps) {
  const [selectedIntent, setSelectedIntent] = React.useState<ConsultationIntent>('LEARN_ABOUT_ISLAM');
  const [language, setLanguage] = React.useState<SupportedLanguage>(initialLanguage);

  /** Synchronizes component side effects with reactive dependencies. */
  React.useEffect(() => {
    if (initialLanguage) {
      setLanguage(initialLanguage);
    }
  }, [initialLanguage]);

  /** Synchronizes component side effects with reactive dependencies. */
  React.useEffect(() => {
    /**
     * Executes handle key down logic.
     * @param e - E value (`KeyboardEvent`).
     */
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  /** Handles handle submit interaction. */
  const handleSubmit = () => {
    onSelectIntent(selectedIntent, language);
  };

  const isFr = language === 'fr';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="triage-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 !m-0 flex items-center justify-center p-4 bg-[#082233]/50 backdrop-blur-md overflow-y-auto overscroll-contain animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-2xl space-y-6">
        {/* Close Button */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label={isFr ? 'Fermer la fenêtre' : 'Close modal'}
            className="absolute top-4 right-4 min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006C9C]"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        )}

        {/* Header */}
        <div className="space-y-1 text-center">
          <Badge variant="gold" className="mb-1" translate="no">
            Al Hiwar Platform
          </Badge>
          <h2 id="triage-title" className="text-xl font-bold text-[#082233] text-balance">
            {isFr ? 'Commencer votre consultation privée' : 'Begin Your Private Consultation'}
          </h2>
          <p className="text-sm text-[#5F7383]">
            {isFr
              ? 'Choisissez le thème principal de votre échange avec nos spécialistes.'
              : 'Choose the primary purpose of your conversation with our faculty scholars.'}
          </p>
        </div>

        {/* Intent Cards */}
        <div className="space-y-3">
          {/* Option 1: Learn About Islam */}
          <button
            type="button"
            aria-pressed={selectedIntent === 'LEARN_ABOUT_ISLAM'}
            onClick={() => setSelectedIntent('LEARN_ABOUT_ISLAM')}
            className={`
              w-full p-4 rounded-xl border-2 text-left cursor-pointer transition-colors select-none
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006C9C]
              flex items-start gap-4
              ${
                selectedIntent === 'LEARN_ABOUT_ISLAM'
                  ? 'border-[#006C9C] bg-[#006C9C]/5 shadow-sm'
                  : 'border-[#E2E8F0] hover:border-[#CBD5E1] bg-white'
              }
            `}
          >
            <div className="p-2.5 rounded-lg bg-[#006C9C]/10 text-[#006C9C] shrink-0">
              <BookOpen className="w-5 h-5" aria-hidden="true" />
            </div>
            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-sm text-[#082233]">
                  {isFr ? 'Je souhaite en savoir plus sur l’Islam' : 'I want to know more about Islam'}
                </span>
                <div className="flex flex-col items-end shrink-0">
                  <span className="text-xs text-[#006C9C] font-arabic" dir="rtl">
                    استكشاف الإسلام
                  </span>
                  <span className="text-[10px] text-[#5F7383] italic">
                    (Istikshāf Al-Islām)
                  </span>
                </div>
              </div>
              <p className="text-xs text-[#5F7383] leading-relaxed">
                {isFr
                  ? 'Dialogue privé individuel avec un spécialiste certifié pour poser vos questions sincères sur la théologie, la morale et la pratique.'
                  : 'Private 1-on-1 dialogue with a certified Islamic scholar to ask open questions about Islamic theology, ethics, prayer, and daily practice.'}
              </p>
            </div>
          </button>

          {/* Option 2: Embrace Islam */}
          <button
            type="button"
            aria-pressed={selectedIntent === 'EMBRACE_ISLAM'}
            onClick={() => setSelectedIntent('EMBRACE_ISLAM')}
            className={`
              w-full p-4 rounded-xl border-2 text-left cursor-pointer transition-colors select-none
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BC9C5C]
              flex items-start gap-4
              ${
                selectedIntent === 'EMBRACE_ISLAM'
                  ? 'border-[#BC9C5C] bg-[#BC9C5C]/5 shadow-sm'
                  : 'border-[#E2E8F0] hover:border-[#CBD5E1] bg-white'
              }
            `}
          >
            <div className="p-2.5 rounded-lg bg-[#BC9C5C]/15 text-[#6A5420] shrink-0">
              <HeartHandshake className="w-5 h-5" aria-hidden="true" />
            </div>
            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-sm text-[#082233]">
                  {isFr
                    ? 'Je souhaite embrasser l’Islam (Déclarer la Shahadah)'
                    : 'I want to embrace Islam (Declare Shahadah)'}
                </span>
                <div className="flex flex-col items-end shrink-0">
                  <span className="text-xs text-[#6A5420] font-arabic" dir="rtl">
                    نطق الشهادة
                  </span>
                  <span className="text-[10px] text-[#8C6D32] italic">
                    (Nuṭq Ash-Shahādah)
                  </span>
                </div>
              </div>
              <p className="text-xs text-[#5F7383] leading-relaxed">
                {isFr
                  ? 'Accompagnement bienveillant pour prononcer la Shahadah (Attestation de foi) et débuter votre parcours musulman officiel.'
                  : 'Direct guidance from an Islamic specialist to pronounce the Shahadah (Testimony of Faith) and receive your official conversion record.'}
              </p>
            </div>
          </button>
        </div>

        {/* Language Selection */}
        <div className="flex items-center justify-between pt-2 border-t border-[#E2E8F0]">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#5F7383]">
            <Globe className="w-4 h-4 text-[#006C9C]" aria-hidden="true" />
            <span>{isFr ? 'Langue de consultation :' : 'Consultation Language:'}</span>
          </div>
          <div className="inline-flex rounded-xl border border-[#CBD5E1] p-1 bg-[#F1F5F9] gap-1">
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006C9C] ${
                language === 'en'
                  ? 'bg-[#006C9C] text-white shadow-sm font-bold'
                  : 'text-[#475569] hover:text-[#082233]'
              }`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setLanguage('fr')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006C9C] ${
                language === 'fr'
                  ? 'bg-[#006C9C] text-white shadow-sm font-bold'
                  : 'text-[#475569] hover:text-[#082233]'
              }`}
            >
              Français
            </button>
          </div>
        </div>

        {/* Submit & Cancel Buttons */}
        <div className="flex items-center gap-3 pt-2">
          {onClose && (
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-1/3 border-[#CBD5E1] text-[#082233]"
              onClick={onClose}
            >
              {isFr ? 'Fermer' : 'Cancel'}
            </Button>
          )}
          <Button
            type="button"
            variant="primary"
            size="lg"
            className={onClose ? 'w-2/3' : 'w-full'}
            onClick={handleSubmit}
          >
            {isFr ? 'Démarrer la consultation' : 'Start Dialogue'}
          </Button>
        </div>
      </div>
    </div>
  );
}
