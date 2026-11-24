/**
 * Module architecture and API reference for `src/hooks/chat/use-chat-actions.ts`.
 *
 * Exported symbols:
 * - `UseChatActionsOptions` (Interface): use chat actions options definition.
 * - `useChatWindowActions` (Function): use chat window actions definition.
 *
 * Internal dependencies:
 * - `@/lib/db/types`
 * - `@/lib/db/in-memory-adapter`
 * - `./chat-window-helpers`
 *
 * @module hooks/chat/use-chat-actions
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

/**
 * Outgoing chat message, quick-reply, intent choice, inline Shahadah review,
 * and claim action handlers extracted from `useChatWindow`.
 */

import * as React from 'react';
import type {
  ConsultationIntent,
  Conversation,
  Message,
  PredefinedMessage,
  ShahadahSubmission,
} from '@/lib/db/types';
import { db } from '@/lib/db/in-memory-adapter';
import {
  appendUniqueMessage,
  buildOptimisticMessage,
  CHAT_WINDOW_COPY,
  postChatMessage,
  postInlineShahadahReview,
  syncLocalDbMessage,
} from './chat-window-helpers';

/** Dependencies injected by `useChatWindow` into chat mutation handlers. */
export interface UseChatActionsOptions {
  /** conversation property. */
  conversation: Conversation;
  /** current user id property. */
  currentUserId: string;
  /** is fr property. */
  isFr: boolean;
  /** input text property. */
  inputText: string;
  /** set input text property. */
  setInputText: React.Dispatch<React.SetStateAction<string>>;
  /** latest submission property. */
  latestSubmission: ShahadahSubmission | null;
  /** set messages property. */
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  /** set current conversation property. */
  setCurrentConversation: React.Dispatch<React.SetStateAction<Conversation>>;
  /** fetch messages property. */
  fetchMessages: (showSpin?: boolean) => Promise<void>;
  /** Optional on send message property. */
  onSendMessage?: (content: string, predefinedReplyId?: string) => Promise<void>;
  /** Optional on claim conversation property. */
  onClaimConversation?: (conversationId: string) => Promise<void>;
}

/**
 * Encapsulates async chat interaction states and handlers for the Chat Window.
 * @param options - Conversation metadata, setters, and optional parent callbacks.
 * @returns Busy flags and event handlers for sending, reviewing, and claiming.
 */
export function useChatWindowActions({
  conversation,
  currentUserId,
  isFr,
  inputText,
  setInputText,
  latestSubmission,
  setMessages,
  setCurrentConversation,
  fetchMessages,
  onSendMessage,
  onClaimConversation,
}: UseChatActionsOptions) {
  const copy = CHAT_WINDOW_COPY[isFr ? 'fr' : 'en'];
  const [isSending, setIsSending] = React.useState(false);
  const [isClaiming, setIsClaiming] = React.useState(false);
  const [isReviewingShahadah, setIsReviewingShahadah] = React.useState(false);
  const [isSelectingIntent, setIsSelectingIntent] = React.useState(false);

  /**
   * Asynchronously executes handle send custom message logic.
   */
  const handleSendCustomMessage = async () => {
    if (!inputText.trim() || isSending) return;
    setIsSending(true);
    const content = inputText.trim();
    setInputText('');

    try {
      if (onSendMessage) {
        await onSendMessage(content);
        return;
      }
      const created = await postChatMessage({
        conversationId: conversation.id,
        senderId: currentUserId,
        content,
      });
      const delivered =
        created || buildOptimisticMessage(conversation.id, currentUserId, content);
      setMessages((prev) => appendUniqueMessage(prev, delivered));
      syncLocalDbMessage(delivered);
    } catch (err) {
      console.error('Failed to send message:', err);
      const fallback = buildOptimisticMessage(conversation.id, currentUserId, content);
      setMessages((prev) => [...prev, fallback]);
      db.messages.push(fallback);
    } finally {
      setIsSending(false);
    }
  };

  /**
   * Asynchronously executes handle send quick reply logic.
   * @param template - Template value (`PredefinedMessage`).
   */
  const handleSendQuickReply = async (template: PredefinedMessage) => {
    if (isSending) return;
    setIsSending(true);
    const content = isFr ? template.bodyFr : template.bodyEn;
    try {
      if (onSendMessage) {
        await onSendMessage(content, template.id);
      } else {
        const created = await postChatMessage({
          conversationId: conversation.id,
          senderId: currentUserId,
          content,
          predefinedReplyId: template.id,
        });
        if (created) setMessages((prev) => appendUniqueMessage(prev, created));
      }
    } catch (err) {
      console.error('Failed to send quick reply:', err);
    } finally {
      setIsSending(false);
    }
  };

  /**
   * Asynchronously executes handle inline shahadah review logic.
   * @param decision - Decision value (`'VALIDATE' | 'REQUEST_RETAKE'`).
   */
  const handleInlineShahadahReview = async (
    decision: 'VALIDATE' | 'REQUEST_RETAKE'
  ) => {
    if (!latestSubmission || isReviewingShahadah) return;
    setIsReviewingShahadah(true);
    try {
      const ok = await postInlineShahadahReview({
        dialogistId: currentUserId,
        submissionId: latestSubmission.id,
        decision,
        isFr: conversation.language === 'fr',
      });
      if (ok) await fetchMessages(false);
    } catch (err) {
      console.error('Failed to review shahadah inline:', err);
    } finally {
      setIsReviewingShahadah(false);
    }
  };

  /**
   * Asynchronously executes handle select chat intent logic.
   * @param selectedIntent - Selected intent value (`ConsultationIntent`).
   */
  const handleSelectChatIntent = async (selectedIntent: ConsultationIntent) => {
    if (isSelectingIntent) return;
    setIsSelectingIntent(true);
    const labelText =
      selectedIntent === 'LEARN_ABOUT_ISLAM' ? copy.intentLearn : copy.intentEmbrace;
    try {
      setCurrentConversation((prev) => ({ ...prev, intent: selectedIntent }));
      if (onSendMessage) {
        await onSendMessage(labelText);
      } else {
        const created = await postChatMessage({
          conversationId: conversation.id,
          senderId: currentUserId,
          content: labelText,
          messageType: 'INTENT_CHOICE',
          selectedIntent,
        });
        if (created) {
          setMessages((prev) => appendUniqueMessage(prev, created));
          syncLocalDbMessage(created);
        }
      }
    } catch (err) {
      console.error('Failed to send consultation choice:', err);
    } finally {
      setIsSelectingIntent(false);
    }
  };

  /**
   * Asynchronously executes handle claim logic.
   */
  const handleClaim = async () => {
    if (isClaiming) return;
    setIsClaiming(true);
    try {
      if (onClaimConversation) {
        await onClaimConversation(conversation.id);
      } else {
        await fetch('/api/chat/claim', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId: conversation.id,
            dialogistId: currentUserId,
          }),
        });
      }
      setCurrentConversation((prev) => ({
        ...prev,
        isAssigned: true,
        dialogistId: currentUserId,
        status: 'ACTIVE',
      }));
    } catch (err) {
      console.error('Failed to claim conversation:', err);
    } finally {
      setIsClaiming(false);
    }
  };

  return {
    isSending,
    setIsSending,
    isClaiming,
    setIsClaiming,
    isReviewingShahadah,
    setIsReviewingShahadah,
    isSelectingIntent,
    setIsSelectingIntent,
    handleSendCustomMessage,
    handleSendQuickReply,
    handleInlineShahadahReview,
    handleSelectChatIntent,
    handleClaim,
  };
}
