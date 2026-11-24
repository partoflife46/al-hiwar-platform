/**
 * Core domain model definitions for users entities and state transitions.
 * Aligned with the Al-Hiwar UML class diagram contracts and entity invariants.
 * @module lib/domain/users
 * @exports User, Administrator, Supervisor, Dialogist, IslamicInstructor, NewMuslim
 */

import type {
  ConsultationIntent,
  Gender,
  SupportedLanguage,
  User as UserRecord,
  UserRole,
  UserStatus,
} from '@/lib/db/types';
import type { Conversation, Message, PredefinedMessage, Shahadah } from './dialogue';
import type {
  Certificate,
  IslamicResource,
  LearningContent,
  LearningProgress,
} from './academy';

/**
 * Abstract base domain entity representing any registered Al-Hiwar user.
 */
export abstract class User {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string;
  surname: string;
  dateOfBirth: string;
  role: UserRole;
  status: UserStatus;
  preferredLanguage: SupportedLanguage;
  emailVerified: boolean;
  verificationOtp?: string | null;
  otpHash?: string | null;
  otpExpiresAt?: string | null;
  otpAttempts?: number;
  otpLastSentAt?: string | null;
  passwordResetTokenHash?: string | null;
  passwordResetExpiresAt?: string | null;
  nationality?: string | null;
  gender?: Gender | null;
  phoneNumber?: string | null;
  conversionDate?: string | null;
  title?: string;
  createdAt: string;
  updatedAt: string;

  constructor(record: UserRecord) {
    this.id = record.id;
    this.email = record.email;
    this.passwordHash = record.passwordHash;
    this.firstName = record.firstName;
    this.surname = record.surname;
    this.dateOfBirth = record.dateOfBirth;
    this.role = record.role;
    this.status = record.status;
    this.preferredLanguage = record.preferredLanguage;
    this.emailVerified = record.emailVerified;
    this.verificationOtp = record.verificationOtp;
    this.otpHash = record.otpHash;
    this.otpExpiresAt = record.otpExpiresAt;
    this.otpAttempts = record.otpAttempts;
    this.otpLastSentAt = record.otpLastSentAt;
    this.passwordResetTokenHash = record.passwordResetTokenHash;
    this.passwordResetExpiresAt = record.passwordResetExpiresAt;
    this.nationality = record.nationality;
    this.gender = record.gender;
    this.phoneNumber = record.phoneNumber;
    this.conversionDate = record.conversionDate;
    this.title = record.title;
    this.createdAt = record.createdAt;
    this.updatedAt = record.updatedAt;
  }

  /**
   * Computes exact calendar age in full years from dateOfBirth.
   */
  calculateAge(referenceDate: Date = new Date()): number {
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(this.dateOfBirth);
    if (!match) return -1;
    const birthYear = Number(match[1]);
    const birthMonth = Number(match[2]) - 1;
    const birthDay = Number(match[3]);
    const refYear = referenceDate.getUTCFullYear();
    const refMonth = referenceDate.getUTCMonth();
    const refDay = referenceDate.getUTCDate();
    let age = refYear - birthYear;
    if (refMonth < birthMonth || (refMonth === birthMonth && refDay < birthDay)) {
      age -= 1;
    }
    return age;
  }

  /**
   * Marks the user email as verified and activates the account when OTP matches.
   */
  verifyEmail(otpCode: string): boolean {
    if (!this.verificationOtp || this.verificationOtp !== otpCode.trim()) {
      return false;
    }
    this.emailVerified = true;
    this.status = 'ACTIVE';
    this.verificationOtp = null;
    this.otpHash = null;
    this.otpExpiresAt = null;
    this.otpAttempts = 0;
    this.updatedAt = new Date().toISOString();
    return true;
  }

  /**
   * Checks whether this user is eligible to sign in given valid credentials.
   */
  login(credentialsValid: boolean): boolean {
    return credentialsValid && this.emailVerified && this.status === 'ACTIVE';
  }

  /**
   * Updates stored password hash and clears any pending reset token.
   */
  resetPassword(newPasswordHash: string): void {
    this.passwordHash = newPasswordHash;
    this.passwordResetTokenHash = null;
    this.passwordResetExpiresAt = null;
    this.updatedAt = new Date().toISOString();
  }

  /**
   * Serializes this domain entity into a plain User JSON record.
   */
  toRecord(): UserRecord {
    return {
      id: this.id,
      email: this.email,
      passwordHash: this.passwordHash,
      firstName: this.firstName,
      surname: this.surname,
      dateOfBirth: this.dateOfBirth,
      role: this.role,
      status: this.status,
      preferredLanguage: this.preferredLanguage,
      emailVerified: this.emailVerified,
      verificationOtp: this.verificationOtp,
      otpHash: this.otpHash,
      otpExpiresAt: this.otpExpiresAt,
      otpAttempts: this.otpAttempts,
      otpLastSentAt: this.otpLastSentAt,
      passwordResetTokenHash: this.passwordResetTokenHash,
      passwordResetExpiresAt: this.passwordResetExpiresAt,
      nationality: this.nationality,
      gender: this.gender,
      phoneNumber: this.phoneNumber,
      conversionDate: this.conversionDate,
      title: this.title,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

/**
 * Platform Administrator with account, role, and resource management authority.
 */
export class Administrator extends User {
  override role: 'ADMINISTRATOR' = 'ADMINISTRATOR';

  constructor(record: UserRecord) {
    super({ ...record, role: 'ADMINISTRATOR' });
  }

  /**
   * Authenticates an active Administrator account.
   */
  override login(credentialsValid: boolean): boolean {
    return this.role === 'ADMINISTRATOR' && super.login(credentialsValid);
  }

  /**
   * Updates the operational status of a target user account.
   */
  manageAccount(target: User, nextStatus: UserStatus): User {
    if (this.role !== 'ADMINISTRATOR') return target;
    target.status = nextStatus;
    target.updatedAt = new Date().toISOString();
    return target;
  }

  /**
   * Assigns a new platform role to a target user account.
   */
  assignRole(target: User, nextRole: UserRole): User {
    if (this.role !== 'ADMINISTRATOR') return target;
    target.role = nextRole;
    target.updatedAt = new Date().toISOString();
    return target;
  }

  /**
   * Creates a verified staff account under administrator governance.
   */
  createStaffAccount(record: UserRecord): UserRecord {
    return {
      ...record,
      status: this.role === 'ADMINISTRATOR' ? 'ACTIVE' : record.status,
      emailVerified: this.role === 'ADMINISTRATOR' ? true : record.emailVerified,
    };
  }

  /**
   * Associates an uploaded Islamic resource with this administrator.
   */
  uploadIslamicResource(resource: IslamicResource): IslamicResource {
    if (this.role === 'ADMINISTRATOR') {
      resource.uploadedByAdminId = this.id;
      resource.uploadedBy = this;
    }
    return resource;
  }
}

/**
 * Sharia Supervisor with editorial approval and read-only oversight privileges.
 */
export class Supervisor extends User {
  override role: 'SUPERVISOR' = 'SUPERVISOR';

  constructor(record: UserRecord) {
    super({ ...record, role: 'SUPERVISOR' });
  }

  /**
   * Authenticates an active Supervisor account.
   */
  override login(credentialsValid: boolean): boolean {
    return this.role === 'SUPERVISOR' && super.login(credentialsValid);
  }

  /**
   * Approves educational lesson content for publication.
   */
  approveEducationalContent(content: LearningContent): LearningContent {
    if (this.role === 'SUPERVISOR') {
      content.status = 'APPROVED';
      content.isApproved = true;
      content.approvedById = this.id;
      content.approvedBy = this;
    }
    return content;
  }

  /**
   * Approves a dialogist quick reply message for live consultation use.
   */
  approveQuickMessage(message: PredefinedMessage): PredefinedMessage {
    if (this.role === 'SUPERVISOR') {
      message.status = 'APPROVED';
      message.isApproved = true;
      message.approvedById = this.id;
      message.approvedBy = this;
    }
    return message;
  }

  /**
   * Returns staff accounts visible under this supervisor's oversight.
   */
  superviseStaff(staffMembers: User[]): User[] {
    if (this.role !== 'SUPERVISOR') return [];
    return staffMembers.filter((u) => u.id !== this.id);
  }

  /**
   * Provides read-only access to platform records for Sharia auditing.
   */
  viewDataReadOnly<T>(records: readonly T[]): readonly T[] {
    return this.role === 'SUPERVISOR' ? Object.freeze([...records]) : [];
  }
}

/**
 * Qualified Islamic specialist conducting live dialogue and Shahadah reviews.
 */
export class Dialogist extends User {
  override role: 'DIALOGIST' = 'DIALOGIST';

  constructor(record: UserRecord) {
    super({ ...record, role: 'DIALOGIST' });
  }

  /**
   * Authenticates an active Dialogist account.
   */
  override login(credentialsValid: boolean): boolean {
    return this.role === 'DIALOGIST' && super.login(credentialsValid);
  }

  /**
   * Filters queued conversations awaiting a specialist response.
   */
  viewUnansweredQuestions(conversations: Conversation[]): Conversation[] {
    if (this.role !== 'DIALOGIST') return [];
    return conversations.filter((c) => c.viewUnansweredQuestions());
  }

  /**
   * Claims an unassigned seeker conversation exclusively for this dialogist.
   */
  acceptConversation(conversation: Conversation): Conversation {
    if (this.role !== 'DIALOGIST') return conversation;
    return conversation.acceptConversation(this);
  }

  /**
   * Authors a new predefined quick message draft pending supervisor approval.
   */
  createQuickMessage(message: PredefinedMessage): PredefinedMessage {
    if (this.role === 'DIALOGIST') {
      message.authorId = this.id;
      message.author = this;
      message.status = 'PENDING_APPROVAL';
      message.isApproved = false;
    }
    return message;
  }

  /**
   * Sends an approved predefined reply within an active conversation.
   */
  sendQuickMessage(message: Message, predefined: PredefinedMessage): Message {
    if (this.role === 'DIALOGIST') {
      message.senderId = this.id;
      message.send(predefined);
    }
    return message;
  }

  /**
   * Validates a seeker's Shahadah audio submission.
   */
  validateShahadah(shahadah: Shahadah, notes?: string): Shahadah {
    if (this.role !== 'DIALOGIST') return shahadah;
    return shahadah.validate(this, notes);
  }

  /**
   * Rejects a Shahadah submission and requests a clearer retake.
   */
  rejectShahadah(shahadah: Shahadah, feedback: string): Shahadah {
    if (this.role !== 'DIALOGIST') return shahadah;
    return shahadah.reject(this, feedback);
  }
}

/**
 * Islamic Academy Instructor responsible for authoring lessons and tracking learners.
 */
export class IslamicInstructor extends User {
  override role: 'INSTRUCTOR' = 'INSTRUCTOR';

  constructor(record: UserRecord) {
    super({ ...record, role: 'INSTRUCTOR' });
  }

  /**
   * Authenticates an active Instructor account.
   */
  override login(credentialsValid: boolean): boolean {
    return this.role === 'INSTRUCTOR' && super.login(credentialsValid);
  }

  /**
   * Creates a draft educational lesson authored by this instructor.
   */
  createLearningContent(content: LearningContent): LearningContent {
    if (this.role === 'INSTRUCTOR') {
      content.authorId = this.id;
      content.author = this;
      content.status = 'DRAFT';
      content.isApproved = false;
    }
    return content;
  }

  /**
   * Submits an authored lesson draft for Sharia supervisor review.
   */
  submitContentForApproval(content: LearningContent): LearningContent {
    if (this.role === 'INSTRUCTOR') {
      content.authorId = this.id;
      content.status = 'PENDING_APPROVAL';
      content.isApproved = false;
    }
    return content;
  }

  /**
   * Inspects a New Muslim learner's progress record.
   */
  monitorStudentProgress(progress: LearningProgress): LearningProgress {
    if (this.role !== 'INSTRUCTOR') return progress;
    return progress;
  }
}

/**
 * Registered New Muslim learner enrolled in Al-Hiwar Islamic Academy.
 */
export class NewMuslim extends User {
  override role: 'NEW_MUSLIM' = 'NEW_MUSLIM';

  constructor(record: UserRecord) {
    super({ ...record, role: 'NEW_MUSLIM' });
  }

  /**
   * Authenticates an active New Muslim learner account.
   */
  override login(credentialsValid: boolean): boolean {
    return this.role === 'NEW_MUSLIM' && super.login(credentialsValid);
  }

  /**
   * Completes mandatory post-conversion demographic profile details.
   */
  updateProfile(nationality: string, gender: Gender, phoneNumber: string): NewMuslim {
    if (this.role === 'NEW_MUSLIM') {
      this.nationality = nationality.trim();
      this.gender = gender;
      this.phoneNumber = phoneNumber.trim();
      this.updatedAt = new Date().toISOString();
    }
    return this;
  }

  /**
   * Returns the learner's active academy roadmap progress.
   */
  accessLearningPath(progress: LearningProgress): LearningProgress {
    if (this.role === 'NEW_MUSLIM') {
      progress.newMuslim = this;
    }
    return progress;
  }

  /**
   * Retrieves the official PDF download URL for a valid certificate.
   */
  downloadCertificate(certificate: Certificate): string {
    if (this.role !== 'NEW_MUSLIM' || certificate.isRevoked) return '';
    return certificate.pdfFileUrl;
  }

  /**
   * Opens or resumes a private follow-up dialogue conversation.
   */
  openConversation(conversation: Conversation): Conversation {
    if (this.role === 'NEW_MUSLIM') {
      conversation.user = this;
    }
    return conversation;
  }
}

/**
 * Registered Non-Muslim seeker exploring Islam through private consultation.
 */
export class NonMuslim extends User {
  override role: 'NON_MUSLIM' = 'NON_MUSLIM';

  constructor(record: UserRecord) {
    super({ ...record, role: 'NON_MUSLIM' });
  }

  /**
   * Authenticates an active Non-Muslim seeker account.
   */
  override login(credentialsValid: boolean): boolean {
    return this.role === 'NON_MUSLIM' && super.login(credentialsValid);
  }

  /**
   * Initiates a private consultation discussion with a specialist.
   */
  startDiscussion(conversation: Conversation, intent: ConsultationIntent): Conversation {
    if (this.role === 'NON_MUSLIM') {
      conversation.nonMuslimId = this.id;
      conversation.user = this;
      conversation.startDiscussion(intent);
    }
    return conversation;
  }

  /**
   * Selects a consultation intent option within an active conversation.
   */
  selectOption(conversation: Conversation, intent: ConsultationIntent): Conversation {
    if (this.role === 'NON_MUSLIM') {
      conversation.selectOption(intent);
    }
    return conversation;
  }

  /**
   * Submits a recorded Shahadah voice note for specialist verification.
   */
  submitShahadahByVoiceNote(shahadah: Shahadah): Shahadah {
    if (this.role === 'NON_MUSLIM') {
      shahadah.nonMuslimId = this.id;
      shahadah.nonMuslim = this;
      shahadah.status = 'PENDING_REVIEW';
    }
    return shahadah;
  }

  /**
   * Elevates a validated seeker into a NewMuslim domain entity.
   */
  promoteToNewMuslim(
    nationality: string,
    gender: Gender,
    phoneNumber: string
  ): NewMuslim {
    const promoted = new NewMuslim({
      ...this.toRecord(),
      role: this.role === 'NON_MUSLIM' ? 'NEW_MUSLIM' : 'NEW_MUSLIM',
      conversionDate: new Date().toISOString(),
    });
    return promoted.updateProfile(nationality, gender, phoneNumber);
  }
}
