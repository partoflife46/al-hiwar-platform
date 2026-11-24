/**
 * Application service module implementing chat templates business rules.
 * Coordinates domain invariants, persistence updates, and structured Result responses.
 * @module lib/services/chat-templates
 * @exports buildIntentPromptMessage, buildInactivityNoticeMessage
 */

import type { Message, SupportedLanguage } from '@/lib/db/types';

/**
 * Builds the bilingual initial intent selection prompt message for a new consultation.
 */
export function buildIntentPromptMessage(
  conversationId: string,
  language: SupportedLanguage
): Message {
  const content =
    language === 'fr'
      ? 'Assalamu alaykum ! Bienvenue dans votre consultation privée Al Hiwar. Veuillez choisir l’objet de votre dialogue : (1) Je souhaite en savoir plus sur l’Islam | (2) Je souhaite embrasser l’Islam (Déclarer la Shahadah)'
      : 'Assalamu alaykum! Welcome to your private Al Hiwar consultation. Please choose the purpose of your dialogue: (1) I want to know more about Islam | (2) I want to embrace Islam (Declare Shahadah)';

  return {
    id: `msg-intent-prompt-${conversationId}`,
    conversationId,
    senderId: 'system',
    messageType: 'INTENT_PROMPT',
    content,
    predefinedReplyId: null,
    hasVoiceNote: false,
    audioUrl: null,
    sentAt: new Date().toISOString(),
  };
}

/**
 * Builds the bilingual 2-minute specialist unavailability notice message.
 */
export function buildInactivityNoticeMessage(
  conversationId: string,
  language: SupportedLanguage
): Message {
  const content =
    language === 'fr'
      ? 'Tous nos spécialistes sont actuellement en consultation. Votre salon reste ouvert et un spécialiste vous rejoindra dans les plus brefs délais.'
      : 'All specialists are currently engaged. Your chat remains open and a specialist will join shortly.';

  return {
    id: `msg-system-inactivity-${Date.now()}`,
    conversationId,
    senderId: 'system',
    content,
    predefinedReplyId: null,
    hasVoiceNote: false,
    audioUrl: null,
    sentAt: new Date().toISOString(),
  };
}
