/**
 * Read-only platform audit overview and consultation/Shahadah/certificate tables for Supervisors.
 */

'use client';

/**
 * Module architecture and API reference for
 *   `src/components/staff/supervisor-audit-card.tsx`.
 *
 * Exported symbols:
 * - `SupervisorAuditCard` (Function): supervisor audit card definition.
 *
 * Internal dependencies:
 * - `@/hooks/use-staff-portal`
 * - `@/components/ui/card`
 * - `@/components/ui/badge`
 * - `@/components/ui/button`
 * - `./supervisor-copy`
 *
 * @module components/staff/supervisor-audit-card
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

import * as React from 'react';
import Link from 'next/link';
import type { StaffPortalContext } from '@/hooks/use-staff-portal';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import { SUPERVISOR_COPY } from './supervisor-copy';

/** Renders platform KPI counters and read-only audit tables for Sharia Supervisors. */
export function SupervisorAuditCard({ ctx }: { ctx: StaffPortalContext }) {
  const {
    isFr,
    conversations,
    studentRecords,
    lessons,
    certificates,
    submissions,
    users,
  } = ctx;
  const copy = SUPERVISOR_COPY[isFr ? 'fr' : 'en'];

  const stats = [
    { value: conversations.length, label: copy.statConsultations, cls: 'text-[#006C9C]' },
    { value: studentRecords.length, label: copy.statLearners, cls: 'text-[#0D7A5F]' },
    { value: lessons.length, label: copy.statModules, cls: 'text-[#8A672B]' },
    { value: certificates.length, label: copy.statCertificates, cls: 'text-[#082233]' },
  ];

  return (
    <Card className="p-6 rounded-2xl border border-[#E2E8F0] bg-white space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-extrabold text-[#082233] flex items-center gap-2">
          <Eye className="w-5 h-5 text-[#006C9C]" />
          {copy.auditHeading}
        </h2>
        <Badge variant="secondary" className="text-xs">
          {copy.auditBadge}
        </Badge>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-xl bg-[#F8FAFC] p-3 border border-[#E2E8F0]"
          >
            <div className={`text-xl font-black ${s.cls}`}>{s.value}</div>
            <div className="text-[11px] text-[#5F7383]">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
        <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 space-y-2">
          <h3 className="text-xs font-extrabold text-[#082233]">
            {copy.consultationsHeading(conversations.length)}
          </h3>
          <div className="space-y-2 max-h-56 overflow-y-auto">
            {conversations.map((conv) => {
              const assigned = users.find((u) => u.id === conv.dialogistId);
              return (
                <div
                  key={conv.id}
                  className="flex items-center justify-between gap-2 rounded-lg bg-white p-2.5 border border-[#E2E8F0] text-xs"
                >
                  <div>
                    <div className="font-bold text-[#082233]">
                      {conv.seekerFirstName || conv.id} • {conv.status}
                    </div>
                    <div className="text-[11px] text-[#5F7383]">
                      {assigned
                        ? `${assigned.firstName} ${assigned.surname}`
                        : copy.unassigned}
                    </div>
                  </div>
                  <Link href={`/dialogue?conv=${conv.id}`}>
                    <Button variant="outline" size="sm" className="h-7 text-[11px]">
                      {copy.auditReassignBtn}
                    </Button>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 space-y-2">
          <h3 className="text-xs font-extrabold text-[#082233]">
            {copy.shahadahCertHeading(submissions.length, certificates.length)}
          </h3>
          <div className="space-y-2 max-h-56 overflow-y-auto text-xs">
            {submissions.map((sub) => (
              <div
                key={sub.id}
                className="flex items-center justify-between gap-2 rounded-lg bg-white p-2.5 border border-[#E2E8F0]"
              >
                <div>
                  <div className="font-bold text-[#082233]">
                    Shahadah {sub.id.slice(0, 14)}
                  </div>
                  <div className="text-[11px] text-[#5F7383]">
                    {sub.feedbackNotes || sub.status}
                  </div>
                </div>
                <Badge
                  variant={sub.status === 'VALIDATED' ? 'approved' : 'warning'}
                  className="text-[10px]"
                >
                  {sub.status}
                </Badge>
              </div>
            ))}
            {certificates.map((cert) => (
              <div
                key={cert.id}
                className="flex items-center justify-between gap-2 rounded-lg bg-white p-2.5 border border-[#E2E8F0]"
              >
                <div>
                  <div className="font-bold text-[#082233]">{cert.fullName}</div>
                  <div className="text-[11px] text-[#5F7383] font-mono">
                    {cert.id}
                  </div>
                </div>
                <Link href={`/verify/${cert.id}`}>
                  <Badge
                    variant={cert.isRevoked ? 'danger' : 'gold'}
                    className="text-[10px] cursor-pointer"
                  >
                    {cert.isRevoked ? 'REVOKED' : 'VALID'}
                  </Badge>
                </Link>
              </div>
            ))}
            {studentRecords.map((rec) => (
              <div
                key={rec.user.id}
                className="flex items-center justify-between gap-2 rounded-lg bg-white p-2.5 border border-[#E2E8F0]"
              >
                <div>
                  <div className="font-bold text-[#082233]">
                    {rec.user.firstName} {rec.user.surname}
                  </div>
                  <div className="text-[11px] text-[#5F7383]">
                    {rec.completedLessonsCount}/7 {copy.lessonsUnit} •{' '}
                    {rec.quizAttempts.length} {copy.quizzesUnit}
                  </div>
                </div>
                <Badge
                  variant={rec.finalExamPassed ? 'approved' : 'secondary'}
                  className="text-[10px]"
                >
                  {rec.finalExamPassed ? 'GRADUATED' : 'IN_PROGRESS'}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
