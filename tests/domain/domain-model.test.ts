import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/lib/db/in-memory-adapter';
import {
  Administrator,
  Certificate,
  Conversation,
  Dialogist,
  FinalAttempt,
  FinalExam,
  IslamicInstructor,
  IslamicResource,
  LearningContent,
  LearningProgress,
  Message,
  NewMuslim,
  NonMuslim,
  PredefinedMessage,
  Question,
  Quiz,
  QuizAttempt,
  Shahadah,
  Supervisor,
  User,
  hydrateUser,
  hydrateConversation,
} from '@/lib/domain';

describe('OOP Rich Domain Model (class.puml & seq.puml alignment)', () => {
  beforeEach(() => {
    db.reset();
  });

  it('hydrates all 6 concrete User subclasses with polymorphic login & age check', () => {
    const admin = hydrateUser(db.findUserByEmail('admin@iu.edu.sa')!);
    const supervisor = hydrateUser(db.findUserByEmail('supervisor@iu.edu.sa')!);
    const dialogist = hydrateUser(db.findUserByEmail('dialogist@iu.edu.sa')!);
    const instructor = hydrateUser(db.findUserByEmail('instructor@iu.edu.sa')!);
    const seeker = hydrateUser(db.findUserByEmail('seeker@example.com')!);
    const newMuslim = hydrateUser(db.findUserByEmail('newmuslim@example.com')!);

    expect(admin).toBeInstanceOf(Administrator);
    expect(admin).toBeInstanceOf(User);
    expect(supervisor).toBeInstanceOf(Supervisor);
    expect(dialogist).toBeInstanceOf(Dialogist);
    expect(instructor).toBeInstanceOf(IslamicInstructor);
    expect(seeker).toBeInstanceOf(NonMuslim);
    expect(newMuslim).toBeInstanceOf(NewMuslim);

    expect(admin.login(true)).toBe(true);
    expect(admin.login(false)).toBe(false);
    expect(seeker.calculateAge(new Date('2026-11-23T00:00:00Z'))).toBeGreaterThanOrEqual(18);
  });

  it('executes private dialogue sequence (NonMuslim -> Conversation -> Dialogist -> Message)', () => {
    const seeker = new NonMuslim(db.findUserByEmail('seeker@example.com')!);
    const dialogist = new Dialogist(db.findUserByEmail('dialogist@iu.edu.sa')!);

    const conv = hydrateConversation({
      id: 'conv-oop-1',
      nonMuslimId: seeker.id,
      dialogistId: null,
      language: 'en',
      intent: 'LEARN_ABOUT_ISLAM',
      status: 'QUEUED',
      isAssigned: false,
      lastMessageAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    });

    seeker.startDiscussion(conv, 'LEARN_ABOUT_ISLAM');
    expect(conv.status).toBe('QUEUED');
    expect(conv.viewUnansweredQuestions()).toBe(true);

    seeker.selectOption(conv, 'EMBRACE_ISLAM');
    expect(conv.intent).toBe('EMBRACE_ISLAM');

    const autoReply = conv.sendAutoReply('A specialist will join shortly.');
    expect(autoReply).toBeInstanceOf(Message);
    expect(conv.inactivityNoticeSent).toBe(true);

    const queue = dialogist.viewUnansweredQuestions([conv]);
    expect(queue).toHaveLength(1);

    dialogist.acceptConversation(conv);
    expect(conv.isAssigned).toBe(true);
    expect(conv.status).toBe('ACTIVE');
    expect(conv.dialogistId).toBe(dialogist.id);

    const predefined = new PredefinedMessage(db.predefinedMessages[0]);
    const msg = new Message({
      id: 'msg-oop-1',
      conversationId: conv.id,
      senderId: dialogist.id,
      content: '',
      hasVoiceNote: false,
      sentAt: '',
    });
    dialogist.sendQuickMessage(msg, predefined);
    expect(msg.content).toBe(predefined.bodyEn);
    msg.markAsRead();
    expect(msg.isRead).toBe(true);
  });

  it('handles Shahadah validation, promotion to NewMuslim, and Academy certification', () => {
    const seeker = new NonMuslim(db.findUserByEmail('seeker@example.com')!);
    const dialogist = new Dialogist(db.findUserByEmail('dialogist@iu.edu.sa')!);
    const instructor = new IslamicInstructor(db.findUserByEmail('instructor@iu.edu.sa')!);
    const supervisor = new Supervisor(db.findUserByEmail('supervisor@iu.edu.sa')!);
    const admin = new Administrator(db.findUserByEmail('admin@iu.edu.sa')!);

    const shahadah = new Shahadah(db.shahadahSubmissions[0]);
    seeker.submitShahadahByVoiceNote(shahadah);
    expect(shahadah.status).toBe('PENDING_REVIEW');

    dialogist.rejectShahadah(shahadah, 'Please pronounce clearly.');
    expect(shahadah.status).toBe('RETAKE_REQUESTED');

    dialogist.validateShahadah(shahadah, 'Clear recitation.');
    expect(shahadah.status).toBe('VALIDATED');

    const newMuslim = seeker.promoteToNewMuslim('France', 'MALE', '+33 600000000');
    expect(newMuslim).toBeInstanceOf(NewMuslim);
    expect(newMuslim.role).toBe('NEW_MUSLIM');
    expect(newMuslim.nationality).toBe('France');

    const lesson = new LearningContent(db.learningContents[0]);
    instructor.createLearningContent(lesson);
    expect(lesson.status).toBe('DRAFT');
    instructor.submitContentForApproval(lesson);
    expect(lesson.status).toBe('PENDING_APPROVAL');
    supervisor.approveEducationalContent(lesson);
    expect(lesson.isApproved).toBe(true);
    expect(lesson.displayContent('en')).toBe(lesson.contentMarkdownEn);

    const quizRecord = db.quizzes[0];
    const qEntities = db.getQuestionsForQuiz(quizRecord.id).map((q) => new Question(q));
    const quiz = new Quiz(quizRecord, qEntities);
    expect(quiz.startQuiz().length).toBe(qEntities.length);
    const perfectAnswers = Object.fromEntries(qEntities.map((q) => [q.id, q.correctOptionIndex]));
    const quizRes = quiz.submitQuiz(perfectAnswers);
    expect(quizRes.isPassed).toBe(true);
    expect(quizRes.scorePercentage).toBe(100);

    const progress = new LearningProgress(db.ensureLearningProgress(newMuslim.id));
    progress.updateProgress(7, 7);
    expect(progress.checkFinalExamEligibility()).toBe(true);
    expect(instructor.monitorStudentProgress(progress)).toBe(progress);

    const examQs = db.getFinalExamQuestions().map((q) => new Question(q));
    const exam = new FinalExam(db.finalExam, examQs);
    expect(exam.startFinalExam().length).toBe(examQs.length);
    const examAnswers = Object.fromEntries(examQs.map((q) => [q.id, q.correctOptionIndex]));
    expect(exam.submitFinalExam(examAnswers).isPassed).toBe(true);

    const quizAttempt = new QuizAttempt({
      id: 'qa-oop-1',
      quizId: quiz.id,
      newMuslimId: newMuslim.id,
      scorePercentage: 100,
      isPassed: true,
      answersJson: perfectAnswers,
      attemptDate: new Date().toISOString(),
    });
    const finalAttempt = new FinalAttempt({
      id: 'fa-oop-1',
      examId: exam.id,
      newMuslimId: newMuslim.id,
      scorePercentage: 100,
      isPassed: true,
      answersJson: examAnswers,
      attemptDate: new Date().toISOString(),
    });
    expect(quizAttempt.toRecord().isPassed).toBe(true);
    expect(finalAttempt.toRecord().isPassed).toBe(true);

    progress.finalExamPassed = true;
    const cert = new Certificate({
      id: 'cert-oop-1',
      newMuslimId: newMuslim.id,
      finalAttemptId: finalAttempt.id,
      fullName: 'Jean-Luc Dubois',
      dateOfBirth: newMuslim.dateOfBirth,
      nationality: 'France',
      issueDate: '',
      verificationQrHash: 'hash-oop-1',
      pdfFileUrl: '',
      isRevoked: false,
      createdAt: new Date().toISOString(),
    });
    cert.generateCertificate(progress);
    expect(newMuslim.downloadCertificate(cert)).toBe('/api/certificates/cert-oop-1/download');

    const resource = new IslamicResource(db.islamicResources[0]);
    admin.uploadIslamicResource(resource);
    expect(resource.uploadedByAdminId).toBe(admin.id);
    admin.assignRole(newMuslim, 'NEW_MUSLIM');
    admin.manageAccount(newMuslim, 'ACTIVE');
    expect(supervisor.viewDataReadOnly([resource])).toHaveLength(1);
  });
});
