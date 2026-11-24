/**
 * Seed multiple-choice question bank for Academy Curriculum Module 6.
 *
 * Each `SeedQuestionTemplate` item provides:
 * - Bilingual prompts (`promptEn`, `promptFr`) aligned with Module 6 markdown content.
 * - Four localized answer choices (`optionsJson`, `optionsFrJson`).
 * - Zero-based `correctOptionIndex` and scholarly explanations in English and French.
 *
 * Consumed by `createInitialQuestions()` to populate the 20-question module quiz
 * and the 30-question randomized Capstone Final Exam pool.
 *
 * @module lib/db/seeds/questions/lesson-6
 * @exports LESSON_6_QUESTIONS
 */

import type { SeedQuestionTemplate } from "./types";

/** Authoritative bilingual questions evaluated in Module 6 quizzes. */
export const LESSON_6_QUESTIONS: SeedQuestionTemplate[] = [
  {
    promptEn: "What did Prophet Muhammad \ufdfa declare as the overarching mission of his prophethood regarding moral character?",
    promptFr: "Qu'a affirm\u00e9 le Proph\u00e8te Muhammad \ufdfa concernant l'objectif supr\u00eame de sa mission proph\u00e9tique quant au comportement ?",
    optionsJson: [
      "«Indeed, I was sent only to perfect noble character» (Al-Adab Al-Mufrad by Imam al-Bukhari, no. 273)",
      "To accumulate vast material wealth for the treasury",
      "To conquer foreign nations for political expansion",
      "To impose severe cultural customs upon all nations",
    ],
    optionsFrJson: [
      "« Je n'ai été envoyé que pour parfaire les nobles caractères » (Al-Adab Al-Moufrad de l'Imam Al-Bukhari, n° 273)",
      "Pour amasser d'immenses richesses matérielles",
      "Pour asservir militairement les nations étrangères",
      "Pour imposer des coutumes locales à l'ensemble du monde",
    ],
    correctOptionIndex: 0,
    explanationEn: "Authentic faith (Tawhid) produces noble character (Akhlaq); a person with corrupted manners lacks perfection in faith.",
    explanationFr: "La foi authentique produit le bon caract\u00e8re ; un comportement indigne d\u00e9note une faiblesse dans la foi.",
  },
  {
    promptEn: "How does Islam command a New Muslim to treat their parents if the parents remain non-Muslim (Qur'an 31:15)?",
    promptFr: "Comment l'Islam ordonne-t-il au nouveau musulman de traiter ses parents si ceux-ci restent non-musulmans (Coran 31:15) ?",
    optionsJson: [
      "To accompany them in this world with utmost kindness, respect, and financial support, except in matters of disobedience to Allah",
      "To sever all ties, curse them, and refuse to speak to them",
      "To steal their property to fund religious projects",
      "To disown them legally and change family lineage",
    ],
    optionsFrJson: [
      "Les accompagner dans ce bas-monde avec une immense bienveillance et respect, sauf s'ils ordonnent de désobéir à Allah",
      "Rompre tout contact, les maudire et refuser de leur adresser la parole",
      "Confisquer leurs biens pour financer des œuvres",
      "Rudier légalement sa filiation familiale",
    ],
    correctOptionIndex: 0,
    explanationEn: "Asma bint Abi Bakr was instructed by the Prophet \ufdfa to maintain warm, loving ties with her visiting non-Muslim mother (Bukhari).",
    explanationFr: "Asma bint Abi Bakr a re\u00e7u l'ordre du Proph\u00e8te \ufdfa d'accueillir et d'honorer avec bont\u00e9 sa m\u00e8re non-musulmane (Bukhari).",
  },
  {
    promptEn: "What did the Prophet \ufdfa state regarding the preservation of the tongue (*Hifdh al-Lisan*) in Sahih al-Bukhari?",
    promptFr: "Qu'a enseign\u00e9 le Proph\u00e8te \ufdfa sur la pr\u00e9servation de la langue (*Hifdh al-Lisan*) dans Sahih Al-Bukhari ?",
    optionsJson: [
      "«Whoever believes in Allah and the Last Day, let him speak good or remain silent»",
      "Speak continuously about others' personal private lives",
      "It is permissible to lie if it entertains an audience",
      "Silence is a sign of theological weakness",
    ],
    optionsFrJson: [
      "« Que celui qui croit en Allah et au Jour Dernier dise du bien ou qu'il se taise »",
      "Parler sans cesse de la vie privée des autres",
      "Il est permis de mentir pour amuser son entourage",
      "Le silence est une faiblesse théologique",
    ],
    correctOptionIndex: 0,
    explanationEn: "Guarding the tongue from backbiting, slander, and foul speech is essential to protect one's good deeds from bankruptcy on Judgment Day.",
    explanationFr: "Pr\u00e9server sa langue de la m\u00e9disance et de l'injure prot\u00e8ge les bonnes actions de la faillite spirituelle au Jour Dernier.",
  },
  {
    promptEn: "What is the authentic definition of backbiting (*Al-Ghibah*) according to the Prophet \ufdfa in Sahih Muslim (no. 2589)?",
    promptFr: "Quelle est la d\u00e9finition authentique de la m\u00e9disance (*Al-Ghibah*) selon le Proph\u00e8te \ufdfa dans Sahih Mouslim (n\u00b0 2589) ?",
    optionsJson: [
      "Mentioning your brother in his absence with something he would dislike, even if it is completely true",
      "Inventing a lie about a stranger",
      "Praising someone behind their back",
      "Reporting a commercial scam to the legitimate police authorities",
    ],
    optionsFrJson: [
      "Évoquer ton frère en son absence par ce qu'il déteste, même si cela est parfaitement vrai",
      "Inventer un mensonge sur un étranger",
      "Faire l'éloge de quelqu'un en son absence",
      "Dénoncer une escroquerie aux autorités compétentes",
    ],
    correctOptionIndex: 0,
    explanationEn: "The Prophet \ufdfa said: 'If what you say is in him, you have backbitten him; and if it is not in him, you have slandered him (Buhtan).'",
    explanationFr: "Le Proph\u00e8te \ufdfa a pr\u00e9cis\u00e9 : 'Si ce que tu dis est vrai, tu as m\u00e9dit de lui ; et si c'est faux, tu l'as calomni\u00e9 (Bouhtan).'",
  },
  {
    promptEn: "What is the virtue of *Al-Haya'* (Modesty & Spiritual Dignity) according to authentic hadith in Sahih al-Bukhari?",
    promptFr: "Quelle est la place de la pudeur (*Al-Haya'*) selon le hadith authentique dans Sahih Al-Bukhari ?",
    optionsJson: [
      "«Al-Haya' brings nothing but goodness and is a branch of faith»",
      "Modesty is a cultural weakness that should be abandoned",
      "Modesty is required only when inside the mosque",
      "Modesty prevents a person from learning the truth",
    ],
    optionsFrJson: [
      "« La pudeur n'apporte que du bien et est une branche de la foi »",
      "La pudeur est une faiblesse psychologique à rejeter",
      "La pudeur n'est requise qu'à l'intérieur de la mosquée",
      "La pudeur empêche d'apprendre la vérité",
    ],
    correctOptionIndex: 0,
    explanationEn: "The Prophet \ufdfa declared: 'Faith has over seventy branches... and modesty is a branch of faith' (Sahih Muslim).",
    explanationFr: "Le Proph\u00e8te \ufdfa a affirm\u00e9 : 'La foi comporte plus de soixante-dix branches... et la pudeur est une branche de la foi' (Mouslim).",
  },
  {
    promptEn: "What Sunnah etiquettes of eating and drinking did the Prophet \ufdfa teach to young Umar ibn Abi Salamah (radhiyallahu 'anhu)?",
    promptFr: "Quelles r\u00e8gles de biens\u00e9ance le Proph\u00e8te \ufdfa a-t-il enseign\u00e9es au jeune Omar ibn Abi Salama pour les repas ?",
    optionsJson: [
      "«Say Bismillah, eat with your right hand, and eat from what is directly in front of you»",
      "Eat with both hands simultaneously from the middle of the platter",
      "Never drink water while sitting down",
      "Eat while standing and walking in markets",
    ],
    optionsFrJson: [
      "« Dis Bismillah, mange de ta main droite et mange de ce qui est devant toi »",
      "Manger des deux mains au milieu du plat",
      "Ne jamais boire d'eau en étant assis",
      "Manger debout en marchant dans la rue",
    ],
    correctOptionIndex: 0,
    explanationEn: "Recorded in Sahih al-Bukhari (no. 5376) as foundational table manners for every Muslim household.",
    explanationFr: "Rapport\u00e9 dans Sahih Al-Bukhari (n\u00b0 5376) comme base universelle des bonnes mani\u00e8res de table en Islam.",
  },
  {
    promptEn: "What high spiritual rank did the Prophet \ufdfa promise for the honest and trustworthy merchant (*At-Tajir As-Saduq*) in Sunan at-Tirmidhi?",
    promptFr: "Quel rang spirituel sublime le Proph\u00e8te \ufdfa a-t-il promis au commer\u00e7ant v\u00e9ridique et digne de confiance dans At-Tirmidhi ?",
    optionsJson: [
      "He will be resurrected on the Day of Judgment alongside the Prophets, the Truthful, and the Martyrs",
      "He will be exempted from performing the five daily prayers",
      "He is guaranteed to never experience any business financial loss",
      "He will receive earthly political kingship",
    ],
    optionsFrJson: [
      "Il sera ressuscité au Jour du Jugement avec les Prophètes, les Véridiques et les Martyrs",
      "Il sera dispensé des cinq prières quotidiennes",
      "Il a la garantie de ne jamais faire de perte financière",
      "Il obtiendra un pouvoir politique terrestre",
    ],
    correctOptionIndex: 0,
    explanationEn: "Conducting commerce with strict honesty, zero fraud, and clear disclosures elevates trade into an act of supreme worship.",
    explanationFr: "Pratiquer le commerce avec une honn\u00eatet\u00e9 rigoureuse sans tromperie \u00e9l\u00e8ve l'activit\u00e9 au rang d'une adoration majeure.",
  },
  {
    promptEn: "What are the rights of neighbors (*Huquq al-Jar*) according to the repeated commands of Prophet Muhammad \ufdfa?",
    promptFr: "Quels sont les devoirs envers le voisin (*Houqo\u00fbq al-Jar*) selon les enseignements r\u00e9p\u00e9t\u00e9s du Proph\u00e8te \ufdfa ?",
    optionsJson: [
      "Treating them with honor, protecting their safety and property, and sharing food, regardless of whether they are Muslim or non-Muslim",
      "Greeting them only if they attend your local mosque",
      "Ignoring them completely unless they knock on your door",
      "Competing with them in material arrogance",
    ],
    optionsFrJson: [
      "Les honorer, préserver leur sécurité et leurs biens, et partager les repas, qu'ils soient musulmans ou non-musulmans",
      "Ne les saluer que s'ils fréquentent votre mosquée",
      "Les ignorer totalement à moins qu'ils ne sollicitent de l'aide",
      "Rivaliser avec eux par orgueil matériel",
    ],
    correctOptionIndex: 0,
    explanationEn: "The Prophet \ufdfa said: 'Jibril kept enjoining good treatment of the neighbor until I thought he would make him an heir' (Bukhari).",
    explanationFr: "Le Proph\u00e8te \ufdfa a dit : 'L'Ange Jibril n'a cess\u00e9 de me recommander le voisin au point que j'ai cru qu'il allait lui donner droit \u00e0 l'h\u00e9ritage' (Bukhari).",
  },
  {
    promptEn: "What is the authentic Sunnah practice when preparing to sleep at night?",
    promptFr: "Quelle est la pratique conforme \u00e0 la Sunnah au moment de se mettre au lit la nuit ?",
    optionsJson: [
      "Performing Wudu, lying on the right side, reciting Ayat al-Kursi, the Mu'awwidhat, and the authentic bedtime supplications",
      "Leaving bright lights on throughout the entire room",
      "Sleeping on one's stomach (which the Prophet ﷺ prohibited)",
      "Listening to secular loud music until falling asleep",
    ],
    optionsFrJson: [
      "Faire ses ablutions, s'allonger sur le côté droit, réciter Ayat Al-Koursi, les sourates protectrices et les invocations du soir",
      "Laisser toutes les lumières allumées",
      "Dormir sur le ventre (posture réprouvée par le Prophète ﷺ)",
      "Écouter de la musique forte jusqu'à l'endormissement",
    ],
    correctOptionIndex: 0,
    explanationEn: "Sleeping upon Taharah on the right side with prophetic adhkar safeguards both body and soul from demonic nightmares.",
    explanationFr: "Dormir en \u00e9tat de puret\u00e9 sur le c\u00f4t\u00e9 droit avec les \u00e9vocations proph\u00e9tiques prot\u00e8ge l'\u00e2me des cauchemars d\u00e9moniaques.",
  },
  {
    promptEn: "Which of the following lifestyle practices are strictly forbidden (*Haram*) in Islam to protect human life, intellect, and wealth?",
    promptFr: "Parmi les suivantes, quelles pratiques sont formellement interdites (*Haram*) pour prot\u00e9ger la vie, la raison et les biens ?",
    optionsJson: [
      "Consuming intoxicants/alcohol (*Khamr*), gambling (*Maysir*), usury/interest (*Riba*), and unlawful meats",
      "Engaging in international lawful commercial trade",
      "Exercising and swimming for physical fitness",
      "Learning useful academic engineering or medicine",
    ],
    optionsFrJson: [
      "Consommer de l'alcool/drogues (*Khamr*), les jeux de hasard (*Maysir*), l'usure/intérêts (*Riba*) et les nourritures illicites",
      "Pratiquer le commerce international licite",
      "Faire du sport et nager pour sa santé",
      "Étudier les sciences médicales ou l'ingénierie",
    ],
    correctOptionIndex: 0,
    explanationEn: "The five universal necessities of Islamic Sharia (*Ad-Daruriyyat al-Khams*) protect: Religion, Life, Intellect, Lineage, and Wealth.",
    explanationFr: "Les cinq objectifs majeurs de la Sharia (*Al-Maqasid*) prot\u00e8gent : la Religion, la Vie, la Raison, la Lign\u00e9e et les Biens.",
  },
];
