/**
 * Seed multiple-choice question bank for Academy Curriculum Module 3.
 *
 * Each `SeedQuestionTemplate` item provides:
 * - Bilingual prompts (`promptEn`, `promptFr`) aligned with Module 3 markdown content.
 * - Four localized answer choices (`optionsJson`, `optionsFrJson`).
 * - Zero-based `correctOptionIndex` and scholarly explanations in English and French.
 *
 * Consumed by `createInitialQuestions()` to populate the 20-question module quiz
 * and the 30-question randomized Capstone Final Exam pool.
 *
 * @module lib/db/seeds/questions/lesson-3
 * @exports LESSON_3_QUESTIONS
 */

import type { SeedQuestionTemplate } from "./types";

/** Authoritative bilingual questions evaluated in Module 3 quizzes. */
export const LESSON_3_QUESTIONS: SeedQuestionTemplate[] = [
  {
    promptEn: "What did Prophet Muhammad \ufdfa instruct his Companions regarding how Muslims must perform their prayer?",
    promptFr: "Qu'a ordonn\u00e9 le Proph\u00e8te Muhammad \ufdfa \u00e0 ses Compagnons concernant la mani\u00e8re d'accomplir la pri\u00e8re ?",
    optionsJson: [
      "«Pray as you have seen me pray» (Sahih al-Bukhari, no. 631)",
      "Invent new physical postures according to local cultural traditions",
      "Perform only internal meditation without physical movement",
      "Pray facing any direction chosen by individual preference",
    ],
    optionsFrJson: [
      "« Priez comme vous m'avez vu prier » (Sahih Al-Bukhari, n° 631)",
      "Inventer de nouvelles postures selon les cultures locales",
      "Pratiquer une méditation interne sans mouvement physique",
      "Prier dans la direction choisie selon sa préférence",
    ],
    correctOptionIndex: 0,
    explanationEn: "The Prophet's authentic Sunnah is the sole source for all postures, recitations, and timings of Salah.",
    explanationFr: "La Sunnah authentique du Proph\u00e8te \ufdfa est l'unique source d\u00e9terminant les gestes et r\u00e9citations de la pri\u00e8re.",
  },
  {
    promptEn: "How many obligatory units (*Rak'ahs*) make up each of the five daily prayers?",
    promptFr: "Combien d'unit\u00e9s obligatoires (*Rak'ahs*) composent chacune des cinq pri\u00e8res quotidiennes ?",
    optionsJson: [
      "Fajr: 2, Dhuhr: 4, Asr: 4, Maghrib: 3, Isha: 4",
      "Fajr: 4, Dhuhr: 2, Asr: 3, Maghrib: 4, Isha: 2",
      "Every single prayer consists of exactly 2 Rak'ahs",
      "Fajr: 1, Dhuhr: 5, Asr: 5, Maghrib: 2, Isha: 5",
    ],
    optionsFrJson: [
      "Fajr : 2, Dhuhr : 4, Asr : 4, Maghrib : 3, Isha : 4",
      "Fajr : 4, Dhuhr : 2, Asr : 3, Maghrib : 4, Isha : 2",
      "Chaque prière comprend exactement 2 Rak'ahs",
      "Fajr : 1, Dhuhr : 5, Asr : 5, Maghrib : 2, Isha : 5",
    ],
    correctOptionIndex: 0,
    explanationEn: "These units were ordained by Allah during Al-Isra' wal-Mi'raj and demonstrated by Jibril to the Prophet \ufdfa.",
    explanationFr: "Ces nombres d'unit\u00e9s ont \u00e9t\u00e9 prescrits lors de l'Ascension c\u00e9leste et d\u00e9montr\u00e9s par Jibril au Proph\u00e8te \ufdfa.",
  },
  {
    promptEn: "Which phrase constitutes the indispensable opening pillar (*Takbirat al-Ihram*) that inaugurates Salah?",
    promptFr: "Quelle formule constitue le pilier d'ouverture indispensable (*Takbirat al-Ihram*) inaugurant la pri\u00e8re ?",
    optionsJson: [
      "«Allahu Akbar» (Allah is the Greatest)",
      "«Subhanallah wa bihamdih»",
      "«Bismillahir-Rahmanir-Rahim»",
      "«La ilaha illa Allah»",
    ],
    optionsFrJson: [
      "« Allahu Akbar » (Allah est le Plus Grand)",
      "« Soubhanallah wa bihamdih »",
      "« Bismillahir-Rahmanir-Rahim »",
      "« La ilaha illa Allah »",
    ],
    correctOptionIndex: 0,
    explanationEn: "Hadith of Ali (radhiyallahu 'anhu): 'Its sanctification is the Takbir, and its dissolution is the Taslim' (Abu Dawud).",
    explanationFr: "Hadith d'Ali : 'Sa sacralisation est le Takbir, et sa d\u00e9sacralisation est le Taslim' (Abou Daoud).",
  },
  {
    promptEn: "What is the ruling on reciting Surah Al-Fatihah in each Rak'ah according to the authentic hadith?",
    promptFr: "Quel est le statut de la r\u00e9citation de la Sourate Al-Fatihah dans chaque Rak'ah selon le hadith authentique ?",
    optionsJson: [
      "An indispensable pillar without which the prayer is invalid («لَا صَلَاةَ لِمَنْ لَمْ يَقْرَأْ بِفَاتِحَةِ الْكِتَابِ»)",
      "An optional recommendation for elderly people only",
      "It is recited only once a year on Eid day",
      "It is forbidden to recite it silently",
    ],
    optionsFrJson: [
      "Un pilier indispensable sans lequel la prière est invalide (« Pas de prière sans la Fatihah »)",
      "Une recommandation facultative pour les personnes âgées",
      "Elle n'est récitée qu'une fois par an le jour de l'Aïd",
      "Il est interdit de la réciter à voix basse",
    ],
    correctOptionIndex: 0,
    explanationEn: "The Prophet \ufdfa declared in Sahih al-Bukhari: 'There is no prayer for whoever does not recite the Opening of the Book.'",
    explanationFr: "Le Proph\u00e8te \ufdfa a d\u00e9clar\u00e9 dans Sahih Al-Bukhari : 'Point de pri\u00e8re pour qui ne r\u00e9cite pas l'Ouverture du Livre.'",
  },
  {
    promptEn: "How did Prophet Muhammad \ufdfa place his hands during standing (*Qiyam*) before bowing?",
    promptFr: "Comment le Proph\u00e8te Muhammad \ufdfa positionnait-il ses mains en position debout (*Qiyam*) avant l'inclinaison ?",
    optionsJson: [
      "Placing the right hand over the back of the left wrist and forearm upon the chest",
      "Letting both arms dangle loosely by the thighs",
      "Clasping both hands behind the back",
      "Placing both palms over the forehead",
    ],
    optionsFrJson: [
      "Poser la main droite sur le dos du poignet et de l'avant-bras gauche sur la poitrine",
      "Laisser pendre les bras le long du corps",
      "Croiser les mains derrière le dos",
      "Placer les deux mains sur le front",
    ],
    correctOptionIndex: 0,
    explanationEn: "Sahl ibn Sa'd (radhiyallahu 'anhu) reported that people were commanded to place their right hand on their left forearm in prayer (Bukhari).",
    explanationFr: "Sahl ibn Sa'd a rapport\u00e9 que les gens avaient l'ordre de poser la main droite sur l'avant-bras gauche dans la pri\u00e8re (Bukhari).",
  },
  {
    promptEn: "What is the authentic Sunnah dhikr recited during bowing (*Ruku'*)?",
    promptFr: "Quelle est l'invocation conforme \u00e0 la Sunnah \u00e0 r\u00e9citer pendant l'inclinaison (*Ruku'*) ?",
    optionsJson: [
      "«Subhana Rabbiyal-'Adheem» (Glory be to my Lord, the Most Magnificent) at least three times",
      "«Subhana Rabbiyal-A'la» three times",
      "Reciting any poem of historical wisdom",
      "Remaining completely silent without any remembrance",
    ],
    optionsFrJson: [
      "« Subhana Rabbiyal-'Adheem » (Gloire à mon Seigneur le Très Grand) au moins trois fois",
      "« Subhana Rabbiyal-A'la » trois fois",
      "Réciter un poème de sagesse",
      "Garder un silence absolu sans évocation",
    ],
    correctOptionIndex: 0,
    explanationEn: "Hudhayfah (radhiyallahu 'anhu) narrated that the Prophet \ufdfa recited 'Subhana Rabbiyal-'Adheem' in Ruku' (Sahih Muslim no. 772).",
    explanationFr: "Houdhayfah a rapport\u00e9 que le Proph\u00e8te \ufdfa disait dans son Ruku' : 'Subhana Rabbiyal-'Adheem' (Sahih Mouslim n\u00b0 772).",
  },
  {
    promptEn: "Upon which seven bodily bones must a worshipper prostrate (*Sujud*) according to Sahih al-Bukhari?",
    promptFr: "Sur quels sept membres le fid\u00e8le doit-il se prosterner (*Sujud*) selon Sahih Al-Bukhari ?",
    optionsJson: [
      "The forehead along with the nose, the two palms, the two knees, and the tips of the toes of both feet",
      "Only the forehead and palms while lifting the knees",
      "The chest, elbows, and hips",
      "The stomach, chin, and feet",
    ],
    optionsFrJson: [
      "Le front avec le nez, les deux mains, les deux genoux et la pointe des orteils des deux pieds",
      "Le front et les mains seulement en levant les genoux",
      "La poitrine, les coudes et les hanches",
      "Le ventre, le menton et les pieds",
    ],
    correctOptionIndex: 0,
    explanationEn: "Ibn Abbas (radhiyallahu 'anhuma) narrated: 'The Prophet \ufdfa was commanded to prostrate on seven bones' (Bukhari no. 812).",
    explanationFr: "Ibn Abbas a rapport\u00e9 : 'Le Proph\u00e8te \ufdfa a re\u00e7u l'ordre de se prosterner sur sept ossements' (Bukhari n\u00b0 812).",
  },
  {
    promptEn: "What did Prophet Muhammad \ufdfa recite in the sitting between the two prostrations?",
    promptFr: "Qu'invoquait le Proph\u00e8te Muhammad \ufdfa dans l'assise entre les deux prosternations ?",
    optionsJson: [
      "«Rabbighfir li, Rabbighfir li» (My Lord, forgive me; My Lord, forgive me)",
      "«Allahu Akbar» ten times",
      "Reciting Surah Al-Ikhlas aloud",
      "Asking for commercial financial expansion",
    ],
    optionsFrJson: [
      "« Rabbighfir li, Rabbighfir li » (Seigneur, pardonne-moi ; Seigneur, pardonne-moi)",
      "« Allahu Akbar » dix fois",
      "Réciter la Sourate Al-Ikhlas à voix haute",
      "Demander un enrichissement commercial",
    ],
    correctOptionIndex: 0,
    explanationEn: "Hudhayfah reported that between the two prostrations the Prophet \ufdfa said: 'Rabbighfir li, Rabbighfir li' (Sunan an-Nasa'i).",
    explanationFr: "Houdhayfah a rapport\u00e9 qu'entre les deux prosternations, le Proph\u00e8te \ufdfa disait : 'Rabbighfir li, Rabbighfir li' (An-Nasa'i).",
  },
  {
    promptEn: "Whose authentic narration of the Tashahhud was taught by the Prophet \ufdfa holding his companion's hand (Sahih al-Bukhari no. 6265)?",
    promptFr: "Quelle narration authentique du Tashahhud le Proph\u00e8te \ufdfa a-t-il enseign\u00e9e main dans la main \u00e0 son Compagnon (Al-Bukhari n\u00b0 6265) ?",
    optionsJson: [
      "The Tashahhud of Abdullah ibn Mas'ud: «At-Tahiyyatu lillahi was-salawatu wat-tayyibat...»",
      "The philosophical poem of modern scholars",
      "The Tashahhud of ancient non-Muslim philosophers",
      "A self-composed freeform meditation",
    ],
    optionsFrJson: [
      "Le Tashahhud d'Abdullah ibn Mas'oud : « At-Tahiyyatou lillahi was-salawatou wat-tayyibat... »",
      "Un poème philosophique de savants contemporains",
      "Le texte des philosophes antiques",
      "Une méditation libre inventée",
    ],
    correctOptionIndex: 0,
    explanationEn: "Ibn Mas'ud said: 'The Messenger of Allah \ufdfa taught me the Tashahhud with my hand between his two hands' (Bukhari & Muslim).",
    explanationFr: "Ibn Mas'oud a dit : 'Le Messager d'Allah \ufdfa m'a enseign\u00e9 le Tashahhud, ma main entre ses deux mains' (Bukhari et Mouslim).",
  },
  {
    promptEn: "What is the concluding act that officially terminates the Islamic prayer?",
    promptFr: "Quel est l'acte final qui cl\u00f4ture officiellement la pri\u00e8re en Islam ?",
    optionsJson: [
      "The Taslim: Turning the head to the right saying «As-salamu alaykum wa rahmatullah», then to the left",
      "Clapping both hands together once loudly",
      "Standing up immediately and walking out in silence",
      "Wiping the eyes and reciting a non-Arabic poem",
    ],
    optionsFrJson: [
      "Le Taslim : Tourner la tête à droite en disant « As-salamu 'alaykum wa rahmatullah », puis à gauche",
      "Frapper dans ses mains une fois",
      "Se lever immédiatement et sortir en silence",
      "S'essuyer les yeux et réciter un poème non arabe",
    ],
    correctOptionIndex: 0,
    explanationEn: "The Prophet \ufdfa said: '...and its dissolution from consecration is the Taslim' (Sunan Abi Dawud).",
    explanationFr: "Le Proph\u00e8te \ufdfa a dit : '...et ce qui la cl\u00f4ture pour sortir de l'\u00e9tat de sacralisation est le Taslim' (Abou Daoud).",
  },
];
