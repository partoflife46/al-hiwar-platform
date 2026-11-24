/**
 * Module architecture and API reference for `src/lib/db/in-memory-adapter.ts`.
 *
 * Exported symbols:
 * - `getDb` (Function): get db definition.
 * - `InMemoryDatabaseAdapter` (Class): in memory database adapter definition.
 * - `db` (Const): db definition.
 *
 * Internal dependencies:
 * - `./seed-data`
 * - `./server-fs`
 * - `./types`
 *
 * @module lib/db/in-memory-adapter
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

/**
 * Persistence layer module defining in memory adapter contracts and storage behavior.
 * Maintains consistent in-memory and JSON-backed platform state across requests.
 * @module lib/db/in-memory-adapter
 * @exports getDb, InMemoryDatabaseAdapter, db
 */

import { createInitialSeedState } from './seed-data';
import { getServerFs } from './server-fs';
import type {
  InMemoryStoreState,
  User,
  UserRole,
  Conversation,
  Message,
  PredefinedMessage,
  ShahadahSubmission,
  LearningContent,
  Quiz,
  Question,
  QuizAttempt,
  FinalExam,
  FinalAttempt,
  Certificate,
  LearningProgress,
  IslamicResource,
} from './types';

declare global {
  // eslint-disable-next-line no-var
  var __alHiwarDb: InMemoryStoreState | undefined;
}

/**
 * Constant definition for domain role aliases.
 */
const DOMAIN_ROLE_ALIASES: Record<string, UserRole> = {
  'admin@iu.edu.sa': 'ADMINISTRATOR',
  'admin@alhiwar.org': 'ADMINISTRATOR',
  'dialogist@iu.edu.sa': 'DIALOGIST',
  'dialogist@alhiwar.org': 'DIALOGIST',
  'instructor@iu.edu.sa': 'INSTRUCTOR',
  'instructor@alhiwar.org': 'INSTRUCTOR',
  'supervisor@iu.edu.sa': 'SUPERVISOR',
  'supervisor@alhiwar.org': 'SUPERVISOR',
};

/** Loads persisted store state from `.data/db-state.json` on non-test servers. */
function loadStateFromDisk(): InMemoryStoreState | null {
  const mod = getServerFs();
  if (!mod) return null;
  try {
    const dbPath = mod.path.join(process.cwd(), '.data', 'db-state.json');
    if (mod.fs.existsSync(dbPath)) {
      const parsed = JSON.parse(mod.fs.readFileSync(dbPath, 'utf8'));
      if (parsed && Array.isArray(parsed.users)) {
        return parsed;
      }
    }
  } catch {
    // ignore corrupt disk snapshot and fall back to fresh seed state
  }
  return null;
}

/** Writes the current in-memory store snapshot to `.data/db-state.json`. */
function saveStateToDisk(state: InMemoryStoreState): void {
  const mod = getServerFs();
  if (!mod) return;
  try {
    const dataDir = mod.path.join(process.cwd(), '.data');
    if (!mod.fs.existsSync(dataDir)) {
      mod.fs.mkdirSync(dataDir, { recursive: true });
    }
    const dbPath = mod.path.join(dataDir, 'db-state.json');
    mod.fs.writeFileSync(dbPath, JSON.stringify(state, null, 2), 'utf8');
  } catch {
    // ignore read-only filesystem errors
  }
}

/** Returns the singleton in-memory database store, hydrating from disk on first access. */
export function getDb(): InMemoryStoreState {
  if (!globalThis.__alHiwarDb) {
    const diskState = loadStateFromDisk();
    if (diskState) {
      globalThis.__alHiwarDb = diskState;
    } else {
      globalThis.__alHiwarDb = createInitialSeedState();
      saveStateToDisk(globalThis.__alHiwarDb);
    }
  }
  return globalThis.__alHiwarDb;
}

/**
 * File-backed in-memory repository adapter for Al-Hiwar platform state.
 * Accepts injectable store loader/persister callbacks for isolated testing.
 */
export class InMemoryDatabaseAdapter {
  private readonly loadStore: () => InMemoryStoreState;
  private readonly persistStore: (state: InMemoryStoreState) => void;

  constructor(
    loadStore: () => InMemoryStoreState = getDb,
    persistStore: (state: InMemoryStoreState) => void = saveStateToDisk
  ) {
    this.loadStore = loadStore;
    this.persistStore = persistStore;
  }

  /** Returns the active in-memory store state. */
  get state(): InMemoryStoreState {
    return this.loadStore();
  }

  /** Persists the current in-memory state to disk. */
  save(): void {
    this.persistStore(this.loadStore());
  }

  /** Resets the singleton store back to its initial seed state. */
  reset(): InMemoryStoreState {
    globalThis.__alHiwarDb = createInitialSeedState();
    this.persistStore(globalThis.__alHiwarDb);
    return this.loadStore();
  }

  get users(): User[] {
    return this.loadStore().users;
  }

  get conversations(): Conversation[] {
    return this.loadStore().conversations;
  }

  get messages(): Message[] {
    return this.loadStore().messages;
  }

  get predefinedMessages(): PredefinedMessage[] {
    return this.loadStore().predefinedMessages;
  }

  get shahadahSubmissions(): ShahadahSubmission[] {
    return this.loadStore().shahadahSubmissions;
  }

  get learningContents(): LearningContent[] {
    return this.loadStore().learningContents;
  }

  get quizzes(): Quiz[] {
    return this.loadStore().quizzes;
  }

  get questions(): Question[] {
    return this.loadStore().questions;
  }

  get quizAttempts(): QuizAttempt[] {
    return this.loadStore().quizAttempts;
  }

  get finalExam(): FinalExam {
    return this.loadStore().finalExam;
  }

  get finalAttempts(): FinalAttempt[] {
    return this.loadStore().finalAttempts;
  }

  get certificates(): Certificate[] {
    return this.loadStore().certificates;
  }

  get learningProgress(): LearningProgress[] {
    return this.loadStore().learningProgress;
  }

  get islamicResources(): IslamicResource[] {
    return this.loadStore().islamicResources;
  }

  get activeDemoUserId(): string | null {
    return this.loadStore().activeDemoUserId;
  }

  set activeDemoUserId(userId: string | null) {
    this.loadStore().activeDemoUserId = userId;
  }

  /** Looks up a user by unique identifier. */
  findUserById(id: string): User | undefined {
    return this.loadStore().users.find((u) => u.id === id);
  }

  /** Looks up a user by normalized email with institutional domain alias support. */
  findUserByEmail(email: string): User | undefined {
    const normalized = email.trim().toLowerCase();
    const users = this.loadStore().users;
    const directMatch = users.find((u) => u.email.toLowerCase() === normalized);
    if (directMatch) return directMatch;

    const aliasRole = DOMAIN_ROLE_ALIASES[normalized];
    return aliasRole ? users.find((u) => u.role === aliasRole) : undefined;
  }

  /** Applies partial updates to an existing user record. */
  updateUser(id: string, updates: Partial<User>): User | undefined {
    const user = this.loadStore().users.find((u) => u.id === id);
    if (!user) return undefined;
    Object.assign(user, updates, { updatedAt: new Date().toISOString() });
    return user;
  }

  /** Removes a user record by ID and returns whether it existed. */
  deleteUser(id: string): boolean {
    const users = this.loadStore().users;
    const idx = users.findIndex((u) => u.id === id);
    if (idx === -1) return false;
    users.splice(idx, 1);
    return true;
  }

  /** Inserts or replaces a user record in the store. */
  addUser(user: User): User {
    const users = this.loadStore().users;
    const existingIdx = users.findIndex((u) => u.id === user.id);
    if (existingIdx !== -1) {
      users[existingIdx] = user;
    } else {
      users.push(user);
    }
    return user;
  }

  /** Finds the first account matching a target platform role. */
  findDemoUserByRole(role: UserRole): User | undefined {
    return this.loadStore().users.find((u) => u.role === role);
  }

  /** Retrieves a New Muslim learner's academy progress record. */
  getLearningProgress(newMuslimId: string): LearningProgress | undefined {
    return this.loadStore().learningProgress.find((p) => p.newMuslimId === newMuslimId);
  }

  /** Retrieves or initializes a New Muslim learner's academy progress record. */
  ensureLearningProgress(newMuslimId: string): LearningProgress {
    const store = this.loadStore();
    const existing = store.learningProgress.find((p) => p.newMuslimId === newMuslimId);
    if (existing) return existing;

    const created: LearningProgress = {
      id: `prog-${newMuslimId}`,
      newMuslimId,
      completedLessonsCount: 0,
      unlockedLessonNumber: 1,
      allQuizzesPassed: false,
      finalExamPassed: false,
      updatedAt: new Date().toISOString(),
    };
    store.learningProgress.push(created);
    return created;
  }

  /** Returns all supervisor-approved academy lessons sorted by lesson number. */
  getApprovedLessons(): LearningContent[] {
    return this.loadStore()
      .learningContents.filter((l) => l.isApproved)
      .sort((a, b) => a.lessonNumber - b.lessonNumber);
  }

  /** Returns the quiz definition associated with a lesson number. */
  getQuizByLessonNumber(lessonNumber: number): Quiz | undefined {
    return this.loadStore().quizzes.find((q) => q.lessonNumber === lessonNumber);
  }

  /** Returns all non-final-exam questions belonging to a quiz. */
  getQuestionsForQuiz(quizId: string): Question[] {
    return this.loadStore().questions.filter((q) => q.quizId === quizId && !q.isFinalExam);
  }

  /** Returns all questions belonging to the academy final examination. */
  getFinalExamQuestions(): Question[] {
    return this.loadStore().questions.filter((q) => q.isFinalExam);
  }

  /** Returns supervisor-approved predefined quick messages, optionally by category. */
  getApprovedPredefinedMessages(category?: string): PredefinedMessage[] {
    return this.loadStore().predefinedMessages.filter(
      (m) => m.isApproved && (!category || m.category === category)
    );
  }

  /** Returns publicly visible Islamic library resources, optionally by category. */
  getPublicIslamicResources(category?: string): IslamicResource[] {
    return this.loadStore().islamicResources.filter(
      (r) => r.isPublic && (!category || r.category === category)
    );
  }

  /** Updates mutable metadata on an existing Islamic resource and persists state. */
  updateIslamicResource(
    id: string,
    updates: Partial<IslamicResource>
  ): IslamicResource | null {
    const store = this.loadStore();
    const resource = store.islamicResources.find((r) => r.id === id);
    if (!resource) return null;
    const fields: Array<keyof IslamicResource> = [
      'titleEn',
      'titleFr',
      'category',
      'resourceType',
      'mediaUrl',
      'descriptionEn',
      'descriptionFr',
    ];
    for (const key of fields) {
      if (updates[key] !== undefined) {
        (resource as unknown as Record<string, unknown>)[key] = updates[key];
      }
    }
    this.persistStore(store);
    return resource;
  }
}

/**
 * Constant definition for db.
 */
export const db = new InMemoryDatabaseAdapter();
