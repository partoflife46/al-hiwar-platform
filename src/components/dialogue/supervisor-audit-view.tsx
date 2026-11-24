'use client';

/**
 * Module architecture and API reference for
 *   `src/components/dialogue/supervisor-audit-view.tsx`.
 *
 * Exported symbols:
 * - `SupervisorAuditView` (Function): supervisor audit view definition.
 *
 * Internal dependencies:
 * - `@/lib/db/in-memory-adapter`
 * - `@/hooks/use-dialogue-workspace`
 * - `@/lib/db/types`
 * - `@/components/chat/intent-triage-modal`
 * - `@/components/dialogue/conversion-modal`
 * - `@/components/chat/chat-window`
 * - `@/components/audio/shahadah-recorder`
 * - `@/components/ui/button`
 * - `@/components/ui/badge`
 *
 * @module components/dialogue/supervisor-audit-view
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

/**
 * UI presentation module for supervisor audit view within the dialogue workspace.
 * Encapsulates accessible markup, bilingual labels, and typed component props.
 * @module components/dialogue/supervisor-audit-view
 * @exports SupervisorAuditView
 */

import * as React from "react";
import Link from "next/link";
import { db } from "@/lib/db/in-memory-adapter";
import type { DialogueWorkspaceContext } from "@/hooks/use-dialogue-workspace";
import type { ConsultationIntent, SupportedLanguage, UserRole } from "@/lib/db/types";
import { IntentTriageModal } from "@/components/chat/intent-triage-modal";
import { ConversionModal } from "@/components/dialogue/conversion-modal";
import { ChatWindow } from "@/components/chat/chat-window";
import { ShahadahRecorder } from "@/components/audio/shahadah-recorder";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  Users,
  ShieldAlert,
  ArrowRight,
  Clock,
  Sparkles,
  RefreshCw,
  UserCheck,
} from "lucide-react";

/**
 * Read-only supervisor and administrator dialogue audit view.
 */
export function SupervisorAuditView({ ctx }: { ctx: DialogueWorkspaceContext }) {
  const { seeker, auditConversations, language, setLanguage, isFr, currentUser, setCurrentUser, activeConversation, setActiveConversation, queue, setQueue, activeConsultations, setActiveConsultations, isTriageOpen, setIsTriageOpen, isStartingDialogue, setIsStartingDialogue, isConversionOpen, setIsConversionOpen, isRecorderOpen, setIsRecorderOpen, isSubmittingRecording, setIsSubmittingRecording, retakeFeedback, setRetakeFeedback, approvedReplies, setApprovedReplies, isShahadahValidated, setIsShahadahValidated, seekerProfileData, setSeekerProfileData, auditUsers, setAuditUsers, pendingRoleSession, setPendingRoleSession, isLoading, setIsLoading, router, isFrRef, currentUserRoleRef, pendingRoleRef, loadSessionAndData, handleStartDialogue, handleSelectIntent, handleClaim, handleUploadRecording, activeConvId, handleShahadahValidated, handleReassign } = ctx;
  if (!currentUser) return null;
  return (
      <div className="max-w-6xl mx-auto py-6 px-4 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E2E8F0] pb-4">
          <div>
            <h1 className="text-xl font-bold text-[#082233]">
              {isFr
                ? 'Supervision de la Chari’a & Audit des Consultations'
                : 'Supervisor Oversight & Dialogue Audit'}
            </h1>
            <p className="text-xs text-[#5F7383]">
              {isFr
                ? 'Contrôle de conformité Chari’a et gestion des consultations en cours'
                : 'Sharia Compliance Oversight & Stalled Chat Management'}
            </p>
          </div>
          <Badge variant="pending" className="gap-1">
            <ShieldAlert className="w-3.5 h-3.5" />
            {isFr ? 'Audit Superviseur (Lecture seule)' : 'Supervisor Read-Only Audit'}
          </Badge>
        </div>

        {/* Conversation selector */}
        <div className="flex items-center gap-2 overflow-x-auto overscroll-x-contain snap-x pb-2">
          {auditConversations.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setActiveConversation(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006C9C] ${
                activeConversation?.id === c.id
                  ? 'border-[#006C9C] bg-[#006C9C] text-white shadow-sm'
                  : 'border-[#E2E8F0] bg-white text-[#082233] hover:bg-[#F8FAFC]'
              }`}
            >
              {isFr ? 'Consultation' : 'Consultation'}: {c.seekerFirstName || c.id} ({c.status})
            </button>
          ))}
        </div>

        {activeConversation ? (
          <ChatWindow
            key={activeConversation.id}
            conversation={activeConversation}
            currentUser={currentUser}
            initialMessages={db.messages.filter((m) => m.conversationId === activeConversation.id)}
            auditMode={true}
            readOnly={true}
            seekerProfile={(() => {
              const s =
                auditUsers.find((u) => u.id === activeConversation.nonMuslimId) ||
                db.findUserById(activeConversation.nonMuslimId);
              return {
                firstName: s?.firstName || (activeConversation as any).seekerFirstName || (isFr ? 'Chercheur' : 'Inquirer'),
                surname: s?.surname || '',
                email: s?.email || 'seeker@alhiwar.org',
                phoneNumber: s?.phoneNumber || '+33 6 12 34 56 78',
                dateOfBirth: s?.dateOfBirth || '1998-06-15',
                nationality: s?.nationality || 'Global',
                preferredLanguage: activeConversation.language,
              };
            })()}
            onReassignConversation={handleReassign}
            availableDialogists={auditUsers
              .filter((u) => u.role === 'DIALOGIST' && u.status === 'ACTIVE')
              .map((u) => ({ id: u.id, firstName: u.firstName, surname: u.surname }))}
          />
        ) : (
          <div className="text-center py-12 border rounded-xl bg-white text-[#5F7383] text-sm">
            {isFr ? 'Aucune consultation disponible pour audit.' : 'No consultations currently available for audit.'}
          </div>
        )}
      </div>
    );
}
