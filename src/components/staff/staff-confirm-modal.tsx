'use client';

/**
 * Module architecture and API reference for `src/components/staff/staff-confirm-modal.tsx`.
 *
 * Exported symbols:
 * - `StaffConfirmModal` (Function): staff confirm modal definition.
 *
 * Internal dependencies:
 * - `@/hooks/use-staff-portal`
 * - `@/lib/db/types`
 * - `@/components/ui/card`
 * - `@/components/ui/badge`
 * - `@/components/ui/button`
 * - `@/components/ui/input`
 *
 * @module components/staff/staff-confirm-modal
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

/**
 * UI presentation module for staff confirm modal within the staff workspace.
 * Encapsulates accessible markup, bilingual labels, and typed component props.
 * @module components/staff/staff-confirm-modal
 * @exports StaffConfirmModal
 */

import * as React from "react";
import Link from "next/link";
import type { StaffPortalContext } from "@/hooks/use-staff-portal";
import type {
  UserRole,
  PredefinedMessageCategory,
  ResourceCategory,
  ResourceType,
} from "@/lib/db/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MessageSquare,
  MessageSquareOff,
  BookOpen,
  ShieldCheck,
  Settings,
  CheckCircle2,
  XCircle,
  Send,
  Mic,
  UserPlus,
  Upload,
  Award,
  RefreshCw,
  Trash2,
  Eye,
  PlusCircle,
  Pencil,
  AlertTriangle,
  Loader2,
} from "lucide-react";

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
 * Confirmation dialog for destructive administrative actions.
 */
export function StaffConfirmModal({ ctx }: { ctx: StaffPortalContext }) {
  const { isFr, currentUser, setCurrentUser, activeTab, setActiveTab, statusBanner, setStatusBanner, conversations, setConversations, selectedConvId, setSelectedConvId, replyText, setReplyText, templates, setTemplates, allTemplates, setAllTemplates, submissions, setSubmissions, lessons, setLessons, studentRecords, setStudentRecords, users, setUsers, certificates, setCertificates, resources, setResources, draftShortcut, setDraftShortcut, draftCategory, setDraftCategory, draftBodyEn, setDraftBodyEn, draftBodyFr, setDraftBodyFr, editingLessonId, setEditingLessonId, lessonNumber, setLessonNumber, lessonTitleEn, setLessonTitleEn, lessonTitleFr, setLessonTitleFr, lessonContentEn, setLessonContentEn, lessonContentFr, setLessonContentFr, rejectingLessonId, setRejectingLessonId, rejectLessonNote, setRejectLessonNote, staffFirstName, setStaffFirstName, staffSurname, setStaffSurname, staffEmail, setStaffEmail, staffPassword, setStaffPassword, staffRole, setStaffRole, resTitleEn, setResTitleEn, resTitleFr, setResTitleFr, resCategory, setResCategory, resFormat, setResFormat, resUrl, setResUrl, resDescEn, setResDescEn, resDescFr, setResDescFr, editingResource, setEditingResource, editResTitleEn, setEditResTitleEn, editResTitleFr, setEditResTitleFr, editResCategory, setEditResCategory, editResFormat, setEditResFormat, editResUrl, setEditResUrl, editResDescEn, setEditResDescEn, editResDescFr, setEditResDescFr, isUploadingMedia, setIsUploadingMedia, uploadingTarget, setUploadingTarget, confirmDialog, setConfirmDialog, isConfirmingAction, setIsConfirmingAction, editingUser, setEditingUser, editFirstName, setEditFirstName, editSurname, setEditSurname, editEmail, setEditEmail, editRole, setEditRole, editStatus, setEditStatus, isAddingUser, setIsAddingUser, newFirstName, setNewFirstName, newSurname, setNewSurname, newEmail, setNewEmail, newPassword, setNewPassword, newRole, setNewRole, userMsg, setUserMsg, userErrorMsg, setUserErrorMsg, activeMessages, setActiveMessages, isAuditOnly, allTabs, availableTabs, effectiveTab, fileInputRef, editFileInputRef, getAcceptMimeType, handleFileUpload, refreshData, handleClaimConversation, handleSendReply, handleCreateTemplateDraft, handleReviewShahadah, handleCreateLessonDraft, handleSupervisorReviewLesson, handleSupervisorReviewTemplate, handleCreateStaff, handleUploadResource, handleRevokeCertificate, startEditUser, handleSaveEditUser, executeDeleteUser, handleDeleteUser, handleDeleteResource, startEditResource, handleSaveEditResource, handleConfirmDestructiveAction, handleCreateUser, selectedConversation, canAccessDialogueStream } = ctx;
  
  return (
    <>
      {confirmDialog && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="staff-confirm-dialog-title"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isConfirmingAction) {
              setConfirmDialog(null);
            }
          }}
          className="fixed inset-0 z-50 !m-0 flex items-center justify-center bg-[#082233]/60 backdrop-blur-sm p-4 overflow-y-auto overscroll-contain"
        >
          <Card className="w-full max-w-md rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 border border-red-200">
                <AlertTriangle className="w-5 h-5" aria-hidden="true" />
              </div>
              <div className="space-y-1">
                <h2 id="staff-confirm-dialog-title" className="text-base font-extrabold text-[#082233]">
                  {confirmDialog.type === 'REVOKE_CERTIFICATE'
                    ? isFr
                      ? 'Confirmer la révocation du certificat'
                      : 'Confirm Certificate Revocation'
                    : confirmDialog.type === 'DELETE_RESOURCE'
                    ? isFr
                      ? 'Confirmer la suppression de la ressource'
                      : 'Confirm Resource Deletion'
                    : isFr
                    ? 'Confirmer la suppression du compte'
                    : 'Confirm Account Deletion'}
                </h2>
                <p className="text-xs text-[#5F7383] leading-relaxed">
                  {confirmDialog.type === 'REVOKE_CERTIFICATE'
                    ? isFr
                      ? `Voulez-vous vraiment révoquer le certificat ${confirmDialog.label} ? Cette action marquera le diplôme comme révoqué lors des vérifications publiques.`
                      : `Are you sure you want to revoke certificate ${confirmDialog.label}? Public verification will immediately mark this credential as revoked.`
                    : confirmDialog.type === 'DELETE_RESOURCE'
                    ? isFr
                      ? `Voulez-vous vraiment supprimer définitivement la ressource « ${confirmDialog.label} » de la bibliothèque publique ?`
                      : `Are you sure you want to permanently delete resource "${confirmDialog.label}" from the public library?`
                    : isFr
                    ? `Voulez-vous vraiment supprimer le compte « ${confirmDialog.label} » ? Cette action est irréversible.`
                    : `Are you sure you want to permanently delete user "${confirmDialog.label}"? This action cannot be undone.`}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isConfirmingAction}
                onClick={() => setConfirmDialog(null)}
                className="text-xs font-semibold"
              >
                {isFr ? 'Annuler' : 'Cancel'}
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={isConfirmingAction}
                onClick={handleConfirmDestructiveAction}
                className="text-xs font-bold gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                {isConfirmingAction
                  ? isFr
                    ? 'Traitement…'
                    : 'Processing…'
                  : confirmDialog.type === 'REVOKE_CERTIFICATE'
                  ? isFr
                    ? 'Oui, révoquer'
                    : 'Yes, Revoke Certificate'
                  : confirmDialog.type === 'DELETE_RESOURCE'
                  ? isFr
                    ? 'Oui, supprimer la ressource'
                    : 'Yes, Delete Resource'
                  : isFr
                  ? 'Oui, supprimer'
                  : 'Yes, Delete User'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
