/**
 * Sharia Supervisor approval gates for lessons and quick replies plus audit overview.
 */

'use client';

/**
 * Module architecture and API reference for `src/components/staff/supervisor-tab.tsx`.
 *
 * Exported symbols:
 * - `SupervisorTab` (Function): supervisor tab definition.
 *
 * Internal dependencies:
 * - `@/hooks/use-staff-portal`
 * - `@/components/ui/card`
 * - `@/components/ui/badge`
 * - `@/components/ui/button`
 * - `@/components/ui/input`
 * - `./supervisor-copy`
 * - `./supervisor-audit-card`
 *
 * @module components/staff/supervisor-tab
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

import * as React from 'react';
import type { StaffPortalContext } from '@/hooks/use-staff-portal';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle2, XCircle } from 'lucide-react';
import { SUPERVISOR_COPY } from './supervisor-copy';
import { SupervisorAuditCard } from './supervisor-audit-card';

/** Renders the Sharia Supervisor pending approval queues and read-only platform audit tables. */
export function SupervisorTab({ ctx }: { ctx: StaffPortalContext }) {
  const {
    isFr,
    effectiveTab,
    lessons,
    allTemplates,
    rejectingLessonId,
    setRejectingLessonId,
    rejectLessonNote,
    setRejectLessonNote,
    handleSupervisorReviewLesson,
    handleSupervisorReviewTemplate,
  } = ctx;

  if (effectiveTab !== 'SUPERVISOR') return null;

  const copy = SUPERVISOR_COPY[isFr ? 'fr' : 'en'];
  const pendingLessons = lessons.filter((l) => !l.isApproved);
  const pendingTemplates = allTemplates.filter((m) => !m.isApproved);

  /**
   * Executes toggle reject editor logic.
   * @param lessonId - Lesson id value (`string`).
   * @param existingNotes - Existing notes value (`string | null`).
   */
  const toggleRejectEditor = (lessonId: string, existingNotes?: string | null) => {
    if (rejectingLessonId === lessonId) {
      setRejectingLessonId(null);
      setRejectLessonNote('');
      return;
    }
    setRejectingLessonId(lessonId);
    setRejectLessonNote(existingNotes || '');
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 rounded-2xl border border-[#E2E8F0] bg-white space-y-4">
          <h2 className="text-base font-extrabold text-[#082233]">
            {copy.lessonsQueueTitle}
          </h2>
          <div className="space-y-3">
            {pendingLessons.map((lesson) => (
              <div
                key={lesson.id}
                className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#006C9C]">
                    Module {lesson.lessonNumber}:{' '}
                    {isFr ? lesson.titleFr || lesson.titleEn : lesson.titleEn}
                  </span>
                  <Badge variant="warning" className="text-[11px]">
                    {lesson.status}
                  </Badge>
                </div>
                <p className="text-xs text-[#5F7383] line-clamp-2">
                  {isFr
                    ? lesson.contentMarkdownFr || lesson.contentMarkdownEn
                    : lesson.contentMarkdownEn}
                </p>
                <div className="flex gap-2 pt-1">
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() =>
                      handleSupervisorReviewLesson(lesson.id, 'APPROVE')
                    }
                    className="text-xs bg-[#0D7A5F] gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> {copy.approveLessonBtn}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => toggleRejectEditor(lesson.id, lesson.reviewNotes)}
                    className="text-xs text-red-600 border-red-200 gap-1"
                  >
                    <XCircle className="w-3.5 h-3.5" /> {copy.rejectBtn}
                  </Button>
                </div>
                {rejectingLessonId === lesson.id && (
                  <div className="mt-2 space-y-2 rounded-xl border border-red-200 bg-white p-3">
                    <label className="block text-[11px] font-bold text-[#082233]">
                      {copy.editorialNotesLabel}
                    </label>
                    <Input
                      value={rejectLessonNote}
                      onChange={(e) => setRejectLessonNote(e.target.value)}
                      placeholder={copy.editorialNotesPh}
                      className="text-xs"
                    />
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={() =>
                          handleSupervisorReviewLesson(
                            lesson.id,
                            'REJECT',
                            rejectLessonNote
                          )
                        }
                        className="text-xs bg-red-600 hover:bg-red-700"
                      >
                        {copy.confirmRejectBtn}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setRejectingLessonId(null);
                          setRejectLessonNote('');
                        }}
                        className="text-xs"
                      >
                        {copy.cancelBtn}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {pendingLessons.length === 0 && (
              <p className="text-xs text-[#5F7383]">{copy.allLessonsReviewed}</p>
            )}
          </div>
        </Card>

        <Card className="p-6 rounded-2xl border border-[#E2E8F0] bg-white space-y-4">
          <h2 className="text-base font-extrabold text-[#082233]">
            {copy.templatesQueueTitle}
          </h2>
          <div className="space-y-3">
            {pendingTemplates.map((tpl) => (
              <div
                key={tpl.id}
                className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-[#082233]">
                    {tpl.shortcut} ({tpl.category})
                  </span>
                  <Badge variant="warning" className="text-[11px]">
                    {tpl.status || copy.pendingBadge}
                  </Badge>
                </div>
                <p className="text-xs text-[#5F7383]">
                  {isFr ? tpl.bodyFr || tpl.bodyEn : tpl.bodyEn}
                </p>
                <div className="flex gap-2 pt-1">
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() =>
                      handleSupervisorReviewTemplate(tpl.id, 'APPROVE')
                    }
                    className="text-xs bg-[#0D7A5F] gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> {copy.approveAllBtn}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handleSupervisorReviewTemplate(tpl.id, 'REJECT')
                    }
                    className="text-xs text-red-600 border-red-200 gap-1"
                  >
                    <XCircle className="w-3.5 h-3.5" /> {copy.rejectBtn}
                  </Button>
                </div>
              </div>
            ))}
            {pendingTemplates.length === 0 && (
              <p className="text-xs text-[#5F7383]">{copy.allTemplatesReviewed}</p>
            )}
          </div>
        </Card>
      </div>

      <SupervisorAuditCard ctx={ctx} />
    </div>
  );
}
