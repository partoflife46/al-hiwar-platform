'use client';

/**
 * Module architecture and API reference for `src/components/staff/instructor-tab.tsx`.
 *
 * Exported symbols:
 * - `InstructorTab` (Function): instructor tab definition.
 *
 * Internal dependencies:
 * - `@/hooks/use-staff-portal`
 * - `@/lib/db/types`
 * - `@/components/ui/card`
 * - `@/components/ui/badge`
 * - `@/components/ui/button`
 * - `@/components/ui/input`
 *
 * @module components/staff/instructor-tab
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

/**
 * UI presentation module for instructor tab within the staff workspace.
 * Encapsulates accessible markup, bilingual labels, and typed component props.
 * @module components/staff/instructor-tab
 * @exports InstructorTab
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
 * Islamic Instructor curriculum authoring studio and module catalog.
 */
export function InstructorTab({ ctx }: { ctx: StaffPortalContext }) {
  const { isFr, currentUser, setCurrentUser, activeTab, setActiveTab, statusBanner, setStatusBanner, conversations, setConversations, selectedConvId, setSelectedConvId, replyText, setReplyText, templates, setTemplates, allTemplates, setAllTemplates, submissions, setSubmissions, lessons, setLessons, studentRecords, setStudentRecords, users, setUsers, certificates, setCertificates, resources, setResources, draftShortcut, setDraftShortcut, draftCategory, setDraftCategory, draftBodyEn, setDraftBodyEn, draftBodyFr, setDraftBodyFr, editingLessonId, setEditingLessonId, lessonNumber, setLessonNumber, lessonTitleEn, setLessonTitleEn, lessonTitleFr, setLessonTitleFr, lessonContentEn, setLessonContentEn, lessonContentFr, setLessonContentFr, rejectingLessonId, setRejectingLessonId, rejectLessonNote, setRejectLessonNote, staffFirstName, setStaffFirstName, staffSurname, setStaffSurname, staffEmail, setStaffEmail, staffPassword, setStaffPassword, staffRole, setStaffRole, resTitleEn, setResTitleEn, resTitleFr, setResTitleFr, resCategory, setResCategory, resFormat, setResFormat, resUrl, setResUrl, resDescEn, setResDescEn, resDescFr, setResDescFr, editingResource, setEditingResource, editResTitleEn, setEditResTitleEn, editResTitleFr, setEditResTitleFr, editResCategory, setEditResCategory, editResFormat, setEditResFormat, editResUrl, setEditResUrl, editResDescEn, setEditResDescEn, editResDescFr, setEditResDescFr, isUploadingMedia, setIsUploadingMedia, uploadingTarget, setUploadingTarget, confirmDialog, setConfirmDialog, isConfirmingAction, setIsConfirmingAction, editingUser, setEditingUser, editFirstName, setEditFirstName, editSurname, setEditSurname, editEmail, setEditEmail, editRole, setEditRole, editStatus, setEditStatus, isAddingUser, setIsAddingUser, newFirstName, setNewFirstName, newSurname, setNewSurname, newEmail, setNewEmail, newPassword, setNewPassword, newRole, setNewRole, userMsg, setUserMsg, userErrorMsg, setUserErrorMsg, activeMessages, setActiveMessages, isAuditOnly, allTabs, availableTabs, effectiveTab, fileInputRef, editFileInputRef, getAcceptMimeType, handleFileUpload, refreshData, handleClaimConversation, handleSendReply, handleCreateTemplateDraft, handleReviewShahadah, handleCreateLessonDraft, handleSupervisorReviewLesson, handleSupervisorReviewTemplate, handleCreateStaff, handleUploadResource, handleRevokeCertificate, startEditUser, handleSaveEditUser, executeDeleteUser, handleDeleteUser, handleDeleteResource, startEditResource, handleSaveEditResource, handleConfirmDestructiveAction, handleCreateUser, selectedConversation, canAccessDialogueStream } = ctx;
  
  return (
    <>
      {effectiveTab === 'INSTRUCTOR' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Author New/Updated Lesson Content */}
          <div className="lg:col-span-5">
            <Card className="p-6 rounded-2xl border border-[#E2E8F0] bg-white space-y-4">
              <h2 className="text-base font-extrabold text-[#082233] flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#006C9C]" />
                {isFr ? 'Rédiger un Brouillon de Module' : 'Author Curriculum Lesson Draft'}
              </h2>
              <p className="text-xs text-[#5F7383]">
                {isFr ? (
                  <>
                    Les modules nouveaux ou mis à jour restent en statut{' '}
                    <span className="font-mono">PENDING_APPROVAL</span> jusqu’à validation par un
                    Superviseur de la Chari’a.
                  </>
                ) : (
                  <>
                    New or updated lessons enter <span className="font-mono">PENDING_APPROVAL</span>{' '}
                    until approved by a Sharia Supervisor.
                  </>
                )}
              </p>

              {/* Form landmark */}
              <form onSubmit={handleCreateLessonDraft} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold">
                    {isFr ? 'Numéro du module' : 'Module Number'}
                  </label>
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    value={lessonNumber}
                    onChange={(e) => setLessonNumber(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold">
                    {isFr ? 'Titre du module (Anglais) *' : 'Lesson Title (English) *'}
                  </label>
                  <Input
                    required
                    value={lessonTitleEn}
                    onChange={(e) => setLessonTitleEn(e.target.value)}
                    placeholder="e.g. Etiquette of Supplication (Du'a)"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold">
                    {isFr ? 'Titre du module (Français)' : 'Lesson Title (French)'}
                  </label>
                  <Input
                    value={lessonTitleFr}
                    onChange={(e) => setLessonTitleFr(e.target.value)}
                    placeholder="ex. L'éthique de l'invocation (Du'a)"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold">
                    {isFr ? 'Contenu Markdown du cours (EN) *' : 'Lesson Markdown Content (EN) *'}
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={lessonContentEn}
                    onChange={(e) => setLessonContentEn(e.target.value)}
                    placeholder={
                      isFr
                        ? 'Rédigez le contenu structuré du cours…'
                        : 'Write structured lesson reading content…'
                    }
                    className="w-full rounded-xl border border-[#E2E8F0] p-3 text-base sm:text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold">
                    {isFr ? 'Contenu Markdown du cours (FR)' : 'Lesson Markdown Content (FR)'}
                  </label>
                  <textarea
                    rows={3}
                    value={lessonContentFr}
                    onChange={(e) => setLessonContentFr(e.target.value)}
                    placeholder={
                      isFr
                        ? 'Traduction française du cours (optionnel)…'
                        : 'French translation of lesson content (optional)…'
                    }
                    className="w-full rounded-xl border border-[#E2E8F0] p-3 text-base sm:text-xs"
                  />
                </div>
                <div className="flex gap-2">
                  {editingLessonId && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setEditingLessonId(null);
                        setLessonTitleEn('');
                        setLessonTitleFr('');
                        setLessonContentEn('');
                        setLessonContentFr('');
                      }}
                      className="text-xs"
                    >
                      {isFr ? 'Annuler' : 'Cancel Edit'}
                    </Button>
                  )}
                  <Button type="submit" variant="primary" className="w-full font-bold text-xs">
                    {editingLessonId
                      ? isFr
                        ? 'Mettre à jour & Soumettre au Superviseur'
                        : 'Update & Resubmit for Approval'
                      : isFr
                        ? 'Soumettre le module au Superviseur'
                        : 'Submit Lesson for Supervisor Approval'}
                  </Button>
                </div>
              </form>
            </Card>
          </div>

          {/* Curriculum Modules Catalog & Review Status (FR 78 Isolated) */}
          <div className="lg:col-span-7 space-y-4">
            <Card className="p-6 rounded-2xl border border-[#E2E8F0] bg-white space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-extrabold text-[#082233]">
                  {isFr
                    ? `Modules du Programme & Statut de Révision (${lessons.length})`
                    : `Curriculum Modules & Review Status (${lessons.length})`}
                </h2>
                <Badge variant="secondary" className="text-[11px]">
                  {isFr ? 'Banque de 20 questions/module' : '20-Question Bank / Module'}
                </Badge>
              </div>

              <div className="space-y-3">
                {[...lessons]
                  .sort((a, b) => a.lessonNumber - b.lessonNumber)
                  .map((lesson) => (
                    <div
                      key={lesson.id}
                      className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 space-y-2"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="text-sm font-bold text-[#082233]">
                          Module {lesson.lessonNumber}:{' '}
                          {isFr ? lesson.titleFr || lesson.titleEn : lesson.titleEn}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              lesson.isApproved
                                ? 'approved'
                                : lesson.status === 'REJECTED'
                                  ? 'danger'
                                  : 'warning'
                            }
                            className="text-[11px]"
                          >
                            {lesson.status}
                          </Badge>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingLessonId(lesson.id);
                              setLessonNumber(lesson.lessonNumber);
                              setLessonTitleEn(lesson.titleEn);
                              setLessonTitleFr(lesson.titleFr || '');
                              setLessonContentEn(lesson.contentMarkdownEn);
                              setLessonContentFr(lesson.contentMarkdownFr || '');
                            }}
                            className="h-7 text-xs gap-1"
                          >
                            <Pencil className="w-3 h-3" />
                            {isFr ? 'Modifier' : 'Edit'}
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-[#5F7383] line-clamp-2">
                        {isFr
                          ? lesson.contentMarkdownFr || lesson.contentMarkdownEn
                          : lesson.contentMarkdownEn}
                      </p>
                      {lesson.reviewNotes && (
                        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                          <span className="font-bold">
                            {isFr ? 'Notes du Superviseur :' : 'Supervisor Notes:'}
                          </span>{' '}
                          {lesson.reviewNotes}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </Card>
          </div>
        </div>
      )}

    </>
  );
}
