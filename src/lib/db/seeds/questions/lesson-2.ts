/**
 * Seed multiple-choice question bank for Academy Curriculum Module 2.
 *
 * Each `SeedQuestionTemplate` item provides:
 * - Bilingual prompts (`promptEn`, `promptFr`) aligned with Module 2 markdown content.
 * - Four localized answer choices (`optionsJson`, `optionsFrJson`).
 * - Zero-based `correctOptionIndex` and scholarly explanations in English and French.
 *
 * Consumed by `createInitialQuestions()` to populate the 20-question module quiz
 * and the 30-question randomized Capstone Final Exam pool.
 *
 * @module lib/db/seeds/questions/lesson-2
 * @exports LESSON_2_QUESTIONS
 */

import type { SeedQuestionTemplate } from "./types";

/** Authoritative bilingual questions evaluated in Module 2 quizzes. */
export const LESSON_2_QUESTIONS: SeedQuestionTemplate[] = [
  {
    promptEn: "What did the Prophet Muhammad \ufdfa state regarding the rank of purity (*At-Taharah*) in Sahih Muslim (no. 223)?",
    promptFr: "Qu'a affirm\u00e9 le Proph\u00e8te Muhammad \ufdfa sur le rang de la puret\u00e9 (*At-Taharah*) dans Sahih Mouslim (n\u00b0 223) ?",
    optionsJson: [
      "Purity is half of faith («الطُّهُورُ شَطْرُ الإِيمَانِ»)",
      "Purity is an optional custom for scholars only",
      "Purity is recommended only once a month",
      "Purity is restricted to washing the face alone",
    ],
    optionsFrJson: [
      "La pureté est la moitié de la foi («الطُّهُورُ شَطْرُ الإِيمَانِ»)",
      "La pureté est une coutume facultative pour les savants",
      "La pureté n'est recommandée qu'une fois par mois",
      "La pureté est restreinte au seul visage",
    ],
    correctOptionIndex: 0,
    explanationEn: "Taharah of the inward (from shirk) and outward (from hadath and najasah) completes the faith of a believer.",
    explanationFr: "La puret\u00e9 int\u00e9rieure (du polyth\u00e9isme) et ext\u00e9rieure (du hadath et de la souillure) compl\u00e8te la foi du croyant.",
  },
  {
    promptEn: "According to the authentic Sunnah of the Prophet \ufdfa, where must the intention (*An-Niyyah*) for Wudu be located?",
    promptFr: "Selon la Sunnah authentique du Proph\u00e8te \ufdfa, o\u00f9 doit r\u00e9sider l'intention (*An-Niyyah*) pour le Wudu ?",
    optionsJson: [
      "Silently in the heart; verbalizing it aloud is an unlegislated innovation (*Bid'ah*)",
      "Spoken aloud three times in classical Arabic",
      "Written down on paper before touching water",
      "Pronounced before a congregation in the mosque",
    ],
    optionsFrJson: [
      "Silencieusement dans le cœur ; la prononcer à voix haute est une innovation non légiférée (*Bid'ah*)",
      "Prononcée à haute voix trois fois en arabe",
      "Écrite sur papier avant de toucher l'eau",
      "Déclarée devant les fidèles à la mosquée",
    ],
    correctOptionIndex: 0,
    explanationEn: "Neither the Prophet \ufdfa nor any of his Companions ever pronounced the intention for Wudu or Salah aloud.",
    explanationFr: "Ni le Proph\u00e8te \ufdfa ni aucun de ses nobles Compagnons n'ont jamais prononc\u00e9 l'intention des ablutions oralement.",
  },
  {
    promptEn: "What is the Sunnah method for rinsing the mouth and nose (*Al-Madmadah wal-Istinshaq*) during Wudu?",
    promptFr: "Quelle est la m\u00e9thode conforme \u00e0 la Sunnah pour rincer la bouche et le nez (*Madmadah & Istinshaq*) lors du Wudu ?",
    optionsJson: [
      "Taking a handful of water with the right hand, dividing it between mouth and nose, then blowing out with the left hand (3 times)",
      "Using separate cups of boiling water for each nostril",
      "Rinsing only the teeth with a dry cloth",
      "Submerging the entire head in water for two minutes",
    ],
    optionsFrJson: [
      "Prendre une poignée d'eau de la main droite pour la bouche et le nez, puis rejeter l'eau du nez avec la gauche (3 fois)",
      "Utiliser des récipients séparés d'eau bouillante pour chaque narine",
      "Rincer uniquement les dents avec un chiffon sec",
      "Immerger toute la tête sous l'eau pendant deux minutes",
    ],
    correctOptionIndex: 0,
    explanationEn: "Hadith of Humran in Sahih al-Bukhari & Muslim establishes combining mouth and nose from one single handful of water.",
    explanationFr: "Le hadith de Humran dans Al-Bukhari et Mouslim \u00e9tablit le rin\u00e7age de la bouche et du nez avec une m\u00eame poign\u00e9e d'eau.",
  },
  {
    promptEn: "What are the exact anatomical boundaries of the face that must be washed in Wudu?",
    promptFr: "Quelles sont les limites anatomiques exactes du visage devant \u00eatre lav\u00e9es lors du Wudu ?",
    optionsJson: [
      "From the normal hairline to the bottom of the chin vertically, and from earlobe to earlobe horizontally",
      "From the eyes to the nose tip only",
      "From the forehead to the chest bone",
      "Only the cheeks and lips",
    ],
    optionsFrJson: [
      "De la racine normale des cheveux au bas du menton, et d'un lobe d'oreille à l'autre",
      "Des yeux à la pointe du nez uniquement",
      "Du front jusqu'à la poitrine",
      "Uniquement les joues et les lèvres",
    ],
    correctOptionIndex: 0,
    explanationEn: "Classical jurists agreed on these comprehensive facial boundaries based on Surah Al-Ma'idah (5:6).",
    explanationFr: "Les juristes du Salaf s'accordent sur ces limites int\u00e9grales fond\u00e9es sur le verset du Wudu (Sourate Al-Ma'idah 5:6).",
  },
  {
    promptEn: "How should the head and ears be wiped (*Mas'h*) according to the authentic practice of Prophet Muhammad \ufdfa?",
    promptFr: "Comment essuyer la t\u00eate et les oreilles (*Mas'h*) selon la pratique authentique du Proph\u00e8te Muhammad \ufdfa ?",
    optionsJson: [
      "Passing wet hands once from front hairline to nape and back, then wiping ears with index fingers and thumbs",
      "Washing the head three times with pouring water like a shower",
      "Wiping only three hairs on the right side of the head",
      "Wiping the neck and shoulders three times",
    ],
    optionsFrJson: [
      "Passer les mains mouillées de l'avant vers la nuque puis revenir, puis essuyer l'intérieur des oreilles et l'arrière (1 fois)",
      "Laver la tête trois fois sous un jet d'eau",
      "Essuyer seulement trois cheveux sur le côté droit",
      "Essuyer le cou et les épaules trois fois",
    ],
    correctOptionIndex: 0,
    explanationEn: "Abdullah ibn Zayd (radhiyallahu 'anhu) demonstrated that the Prophet \ufdfa wiped his head once front-to-back and back-to-front (Bukhari no. 185).",
    explanationFr: "Abdullah ibn Zayd a d\u00e9montr\u00e9 que le Proph\u00e8te \ufdfa a pass\u00e9 ses mains sur sa t\u00eate une seule fois en aller-retour (Bukhari n\u00b0 185).",
  },
  {
    promptEn: "Which of the following is an authentic nullifier of Wudu established in the Sunnah?",
    promptFr: "Parmi les suivants, lequel constitue un annulatif authentique du Wudu selon la Sunnah ?",
    optionsJson: [
      "Eating camel meat (hadith of Jabir ibn Samurah in Sahih Muslim)",
      "Touching an infant child with affection",
      "Clipping fingernails or trimming hair",
      "Eating beef, chicken, or mutton",
    ],
    optionsFrJson: [
      "Manger de la viande de chameau (hadith de Jabir ibn Samourah dans Sahih Mouslim)",
      "Toucher un enfant avec affection",
      "Se couper les ongles ou les cheveux",
      "Manger du bœuf, du poulet ou du mouton",
    ],
    correctOptionIndex: 0,
    explanationEn: "A man asked the Prophet \ufdfa: 'Shall I perform wudu after eating camel meat?' He replied: 'Yes' (Sahih Muslim no. 360).",
    explanationFr: "Un homme demanda au Proph\u00e8te \ufdfa : 'Dois-je refaire mes ablutions apr\u00e8s avoir mang\u00e9 du chameau ?' Il r\u00e9pondit : 'Oui' (Mouslim n\u00b0 360).",
  },
  {
    promptEn: "If a worshipper experiences doubt (*waswas*) during prayer about whether they passed wind, what is the prophetic rule?",
    promptFr: "Si un fid\u00e8le \u00e9prouve un doute (*waswas*) pendant sa pri\u00e8re quant \u00e0 la rupture de ses ablutions, quelle est la r\u00e8gle proph\u00e9tique ?",
    optionsJson: [
      "Do not leave the prayer unless you hear a sound or detect an odor (Sahih al-Bukhari no. 137)",
      "Leave the prayer immediately upon the slightest suspicion",
      "Restart the prayer from the beginning without checking",
      "Perform four prostrations of forgetfulness",
    ],
    optionsFrJson: [
      "Ne pas quitter la prière tant qu'on n'a pas entendu un bruit ou senti une odeur (Sahih Al-Bukhari n° 137)",
      "Interrompre la prière immédiatement au moindre soupçon",
      "Recommencer la prière depuis le début",
      "Faire quatre prosternations de distraction",
    ],
    correctOptionIndex: 0,
    explanationEn: "The golden rule of Fiqh derived from this hadith: 'Certainty is not overturned by mere doubt' (Al-Yaqin la yazulu bish-shakk).",
    explanationFr: "La grande r\u00e8gle juridique : 'La certitude ne s'annule pas par le simple doute' (Al-Yaqin la yazoulou bish-shakk).",
  },
  {
    promptEn: "Under which circumstance is the major ritual bath (*Al-Ghusl*) legally required in Islam?",
    promptFr: "Dans quelle circonstance le grand bain rituel (*Al-Ghusl*) est-il l\u00e9galement obligatoire en Islam ?",
    optionsJson: [
      "Following marital relations, nocturnal emission, completion of menses, or upon embracing Islam",
      "After sneezing or yawning repeatedly",
      "After walking outside in rainy weather",
      "After eating spicy foods",
    ],
    optionsFrJson: [
      "Après l'intimité conjugale, émission nocturne, fin des menstrues, ou lors de l'entrée en Islam",
      "Après avoir éternué ou bâillé plusieurs fois",
      "Après avoir marché sous la pluie",
      "Après avoir consommé des mets épicés",
    ],
    correctOptionIndex: 0,
    explanationEn: "Major ritual impurity (Janabah) requires pouring water over the entire body with intention.",
    explanationFr: "L'\u00e9tat d'impuret\u00e9 majeure (*Janabah*) impose de faire couler l'eau sur l'int\u00e9gralit\u00e9 du corps avec intention.",
  },
  {
    promptEn: "How is dry ablution (*At-Tayammum*) correctly performed when water is unavailable or medically harmful?",
    promptFr: "Comment s'accomplit correctement l'ablution s\u00e8che (*At-Tayammum*) en cas d'absence d'eau ou de contre-indication m\u00e9dicale ?",
    optionsJson: [
      "Striking clean earth/dust once with both hands, shaking them, then wiping the face and the backs of the hands",
      "Rubbing sand over the entire body three times",
      "Washing with oil or perfume instead of water",
      "Delaying all prayers until next week",
    ],
    optionsFrJson: [
      "Frapper une fois la terre propre des deux mains, les secouer, puis essuyer le visage et le dos des mains",
      "Se frotter le sable sur tout le corps trois fois",
      "Se laver avec de l'huile ou du parfum",
      "Reporter toutes les prières à la semaine suivante",
    ],
    correctOptionIndex: 0,
    explanationEn: "Ammaar ibn Yasir (radhiyallahu 'anhu) narrated that the Prophet \ufdfa struck the earth once and wiped his face and palms (Bukhari no. 347).",
    explanationFr: "Ammar ibn Yassir a rapport\u00e9 que le Proph\u00e8te \ufdfa a frapp\u00e9 le sol une fois et a essuy\u00e9 son visage et ses mains (Bukhari n\u00b0 347).",
  },
  {
    promptEn: "What authentic supplication did Prophet Muhammad \ufdfa promise opens the eight gates of Paradise when recited after Wudu?",
    promptFr: "Quelle invocation authentique le Proph\u00e8te \ufdfa a-t-il enseign\u00e9 comme ouvrant les 8 portes du Paradis apr\u00e8s le Wudu ?",
    optionsJson: [
      "«Ash-hadu an la ilaha illa Allah... Allahumma-j'alni minat-tawwabin waj'alni minal-mutathahhirin»",
      "Reciting the names of the four Caliphs in historical order",
      "Saying only 'Allahu Akbar' forty times",
      "Remaining silent for ten minutes",
    ],
    optionsFrJson: [
      "«Ash-hadu an la ilaha illa Allah... Allahoumma ij'alni minat-tawwabin waj'alni minal-moutatahhirin»",
      "Réciter les noms des quatre Califes bien guidés",
      "Dire seulement 'Allahu Akbar' quarante fois",
      "Garder le silence pendant dix minutes",
    ],
    correctOptionIndex: 0,
    explanationEn: "Recorded in Sahih Muslim (no. 234) and Jami' at-Tirmidhi (no. 55) with authentic sanad.",
    explanationFr: "Rapport\u00e9 dans Sahih Mouslim (n\u00b0 234) et Jami' At-Tirmidhi (n\u00b0 55) avec une cha\u00eene authentique.",
  },
];
