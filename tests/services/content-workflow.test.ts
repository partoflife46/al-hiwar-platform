import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/lib/db/in-memory-adapter';
import { contentWorkflowService } from '@/lib/services/content-workflow-service';
import { academyService } from '@/lib/services/academy-service';

describe('ContentWorkflowService & Governance Seam (Task 5.1)', () => {
  const dialogistId = 'user-dialogist-1';
  const instructorId = 'user-instructor-1';
  const supervisorId = 'user-supervisor-1';
  const adminId = 'user-admin-1';
  const newMuslimId = 'user-newmuslim-1';

  beforeEach(() => {
    db.reset();
  });

  describe('1. Dialogist Predefined Messages & Visibility Gate', () => {
    it('creates predefined message draft visible only to author until Supervisor approves it', async () => {
      const draft = await contentWorkflowService.createPredefinedMessageDraft({
        authorId: dialogistId,
        shortcut: '/tawhid-intro',
        category: 'THEOLOGY',
        bodyEn: 'Tawhid is the oneness of God in worship and lordship.',
        bodyFr: "Le Tawhid est l'unicité de Dieu dans l'adoration et la seigneurie.",
      });

      expect(draft.isApproved).toBe(false);
      expect(draft.authorId).toBe(dialogistId);

      // Author sees their own unapproved draft
      const authorTemplates = await contentWorkflowService.getAvailablePredefinedMessages(dialogistId);
      expect(authorTemplates.some((m) => m.id === draft.id)).toBe(true);

      // Another dialogist does NOT see the unapproved draft
      const otherTemplates = await contentWorkflowService.getAvailablePredefinedMessages('other-dialogist');
      expect(otherTemplates.some((m) => m.id === draft.id)).toBe(false);

      // Supervisor approves the draft
      const approveRes = await contentWorkflowService.reviewPredefinedMessage({
        supervisorId,
        templateId: draft.id,
        decision: 'APPROVE',
      });
      expect(approveRes.ok).toBe(true);
      if (approveRes.ok) {
        expect(approveRes.data.isApproved).toBe(true);
        expect(approveRes.data.approvedById).toBe(supervisorId);
      }

      // Now ALL dialogists see the approved template
      const afterApprove = await contentWorkflowService.getAvailablePredefinedMessages('other-dialogist');
      expect(afterApprove.some((m) => m.id === draft.id)).toBe(true);
    });
  });

  describe('2. Instructor Lesson Drafting & Supervisor Approval Gate', () => {
    it('creates lesson draft in PENDING_APPROVAL and publishes upon Supervisor approval', async () => {
      const draftRes = await contentWorkflowService.createOrUpdateLessonDraft({
        instructorId,
        lessonNumber: 8,
        titleEn: 'Islamic Family Ethics & Kinship',
        titleFr: 'Éthique familiale islamique et parenté',
        contentMarkdownEn: '# Kinship in Islam',
        contentMarkdownFr: '# La parenté en Islam',
      });

      expect(draftRes.ok).toBe(true);
      if (!draftRes.ok) return;

      expect(draftRes.data.isApproved).toBe(false);
      expect(draftRes.data.status).toBe('PENDING_APPROVAL');

      // Non-supervisor cannot approve
      const unauthRes = await contentWorkflowService.reviewLessonContent({
        supervisorId: dialogistId,
        lessonId: draftRes.data.id,
        decision: 'APPROVE',
      });
      expect(unauthRes.ok).toBe(false);
      if (!unauthRes.ok) {
        expect(unauthRes.error).toBe('UNAUTHORIZED_SUPERVISOR');
      }

      // Supervisor approves
      const supRes = await contentWorkflowService.reviewLessonContent({
        supervisorId,
        lessonId: draftRes.data.id,
        decision: 'APPROVE',
      });
      expect(supRes.ok).toBe(true);
      if (supRes.ok) {
        expect(supRes.data.isApproved).toBe(true);
        expect(supRes.data.status).toBe('APPROVED');
      }
    });

    it('monitors New Muslim student progress across lessons, quizzes, and certificates', async () => {
      await academyService.executeEvaluationShortcut(newMuslimId, 'PASS_ALL_AND_GRADUATE');
      const supervision = await contentWorkflowService.getStudentProgressSupervision();
      expect(supervision.length).toBeGreaterThanOrEqual(1);

      const thomas = supervision.find((s) => s.user.id === newMuslimId);
      expect(thomas).toBeDefined();
      expect(thomas?.completedLessonsCount).toBe(7);
      expect(thomas?.finalExamPassed).toBe(true);
      expect(thomas?.certificate).not.toBeNull();
    });
  });

  describe('3. Supervisor Read-Only Audit & Administrator Governance', () => {
    it('returns comprehensive read-only platform overview for Supervisor', async () => {
      const overview = await contentWorkflowService.getSupervisorAuditData();
      expect(overview.conversations.length).toBeGreaterThanOrEqual(1);
      expect(overview.staff.length).toBeGreaterThanOrEqual(4);
      expect(overview.studentProgress.length).toBeGreaterThanOrEqual(1);
    });

    it('allows Administrator to create staff accounts, upload IslamicResources, and revoke certificates', async () => {
      // 1. Create new Dialogist account
      const staffRes = await contentWorkflowService.createStaffAccount({
        adminId,
        firstName: 'Sheikh Yusuf',
        surname: 'Al-Qarni',
        email: 'yusuf.qarni@iu.edu.sa',
        role: 'DIALOGIST',
        dateOfBirth: '1988-06-15',
      });
      expect(staffRes.ok).toBe(true);
      if (staffRes.ok) {
        expect(staffRes.data.role).toBe('DIALOGIST');
        expect(staffRes.data.emailVerified).toBe(true);
      }

      // 2. Upload public IslamicResource with uploadedByAdminId
      const resourceRes = await contentWorkflowService.uploadIslamicResource({
        adminId,
        titleEn: 'Authentic Prophetic Supplications',
        titleFr: 'Invocations prophétiques authentiques',
        category: 'PROPHET',
        resourceType: 'PDF',
        mediaUrl: '/resources/prophetic-supplications.pdf',
        descriptionEn: 'Verified compilation of daily adhkar.',
        descriptionFr: 'Compilation vérifiée des invocations quotidiennes.',
      });
      expect(resourceRes.ok).toBe(true);
      if (resourceRes.ok) {
        expect(resourceRes.data.uploadedByAdminId).toBe(adminId);
        expect(resourceRes.data.isPublic).toBe(true);
      }

      // 3. Revoke Certificate
      await academyService.executeEvaluationShortcut(newMuslimId, 'PASS_ALL_AND_GRADUATE');
      const cert = db.certificates.find((c) => c.newMuslimId === newMuslimId)!;
      const revokeRes = await contentWorkflowService.revokeCertificate({
        adminId,
        certificateId: cert.id,
        reason: 'Audit test revocation',
      });
      expect(revokeRes.ok).toBe(true);
      expect(cert.isRevoked).toBe(true);
    });
  });
});
