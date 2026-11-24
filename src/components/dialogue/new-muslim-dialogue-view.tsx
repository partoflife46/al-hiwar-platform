'use client';

/**
 * Module architecture and API reference for
 *   `src/components/dialogue/new-muslim-dialogue-view.tsx`.
 *
 * Exported symbols:
 * - `NewMuslimDialogueView` (Function): new muslim dialogue view definition.
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
 * @module components/dialogue/new-muslim-dialogue-view
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

/**
 * UI presentation module for new muslim dialogue view within the dialogue workspace.
 * Encapsulates accessible markup, bilingual labels, and typed component props.
 * @module components/dialogue/new-muslim-dialogue-view
 * @exports NewMuslimDialogueView
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
 * Post-conversion New Muslim consultation and academy bridge view.
 */
export function NewMuslimDialogueView({ ctx }: { ctx: DialogueWorkspaceContext }) {
  const { seeker, auditConversations, handleSubmitProfile, language, setLanguage, isFr, currentUser, setCurrentUser, activeConversation, setActiveConversation, queue, setQueue, activeConsultations, setActiveConsultations, isTriageOpen, setIsTriageOpen, isStartingDialogue, setIsStartingDialogue, isConversionOpen, setIsConversionOpen, isRecorderOpen, setIsRecorderOpen, isSubmittingRecording, setIsSubmittingRecording, retakeFeedback, setRetakeFeedback, approvedReplies, setApprovedReplies, isShahadahValidated, setIsShahadahValidated, seekerProfileData, setSeekerProfileData, auditUsers, setAuditUsers, pendingRoleSession, setPendingRoleSession, isLoading, setIsLoading, router, isFrRef, currentUserRoleRef, pendingRoleRef, loadSessionAndData, handleStartDialogue, handleSelectIntent, handleClaim, handleUploadRecording, activeConvId, handleShahadahValidated, handleReassign } = ctx;
  if (!currentUser) return null;
  if (currentUser?.role === 'NEW_MUSLIM') {
    return (
      <div className="max-w-5xl mx-auto py-6 px-4 space-y-6">
        <ConversionModal
          isOpen={isConversionOpen}
          seekerId={currentUser.userId}
          seekerName={`${currentUser.firstName} ${currentUser.surname}`}
          initialNationality={seekerProfileData?.nationality ?? seeker?.nationality}
          initialGender={seekerProfileData?.gender ?? seeker?.gender}
          initialPhoneNumber={seekerProfileData?.phoneNumber ?? seeker?.phoneNumber}
          onSubmitProfile={handleSubmitProfile}
          onNavigateToAcademy={() => {
            pendingRoleRef.current = false;
            if (pendingRoleSession) {
              window.dispatchEvent(
                new CustomEvent('alhiwar:role-changed', { detail: pendingRoleSession })
              );
            }
            setIsConversionOpen(false);
            router.push('/academy');
          }}
        />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-4">
          <div>
            <Badge variant="gold" className="text-[11px] mb-1">
              {isFr ? 'Étudiant de l’Académie Islamique Al Hiwar' : 'Al Hiwar Islamic Academy Student'}
            </Badge>
            <h1 className="text-xl font-bold text-[#082233]">
              {isFr ? 'Salle de Consultation & Poursuite à l’Académie' : 'Consultation Room & Academy Continuation'}
            </h1>
            <p className="text-xs text-[#5F7383]">
              {isFr
                ? 'Votre profession de foi est vérifiée. Vous pouvez continuer à poser vos questions à votre spécialiste ci-dessous, ou accéder à l’Académie Islamique.'
                : 'Your declaration of Islam is verified. You can continue asking questions to your Sharia Specialist below, or proceed to the Foundational Academy.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Link href="/profile">
              <Button variant="outline" size="sm" className="text-xs gap-1.5 font-semibold border-[#CBD5E1] text-[#082233] hover:bg-slate-100">
                <UserCheck className="w-3.5 h-3.5 text-[#006C9C]" />
                <span>{isFr ? 'Gérer mon profil' : 'Manage My Profile'}</span>
              </Button>
            </Link>
            <Link href="/academy">
              <Button variant="primary" className="gap-2 bg-[#BC9C5C] hover:bg-[#a88a4e] text-[#082233] font-bold">
                <span>{isFr ? 'Accéder à l’Académie Islamique →' : 'Enter Al Hiwar Islamic Academy →'}</span>
              </Button>
            </Link>
          </div>
        </div>

        {activeConversation ? (
          <ChatWindow
            key={activeConversation.id}
            conversation={activeConversation}
            currentUser={currentUser}
            initialMessages={db.messages.filter((m) => m.conversationId === activeConversation.id)}
            readOnly={false}
          />
        ) : (
          <div className="text-center py-12 border rounded-xl bg-white text-[#5F7383] text-sm space-y-3">
            <p className="font-bold text-[#082233]">
              {isFr ? 'Votre parcours à l’Académie Islamique est actif !' : 'Your Islamic Academy Journey is Active!'}
            </p>
            <Link href="/academy">
              <Button variant="primary" className="gap-2">
                <span>{isFr ? 'Accéder à l’Académie Islamique →' : 'Enter Al Hiwar Islamic Academy →'}</span>
              </Button>
            </Link>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto py-16 px-4 text-center">
      <div className="rounded-3xl border border-red-200 bg-white p-8 shadow-sm space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-extrabold text-[#082233]">
          {isFr ? 'Accès aux Consultations Restreint (403)' : 'Consultation Access Restricted (403)'}
        </h1>
        <p className="text-xs text-[#5F7383] leading-relaxed">
          {isFr
            ? 'Votre rôle ne dispose pas des autorisations requises pour accéder aux dialogues privés ou aux données personnelles des chercheurs.'
            : 'Your staff role is isolated from private consultation chats and seeker PII per platform RBAC policy.'}
        </p>
        <div className="flex justify-center gap-2 pt-2">
          <Link href={currentUser.role === 'INSTRUCTOR' ? '/staff' : '/'}>
            <Button variant="primary" size="sm" className="text-xs font-bold">
              {currentUser.role === 'INSTRUCTOR'
                ? isFr
                  ? 'Retour au Studio Pédagogique'
                  : 'Return to Curriculum Studio'
                : isFr
                  ? 'Retour à l’accueil'
                  : 'Back to Home'}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
