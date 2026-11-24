/**
 * Seed multiple-choice question bank for Academy Curriculum Module 5.
 *
 * Each `SeedQuestionTemplate` item provides:
 * - Bilingual prompts (`promptEn`, `promptFr`) aligned with Module 5 markdown content.
 * - Four localized answer choices (`optionsJson`, `optionsFrJson`).
 * - Zero-based `correctOptionIndex` and scholarly explanations in English and French.
 *
 * Consumed by `createInitialQuestions()` to populate the 20-question module quiz
 * and the 30-question randomized Capstone Final Exam pool.
 *
 * @module lib/db/seeds/questions/lesson-5
 * @exports LESSON_5_QUESTIONS
 */

import type { SeedQuestionTemplate } from "./types";

/** Authoritative bilingual questions evaluated in Module 5 quizzes. */
export const LESSON_5_QUESTIONS: SeedQuestionTemplate[] = [
  {
    promptEn: "To which noble tribe did Prophet Muhammad \ufdfa belong, and what honorary title did his people grant him before revelation?",
    promptFr: "\u00c0 quelle noble tribu appartenait le Proph\u00e8te Muhammad \ufdfa et quel titre honorifique son peuple lui avait-il donn\u00e9 avant la r\u00e9v\u00e9lation ?",
    optionsJson: [
      "The noble tribe of Quraysh; titled As-Sadiq Al-Amin (The Truthful, The Trustworthy)",
      "The tribe of Thaqif; titled Al-Hakim (The Judge)",
      "The tribe of Aws; titled Ash-Sha'ir (The Poet)",
      "The tribe of Khazraj; titled Al-Qaid (The Commander)",
    ],
    optionsFrJson: [
      "La noble tribu de Quraysh ; surnommé As-Sadiq Al-Amin (Le Véridique, le Digne de Confiance)",
      "La tribu de Thaqif ; surnommé Al-Hakim",
      "La tribu d'Aws ; surnommé Ash-Sha'ir",
      "La tribu de Khazraj ; surnommé Al-Qaid",
    ],
    correctOptionIndex: 0,
    explanationEn: "He descended from Prophet Ibrahim through Isma'il, and even his staunchest pagan opponents attested to his unimpeachable honesty.",
    explanationFr: "Il descendait d'Ibrahim par Isma\u00ebl, et ses ennemis eux-m\u00eames attestaient de son honn\u00eatet\u00e9 irr\u00e9prochable.",
  },
  {
    promptEn: "What were the very first verses of divine revelation brought by Jibril to Prophet Muhammad \ufdfa in the Cave of Hira?",
    promptFr: "Quels furent les tout premiers versets r\u00e9v\u00e9l\u00e9s par Jibril au Proph\u00e8te Muhammad \ufdfa dans la grotte de Hira ?",
    optionsJson: [
      "Surah Al-Alaq (96:1–5): «Read in the Name of your Lord Who created...»",
      "Surah Al-Baqarah: The verse of the Throne (Ayat al-Kursi)",
      "Surah Al-Fatihah: «All praise belongs to Allah, Lord of all worlds»",
      "Surah Al-Ikhlas: «Say: He is Allah, the One»",
    ],
    optionsFrJson: [
      "Sourate Al-Alaq (96:1-5) : « Lis, au nom de ton Seigneur qui a créé... »",
      "Sourate Al-Baqarah : Le verset du Trône (Ayat Al-Koursi)",
      "Sourate Al-Fatihah : « Louange à Allah, Seigneur de l'univers »",
      "Sourate Al-Ikhlas : « Dis : Il est Allah, Unique »",
    ],
    correctOptionIndex: 0,
    explanationEn: "At age 40, Jibril embraced him in the cave of Hira, commanding him to read in the Name of his Creator (Sahih al-Bukhari no. 3).",
    explanationFr: "\u00c0 40 ans, Jibril lui transmit les cinq premiers versets de la Sourate Al-Alaq dans la grotte de Hira (Bukhari n\u00b0 3).",
  },
  {
    promptEn: "For how many years did Prophet Muhammad \ufdfa preach in Makkah, and what was the singular focal message of this era?",
    promptFr: "Combien d'ann\u00e9es le Proph\u00e8te \ufdfa a-t-il pr\u00each\u00e9 \u00e0 La Mecque et quel \u00e9tait le message central de cette p\u00e9riode ?",
    optionsJson: [
      "13 years; focusing resolutely on pure Tawhid (worshipping Allah alone and renouncing idols)",
      "2 years; establishing tax collection systems",
      "20 years; teaching military warfare techniques",
      "5 years; organizing poetic literature contests",
    ],
    optionsFrJson: [
      "13 ans ; axés fermement sur le Tawhid pur (l'Unicité d'Allah et le rejet des idoles)",
      "2 ans ; consacrés à la fiscalité",
      "20 ans ; consacrés aux techniques militaires",
      "5 ans ; consacrés aux concours de poésie",
    ],
    correctOptionIndex: 0,
    explanationEn: "The Salaf emphasized that the Prophet \ufdfa spent over half his prophetic mission establishing Tawhid before detailed laws were revealed.",
    explanationFr: "Le Salaf souligne que plus de la moiti\u00e9 de sa mission fut consacr\u00e9e \u00e0 ancrer le Tawhid avant les lois d\u00e9taill\u00e9es.",
  },
  {
    promptEn: "During which momentous miraculous event were the Five Daily Prayers directly prescribed to the Prophet \ufdfa in the heavens?",
    promptFr: "Lors de quel \u00e9v\u00e9nement miraculeux les cinq pri\u00e8res quotidiennes furent-elles directement prescrites au Proph\u00e8te \ufdfa aux cieux ?",
    optionsJson: [
      "Al-Isra' wal-Mi'raj (The Night Journey and Heavenly Ascension)",
      "The Battle of Badr",
      "The signing of the Treaty of Hudaybiyyah",
      "The Farewell Pilgrimage",
    ],
    optionsFrJson: [
      "Al-Isra' wal-Mi'raj (Le Voyage Nocturne et l'Ascension Céleste)",
      "La Bataille de Badr",
      "Le Traité d'Al-Houdaybiyyah",
      "Le Pèlerinage d'Adieu",
    ],
    correctOptionIndex: 0,
    explanationEn: "Allah spoke directly to His Messenger \ufdfa above the seventh heaven, instituting Salah as the direct celestial link with believers.",
    explanationFr: "Allah a prescrit la pri\u00e8re directement au-dessus des sept cieux, montrant son caract\u00e8re unique parmi tous les cultes.",
  },
  {
    promptEn: "In what year did the historic Hijrah (migration) to Madinah take place, initiating the Islamic lunar calendar?",
    promptFr: "En quelle ann\u00e9e l'H\u00e9gire historique vers M\u00e9dine a-t-elle eu lieu, marquant le d\u00e9but du calendrier musulman ?",
    optionsJson: [
      "622 CE (1st Year of Hijrah)",
      "570 CE",
      "632 CE",
      "700 CE",
    ],
    optionsFrJson: [
      "622 EC (1ère Année de l'Hégire)",
      "570 EC",
      "632 EC",
      "700 EC",
    ],
    correctOptionIndex: 0,
    explanationEn: "The Caliph Umar ibn al-Khattab established the migration to Madinah as Year 1 of the Islamic calendar.",
    explanationFr: "Le Calife Omar ibn al-Khattab a fix\u00e9 l'\u00e9migration vers M\u00e9dine comme l'An 1 du calendrier musulman.",
  },
  {
    promptEn: "What was the very first construction project undertaken by Prophet Muhammad \ufdfa upon his arrival in Madinah?",
    promptFr: "Quelle fut la toute premi\u00e8re construction entreprise par le Proph\u00e8te Muhammad \ufdfa \u00e0 son arriv\u00e9e \u00e0 M\u00e9dine ?",
    optionsJson: [
      "Building Al-Masjid An-Nabawi (The Prophet's Mosque)",
      "Building a royal palace for community leaders",
      "Constructing a military fortress wall around the city",
      "Erecting a commercial toll gate",
    ],
    optionsFrJson: [
      "L'édification d'Al-Masjid An-Nabawi (La Mosquée du Prophète)",
      "La construction d'un palais royal pour les chefs",
      "L'érection d'une forteresse militaire entourant la ville",
      "La construction d'un poste de péage commercial",
    ],
    correctOptionIndex: 0,
    explanationEn: "The mosque served as the spiritual sanctuary, school, assembly, and foundation of the nascent Islamic society.",
    explanationFr: "La mosqu\u00e9e \u00e9tait le centre spirituel, \u00e9ducatif et communautaire de la soci\u00e9t\u00e9 musulmane naissante.",
  },
  {
    promptEn: "What was the historic constitutional pact established by the Prophet \ufdfa in Madinah to guarantee civil protection and religious freedom?",
    promptFr: "Quel pacte constitutionnel historique le Proph\u00e8te \ufdfa a-t-il r\u00e9dig\u00e9 \u00e0 M\u00e9dine pour garantir la protection et la libert\u00e9 de culte ?",
    optionsJson: [
      "The Charter of Madinah (*Sahifat al-Madinah*)",
      "The Code of Hammurabi",
      "The Roman Edict of Milan",
      "The Treaty of Versailles",
    ],
    optionsFrJson: [
      "La Charte de Médine (*Sahifat al-Madinah*)",
      "Le Code d'Hammurabi",
      "L'Édit de Milan",
      "Le Traité de Versailles",
    ],
    correctOptionIndex: 0,
    explanationEn: "The Charter of Madinah is recognized as one of history's earliest written constitutions establishing civil rights and mutual defense.",
    explanationFr: "La Charte de M\u00e9dine est l'une des premi\u00e8res constitutions \u00e9crites \u00e9tablissant la libert\u00e9 de culte et la d\u00e9fense mutuelle.",
  },
  {
    promptEn: "How did Prophet Muhammad \ufdfa treat the defeated pagan Quraysh upon the peaceful Conquest of Makkah (*Fath Makkah*, 8 AH)?",
    promptFr: "Comment le Proph\u00e8te Muhammad \ufdfa a-t-il trait\u00e9 les habitants de La Mecque lors de sa lib\u00e9ration pacifique (*Fath Makkah*, an 8 H) ?",
    optionsJson: [
      "He entered with supreme humility, smashed the 360 idols, and granted universal amnesty: «Go, for you are free»",
      "He executed all former leaders in retaliation for past persecutions",
      "He confiscated all private homes and enslaved the citizens",
      "He burned the city to the ground",
    ],
    optionsFrJson: [
      "Il est entré en toute humilité, a détruit les 360 idoles et a accordé l'amnistie générale : « Allez, vous êtes libres »",
      "Il a fait exécuter les anciens chefs par représailles",
      "Il a confisqué toutes les maisons et asservi la population",
      "Il a ordonné de brûler la ville",
    ],
    correctOptionIndex: 0,
    explanationEn: "He modeled the forbearance of Prophet Yusuf to his brothers, declaring peace and purifying the House of Allah from shirk.",
    explanationFr: "Il a reproduit le pardon sublime de Youssouf envers ses fr\u00e8res, purifiant la Ka'bah de toute idol\u00e2trie.",
  },
  {
    promptEn: "In his Farewell Sermon (*Khutbat Hajjat al-Wada'*), what foundational declaration did the Prophet \ufdfa make concerning racial discrimination?",
    promptFr: "Dans son Sermon d'Adieu, quelle proclamation fondamentale le Proph\u00e8te \ufdfa a-t-il faite concernant la discrimination raciale ?",
    optionsJson: [
      "«An Arab has no superiority over a non-Arab, nor white over black, except by piety and righteous action»",
      "Tribal lineage determines legal status before the law",
      "Certain races are naturally closer to Paradise than others",
      "Non-Arab converts cannot attain high scholarly rank",
    ],
    optionsFrJson: [
      "« L'Arabe n'a aucun mérite sur le non-Arabe, ni le blanc sur le noir, si ce n'est par la piété et les bonnes œuvres »",
      "L'ascendance tribale détermine le statut juridique",
      "Certaines races sont naturellement plus proches du Paradis",
      "Les convertis non-arabes ne peuvent pas devenir de grands savants",
    ],
    correctOptionIndex: 0,
    explanationEn: "Musnad Ahmad (no. 23489). Islam abolished all racial hierarchy 1,400 years before modern human rights declarations.",
    explanationFr: "Musnad Ahmad (n\u00b0 23489). L'Islam a aboli toute hi\u00e9rarchie raciale, seule la pi\u00e9t\u00e9 (*Taqwa*) \u00e9levant l'\u00e2me aupr\u00e8s d'Allah.",
  },
  {
    promptEn: "What is the mandatory obligation of every believer toward Prophet Muhammad \ufdfa according to the Qur'an and Sunnah?",
    promptFr: "Quelle est l'obligation religieuse de tout croyant envers le Proph\u00e8te Muhammad \ufdfa selon le Coran et la Sunnah ?",
    optionsJson: [
      "To love him above oneself and all creation, obey his commands, and follow his Sunnah without innovation",
      "To worship him alongside Allah",
      "To consider his commands as mere temporary 7th-century suggestions",
      "To celebrate his birthday with unauthorized musical rituals",
    ],
    optionsFrJson: [
      "L'aimer plus que sa propre personne, obéir à ses ordres et suivre rigoureusement sa Sunnah sans innovation",
      "L'adorer aux côtés d'Allah",
      "Considérer ses ordres comme de simples avis historiques caducs",
      "Fêter sa naissance par des danses non légiférées",
    ],
    correctOptionIndex: 0,
    explanationEn: "The Prophet \ufdfa said: 'None of you truly believes until I am more beloved to him than his father, his child, and all of mankind' (Bukhari).",
    explanationFr: "Le Proph\u00e8te \ufdfa a dit : 'Nul d'entre vous ne sera v\u00e9ritablement croyant tant que je ne serai pas plus cher pour lui que son p\u00e8re, son enfant et tous les hommes' (Bukhari).",
  },
];
