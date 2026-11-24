/**
 * Dialogist live consultation queue, toolbar switcher, and active chat console view.
 */

'use client';

/**
 * Module architecture and API reference for
 *   `src/components/dialogue/dialogist-dialogue-view.tsx`.
 *
 * Exported symbols:
 * - `DialogistDialogueView` (Function): dialogist dialogue view definition.
 *
 * Internal dependencies:
 * - `@/lib/db/in-memory-adapter`
 * - `@/hooks/use-dialogue-workspace`
 * - `@/lib/db/types`
 * - `@/components/chat/chat-window`
 * - `@/components/ui/button`
 * - `@/components/ui/badge`
 *
 * @module components/dialogue/dialogist-dialogue-view
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

import * as React from 'react';
import { db } from '@/lib/db/in-memory-adapter';
import type { DialogueWorkspaceContext } from '@/hooks/use-dialogue-workspace';
import type { SupportedLanguage } from '@/lib/db/types';
import { ChatWindow } from '@/components/chat/chat-window';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, MessageSquare, RefreshCw, Users } from 'lucide-react';

/**
 * Constant definition for dialogist view copy.
 */
const DIALOGIST_VIEW_COPY: Record<
  SupportedLanguage,
  {
    heading: string;
    subtitle: string;
    activeLabel: string;
    refreshTitle: string;
    refreshBtn: string;
    consultationsLabel: string;
    waitingSuffix: string;
    claimShort: string;
    defaultSeeker: string;
    noActiveToolbar: string;
    unansweredHeading: (n: number) => string;
    fcfsBadge: string;
    intentShahadah: string;
    intentLearn: string;
    waitingSince: string;
    claimBtn: string;
    emptyTitle: string;
    emptyDesc: string;
    refreshNowBtn: string;
  }
> = {
  /** English (EN) localized strings and formatting templates. */
  en: {
    heading: 'Dialogist Consultation Console',
    subtitle: 'Faculty of Sharia • Verified 1-on-1 Inquirer Consultations',
    activeLabel: 'Active Dialogist',
    refreshTitle: 'Refresh queues',
    refreshBtn: 'Refresh',
    consultationsLabel: 'Consultations:',
    waitingSuffix: 'waiting in queue',
    claimShort: 'Claim',
    defaultSeeker: 'Seeker',
    noActiveToolbar: 'No active consultations currently',
    unansweredHeading: (n) => `Unanswered Queue (${n})`,
    fcfsBadge: 'First-come First-served',
    intentShahadah: 'Declare Shahadah',
    intentLearn: 'Learn About Islam',
    waitingSince: 'Waiting since',
    claimBtn: 'Claim Consultation',
    emptyTitle: 'No inquiries currently in the queue.',
    emptyDesc:
      'Waiting for adult seekers to initiate a consultation. This console updates automatically in real-time.',
    refreshNowBtn: 'Refresh Queue',
  },
  /** French (FR) localized strings and formatting templates. */
  fr: {
    heading: 'Console de Consultation du Spécialiste',
    subtitle: 'Faculté de la Chari’a • Consultations privées 1-à-1 vérifiées',
    activeLabel: 'Spécialiste actif',
    refreshTitle: 'Actualiser les files',
    refreshBtn: 'Actualiser',
    consultationsLabel: 'Consultations :',
    waitingSuffix: 'en attente',
    claimShort: 'Prendre en charge',
    defaultSeeker: 'Chercheur',
    noActiveToolbar: 'Aucune consultation active pour le moment',
    unansweredHeading: (n) => `File d'attente (${n})`,
    fcfsBadge: 'Premier arrivé, premier servi',
    intentShahadah: 'Déclarer la Chahada',
    intentLearn: 'Découvrir l’Islam',
    waitingSince: 'En attente depuis',
    claimBtn: 'Prendre la consultation',
    emptyTitle: 'Aucune demande en attente dans la file.',
    emptyDesc:
      'En attente de chercheurs de vérité. La file se met à jour automatiquement en temps réel.',
    refreshNowBtn: 'Actualiser maintenant',
  },
};

/** Renders the full unanswered queue list when no conversation is currently selected. */
function UnansweredQueueCard({
  queue,
  isFr,
  onClaim,
}: {
  queue: any[];
  isFr: boolean;
  onClaim: (id: string) => void;
}) {
  const copy = DIALOGIST_VIEW_COPY[isFr ? 'fr' : 'en'];
  const locale = isFr ? 'fr-FR' : 'en-US';

  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-[#006C9C]" />
          <h2 className="text-sm font-bold text-[#082233]">
            {copy.unansweredHeading(queue.length)}
          </h2>
        </div>
        <Badge variant="gold">{copy.fcfsBadge}</Badge>
      </div>

      <div className="divide-y divide-[#E2E8F0]">
        {queue.map((item) => {
          const isShahadah = item.intent === 'EMBRACE_ISLAM';
          const waitingTime = new Intl.DateTimeFormat(locale, {
            hour: '2-digit',
            minute: '2-digit',
          }).format(new Date(item.createdAt));

          return (
            <div
              key={item.id}
              className="py-3 flex items-center justify-between gap-4 hover:bg-[#F8FAFC] px-2 rounded-lg transition-colors"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-[#082233]">
                    {item.seekerFirstName}
                  </span>
                  <Badge variant="secondary" className="uppercase text-[11px]">
                    {item.seekerPreferredLanguage}
                  </Badge>
                  <Badge
                    variant={isShahadah ? 'gold' : 'default'}
                    className="text-[11px]"
                  >
                    {isShahadah ? copy.intentShahadah : copy.intentLearn}
                  </Badge>
                </div>
                <p className="text-xs text-[#5F7383] flex items-center gap-1">
                  <Clock className="w-3 h-3" aria-hidden="true" />
                  {copy.waitingSince} {waitingTime}
                </p>
              </div>
              <Button variant="primary" size="sm" onClick={() => onClaim(item.id)}>
                {copy.claimBtn}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Renders the Dialogist consultation queue toolbar and active 1-on-1 chat console. */
export function DialogistDialogueView({ ctx }: { ctx: DialogueWorkspaceContext }) {
  const {
    isFr,
    currentUser,
    activeConversation,
    setActiveConversation,
    queue,
    activeConsultations,
    approvedReplies,
    loadSessionAndData,
    handleClaim,
  } = ctx;

  if (!currentUser) return null;

  const copy = DIALOGIST_VIEW_COPY[isFr ? 'fr' : 'en'];
  const isCompletelyEmpty = queue.length === 0 && activeConsultations.length === 0;

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E2E8F0] pb-4">
        <div>
          <h1 className="text-xl font-bold text-[#082233]">{copy.heading}</h1>
          <p className="text-xs text-[#5F7383]">{copy.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="primary" className="gap-1 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            {copy.activeLabel}: {currentUser.firstName}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadSessionAndData(false)}
            className="text-xs h-7 gap-1 border-[#CBD5E1]"
            title={copy.refreshTitle}
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#006C9C]" />
            <span className="hidden sm:inline">{copy.refreshBtn}</span>
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-[#E2E8F0] text-xs">
        <span className="font-bold text-[#082233] px-2 flex items-center gap-1.5">
          <Users className="w-4 h-4 text-[#006C9C]" />
          {copy.consultationsLabel}
        </span>

        {queue.length > 0 && (
          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[11px]">
            {queue.length} {copy.waitingSuffix}
          </span>
        )}

        {queue.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => handleClaim(item.id)}
            className="px-2.5 py-1 rounded-lg font-semibold bg-amber-500/10 text-amber-900 border border-amber-300 hover:bg-amber-500/20 transition-colors flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600"
          >
            <Clock className="w-3 h-3 text-amber-600" />
            <span>{item.seekerFirstName}</span>
            <span className="text-[11px] uppercase font-mono px-1 rounded bg-white/70">
              {item.seekerPreferredLanguage}
            </span>
            <span className="text-[11px] text-amber-800 font-bold underline ml-0.5">
              {copy.claimShort}
            </span>
          </button>
        ))}

        {activeConsultations.map((item) => {
          const isSelected = activeConversation?.id === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveConversation(item)}
              className={`px-2.5 py-1 rounded-lg font-semibold border transition-colors flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006C9C] ${
                isSelected
                  ? 'bg-[#006C9C] text-white border-[#006C9C] shadow-sm'
                  : 'bg-white text-[#082233] border-[#CBD5E1] hover:bg-slate-100'
              }`}
            >
              <MessageSquare className="w-3 h-3" />
              <span>{item.seekerFirstName || copy.defaultSeeker}</span>
              <span
                className={`text-[11px] uppercase font-mono px-1 rounded ${
                  isSelected
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 text-[#082233]'
                }`}
              >
                {item.language}
              </span>
            </button>
          );
        })}

        {isCompletelyEmpty && (
          <span className="text-slate-400 italic px-2">
            {copy.noActiveToolbar}
          </span>
        )}
      </div>

      {queue.length > 0 && !activeConversation && (
        <UnansweredQueueCard queue={queue} isFr={isFr} onClaim={handleClaim} />
      )}

      {activeConversation ? (
        <ChatWindow
          key={activeConversation.id}
          conversation={activeConversation}
          currentUser={currentUser}
          initialMessages={db.messages.filter(
            (m) => m.conversationId === activeConversation.id
          )}
          approvedQuickReplies={approvedReplies}
          seekerProfile={{
            firstName:
              (activeConversation as any).seekerFirstName || copy.defaultSeeker,
            preferredLanguage: activeConversation.language,
          }}
          onClaimConversation={handleClaim}
        />
      ) : isCompletelyEmpty ? (
        <div className="text-center py-16 border rounded-xl bg-white text-[#5F7383] text-sm space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#006C9C]/10 text-[#006C9C] flex items-center justify-center mx-auto">
            <Users className="w-6 h-6 animate-pulse" />
          </div>
          <p className="font-bold text-[#082233]">{copy.emptyTitle}</p>
          <p className="text-xs text-[#5F7383] max-w-sm mx-auto">
            {copy.emptyDesc}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadSessionAndData(false)}
            className="text-xs gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{copy.refreshNowBtn}</span>
          </Button>
        </div>
      ) : null}
    </div>
  );
}
