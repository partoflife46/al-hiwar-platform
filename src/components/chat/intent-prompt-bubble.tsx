/**
 * Interactive consultation intent selector bubble rendered inside the chat timeline.
 */

'use client';

/**
 * Module architecture and API reference for `src/components/chat/intent-prompt-bubble.tsx`.
 *
 * Exported symbols:
 * - `IntentPromptBubble` (Function): intent prompt bubble definition.
 *
 * Internal dependencies:
 * - `@/lib/db/types`
 * - `@/components/ui/badge`
 * - `./chat-timeline-copy`
 *
 * @module components/chat/intent-prompt-bubble
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

import * as React from 'react';
import type { ConsultationIntent, Message } from '@/lib/db/types';
import { Badge } from '@/components/ui/badge';
import { BookOpen, CheckCircle2, HeartHandshake } from 'lucide-react';
import {
  formatChatTime,
  INTENT_OPTIONS,
  TIMELINE_COPY,
} from './chat-timeline-copy';

/**
 * Type contract defining intent prompt bubble props.
 * Includes fields/members: msg, isFr, chosenIntent, canPickIntent, onSelectIntent.
 */
interface IntentPromptBubbleProps {
  /** msg property. */
  msg: Message;
  /** is fr property. */
  isFr: boolean;
  /** chosen intent property. */
  chosenIntent: ConsultationIntent | null;
  /** can pick intent property. */
  canPickIntent: boolean;
  /** on select intent property. */
  onSelectIntent: (intent: ConsultationIntent) => void;
}

/** Computes option card border and hover styling based on selection and interactivity. */
function optionCardClass(
  isChosen: boolean,
  isEmbrace: boolean,
  canPickIntent: boolean
): string {
  if (isChosen) {
    return isEmbrace
      ? 'border-[#BC9C5C] bg-[#BC9C5C]/10 shadow-sm'
      : 'border-[#006C9C] bg-[#006C9C]/10 shadow-sm';
  }
  if (!canPickIntent) {
    return 'border-[#E2E8F0] bg-[#F8FAFC]/70 opacity-75 cursor-default';
  }
  return isEmbrace
    ? 'border-[#E2E8F0] hover:border-[#BC9C5C] hover:bg-[#BC9C5C]/5 cursor-pointer'
    : 'border-[#E2E8F0] hover:border-[#006C9C] hover:bg-[#006C9C]/5 cursor-pointer';
}

/** Renders the two-option consultation guide prompt card inside the message timeline. */
export function IntentPromptBubble({
  msg,
  isFr,
  chosenIntent,
  canPickIntent,
  onSelectIntent,
}: IntentPromptBubbleProps) {
  const copy = TIMELINE_COPY[isFr ? 'fr' : 'en'];

  return (
    <div className="mr-auto ml-0 max-w-[92%] sm:max-w-[80%] text-left space-y-1">
      <div className="text-xs font-semibold text-[#006C9C] flex items-center gap-1.5 ml-1">
        <span>{copy.guideAuthor}</span>
        <Badge variant="gold" className="text-[11px] py-0.5 px-2">
          {copy.guideBadge}
        </Badge>
      </div>
      <div className="rounded-2xl border border-[#006C9C]/25 bg-white p-4 shadow-sm space-y-3">
        <p className="text-xs sm:text-sm text-[#082233] leading-relaxed font-medium">
          {copy.guideIntro}
        </p>
        <div className="space-y-2.5">
          {INTENT_OPTIONS.map((opt) => {
            const isChosen = chosenIntent === opt.id;
            const isEmbrace = opt.id === 'EMBRACE_ISLAM';
            const cardCls = optionCardClass(isChosen, isEmbrace, canPickIntent);
            const iconCls = isEmbrace
              ? 'bg-[#BC9C5C]/15 text-[#6A5420]'
              : 'bg-[#006C9C]/10 text-[#006C9C]';

            return (
              <button
                key={opt.id}
                type="button"
                disabled={!canPickIntent}
                onClick={() => canPickIntent && onSelectIntent(opt.id)}
                className={`w-full p-3.5 rounded-xl border-2 text-left transition-all active:scale-[0.98] duration-100 ease-out flex items-start gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006C9C] ${cardCls}`}
              >
                <div className={`p-2 rounded-lg shrink-0 ${iconCls}`}>
                  {opt.icon === 'book' ? (
                    <BookOpen className="w-4 h-4" />
                  ) : (
                    <HeartHandshake className="w-4 h-4" />
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold text-xs sm:text-sm text-[#082233]">
                      {isFr ? opt.titleFr : opt.titleEn}
                    </span>
                    <div className="flex flex-col items-end shrink-0">
                      <div className="flex items-center gap-1.5">
                        {isChosen && (
                          <Badge variant="approved" className="text-[11px] gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            {copy.selectedBadge}
                          </Badge>
                        )}
                        <span
                          className={`text-xs font-arabic ${
                            isEmbrace ? 'text-[#6A5420]' : 'text-[#006C9C]'
                          }`}
                          dir="rtl"
                        >
                          {opt.arabic}
                        </span>
                      </div>
                      <span className="text-[10px] text-[#5F7383] italic">
                        ({opt.transliteration})
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-[#5F7383] leading-relaxed">
                    {isFr ? opt.descFr : opt.descEn}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
      <div className="text-[11px] text-[#5F7383] ml-1">
        {formatChatTime(msg.sentAt, isFr)}
      </div>
    </div>
  );
}
