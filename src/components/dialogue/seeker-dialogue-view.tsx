'use client';

/**
 * Module architecture and API reference for
 *   `src/components/dialogue/seeker-dialogue-view.tsx`.
 *
 * Exported symbols:
 * - `SeekerDialogueView` (Function): seeker dialogue view definition.
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
 * @module components/dialogue/seeker-dialogue-view
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

/**
 * UI presentation module for seeker dialogue view within the dialogue workspace.
 * Encapsulates accessible markup, bilingual labels, and typed component props.
 * @module components/dialogue/seeker-dialogue-view
 * @exports SeekerDialogueView
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
 * Private consultation workspace for Non-Muslim seekers.
 */
export function SeekerDialogueView({ ctx }: { ctx: DialogueWorkspaceContext }) {
  const { seeker, auditConversations, handleSubmitProfile, language, setLanguage, isFr, currentUser, setCurrentUser, activeConversation, setActiveConversation, queue, setQueue, activeConsultations, setActiveConsultations, isTriageOpen, setIsTriageOpen, isStartingDialogue, setIsStartingDialogue, isConversionOpen, setIsConversionOpen, isRecorderOpen, setIsRecorderOpen, isSubmittingRecording, setIsSubmittingRecording, retakeFeedback, setRetakeFeedback, approvedReplies, setApprovedReplies, isShahadahValidated, setIsShahadahValidated, seekerProfileData, setSeekerProfileData, auditUsers, setAuditUsers, pendingRoleSession, setPendingRoleSession, isLoading, setIsLoading, router, isFrRef, currentUserRoleRef, pendingRoleRef, loadSessionAndData, handleStartDialogue, handleSelectIntent, handleClaim, handleUploadRecording, activeConvId, handleShahadahValidated, handleReassign } = ctx;
  if (!currentUser) return null;
  return (
      <div className="max-w-5xl mx-auto py-6 px-4">
        {/* Seeker Header & Profile Management */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#006C9C]/10 text-[#006C9C] flex items-center justify-center font-bold text-xs">
              {currentUser.firstName.slice(0, 1)}
            </div>
            <div>
              <div className="text-xs font-bold text-[#082233]">
                {currentUser.firstName} {currentUser.surname}
              </div>
              <div className="text-[11px] text-[#5F7383]">
                {isFr
                  ? 'Consultation privée • Chercheur de vérité'
                  : 'Private Consultation • Truth Seeker'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/profile">
              <Button variant="outline" size="sm" className="text-xs gap-1.5 font-semibold border-[#CBD5E1] text-[#082233] hover:bg-slate-100">
                <UserCheck className="w-3.5 h-3.5 text-[#006C9C]" />
                <span>
                  {isFr ? 'Gérer mon profil' : 'Manage My Profile'}
                </span>
              </Button>
            </Link>
          </div>
        </div>

        <IntentTriageModal
          isOpen={isTriageOpen}
          onSelectIntent={handleSelectIntent}
          onClose={() => setIsTriageOpen(false)}
          initialLanguage={language || currentUser.preferredLanguage}
        />

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

        {/* Shahadah Audio Recorder Modal */}
        {isRecorderOpen && activeConversation && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label={isFr ? 'Enregistreur audio de la Chahada' : 'Shahadah Audio Recorder'}
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsRecorderOpen(false);
            }}
            className="fixed inset-0 z-50 !m-0 flex items-start sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto overscroll-contain"
          >
            <div className="w-full max-w-2xl">
              <ShahadahRecorder
                conversationId={activeConversation.id}
                seekerId={currentUser.userId}
                language={language}
                retakeFeedback={retakeFeedback}
                modelReference={
                  retakeFeedback
                    ? {
                        language,
                        audioUrl: '/audio/reference-shahadah-ar.wav',
                        durationSeconds: 24,
                        arabicScript:
                          'أَشْهَدُ أَنْ لَا إِلَٰهَ إِلَّا ٱللَّٰهُ وَأَشْهَدُ أَنَّ مُحَمَّدًا رَسُولُ ٱللَّٰهِ',
                        phoneticGuide:
                          language === 'fr'
                            ? 'Ach-hadou an la ilaha illa Allah, wa ach-hadou anna Mouhammadan rassouloullah'
                            : 'Ash-hadu an la ilaha illa Allah, wa ash-hadu anna Muhammadan Rasoolullah',
                        englishTranslation:
                          'I bear witness that there is no deity worthy of worship except Allah, and I bear witness that Muhammad is the Messenger of Allah.',
                      }
                    : null
                }
                onSubmit={handleUploadRecording}
                onCancel={() => setIsRecorderOpen(false)}
                isSubmitting={isSubmittingRecording}
              />
            </div>
          </div>
        )}

        {activeConversation ? (
          <ChatWindow
            key={activeConversation.id}
            conversation={activeConversation}
            currentUser={currentUser}
            initialMessages={db.messages.filter((m) => m.conversationId === activeConversation.id)}
            seekerProfile={{
              firstName: currentUser.firstName,
              surname: currentUser.surname,
              email: currentUser.email,
              dateOfBirth: seekerProfileData?.dateOfBirth || seeker?.dateOfBirth,
              phoneNumber: seekerProfileData?.phoneNumber || seeker?.phoneNumber || undefined,
              nationality: seekerProfileData?.nationality || seeker?.nationality || undefined,
              preferredLanguage: language,
            }}
            onInitiateShahadah={() => setIsRecorderOpen(true)}
            onShahadahValidated={handleShahadahValidated}
            isShahadahValidated={isShahadahValidated}
          />
        ) : (
          <div className="text-center py-16 px-4 max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-[#006C9C]/10 text-[#006C9C] flex items-center justify-center">
              <MessageSquare className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-[#082233]">
              {isFr
                ? 'Prêt pour votre consultation privée ?'
                : 'Ready for Your Private Consultation?'}
            </h2>
            <p className="text-sm text-[#5F7383]">
              {isFr
                ? 'Cliquez sur « Démarrer le dialogue » ci-dessous pour ouvrir votre salon privé 1-à-1 avec un spécialiste certifié.'
                : 'Click "Start Dialogue" below to open your confidential 1-on-1 chat with an Islamic specialist.'}
            </p>
            <Button
              variant="primary"
              size="lg"
              disabled={isStartingDialogue}
              onClick={handleStartDialogue}
              className="gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>
                {isFr
                  ? isStartingDialogue
                    ? 'Ouverture du salon…'
                    : 'Démarrer le dialogue'
                  : isStartingDialogue
                  ? 'Starting Dialogue…'
                  : 'Start Dialogue'}
              </span>
            </Button>
          </div>
        )}
      </div>
    );
}
