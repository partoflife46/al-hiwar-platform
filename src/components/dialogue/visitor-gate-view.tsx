'use client';

/**
 * Module architecture and API reference for
 *   `src/components/dialogue/visitor-gate-view.tsx`.
 *
 * Exported symbols:
 * - `VisitorGateView` (Function): visitor gate view definition.
 *
 * Internal dependencies:
 * - `@/hooks/use-dialogue-workspace`
 * - `@/lib/db/types`
 * - `@/components/chat/intent-triage-modal`
 * - `@/components/dialogue/conversion-modal`
 * - `@/components/chat/chat-window`
 * - `@/components/audio/shahadah-recorder`
 * - `@/components/ui/button`
 * - `@/components/ui/badge`
 *
 * @module components/dialogue/visitor-gate-view
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

/**
 * UI presentation module for visitor gate view within the dialogue workspace.
 * Encapsulates accessible markup, bilingual labels, and typed component props.
 * @module components/dialogue/visitor-gate-view
 * @exports VisitorGateView
 */

import * as React from "react";
import Link from "next/link";
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
 * Authentication gate shown to unauthenticated visitors on /dialogue.
 */
export function VisitorGateView({ ctx }: { ctx: DialogueWorkspaceContext }) {
  const { language, setLanguage, isFr, currentUser, setCurrentUser, activeConversation, setActiveConversation, queue, setQueue, activeConsultations, setActiveConsultations, isTriageOpen, setIsTriageOpen, isStartingDialogue, setIsStartingDialogue, isConversionOpen, setIsConversionOpen, isRecorderOpen, setIsRecorderOpen, isSubmittingRecording, setIsSubmittingRecording, retakeFeedback, setRetakeFeedback, approvedReplies, setApprovedReplies, isShahadahValidated, setIsShahadahValidated, seekerProfileData, setSeekerProfileData, auditUsers, setAuditUsers, pendingRoleSession, setPendingRoleSession, isLoading, setIsLoading, router, isFrRef, currentUserRoleRef, pendingRoleRef, loadSessionAndData, handleStartDialogue, handleSelectIntent, handleClaim, handleUploadRecording, activeConvId, handleShahadahValidated, handleReassign } = ctx;
  return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-[#006C9C]/10 text-[#006C9C] flex items-center justify-center">
          <MessageSquare className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <Badge variant="gold">
            {isFr ? 'Plateforme Al Hiwar' : 'Al Hiwar Platform'}
          </Badge>
          <h1 className="text-2xl font-bold text-[#082233]">
            {isFr ? 'Consultation Islamique Individuelle Vérifiée' : 'Verified Islamic Da’wah Consultation'}
          </h1>
          <p className="text-sm text-[#5F7383] max-w-lg mx-auto leading-relaxed">
            {isFr
              ? 'Bienvenue au Centre de Dialogue Al Hiwar. Pour garantir la rigueur théologique, la dignité et la sincérité de nos échanges, les consultations 1-à-1 nécessitent un compte vérifié.'
              : 'Welcome to the Al Hiwar Dialogue Center. To ensure theological precision, dignity, and sincere dialogue, 1-on-1 consultations require eligibility verification.'}
          </p>
        </div>

        <div className="p-4 rounded-2xl border border-[#006C9C]/30 bg-[#006C9C]/5 text-xs text-[#082233] max-w-md mx-auto flex items-start gap-3 text-left">
          <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5 text-[#006C9C]" />
          <div>
            <p className="font-bold text-[#082233] mb-0.5">
              {isFr ? 'Condition d’âge adulte (18+ ans)' : 'Adult Eligibility Notice (18+)'}
            </p>
            <p className="text-[#5F7383]">
              {isFr
                ? 'Pour préserver la rigueur théologique, la sincérité et le cadre légal, les consultations privées sont réservées aux adultes âgés de 18 ans et plus. Veuillez vous connecter ou créer un compte pour commencer.'
                : 'To preserve theological precision, sincerity, and legal standards, live 1-on-1 consultations are open to adult seekers aged 18 and older. Please sign in or create an account to begin.'}
            </p>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/register">
            <Button
              variant="primary"
              size="lg"
              className="w-full sm:w-auto font-bold gap-2 shadow-sm"
            >
              <span>{isFr ? 'Créer un compte chercheur (18+ Ans)' : 'Create Seeker Account (18+)'}</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link href="/login">
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto font-bold border-[#CBD5E1] text-[#082233] hover:bg-slate-100"
            >
              {isFr ? 'Se connecter à votre compte' : 'Sign In to Your Account'}
            </Button>
          </Link>
        </div>
      </div>
    );
  }
