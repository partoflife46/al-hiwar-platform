/**
 * Seed multiple-choice question bank for Academy Curriculum Module 1.
 *
 * Each `SeedQuestionTemplate` item provides:
 * - Bilingual prompts (`promptEn`, `promptFr`) aligned with Module 1 markdown content.
 * - Four localized answer choices (`optionsJson`, `optionsFrJson`).
 * - Zero-based `correctOptionIndex` and scholarly explanations in English and French.
 *
 * Consumed by `createInitialQuestions()` to populate the 20-question module quiz
 * and the 30-question randomized Capstone Final Exam pool.
 *
 * @module lib/db/seeds/questions/lesson-1
 * @exports LESSON_1_QUESTIONS
 */

import type { SeedQuestionTemplate } from "./types";

/** Authoritative bilingual questions evaluated in Module 1 quizzes. */
export const LESSON_1_QUESTIONS: SeedQuestionTemplate[] = [
  {
    promptEn: "According to the Ulama Salaf and 'Al-Ushul Ats-Tsalatsah', what are the Three Fundamental Principles every Muslim must know?",
    promptFr: "Selon les Oul\u00e9mas du Salaf et 'Al-Oussoul Ath-Thalatha', quels sont les Trois Principes Fondamentaux que tout croyant doit conna\u00eetre ?",
    optionsJson: [
      "Knowing Allah, knowing the religion of Islam with proofs, and knowing Prophet Muhammad ﷺ",
      "Knowing astronomy, Islamic philosophy, and cultural history",
      "Knowing political science, linguistic poetry, and tribal genealogy",
      "Knowing international law, commercial trade, and ancient civilizations",
    ],
    optionsFrJson: [
      "Connaître Allah, connaître l'Islam avec preuves, et connaître le Prophète Muhammad ﷺ",
      "Connaître l'astronomie, la philosophie islamique et l'histoire culturelle",
      "Connaître la science politique, la poésie et la généalogie",
      "Connaître le droit international, le commerce et les civilisations anciennes",
    ],
    correctOptionIndex: 0,
    explanationEn: "Shaykh al-Islam Muhammad ibn Abd al-Wahhab outlined these three foundational questions asked to every soul in the grave.",
    explanationFr: "Ces trois fondements constituent les trois questions fondamentales pos\u00e9es \u00e0 toute \u00e2me dans la tombe.",
  },
  {
    promptEn: "What are the three categories of Tawhid established by the scholars of Ahlus Sunnah wal-Jama'ah?",
    promptFr: "Quelles sont les trois branches du Tawhid selon les savants d'Ahlus Sunnah wal-Jama'ah ?",
    optionsJson: [
      "Tawhid Ar-Rububiyyah, Tawhid Al-Uluhiyyah, and Tawhid Al-Asma' was-Sifat",
      "Tawhid of nature, Tawhid of mind, and Tawhid of soul",
      "Tawhid of poetry, Tawhid of politics, and Tawhid of society",
      "Tawhid of essence, Tawhid of light, and Tawhid of numbers",
    ],
    optionsFrJson: [
      "Tawhid Ar-Rouboubiyyah, Tawhid Al-Oulouhiyyah, et Tawhid Al-Asma' was-Sifat",
      "Tawhid de la nature, de l'esprit et de l'âme",
      "Tawhid de la poésie, de la politique et de la société",
      "Tawhid de l'essence, de la lumière et des nombres",
    ],
    correctOptionIndex: 0,
    explanationEn: "The Salaf derived these three categories from the comprehensive texts of the Qur'an (such as Surah Maryam 19:65).",
    explanationFr: "Les pieux pr\u00e9d\u00e9cesseurs ont d\u00e9duit ces trois cat\u00e9gories des textes complets du Coran (ex. Sourate Maryam 19:65).",
  },
  {
    promptEn: "Which category of Tawhid did the pagan Quraysh acknowledge yet it alone did not enter them into Islam?",
    promptFr: "Quelle cat\u00e9gorie de Tawhid les polyth\u00e9istes de Quraysh reconnaissaient-ils, sans que cela ne suffise \u00e0 les faire entrer en Islam ?",
    optionsJson: [
      "Tawhid Ar-Rububiyyah (affirming that Allah is the Creator and Sustainer)",
      "Tawhid Al-Uluhiyyah (directing all prayers exclusively to Allah)",
      "Tawhid Al-Ikhlas (purifying inward intentions)",
      "Tawhid of legislation and legal arbitration",
    ],
    optionsFrJson: [
      "Tawhid Ar-Rouboubiyyah (reconnaître qu'Allah est le Créateur et le Pourvoyeur)",
      "Tawhid Al-Oulouhiyyah (vouer toute adoration exclusivement à Allah)",
      "Tawhid Al-Ikhlas (la sincérité absolue)",
      "Tawhid de la législation",
    ],
    correctOptionIndex: 0,
    explanationEn: "The Qur'an (43:87) notes that if asked who created them, the pagans replied 'Allah', yet they committed Shirk in worship (Uluhiyyah).",
    explanationFr: "Le Coran (43:87) atteste que si on leur demandait qui les a cr\u00e9\u00e9s, ils disaient 'Allah', mais ils associaient dans l'adoration.",
  },
  {
    promptEn: "What is the core creedal rule of Ahlus Sunnah regarding Allah's Divine Names and Attributes (*Al-Asma' was-Sifat*)?",
    promptFr: "Quelle est la r\u00e8gle fondamentale d'Ahlus Sunnah concernant les Noms et Attributs Divins d'Allah ?",
    optionsJson: [
      "Affirming them as revealed in the Qur'an and Sunnah without Tahrif, Ta'til, Takyif, or Tamthil",
      "Interpreting them metaphorically according to Greek philosophy",
      "Denying them completely to avoid any mental likeness",
      "Comparing Allah's hands and hearing to created human organs",
    ],
    optionsFrJson: [
      "Les affirmer tels que révélés sans Tahrif, sans Ta'til, sans Takyif et sans Tamthil",
      "Les interpréter métaphoriquement selon la philosophie grecque",
      "Les nier totalement pour éviter toute ressemblance",
      "Comparer les attributs d'Allah aux organes humains",
    ],
    correctOptionIndex: 0,
    explanationEn: "Based on Surah Ash-Shura (42:11): 'There is nothing like unto Him, and He is the All-Hearing, the All-Seeing.'",
    explanationFr: "Fond\u00e9 sur la Sourate Ach-Choura (42:11) : 'Rien ne Lui ressemble ; et c'est Lui l'Audient, le Clairvoyant.'",
  },
  {
    promptEn: "What are the two structural pillars of the testimony *Laa Ilaaha Illa Allah*?",
    promptFr: "Quels sont les deux piliers indissociables de l'attestation *Laa Ilaaha Illa Allah* ?",
    optionsJson: [
      "An-Nafiy (Negation of false deities) and Al-Itsbat (Affirmation of Allah alone)",
      "Doubt and certain proof",
      "Love and fear without submission",
      "Praise and historical recitation",
    ],
    optionsFrJson: [
      "An-Nafiy (La Négation des fausses divinités) et Al-Itsbat (L'Affirmation pour Allah seul)",
      "Le doute et la preuve certaine",
      "L'amour et la crainte sans soumission",
      "L'éloge et la récitation historique",
    ],
    correctOptionIndex: 0,
    explanationEn: "'La ilaha' negates worship from everything; 'illa Allah' affirms all worship exclusively to Allah alone.",
    explanationFr: "'La ilaha' nie toute divinit\u00e9 ; 'illa Allah' affirme l'adoration exclusivement pour Allah seul.",
  },
  {
    promptEn: "How many mandatory conditions (*Shurut*) must be fulfilled for *Laa Ilaaha Illa Allah* to benefit its bearer?",
    promptFr: "Combien de conditions obligatoires (*Chourout*) doivent \u00eatre r\u00e9unies pour que *Laa Ilaaha Illa Allah* soit profitable ?",
    optionsJson: [
      "Seven Conditions: Knowledge, Certainty, Sincerity, Truthfulness, Love, Submission, and Acceptance",
      "Three Conditions: Pronunciation, hearing, and writing",
      "Ten Conditions: Diet, sleep, fasting, wealth, lineage, travel, prayer, trade, silence, and age",
      "Zero Conditions: Mere lip pronunciation is sufficient without heart conviction",
    ],
    optionsFrJson: [
      "Sept Conditions : Science, Certitude, Sincérité, Véracité, Amour, Soumission et Acceptation",
      "Trois Conditions : Prononciation, écoute et écriture",
      "Dix Conditions : Régime, sommeil, jeûne, richesse, lignée, voyage, prière, commerce, silence et âge",
      "Zéro Condition : La simple prononciation verbale suffit sans adhésion du cœur",
    ],
    correctOptionIndex: 0,
    explanationEn: "Scholars of the Salaf gathered these 7 conditions from definitive Qur'anic verses and authentic prophetic hadiths.",
    explanationFr: "Les savants du Salaf ont extrait ces 7 conditions des versets coraniques et des hadiths authentiques.",
  },
  {
    promptEn: "In the famous Hadith of Jibril (Sahih Muslim), how many articles of faith constitute *Al-Iman*?",
    promptFr: "Dans le c\u00e9l\u00e8bre Hadith de Jibril (Sahih Mouslim), combien d'articles de foi constituent *Al-Iman* ?",
    optionsJson: [
      "Six Articles: Belief in Allah, His Angels, His Books, His Messengers, the Last Day, and Al-Qadar",
      "Five Articles of faith",
      "Seven Articles including belief in saints",
      "Four Articles of faith",
    ],
    optionsFrJson: [
      "Six Piliers : La foi en Allah, Ses Anges, Ses Livres, Ses Messagers, le Jour Dernier et le Destin",
      "Cinq Piliers de la foi",
      "Sept Piliers incluant la foi aux saints",
      "Quatre Piliers de la foi",
    ],
    correctOptionIndex: 0,
    explanationEn: "The Prophet \ufdfa listed these six articles when Jibril asked him to define Iman.",
    explanationFr: "Le Proph\u00e8te \ufdfa a \u00e9num\u00e9r\u00e9 ces six piliers lorsque Jibril l'a interrog\u00e9 sur la foi.",
  },
  {
    promptEn: "What is the highest level of religion described in the Hadith of Jibril (*Al-Ihsan*)?",
    promptFr: "Quel est le degr\u00e9 le plus \u00e9lev\u00e9 de la religion d\u00e9crit dans le Hadith de Jibril (*Al-Ihsan*) ?",
    optionsJson: [
      "To worship Allah as though you see Him; and if you do not see Him, truly He sees you",
      "To memorize the entire dictionary of Arabic language",
      "To live in complete isolation from human civilization",
      "To abandon all physical sleep and food",
    ],
    optionsFrJson: [
      "Adorer Allah comme si tu Le voyais ; car si tu ne Le vois pas, Lui te voit certes",
      "Mémoriser l'intégralité du dictionnaire arabe",
      "Vivre dans un isolement complet loin de toute société",
      "Abandonner tout repos et toute nourriture",
    ],
    correctOptionIndex: 0,
    explanationEn: "Al-Ihsan is spiritual excellence, maintaining continuous consciousness of Allah's watchful presence.",
    explanationFr: "Al-Ihsan est l'excellence spirituelle, la conscience permanente du regard d'Allah sur soi.",
  },
  {
    promptEn: "What is the primary spiritual difference between Major Shirk (*Ash-Shirk al-Akbar*) and Minor Shirk (*Ash-Shirk al-Asghar*)?",
    promptFr: "Quelle est la diff\u00e9rence fondamentale entre le Grand Shirk (*Al-Akbar*) et le Petit Shirk (*Al-Asghar*) ?",
    optionsJson: [
      "Major Shirk expels a person from Islam and nullifies all deeds; Minor Shirk (like Riya') is a major sin but does not expel from the fold of faith",
      "There is no difference between them",
      "Major Shirk is forgiven without repentance, while Minor Shirk is never forgiven",
      "Minor Shirk is recommended in worship",
    ],
    optionsFrJson: [
      "Le Grand Shirk exclut de l'Islam et annule les œuvres ; le Petit Shirk (comme l'ostentation) est un grand péché mais n'exclut pas de la foi",
      "Il n'y a aucune différence entre les deux",
      "Le Grand Shirk est pardonné sans repentir, tandis que le Petit ne l'est jamais",
      "Le Petit Shirk est recommandé dans l'adoration",
    ],
    correctOptionIndex: 0,
    explanationEn: "Major Shirk (worshipping idols or dead beings) destroys faith entirely; Minor Shirk (showing off) ruins only that specific action.",
    explanationFr: "Le Grand Shirk annule totalement la foi ; le Petit Shirk (l'ostentation) g\u00e2te l'action concern\u00e9e.",
  },
  {
    promptEn: "Which of the following is counted among the ten critical nullifiers of Islam (*Nawaqid al-Islam*) by the Ulama Salaf?",
    promptFr: "Parmi les suivants, lequel fait partie des dix grands annulatifs de l'Islam (*Nawaqid al-Islam*) selon les savants du Salaf ?",
    optionsJson: [
      "Mocking any aspect of the religion of Allah, its promises, or its warnings (Qur'an 9:65–66)",
      "Eating lawful food with the left hand by mistake",
      "Forgetting to perform voluntary prayer",
      "Traveling to a non-Muslim country for lawful business",
    ],
    optionsFrJson: [
      "Se moquer d'un aspect quelconque de la religion d'Allah, de Sa récompense ou de Son châtiment (Coran 9:65-66)",
      "Manger par mégarde avec la main gauche",
      "Oublier une prière surérogatoire",
      "Voyager dans un pays non-musulman pour un commerce licite",
    ],
    correctOptionIndex: 0,
    explanationEn: "Surah At-Tawbah (9:65-66) explicitly states that mocking Allah, His signs, or His Messenger constitutes disbelief.",
    explanationFr: "La Sourate At-Tawbah (9:65-66) stipule que la moquerie envers Allah, Ses versets ou Son Messager constitue une m\u00e9cr\u00e9ance.",
  },
];
