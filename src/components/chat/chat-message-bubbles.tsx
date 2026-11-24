/**
 * Individual message bubble components for system notices, seekers, and dialogists.
 */

'use client';

/**
 * Module architecture and API reference for `src/components/chat/chat-message-bubbles.tsx`.
 *
 * Exported symbols:
 * - `InactivityNoticeBanner` (Function): inactivity notice banner definition.
 * - `SeekerMessageBubble` (Function): seeker message bubble definition.
 * - `DialogistMessageBubble` (Function): dialogist message bubble definition.
 *
 * Internal dependencies:
 * - `@/lib/db/types`
 * - `@/lib/db/in-memory-adapter`
 * - `@/components/ui/badge`
 * - `@/components/ui/button`
 * - `./chat-timeline-copy`
 *
 * @module components/chat/chat-message-bubbles
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

import * as React from 'react';
import type { Message, ShahadahSubmission, User, UserSession } from '@/lib/db/types';
import { db } from '@/lib/db/in-memory-adapter';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Clock, Mic, XCircle } from 'lucide-react';
import {
  formatChatTime,
  resolveAudioSrc,
  SHAHADAH_BADGE_VARIANT,
  TIMELINE_COPY,
} from './chat-timeline-copy';

/** Renders a 120s watchdog inactivity notice banner. */
export function InactivityNoticeBanner({
  content,
  isFr,
}: {
  content: string;
  isFr: boolean;
}) {
  const copy = TIMELINE_COPY[isFr ? 'fr' : 'en'];
  return (
    <div className="mx-auto max-w-lg my-4 rounded-xl border border-[#D97706]/30 bg-[#D97706]/10 p-3.5 flex items-start gap-3">
      <Clock className="w-5 h-5 text-[#D97706] shrink-0 mt-0.5" />
      <div className="text-xs text-[#D97706] leading-relaxed">
        <p className="font-semibold mb-0.5">{copy.inactivityTitle}</p>
        <p>{content}</p>
      </div>
    </div>
  );
}

/**
 * Type contract defining seeker message bubble props.
 * Includes fields/members: msg, isFr, latestSubmission, canReviewInline,
 * isReviewingShahadah, onReview.
 */
interface SeekerMessageBubbleProps {
  /** msg property. */
  msg: Message;
  /** is fr property. */
  isFr: boolean;
  /** latest submission property. */
  latestSubmission: ShahadahSubmission | null;
  /** can review inline property. */
  canReviewInline: boolean;
  /** is reviewing shahadah property. */
  isReviewingShahadah: boolean;
  /** on review property. */
  onReview: (decision: 'VALIDATE' | 'REQUEST_RETAKE') => void;
}

/** Renders a seeker chat bubble, including optional Shahadah audio player and inline review buttons. */
export function SeekerMessageBubble({
  msg,
  isFr,
  latestSubmission,
  canReviewInline,
  isReviewingShahadah,
  onReview,
}: SeekerMessageBubbleProps) {
  const copy = TIMELINE_COPY[isFr ? 'fr' : 'en'];
  const audioSrc = resolveAudioSrc(msg.audioUrl || latestSubmission?.audioRecordingUrl);
  const subStatus = latestSubmission?.status ?? 'PENDING_REVIEW';
  const showReviewControls = canReviewInline && subStatus !== 'VALIDATED';

  return (
    <div className="ml-auto mr-0 max-w-[75%] min-w-0 text-right space-y-1">
      <div className="inline-block text-left bg-[#006C9C] text-white rounded-[18px] rounded-br-[4px] p-3 text-sm shadow-sm leading-relaxed max-w-full min-w-0 break-words [overflow-wrap:anywhere]">
        {msg.hasVoiceNote ? (
          <div className="space-y-2 bg-white text-[#082233] p-3 rounded-xl border border-[#BC9C5C] w-full min-w-[220px] sm:min-w-[260px]">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-bold text-[#6A5420] flex items-center gap-1">
                <Mic className="w-3.5 h-3.5" />
                {copy.shahadahAudioTitle}
              </span>
              <Badge variant={SHAHADAH_BADGE_VARIANT[subStatus]}>
                {copy.statusLabels[subStatus]}
              </Badge>
            </div>
            <audio
              key={`${msg.id}-${audioSrc}`}
              controls
              preload="metadata"
              src={audioSrc}
              className="w-full h-9"
            />
            {showReviewControls && (
              <div className="flex flex-wrap gap-1.5 pt-1 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isReviewingShahadah}
                  onClick={() => onReview('REQUEST_RETAKE')}
                  className="text-[11px] h-7 px-2 border-[#D97706] text-[#D97706] gap-1"
                >
                  <XCircle className="w-3 h-3" />
                  <span>{copy.requestRetake}</span>
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  disabled={isReviewingShahadah}
                  onClick={() => onReview('VALIDATE')}
                  className="text-[11px] h-7 px-2 bg-[#0D7A5F] hover:bg-[#095c47] gap-1 font-bold"
                >
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{copy.validateShahadah}</span>
                </Button>
              </div>
            )}
          </div>
        ) : (
          <>
            {msg.messageType === 'INTENT_CHOICE' && (
              <div className="text-[11px] uppercase tracking-wider font-bold text-[#FDF4D4] mb-1 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>{copy.selectedIntentLabel}</span>
              </div>
            )}
            <p>{msg.content}</p>
          </>
        )}
      </div>
      <div className="text-[11px] text-[#5F7383]">{formatChatTime(msg.sentAt, isFr)}</div>
    </div>
  );
}

/**
 * Type contract defining dialogist message bubble props.
 * Includes fields/members: msg, isFr, currentUser.
 */
interface DialogistMessageBubbleProps {
  msg: Message;
  isFr: boolean;
  currentUser: UserSession | User;
}

/** Resolves the display name of the specialist who authored a chat message. */
function resolveDialogistName(
  senderId: string,
  currentUser: UserSession | User,
  fallback: string
): string {
  const currentUserId = 'userId' in currentUser ? currentUser.userId : currentUser.id;
  const matched =
    senderId === currentUserId
      ? currentUser
      : db.users.find((u) => u.id === senderId);
  if (!matched) return fallback;
  return `${matched.firstName}${matched.surname ? ` ${matched.surname}` : ''}`.trim();
}

/** Renders a specialist chat bubble with optional authentic reference audio player. */
export function DialogistMessageBubble({
  msg,
  isFr,
  currentUser,
}: DialogistMessageBubbleProps) {
  const copy = TIMELINE_COPY[isFr ? 'fr' : 'en'];
  const displayName = resolveDialogistName(
    msg.senderId,
    currentUser,
    copy.certifiedDialogist
  );
  const refAudioSrc =
    msg.audioUrl === '/audio/reference-shahadah-ar.webm'
      ? '/audio/reference-shahadah-ar.wav'
      : resolveAudioSrc(msg.audioUrl);

  return (
    <div className="mr-auto ml-0 max-w-[75%] min-w-0 text-left space-y-1">
      <div className="text-xs font-semibold text-[#006C9C] flex flex-wrap items-center gap-1.5 ml-1">
        <span>{displayName}</span>
        <Badge variant="gold" className="text-[11px] py-0.5 px-2">
          {copy.dialogistBadge}
        </Badge>
      </div>
      <div className="inline-block bg-[#F8FAFC] border border-[#005072]/20 text-[#082233] rounded-[18px] rounded-bl-[4px] p-3 text-sm shadow-[0_1px_3px_rgba(0,0,0,0.04)] leading-relaxed max-w-full min-w-0 break-words [overflow-wrap:anywhere]">
        <p>{msg.content}</p>
        {msg.audioUrl && (
          <div className="mt-2.5 pt-2 border-t border-[#CBD5E1]/60 space-y-1">
            <div className="text-[11px] font-bold text-[#005072] flex items-center gap-1">
              <Mic className="w-3 h-3" aria-hidden="true" />
              <span>{copy.modelRefAudio}</span>
            </div>
            <audio
              key={`${msg.id}-${msg.audioUrl}`}
              controls
              preload="metadata"
              src={refAudioSrc}
              className="w-full min-w-0 h-8"
            />
          </div>
        )}
      </div>
      <div className="text-[11px] text-[#5F7383] ml-1">
        {formatChatTime(msg.sentAt, isFr)}
      </div>
    </div>
  );
}
