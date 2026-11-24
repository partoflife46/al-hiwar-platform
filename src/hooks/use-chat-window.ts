/**
 * Module architecture and API reference for `src/hooks/use-chat-window.ts`.
 *
 * Exported symbols:
 * - `ChatWindowProps` (Interface): chat window props definition.
 * - `useChatWindow` (Function): use chat window definition.
 * - `ChatWindowContext` (TypeAlias): chat window context definition.
 *
 * Internal dependencies:
 * - `@/lib/db/types`
 * - `@/lib/context/language-context`
 * - `./chat/chat-window-helpers`
 * - `./chat/use-chat-stream`
 * - `./chat/use-chat-actions`
 *
 * @module hooks/use-chat-window
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

/**
 * Main React hook managing chat window state, live sync, quick replies, and Shahadah review.
 * Delegates SSE streaming to `useChatEventStream` and mutations to `useChatWindowActions`.
 */

import * as React from 'react';
import type {
  Conversation,
  Message,
  PredefinedMessage,
  PredefinedMessageCategory,
  ShahadahSubmission,
  SupportedLanguage,
  User,
  UserSession,
} from '@/lib/db/types';
import { useLanguage } from '@/lib/context/language-context';
import {
  CHAT_WINDOW_COPY,
  fetchConversationSnapshot,
  isValidationMessage,
  mergeIncomingMessages,
} from './chat/chat-window-helpers';
import { useChatEventStream } from './chat/use-chat-stream';
import { useChatWindowActions } from './chat/use-chat-actions';

/** Props accepted by the `ChatWindow` component and its backing `useChatWindow` hook. */
export interface ChatWindowProps {
  /** conversation property. */
  conversation: Conversation;
  /** current user property. */
  currentUser: UserSession | User;
  /** Optional initial messages property. */
  initialMessages?: Message[];
  /** Optional seeker profile property. */
  seekerProfile?: {
    firstName: string;
    surname?: string;
    email?: string;
    phoneNumber?: string;
    nationality?: string;
    dateOfBirth?: string;
    preferredLanguage: SupportedLanguage;
  };
  /** Optional approved quick replies property. */
  approvedQuickReplies?: PredefinedMessage[];
  /** Optional read only property. */
  readOnly?: boolean;
  /** Optional audit mode property. */
  auditMode?: boolean;
  /** Optional on send message property. */
  onSendMessage?: (content: string, predefinedReplyId?: string) => Promise<void>;
  /** Optional on claim conversation property. */
  onClaimConversation?: (conversationId: string) => Promise<void>;
  /** Optional on reassign conversation property. */
  onReassignConversation?: (
    conversationId: string,
    newDialogistId: string
  ) => Promise<void>;
  /** Optional available dialogists property. */
  availableDialogists?: Array<{ id: string; firstName: string; surname: string }>;
  /** Optional on initiate shahadah property. */
  onInitiateShahadah?: () => void;
  /** Optional on shahadah validated property. */
  onShahadahValidated?: () => void;
  /** Optional is shahadah validated property. */
  isShahadahValidated?: boolean;
}

/**
 * Manages chat window state, SSE subscription, polling, inline Shahadah review,
 * and quick-reply filtering for Seekers, Dialogists, and Supervisors.
 * @param props - Component props supplied to `ChatWindow`.
 * @returns Unified chat context object consumed by header, timeline, and composer subcomponents.
 */
export function useChatWindow(props: ChatWindowProps) {
  const {
    conversation,
    currentUser,
    initialMessages = [],
    approvedQuickReplies = [],
    readOnly = false,
    auditMode = false,
    onSendMessage,
    onClaimConversation,
    availableDialogists = [],
    onShahadahValidated,
    isShahadahValidated = false,
  } = props;

  const { language: uiLang } = useLanguage();
  const isFr = uiLang === 'fr';
  const copy = CHAT_WINDOW_COPY[isFr ? 'fr' : 'en'];

  const [messages, setMessages] = React.useState<Message[]>(initialMessages);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [customInactivityNotice, setCustomInactivityNotice] =
    React.useState<string | null>(null);
  const [activeCategory, setActiveCategory] =
    React.useState<PredefinedMessageCategory>('GREETING');
  const [inputText, setInputText] = React.useState('');
  const [currentConversation, setCurrentConversation] =
    React.useState<Conversation>(conversation);
  const [latestSubmission, setLatestSubmission] =
    React.useState<ShahadahSubmission | null>(null);
  const [reassignTargetId, setReassignTargetId] = React.useState(
    conversation.dialogistId || 'QUEUE'
  );
  const [isReassigning, setIsReassigning] = React.useState(false);
  const [reassignStatus, setReassignStatus] = React.useState<string | null>(null);

  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const messagesContainerRef = React.useRef<HTMLDivElement>(null);
  const onShahadahValidatedRef = React.useRef(onShahadahValidated);
  /** Synchronizes component side effects with reactive dependencies. */
  React.useEffect(() => {
    onShahadahValidatedRef.current = onShahadahValidated;
  }, [onShahadahValidated]);

  const isFrRef = React.useRef(isFr);
  /** Synchronizes component side effects with reactive dependencies. */
  React.useEffect(() => {
    isFrRef.current = isFr;
  }, [isFr]);

  const inactivityNotice =
    customInactivityNotice ??
    (currentConversation.inactivityNoticeSent ? copy.inactivity : null);

  /** Synchronizes component side effects with reactive dependencies. */
  React.useEffect(() => {
    setCurrentConversation(conversation);
  }, [conversation]);

  /** Synchronizes component side effects with reactive dependencies. */
  React.useEffect(() => {
    setMessages(initialMessages);
    setCustomInactivityNotice(null);
    setLatestSubmission(null);
  }, [conversation.id]);

  /** Handles scroll to bottom interaction. */
  const scrollToBottom = () => {
    const container = messagesContainerRef.current;
    if (container) container.scrollTop = container.scrollHeight;
  };

  /** Synchronizes component side effects with reactive dependencies. */
  React.useEffect(() => {
    scrollToBottom();
  }, [messages, inactivityNotice]);

  /**
   * Memoized handler/selector for fetch messages.
   */
  const fetchMessages = React.useCallback(
    async (showSpin = false) => {
      if (showSpin) setIsRefreshing(true);
      try {
        const { messages: incoming, submission } = await fetchConversationSnapshot(
          conversation.id
        );
        if (submission) {
          setLatestSubmission(submission);
          if (submission.status === 'VALIDATED' && onShahadahValidatedRef.current) {
            onShahadahValidatedRef.current();
          }
        }
        if (incoming) {
          setMessages((prev) => mergeIncomingMessages(prev, incoming));
          const latestChoice = [...incoming]
            .reverse()
            .find((m) => m.messageType === 'INTENT_CHOICE' && m.selectedIntent);
          if (latestChoice?.selectedIntent) {
            setCurrentConversation((prev) =>
              prev.intent === latestChoice.selectedIntent
                ? prev
                : { ...prev, intent: latestChoice.selectedIntent! }
            );
          }
          if (
            incoming.some((m) => isValidationMessage(m.content)) &&
            onShahadahValidatedRef.current
          ) {
            onShahadahValidatedRef.current();
          }
        }
      } catch {
        // Ignore transient network errors
      } finally {
        if (showSpin) setIsRefreshing(false);
      }
    },
    [conversation.id]
  );

  /** Synchronizes component side effects with reactive dependencies. */
  React.useEffect(() => {
    fetchMessages();
    const pollId = setInterval(() => fetchMessages(), 1500);
    return () => clearInterval(pollId);
  }, [fetchMessages]);

  useChatEventStream({
    conversationId: conversation.id,
    isFrRef,
    onShahadahValidatedRef,
    setMessages,
    setCurrentConversation,
    setCustomInactivityNotice,
  });

  const currentUserId = 'userId' in currentUser ? currentUser.userId : currentUser.id;
  const actions = useChatWindowActions({
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
  });

  const isDialogist = currentUser.role === 'DIALOGIST';
  const isSupervisorOrAdmin =
    currentUser.role === 'SUPERVISOR' || currentUser.role === 'ADMINISTRATOR';
  const isSeeker = currentUser.role === 'NON_MUSLIM';
  const filteredQuickReplies = approvedQuickReplies.filter(
    (q) => q.category === activeCategory
  );

  return {
    ...props,
    readOnly,
    auditMode,
    availableDialogists,
    isShahadahValidated,
    isFr,
    messages,
    setMessages,
    isRefreshing,
    setIsRefreshing,
    customInactivityNotice,
    setCustomInactivityNotice,
    activeCategory,
    setActiveCategory,
    inputText,
    setInputText,
    currentConversation,
    setCurrentConversation,
    latestSubmission,
    setLatestSubmission,
    reassignTargetId,
    setReassignTargetId,
    isReassigning,
    setIsReassigning,
    reassignStatus,
    setReassignStatus,
    messagesEndRef,
    messagesContainerRef,
    onShahadahValidatedRef,
    isFrRef,
    inactivityNotice,
    scrollToBottom,
    fetchMessages,
    currentUserId,
    isDialogist,
    isSupervisorOrAdmin,
    isSeeker,
    filteredQuickReplies,
    ...actions,
  };
}

/** Return shape exported by `useChatWindow` for child chat components. */
export type ChatWindowContext = ReturnType<typeof useChatWindow>;
