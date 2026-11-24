'use client';

/**
 * Module architecture and API reference for `src/components/chat/chat-composer.tsx`.
 *
 * Exported symbols:
 * - `ChatComposer` (Function): chat composer definition.
 *
 * Internal dependencies:
 * - `@/hooks/use-chat-window`
 * - `@/lib/db/types`
 * - `@/components/ui/button`
 * - `@/components/ui/badge`
 *
 * @module components/chat/chat-composer
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

/**
 * UI presentation module for chat composer within the chat workspace.
 * Encapsulates accessible markup, bilingual labels, and typed component props.
 * @module components/chat/chat-composer
 * @exports ChatComposer
 */

import * as React from "react";
import type { ChatWindowContext } from "@/hooks/use-chat-window";
import type { PredefinedMessageCategory } from "@/lib/db/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Send,
  Clock,
  Mic,
  ShieldCheck,
  UserCheck,
  AlertCircle,
  RotateCcw,
  MessageSquare,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  XCircle,
  BookOpen,
  HeartHandshake,
} from "lucide-react";

/**
 * Constant definition for categories.
 */
const CATEGORIES: { id: PredefinedMessageCategory; labelEn: string; labelFr: string }[] = [
  { id: "GREETING", labelEn: "/greeting", labelFr: "/salutation" },
  { id: "THEOLOGY", labelEn: "/theology", labelFr: "/théologie" },
  { id: "SHAHADAH", labelEn: "/shahadah", labelFr: "/chahada" },
  { id: "MISCONCEPTIONS", labelEn: "/misconceptions", labelFr: "/idées-reçues" },
];

/**
 * Executes resolve audio src logic.
 * @param url - Url value (`string | null`).
 * @returns Value of type `string`.
 */
function resolveAudioSrc(url?: string | null): string {
  if (!url || url.startsWith("blob:")) {
    return "/audio/sample-shahadah-jean-luc.wav";
  }
  return url;
}

/**
 * Quick-reply category selector and message composer area.
 */
export function ChatComposer({ ctx }: { ctx: ChatWindowContext }) {
  const { conversation, currentUser, seekerProfile, approvedQuickReplies, readOnly, auditMode, onSendMessage, onClaimConversation, onReassignConversation, availableDialogists, onInitiateShahadah, onShahadahValidated, isShahadahValidated, isFr, messages, setMessages, isRefreshing, setIsRefreshing, customInactivityNotice, setCustomInactivityNotice, activeCategory, setActiveCategory, inputText, setInputText, isSending, setIsSending, isClaiming, setIsClaiming, currentConversation, setCurrentConversation, latestSubmission, setLatestSubmission, isReviewingShahadah, setIsReviewingShahadah, isSelectingIntent, setIsSelectingIntent, reassignTargetId, setReassignTargetId, isReassigning, setIsReassigning, reassignStatus, setReassignStatus, messagesEndRef, messagesContainerRef, onShahadahValidatedRef, isFrRef, inactivityNotice, scrollToBottom, fetchMessages, currentUserId, handleSendCustomMessage, handleSendQuickReply, handleInlineShahadahReview, handleSelectChatIntent, handleClaim, isDialogist, isSupervisorOrAdmin, isSeeker, filteredQuickReplies } = ctx;
  return (
    <>
      {/* Dialogist Quick Replies (Hidden for Seeker & Read-Only Audit) */}
      {!readOnly && !auditMode && isDialogist && (
        <div className="border-t border-[#E2E8F0] bg-white p-3 space-y-2">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto overscroll-x-contain snap-x">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006C9C] ${
                  activeCategory === cat.id
                    ? 'bg-[#006C9C] text-white shadow-sm'
                    : 'bg-[#F8FAFC] text-[#5F7383] hover:text-[#082233] border border-[#E2E8F0]'
                }`}
              >
                {isFr ? cat.labelFr : cat.labelEn}
              </button>
            ))}
          </div>

          {/* Quick Reply Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto overscroll-x-contain snap-x py-1">
            {filteredQuickReplies.length > 0 ? (
              filteredQuickReplies.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => handleSendQuickReply(template)}
                  disabled={isSending}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border border-[#BC9C5C] bg-[#BC9C5C]/10 text-[#6A5420] hover:bg-[#BC9C5C] hover:text-white active:scale-[0.96] transition-[background-color,color,transform] whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BC9C5C]"
                  title={isFr ? template.bodyFr : template.bodyEn}
                >
                  <span className="font-mono text-[11px] text-[#8A672B] group-hover:text-white">
                    {template.shortcut}
                  </span>
                  <span className="truncate max-w-[200px]">
                    {isFr ? template.bodyFr.slice(0, 36) : template.bodyEn.slice(0, 36)}…
                  </span>
                </button>
              ))
            ) : (
              <span className="text-xs text-[#5F7383] italic">
                {isFr ? 'Aucun modèle dans cette catégorie.' : 'No templates in this category.'}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Composer Area (Hidden in Audit Mode) */}
      {!readOnly && !auditMode ? (
        <div className="p-3 border-t border-[#E2E8F0] bg-white flex items-end gap-2">
          <label htmlFor="chat-message-composer" className="sr-only">
            {isDialogist
              ? isFr
                ? 'Rédiger une réponse théologique'
                : 'Type custom theological response'
              : isFr
              ? 'Écrivez votre message au spécialiste'
              : 'Type your message to the specialist'}
          </label>
          <textarea
            id="chat-message-composer"
            name="message"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendCustomMessage();
              }
            }}
            placeholder={
              isDialogist
                ? isFr
                  ? 'Rédiger une réponse théologique…'
                  : 'Type custom theological response…'
                : isFr
                ? 'Écrivez votre message au spécialiste…'
                : 'Type your message to the specialist…'
            }
            rows={2}
            enterKeyHint="send"
            className="flex-1 resize-none rounded-[10px] border border-[#CBD5E1] bg-white px-3 py-2 text-base sm:text-sm text-[#082233] outline-transparent focus:border-[#006C9C] focus:ring-2 focus:ring-[#006C9C]/15 focus-visible:outline-none"
          />
          <Button
            type="button"
            variant="primary"
            size="sm"
            disabled={!inputText.trim() || isSending}
            onClick={handleSendCustomMessage}
            aria-label={isFr ? 'Envoyer le message' : 'Send message'}
            title={isFr ? 'Envoyer le message' : 'Send message'}
            className="h-[58px] px-4"
          >
            <Send className="w-4 h-4" aria-hidden="true" />
          </Button>
        </div>
      ) : (
        <div className="p-3 border-t border-[#E2E8F0] bg-[#F8FAFC] text-center text-xs text-[#5F7383]">
          {isFr
            ? 'Les contrôles de messagerie sont désactivés en mode audit.'
            : 'Messaging controls are disabled in audit mode.'}
        </div>
      )}
    </>
  );
}
