/**
 * Scrollable live message timeline orchestrating welcome, Shahadah, and bubble views.
 */

'use client';

/**
 * Module architecture and API reference for `src/components/chat/chat-timeline.tsx`.
 *
 * Exported symbols:
 * - `ChatTimeline` (Function): chat timeline definition.
 *
 * Internal dependencies:
 * - `@/hooks/use-chat-window`
 * - `@/components/ui/button`
 * - `@/components/ui/badge`
 * - `./chat-timeline-copy`
 * - `./intent-prompt-bubble`
 * - `./chat-message-bubbles`
 *
 * @module components/chat/chat-timeline
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

import * as React from 'react';
import type { ChatWindowContext } from '@/hooks/use-chat-window';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Sparkles } from 'lucide-react';
import { TIMELINE_COPY } from './chat-timeline-copy';
import { IntentPromptBubble } from './intent-prompt-bubble';
import {
  DialogistMessageBubble,
  InactivityNoticeBanner,
  SeekerMessageBubble,
} from './chat-message-bubbles';

/** Renders the scrollable message timeline with inline Shahadah review and intent prompts. */
export function ChatTimeline({ ctx }: { ctx: ChatWindowContext }) {
  const {
    conversation,
    currentUser,
    readOnly,
    auditMode,
    onShahadahValidated,
    isShahadahValidated,
    isFr,
    messages,
    latestSubmission,
    isReviewingShahadah,
    isSelectingIntent,
    messagesEndRef,
    messagesContainerRef,
    inactivityNotice,
    handleInlineShahadahReview,
    handleSelectChatIntent,
    isDialogist,
    isSeeker,
  } = ctx;

  const copy = TIMELINE_COPY[isFr ? 'fr' : 'en'];
  const showValidatedBanner =
    isSeeker && (isShahadahValidated || latestSubmission?.status === 'VALIDATED');
  const chosenIntent =
    messages.find((m) => m.messageType === 'INTENT_CHOICE' && m.selectedIntent)
      ?.selectedIntent || null;
  const canPickIntent =
    isSeeker && !readOnly && !auditMode && !chosenIntent && !isSelectingIntent;
  const canReviewInline =
    isDialogist && !readOnly && !auditMode && Boolean(latestSubmission);
  const hasSystemNotice = messages.some(
    (m) => m.senderId === 'system' && m.messageType !== 'INTENT_PROMPT'
  );

  return (
    <div
      ref={messagesContainerRef}
      className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5 space-y-4 bg-[#F8FAFC]/50"
    >
      <div className="text-center my-2">
        <Badge variant="default" className="text-[11px] py-1 px-3">
          {copy.sessionInit}
        </Badge>
      </div>

      {showValidatedBanner && (
        <div className="rounded-2xl border-2 border-[#BC9C5C] bg-gradient-to-r from-[#BC9C5C]/20 via-[#D8BC7C]/20 to-[#BC9C5C]/10 p-4 shadow-md flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#BC9C5C] text-[#082233]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-[#082233]">
                {copy.validatedTitle}
              </h4>
              <p className="text-xs text-[#5F7383]">{copy.validatedSubtitle}</p>
            </div>
          </div>
          <Button
            variant="accent"
            size="sm"
            onClick={onShahadahValidated}
            className="font-bold shadow-md shrink-0 gap-1.5"
          >
            <span>{copy.completeProfile}</span>
          </Button>
        </div>
      )}

      {messages.length === 0 && (
        <div className="text-center py-12 px-4 max-w-md mx-auto space-y-3">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-[#006C9C]/10 text-[#006C9C] flex items-center justify-center">
            <MessageSquare className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#082233]">{copy.emptyTitle}</h3>
          <p className="text-xs text-[#5F7383] leading-relaxed">{copy.emptySubtitle}</p>
        </div>
      )}

      {messages.map((msg) => {
        if (msg.messageType === 'INTENT_PROMPT') {
          return (
            <IntentPromptBubble
              key={msg.id}
              msg={msg}
              isFr={isFr}
              chosenIntent={chosenIntent}
              canPickIntent={canPickIntent}
              onSelectIntent={handleSelectChatIntent}
            />
          );
        }
        if (msg.senderId === 'system') {
          return (
            <InactivityNoticeBanner key={msg.id} content={msg.content} isFr={isFr} />
          );
        }
        if (msg.senderId === conversation.nonMuslimId) {
          return (
            <SeekerMessageBubble
              key={msg.id}
              msg={msg}
              isFr={isFr}
              latestSubmission={latestSubmission}
              canReviewInline={canReviewInline}
              isReviewingShahadah={isReviewingShahadah}
              onReview={handleInlineShahadahReview}
            />
          );
        }
        return (
          <DialogistMessageBubble
            key={msg.id}
            msg={msg}
            isFr={isFr}
            currentUser={currentUser}
          />
        );
      })}

      {inactivityNotice && !hasSystemNotice && (
        <InactivityNoticeBanner content={inactivityNotice} isFr={isFr} />
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}
