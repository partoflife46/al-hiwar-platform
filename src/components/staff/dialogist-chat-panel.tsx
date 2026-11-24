/**
 * Active specialist chat transcript, 1-click quick replies, and reply composer card.
 */

'use client';

/**
 * Module architecture and API reference for
 *   `src/components/staff/dialogist-chat-panel.tsx`.
 *
 * Exported symbols:
 * - `DialogistChatPanel` (Function): dialogist chat panel definition.
 *
 * Internal dependencies:
 * - `@/hooks/use-staff-portal`
 * - `@/lib/db/types`
 * - `@/components/ui/card`
 * - `@/components/ui/badge`
 * - `@/components/ui/button`
 * - `@/components/ui/input`
 * - `./dialogist-copy`
 *
 * @module components/staff/dialogist-chat-panel
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

import * as React from 'react';
import type { StaffPortalContext } from '@/hooks/use-staff-portal';
import type { Message } from '@/lib/db/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send } from 'lucide-react';
import { DIALOGIST_COPY, resolveDialogistAudioSrc } from './dialogist-copy';

/**
 * Type contract defining message row props.
 * Includes fields/members: msg, nonMuslimId, isFr.
 */
interface MessageRowProps {
  msg: Message;
  nonMuslimId?: string;
  isFr: boolean;
}

/** Renders a single system, seeker, or specialist message inside the staff chat transcript. */
function StaffChatMessageRow({ msg, nonMuslimId, isFr }: MessageRowProps) {
  const copy = DIALOGIST_COPY[isFr ? 'fr' : 'en'];

  if (msg.senderId === 'system') {
    const isPrompt = msg.messageType === 'INTENT_PROMPT';
    const tone = isPrompt
      ? 'bg-sky-50 border-sky-200 text-[#082233]'
      : 'bg-amber-50 border-amber-200 text-amber-900';
    return (
      <div
        className={`mx-auto my-1 p-2.5 rounded-xl text-xs max-w-md border text-center font-medium ${tone}`}
      >
        {isPrompt && (
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#006C9C] mb-1">
            {copy.autoOptionsLabel}
          </div>
        )}
        <div>{msg.content}</div>
      </div>
    );
  }

  const isStaff = msg.senderId !== nonMuslimId;
  const voiceSrc = resolveDialogistAudioSrc(msg.audioUrl);
  const bubbleTone = isStaff
    ? 'ml-auto bg-[#006C9C] text-white'
    : 'bg-white border border-[#E2E8F0] text-[#082233]';

  return (
    <div className={`p-3 rounded-xl text-xs max-w-lg ${bubbleTone}`}>
      <div className="font-bold opacity-80 mb-0.5">
        {isStaff ? copy.specialistLabel : copy.seekerLabel}
      </div>
      <div>{msg.content}</div>
      {msg.hasVoiceNote && (
        <audio
          key={`${msg.id}-${voiceSrc}`}
          controls
          preload="metadata"
          src={voiceSrc}
          className="w-full min-w-[220px] h-8 mt-2"
        />
      )}
    </div>
  );
}

/** Renders the active specialist chat room with approved 1-click quick replies. */
export function DialogistChatPanel({ ctx }: { ctx: StaffPortalContext }) {
  const {
    isFr,
    selectedConversation,
    isAuditOnly,
    activeMessages,
    templates,
    replyText,
    setReplyText,
    handleSendReply,
  } = ctx;

  const copy = DIALOGIST_COPY[isFr ? 'fr' : 'en'];
  const approvedTemplates = templates.filter((t) => t.isApproved);

  return (
    <Card className="p-6 rounded-2xl border border-[#E2E8F0] bg-white space-y-4">
      <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
        <div>
          <h2 className="text-base font-extrabold text-[#082233]">
            {copy.chatTitle}
          </h2>
          <p className="text-xs text-[#5F7383]">{copy.privacyGuard}</p>
        </div>
        <div className="flex items-center gap-2">
          {selectedConversation && (
            <Badge variant="primary" className="text-xs font-mono">
              {selectedConversation.id}
            </Badge>
          )}
          {isAuditOnly && (
            <Badge
              variant="outline"
              className="text-xs font-bold text-[#8C6D32] bg-[#BC9C5C]/10 border-[#BC9C5C]/30"
            >
              Mode Audit (Hanya Baca)
            </Badge>
          )}
        </div>
      </div>

      <div className="max-h-64 overflow-y-auto space-y-2.5 rounded-2xl bg-[#F8FAFC] p-4 border border-[#E2E8F0]">
        {activeMessages.map((msg) => (
          <StaffChatMessageRow
            key={msg.id}
            msg={msg}
            nonMuslimId={selectedConversation?.nonMuslimId}
            isFr={isFr}
          />
        ))}
      </div>

      {!isAuditOnly && (
        <div className="space-y-1.5">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#5F7383]">
            {copy.quickRepliesTitle}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {approvedTemplates.map((tpl) => (
              <button
                key={tpl.id}
                type="button"
                onClick={() => handleSendReply(tpl.id)}
                className="px-2.5 py-1 rounded-lg text-xs font-mono font-semibold bg-[#006C9C]/10 text-[#006C9C] hover:bg-[#006C9C] hover:text-white transition-colors"
              >
                {tpl.shortcut} ({tpl.category})
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        <Input
          aria-label={copy.replyAria}
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          disabled={isAuditOnly}
          placeholder={
            isAuditOnly
              ? 'Mode Audit (Hanya Baca) — Akun audit tidak dapat mengirim pesan.'
              : copy.replyPlaceholder
          }
          className="text-base sm:text-xs"
        />
        {isAuditOnly ? (
          <Badge
            variant="outline"
            className="px-3 py-2 text-xs font-bold text-[#5F7383] bg-[#F1F5F9] border-[#CBD5E1] shrink-0 whitespace-nowrap"
          >
            Mode Audit (Hanya Baca)
          </Badge>
        ) : (
          <Button
            type="button"
            variant="primary"
            onClick={() => handleSendReply()}
            className="gap-1.5 text-xs font-bold shrink-0"
          >
            <Send className="w-3.5 h-3.5" /> {copy.sendBtn}
          </Button>
        )}
      </div>
    </Card>
  );
}
