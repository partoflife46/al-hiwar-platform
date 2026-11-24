/**
 * Chat window header with PII scrim, consultation claim button, and supervisor reassignment.
 */

'use client';

/**
 * Module architecture and API reference for `src/components/chat/chat-header.tsx`.
 *
 * Exported symbols:
 * - `ChatHeader` (Function): chat header definition.
 *
 * Internal dependencies:
 * - `@/hooks/use-chat-window`
 * - `@/lib/db/types`
 * - `@/components/ui/button`
 * - `@/components/ui/badge`
 *
 * @module components/chat/chat-header
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

import * as React from 'react';
import type { ChatWindowContext } from '@/hooks/use-chat-window';
import type { SupportedLanguage } from '@/lib/db/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mic, RefreshCw, ShieldCheck, UserCheck } from 'lucide-react';

/**
 * Constant definition for header copy.
 */
const HEADER_COPY: Record<
  SupportedLanguage,
  {
    shahadahInquirer: string;
    dob: string;
    piiScrim: string;
    privateConsult: string;
    refreshTitle: string;
    refresh: string;
    claimBtn: string;
    auditBadge: string;
    reassignAria: string;
    returnQueue: string;
    returnedStatus: string;
    reassignedStatus: string;
    saving: string;
    reassignBtn: string;
    recordShahadah: string;
  }
> = {
  /** English (EN) localized strings and formatting templates. */
  en: {
    shahadahInquirer: 'Shahadah Inquirer',
    dob: 'DOB',
    piiScrim: 'Verified Adult Inquirer (PII Scrim Active)',
    privateConsult: 'Private Consultation with Islamic Specialist',
    refreshTitle: 'Refresh messages',
    refresh: 'Refresh',
    claimBtn: 'Claim Consultation',
    auditBadge: 'Supervisor Read-Only Audit Mode',
    reassignAria: 'Reassign to Dialogist',
    returnQueue: 'Return to Unanswered Queue',
    returnedStatus: 'Returned to queue',
    reassignedStatus: 'Reassigned',
    saving: 'Saving…',
    reassignBtn: 'Reassign',
    recordShahadah: 'Record Shahadah',
  },
  /** French (FR) localized strings and formatting templates. */
  fr: {
    shahadahInquirer: 'Demandeur de Chahada',
    dob: 'Né(e) le',
    piiScrim: 'Chercheur adulte vérifié (Identité protégée)',
    privateConsult: 'Consultation privée avec un spécialiste islamique',
    refreshTitle: 'Actualiser les messages',
    refresh: 'Actualiser',
    claimBtn: 'Prendre la consultation',
    auditBadge: 'Mode Audit Superviseur (Lecture seule)',
    reassignAria: 'Réassigner à un spécialiste',
    returnQueue: 'Renvoyer en file d’attente',
    returnedStatus: 'Renvoyée en file',
    reassignedStatus: 'Réassignée',
    saving: 'En cours…',
    reassignBtn: 'Réassigner',
    recordShahadah: 'Enregistrer la Chahada',
  },
};

/** Renders the Supervisor conversation reassignment dropdown and status indicator. */
function SupervisorReassignControls({ ctx }: { ctx: ChatWindowContext }) {
  const {
    isFr,
    availableDialogists,
    currentConversation,
    onReassignConversation,
    reassignTargetId,
    setReassignTargetId,
    isReassigning,
    setIsReassigning,
    reassignStatus,
    setReassignStatus,
  } = ctx;
  const copy = HEADER_COPY[isFr ? 'fr' : 'en'];

  if (!onReassignConversation) return null;

  /**
   * Asynchronously executes handle save logic.
   */
  const handleSave = async () => {
    setIsReassigning(true);
    setReassignStatus(null);
    try {
      await onReassignConversation(currentConversation.id, reassignTargetId);
      setReassignStatus(
        reassignTargetId === 'QUEUE' ? copy.returnedStatus : copy.reassignedStatus
      );
    } finally {
      setIsReassigning(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <select
        aria-label={copy.reassignAria}
        value={reassignTargetId}
        onChange={(e) => {
          setReassignTargetId(e.target.value);
          setReassignStatus(null);
        }}
        className="h-8 rounded-lg border border-[#CBD5E1] bg-white px-2 text-xs text-[#082233] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006C9C]"
      >
        <option value="QUEUE">{copy.returnQueue}</option>
        {availableDialogists.map((d) => (
          <option key={d.id} value={d.id}>
            {d.firstName} {d.surname}
          </option>
        ))}
      </select>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isReassigning}
        onClick={handleSave}
        className="h-8 text-xs font-semibold border-[#006C9C] text-[#006C9C] hover:bg-[#006C9C]/10"
      >
        {isReassigning ? copy.saving : copy.reassignBtn}
      </Button>
      {reassignStatus && (
        <span className="text-[11px] font-semibold text-[#0D7A5F]">
          {reassignStatus}
        </span>
      )}
    </div>
  );
}

/** Renders the chat header with role-appropriate PII visibility and workflow actions. */
export function ChatHeader({ ctx }: { ctx: ChatWindowContext }) {
  const {
    conversation,
    currentUser,
    seekerProfile,
    auditMode,
    onReassignConversation,
    onInitiateShahadah,
    isFr,
    isRefreshing,
    isClaiming,
    currentConversation,
    fetchMessages,
    handleClaim,
    isDialogist,
    isSupervisorOrAdmin,
    isSeeker,
  } = ctx;

  const copy = HEADER_COPY[isFr ? 'fr' : 'en'];
  const showFullPii = auditMode || isSupervisorOrAdmin;
  const firstName = seekerProfile?.firstName || currentUser?.firstName || 'Seeker';
  const surname = seekerProfile?.surname || currentUser?.surname || '';
  const headingName = showFullPii ? `${firstName} ${surname}` : firstName;
  const canRefresh = (isSeeker || isDialogist) && !auditMode;
  const canReassign =
    auditMode && Boolean(onReassignConversation) && currentUser?.role === 'SUPERVISOR';

  return (
    <header className="px-5 py-3 border-b border-[#E2E8F0] bg-white flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[#006C9C]/10 text-[#006C9C] flex items-center justify-center font-bold text-sm">
          {seekerProfile?.firstName?.[0] || 'S'}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-[#082233]">{headingName}</h2>
            <Badge variant="secondary" className="uppercase font-mono text-[11px]">
              {seekerProfile?.preferredLanguage || conversation.language}
            </Badge>
            {currentConversation.intent === 'EMBRACE_ISLAM' && (
              <Badge variant="gold" className="text-[11px]">
                {copy.shahadahInquirer}
              </Badge>
            )}
          </div>

          <div className="text-xs text-[#5F7383] mt-0.5">
            {showFullPii ? (
              <span>
                {seekerProfile?.email || 'seeker@example.com'} • {copy.dob}:{' '}
                {seekerProfile?.dateOfBirth || '1999-05-14'} •{' '}
                {seekerProfile?.nationality || 'France'}
              </span>
            ) : isDialogist ? (
              <span className="text-[#0D7A5F] font-medium flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 inline" />
                {copy.piiScrim}
              </span>
            ) : (
              <span>{copy.privateConsult}</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 min-w-0">
        {canRefresh && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fetchMessages(true)}
            className="text-xs gap-1.5 border-[#CBD5E1] text-[#082233] hover:bg-slate-100"
            title={copy.refreshTitle}
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${
                isRefreshing ? 'animate-spin text-[#006C9C]' : 'text-[#5F7383]'
              }`}
            />
            <span className="sr-only sm:not-sr-only">{copy.refresh}</span>
          </Button>
        )}

        {isDialogist && !currentConversation.isAssigned && (
          <Button
            variant="accent"
            size="sm"
            disabled={isClaiming}
            onClick={handleClaim}
            className="gap-1.5"
          >
            <UserCheck className="w-4 h-4" />
            {copy.claimBtn}
          </Button>
        )}

        {auditMode && (
          <Badge
            variant="pending"
            className="gap-1 max-w-full whitespace-normal text-left"
          >
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            {copy.auditBadge}
          </Badge>
        )}

        {canReassign && <SupervisorReassignControls ctx={ctx} />}

        {isSeeker && (
          <Button
            variant="accent"
            size="sm"
            onClick={onInitiateShahadah}
            className="gap-1.5"
          >
            <Mic className="w-4 h-4" />
            {copy.recordShahadah}
          </Button>
        )}
      </div>
    </header>
  );
}
