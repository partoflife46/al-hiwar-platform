/**
 * Seed multiple-choice question bank for Academy Curriculum Module 4.
 *
 * Each `SeedQuestionTemplate` item provides:
 * - Bilingual prompts (`promptEn`, `promptFr`) aligned with Module 4 markdown content.
 * - Four localized answer choices (`optionsJson`, `optionsFrJson`).
 * - Zero-based `correctOptionIndex` and scholarly explanations in English and French.
 *
 * Consumed by `createInitialQuestions()` to populate the 20-question module quiz
 * and the 30-question randomized Capstone Final Exam pool.
 *
 * @module lib/db/seeds/questions/lesson-4
 * @exports LESSON_4_QUESTIONS
 */

import type { SeedQuestionTemplate } from "./types";

/** Authoritative bilingual questions evaluated in Module 4 quizzes. */
export const LESSON_4_QUESTIONS: SeedQuestionTemplate[] = [
  {
    promptEn: "What is the unanimous creed of Ahlus Sunnah wal-Jama'ah regarding the Nature of the Noble Qur'an?",
    promptFr: "Quelle est la croyance unanime d'Ahlus Sunnah wal-Jama'ah concernant la Nature du Noble Coran ?",
    optionsJson: [
      "It is the literal, uncreated Word of Allah (*Kalamullah ghayru makhluq*) revealed to Muhammad ﷺ",
      "It was created like any ordinary creature or tree",
      "It is the human personal poetry of the Prophet Muhammad ﷺ",
      "It was authored by the early caliphs after the Prophet's death",
    ],
    optionsFrJson: [
      "Il est la Parole littérale et incréée d'Allah (*Kalamullah ghayrou makhloûq*) révélée à Muhammad ﷺ",
      "Il a été créé à l'image d'une créature quelconque",
      "Il est la poésie personnelle du Prophète Muhammad ﷺ",
      "Il a été rédigé par les premiers califes après sa mort",
    ],
    correctOptionIndex: 0,
    explanationEn: "Imam Ahmad ibn Hanbal and the Salaf endured severe trials defending that the Qur'an is Allah's uncreated speech.",
    explanationFr: "L'Imam Ahmad ibn Hanbal et les savants du Salaf ont fermement d\u00e9fendu que le Coran est la parole incr\u00e9\u00e9e d'Allah.",
  },
  {
    promptEn: "Why is Surah Al-Fatihah honored with the title *Umm al-Kitab* (The Mother of the Book)?",
    promptFr: "Pourquoi la Sourate Al-Fatihah est-elle honor\u00e9e du titre *Oumm al-Kitab* (La M\u00e8re du Livre) ?",
    optionsJson: [
      "Because it concisely encompasses all core themes of the Qur'an: Tawhid, worship, the Day of Judgment, and the Straight Path",
      "Because it is the longest chapter in the Qur'an",
      "Because it was the final chapter revealed in Madinah",
      "Because it contains names of all previous prophets",
    ],
    optionsFrJson: [
      "Parce qu'elle résume tous les thèmes centraux du Coran : Tawhid, adoration, Jugement Dernier et Droit Chemin",
      "Parce qu'elle est la plus longue sourate du Coran",
      "Parce qu'elle a été la dernière révélée à Médine",
      "Parce qu'elle contient les noms de tous les prophètes",
    ],
    correctOptionIndex: 0,
    explanationEn: "Imam al-Bukhari noted that it was titled Umm al-Kitab because the prayer begins with it and all Qur'anic meanings derive from it.",
    explanationFr: "L'Imam Al-Bukhari a expliqu\u00e9 qu'elle est nomm\u00e9e ainsi car elle ouvre le Livre et en r\u00e9sume tous les sens th\u00e9ologiques.",
  },
  {
    promptEn: "What is the profound theological meaning of the verse \u00ab\u0625\u0650\u064a\u064e\u0651\u0627\u0643\u064e \u0646\u064e\u0639\u0652\u0628\u064f\u062f\u064f \u0648\u064e\u0625\u0650\u064a\u064e\u0651\u0627\u0643\u064e \u0646\u064e\u0633\u0652\u062a\u064e\u0639\u0650\u064a\u0646\u064f\u00bb in Surah Al-Fatihah?",
    promptFr: "Quel est le sens th\u00e9ologique profond du verset \u00ab Iyyaka na'budu wa iyyaka nasta'in \u00bb dans la Sourate Al-Fatihah ?",
    optionsJson: [
      "«You alone we worship, and You alone we ask for help» — dedicating all devotion and reliance solely to Allah",
      "Worshipping saints to bring us closer to Allah",
      "Relying upon our own intellect without divine assistance",
      "Worshipping Allah alongside angels and intermediaries",
    ],
    optionsFrJson: [
      "« C'est Toi seul que nous adorons, et c'est Toi seul dont nous implorons le secours » — vouer adoration et confiance à Allah seul",
      "Adorer les saints pour se rapprocher d'Allah",
      "Compter uniquement sur sa propre raison sans aide divine",
      "Adorer Allah aux côtés des anges et des intercesseurs",
    ],
    correctOptionIndex: 0,
    explanationEn: "Ibn al-Qayyim authored his magnum opus 'Madarij as-Salikin' expounding the stations of the soul upon this single verse.",
    explanationFr: "Ibn Al-Qayyim a consacr\u00e9 son ouvrage monumental 'Madarij as-Salikin' \u00e0 m\u00e9diter les profondeurs de ce seul verset.",
  },
  {
    promptEn: "In the tafsir of Surah Al-Fatihah, who are \u00ab\u0627\u0644\u0652\u0645\u064e\u063a\u0652\u0636\u064f\u0648\u0628\u0650 \u0639\u064e\u0644\u064e\u064a\u0652\u0647\u0650\u0645\u0652\u00bb and \u00ab\u0627\u0644\u0636\u064e\u0651\u0627\u0644\u0650\u0651\u064a\u0646\u064e\u00bb according to the Prophet's explanation?",
    promptFr: "Dans le tafsir d'Al-Fatihah, qui sont \u00ab ceux qui ont encouru Ta col\u00e8re \u00bb et \u00ab les \u00e9gar\u00e9s \u00bb selon l'explication proph\u00e9tique ?",
    optionsJson: [
      "Those who had knowledge of truth but refused to act upon it, and those who acted and worshipped without divine knowledge",
      "Those who lived before the time of Prophet Ibrahim",
      "Those who never received any message or book",
      "Those who were poor in material wealth",
    ],
    optionsFrJson: [
      "Ceux qui avaient la connaissance mais ont refusé d'agir, et ceux qui ont agi et adoré dans l'ignorance sans science",
      "Ceux qui ont vécu avant le Prophète Ibrahim",
      "Ceux qui n'ont jamais reçu de message",
      "Ceux qui étaient démunis de biens matériels",
    ],
    correctOptionIndex: 0,
    explanationEn: "Adi ibn Hatim (radhiyallahu 'anhu) narrated that the Prophet \ufdfa explicitly identified them as those who corrupt knowledge vs practice (Tirmidhi).",
    explanationFr: "Le Proph\u00e8te \ufdfa a expliqu\u00e9 que ce sont ceux qui corrompent le savoir par manque d'action, et ceux qui agissent sans science (At-Tirmidhi).",
  },
  {
    promptEn: "Why did the Prophet Muhammad \ufdfa equate Surah Al-Ikhlas (Chapter 112) to one-third of the Qur'an?",
    promptFr: "Pourquoi le Proph\u00e8te Muhammad \ufdfa a-t-il d\u00e9clar\u00e9 que la Sourate Al-Ikhlas \u00e9quivaut au tiers du Coran ?",
    optionsJson: [
      "Because the Qur'an treats three broad subjects (Tawhid, narratives, and rulings), and Al-Ikhlas is purely dedicated to Tawhid",
      "Because it has exactly one-third of the total letters of the Qur'an",
      "Because it took one-third of the prophetic mission to reveal",
      "Because it must be recited three times a day only",
    ],
    optionsFrJson: [
      "Car le Coran traite de trois grands thèmes (Tawhid, récits et lois), et Al-Ikhlas est purement consacrée au Tawhid",
      "Parce qu'elle compte un tiers des lettres du Coran",
      "Parce qu'elle a nécessité un tiers de la mission prophétique pour être révélée",
      "Parce qu'elle ne doit être lue que trois fois par jour",
    ],
    correctOptionIndex: 0,
    explanationEn: "Ibn Abbas and the Salaf explained that its entire content describes Allah's uncompromised Monotheism and perfection.",
    explanationFr: "Ibn Abbas et le Salaf ont expliqu\u00e9 que l'int\u00e9gralit\u00e9 de cette sourate est consacr\u00e9e \u00e0 la description pure de l'Unicit\u00e9 d'Allah.",
  },
  {
    promptEn: "What is the meaning of the Divine Name *As-Samad* in Surah Al-Ikhlas (112:2)?",
    promptFr: "Quel est le sens du Nom Divin *As-Samad* dans la Sourate Al-Ikhlas (112:2) ?",
    optionsJson: [
      "The Self-Sufficient Master upon Whom all creation depends for all needs, Who neither eats nor drinks",
      "The ruler who appoints mortal kings on earth",
      "The one who rests after creating the universe",
      "The spirit that inhabits created things",
    ],
    optionsFrJson: [
      "Le Maître Absolu et Autosuffisant dont dépend toute la création pour ses besoins, qui ne mange ni ne boit",
      "Le monarque qui désigne des rois terrestres",
      "Celui qui se repose après la création",
      "L'esprit qui s'incarne dans les créatures",
    ],
    correctOptionIndex: 0,
    explanationEn: "Ibn Abbas (radhiyallahu 'anhuma) defined As-Samad: 'The Master Who is perfect in His sovereignty, nobility, and wisdom.'",
    explanationFr: "Ibn Abbas a d\u00e9fini As-Samad : 'Le Ma\u00eetre Absolu parfait dans Sa souverainet\u00e9, Sa grandeur et Sa sagesse.'",
  },
  {
    promptEn: "What false theological doctrines are decisively refuted by the verse \u00ab\u0644\u064e\u0645\u0652 \u064a\u064e\u0644\u0650\u062f\u0652 \u0648\u064e\u0644\u064e\u0645\u0652 \u064a\u064f\u0648\u0644\u064e\u062f\u0652\u00bb in Surah Al-Ikhlas?",
    promptFr: "Quelles fausses doctrines th\u00e9ologiques sont r\u00e9fut\u00e9es par le verset \u00ab Lam yalid wa lam youlad \u00bb ?",
    optionsJson: [
      "The concept that God has biological offspring, parents, daughters (as pagans claimed), or a son (like Jesus/Ezra)",
      "The concept of bodily resurrection on the Last Day",
      "The reality of prophetic miracles",
      "The obligation of giving charity",
    ],
    optionsFrJson: [
      "La croyance que Dieu a des enfants, des parents, des filles (comme prétendaient les païens) ou un fils (comme Jésus/Esdras)",
      "La résurrection corporelle au Jour Dernier",
      "La réalité des miracles des prophètes",
      "L'obligation de faire l'aumône",
    ],
    correctOptionIndex: 0,
    explanationEn: "Allah is without origin, without descendant, eternal and transcendent above all human generational attributes.",
    explanationFr: "Allah est sans origine, sans prog\u00e9niture, transcendant au-dessus de tout attribut de g\u00e9n\u00e9ration biologique.",
  },
  {
    promptEn: "From what external harms does a believer seek refuge in Allah in Surah Al-Falaq (Chapter 113)?",
    promptFr: "Contre quels maux ext\u00e9rieurs le croyant cherche-t-il refuge aupr\u00e8s d'Allah dans la Sourate Al-Falaq ?",
    optionsJson: [
      "The evil of created things, descending darkness, practitioners of witchcraft, and the envious person when he envies",
      "Financial poverty and market inflation only",
      "The seasonal change of summer and winter",
      "The passage of biological aging",
    ],
    optionsFrJson: [
      "Le mal des créatures, les ténèbres qui s'épaississent, les souffleurs sur les nœuds (sorcellerie) et l'envieux qui envie",
      "La baisse du pouvoir d'achat uniquement",
      "Le changement des saisons",
      "Le vieillissement naturel du corps",
    ],
    correctOptionIndex: 0,
    explanationEn: "Tafsir Ibn Kathir explains that Surah Al-Falaq provides divine shield against external dangers and occult malice.",
    explanationFr: "Tafsir Ibn Kathir pr\u00e9cise que la Sourate Al-Falaq est le bouclier divin contre les malveillances ext\u00e9rieures et l'occulte.",
  },
  {
    promptEn: "From what specific internal danger does Surah An-Nas (Chapter 114) protect the human heart?",
    promptFr: "De quel danger int\u00e9rieur pr\u00e9cis la Sourate An-Nas (114) prot\u00e8ge-t-elle le c\u0153ur humain ?",
    optionsJson: [
      "The insidious whisperer (*Al-Waswas Al-Khannas*) who whispers doubts and retreats when Allah is remembered",
      "Physical cardiovascular illnesses",
      "The loss of night sleep",
      "Forgetfulness of daily mundane chores",
    ],
    optionsFrJson: [
      "Le tentateur insidieux (*Al-Waswas Al-Khannas*) qui souffle le doute et recule à l'évocation d'Allah",
      "Les maladies physiques du cœur",
      "L'insomnie passagère",
      "L'oubli des tâches quotidiennes",
    ],
    correctOptionIndex: 0,
    explanationEn: "Al-Khannas is the devil who lurks in the heart, whispering in moments of heedlessness and retreating when Allah's Name is mentioned.",
    explanationFr: "Al-Khannas est le diable qui suscite le doute dans l'insouciance et bat en retraite d\u00e8s qu'Allah est \u00e9voqu\u00e9.",
  },
  {
    promptEn: "What was the regular Sunnah of Prophet Muhammad \ufdfa regarding reciting the Three Qul surahs (Al-Ikhlas, Al-Falaq, An-Nas)?",
    promptFr: "Quelle \u00e9tait la Sunnah habituelle du Proph\u00e8te \ufdfa concernant la r\u00e9citation des trois sourates 'Qul' ?",
    optionsJson: [
      "Reciting them every morning, evening, after each prescribed prayer, and cupping hands to blow over his body before sleeping",
      "Reciting them only once during the pilgrimage to Makkah",
      "Writing them with ink and wearing them as an amulet (*Tamimah*)",
      "Reciting them only on the night of Ramadan",
    ],
    optionsFrJson: [
      "Les réciter matin et soir, après chaque prière obligatoire, et souffler dans ses mains pour s'essuyer le corps avant de dormir",
      "Ne les réciter qu'une fois lors du pèlerinage",
      "Les écrire et les porter comme amulette (*Tamimah*)",
      "Ne les réciter que pendant une nuit de Ramadan",
    ],
    correctOptionIndex: 0,
    explanationEn: "Aisha (radhiyallahu 'anha) reported that every night the Prophet \ufdfa cupped his hands, recited the three surahs, blew into them, and wiped his body (Bukhari).",
    explanationFr: "A\u00efcha a rapport\u00e9 que chaque nuit, le Proph\u00e8te \ufdfa joignait ses mains, y soufflait apr\u00e8s les avoir r\u00e9cit\u00e9es, et s'essuyait le corps (Bukhari).",
  },
];
