/**
 * Seed multiple-choice question bank for Academy Curriculum Module 7.
 *
 * Each `SeedQuestionTemplate` item provides:
 * - Bilingual prompts (`promptEn`, `promptFr`) aligned with Module 7 markdown content.
 * - Four localized answer choices (`optionsJson`, `optionsFrJson`).
 * - Zero-based `correctOptionIndex` and scholarly explanations in English and French.
 *
 * Consumed by `createInitialQuestions()` to populate the 20-question module quiz
 * and the 30-question randomized Capstone Final Exam pool.
 *
 * @module lib/db/seeds/questions/lesson-7
 * @exports LESSON_7_QUESTIONS
 */

import type { SeedQuestionTemplate } from "./types";

/** Authoritative bilingual questions evaluated in Module 7 quizzes. */
export const LESSON_7_QUESTIONS: SeedQuestionTemplate[] = [
  {
    promptEn: "What is the foundational methodology of Ahlus Sunnah wal-Jama'ah when encountering doubts or contentious claims (*Shubuhat*)?",
    promptFr: "Quelle est la m\u00e9thodologie fondamentale d'Ahlus Sunnah face aux doutes et ambigu\u00eft\u00e9s (*Choubouhat*) ?",
    optionsJson: [
      "Returning ambiguous matters (*Mutashabih*) to clear definitive verses (*Muhkam*), and consulting grounded scholars (*Ahludz-Dhikr*)",
      "Accepting every viral social media opinion without verification",
      "Debating aggressively on online forums without Islamic knowledge",
      "Abandoning the Sunnah whenever a philosopher objects",
    ],
    optionsFrJson: [
      "Renvoyer les textes équivoques (*Moutashabih*) aux versets clairs (*Mouhkam*), et consulter les savants enracinés (*Ahloudh-Dhikr*)",
      "Adopter aveuglément les tendances des réseaux sociaux sans vérification",
      "Polémiquer violemment en ligne sans science religieuse",
      "Délaisser la Sunnah dès qu'un philosophe émet une objection",
    ],
    correctOptionIndex: 0,
    explanationEn: "Surah Ali 'Imran (3:7) condemns those with diseased hearts who pursue ambiguity, praising those firm in knowledge who hold to clear proofs.",
    explanationFr: "La Sourate Al-Imran (3:7) met en garde contre ceux qui suivent les \u00e9quivoques et loue ceux enracin\u00e9s dans la science.",
  },
  {
    promptEn: "How does authentic Islamic jurisprudence distinguish between legitimate state Jihad and acts of terrorism/murder?",
    promptFr: "Comment le droit musulman authentique distingue-t-il le Jihad l\u00e9gitime d'\u00c9tat des actes terroristes et du meurtre ?",
    optionsJson: [
      "Legitimate Jihad is defensive/authorized under a recognized legitimate state ruler with strict rules; terrorism is criminal murder forbidden by consensus",
      "There is no legal difference between them in Islamic law",
      "Any self-appointed individual in a cave has authority to declare war",
      "Terrorism against innocent civilians is permitted during economic hardship",
    ],
    optionsFrJson: [
      "Le Jihad légitime est défensif et sous l'autorité exclusive d'un État légitime ; le terrorisme est un crime abject interdit par consensus",
      "Il n'y a aucune différence dans la loi islamique",
      "N'importe quel individu isolé peut décréter la guerre",
      "Les attentats contre des civils sont tolérés en temps de crise",
    ],
    correctOptionIndex: 0,
    explanationEn: "Senior scholars (Council of Senior Scholars of Saudi Arabia) unanimously ruled that terrorism and suicide attacks are acts of the deviant Khawarij.",
    explanationFr: "Les grands comit\u00e9s de savants ont statu\u00e9 unanimement que les attentats et le terrorisme rel\u00e8vent des d\u00e9viances de la secte des Khawarij.",
  },
  {
    promptEn: "In military conflict, what explicit restrictions did Prophet Muhammad \ufdfa and Caliph Abu Bakr place upon Muslim soldiers?",
    promptFr: "En p\u00e9riode de conflit militaire, quelles restrictions strictes le Proph\u00e8te \ufdfa et Abou Bakr ont-ils impos\u00e9es aux soldats musulmans ?",
    optionsJson: [
      "Never harm women, children, the elderly, monks in cloisters, or cut down fruit-bearing trees (Sunan Abi Dawud)",
      "Destroy all agricultural fields and water wells indiscriminately",
      "Execute non-combatant civilians to spread psychological dread",
      "Burn all libraries and schools in defeated territories",
    ],
    optionsFrJson: [
      "Ne jamais tuer de femmes, d'enfants, de vieillards, de moines retirés dans leurs ermitages, ni couper d'arbres fruitiers (Abou Daoud)",
      "Détruire aveuglément les récoltes et les puits d'eau",
      "Exécuter des civils innocents pour semer la terreur",
      "Brûler toutes les bibliothèques et écoles des territoires conquis",
    ],
    correctOptionIndex: 0,
    explanationEn: "Islam formulated the world's first codified humanitarian laws of war over 1,400 years before the Geneva Conventions.",
    explanationFr: "L'Islam a codifi\u00e9 les premi\u00e8res lois humanitaires de la guerre 14 si\u00e8cles avant les conventions de Gen\u00e8ve modernes.",
  },
  {
    promptEn: "What does the Noble Qur'an declare regarding freedom of conscience in Surah Al-Baqarah (2:256)?",
    promptFr: "Que proclame le Noble Coran au sujet de la libert\u00e9 de conscience dans la Sourate Al-Baqarah (2:256) ?",
    optionsJson: [
      "«There is no compulsion in religion. The right course has become distinct from the wrong»",
      "People must be forced to convert under threat of physical penalty",
      "Only members of royal families have freedom to choose religion",
      "Faith can be imposed by legal coercion",
    ],
    optionsFrJson: [
      "« Nulle contrainte en religion ! Car le bon chemin s'est distingué de l'égarement »",
      "Les gens doivent être convertis de force sous la contrainte",
      "Seules les familles régnantes ont le libre arbitre",
      "La foi peut être imposée par coercition légale",
    ],
    correctOptionIndex: 0,
    explanationEn: "True faith requires voluntary inward conviction; forced conversion produces only hypocrisy and is invalid before Allah.",
    explanationFr: "La foi n'a de valeur que si elle \u00e9mane d'une conviction sinc\u00e8re du c\u0153ur ; la conversion forc\u00e9e est nulle et non avenue.",
  },
  {
    promptEn: "How does Islamic law guarantee the independent financial rights of women compared to ancient Western/Roman laws?",
    promptFr: "Comment la loi islamique garantit-elle l'autonomie financi\u00e8re de la femme par rapport aux anciens syst\u00e8mes occidentaux et romains ?",
    optionsJson: [
      "A Muslim woman retains 100% full, independent legal ownership of her wealth and earnings; her husband must provide all household living costs",
      "A woman's property automatically transfers to her husband upon marriage",
      "Women are forbidden from owning real estate or conducting commerce",
      "A woman must surrender her inheritance to her brothers",
    ],
    optionsFrJson: [
      "La femme conserve 100 % de la propriété exclusive de ses biens et revenus ; son époux a le devoir légal d'assurer tout l'entretien du foyer",
      "Les biens de l'épouse deviennent automatiquement la propriété du mari",
      "Il est interdit aux femmes de posséder des biens immobiliers",
      "La femme doit céder son héritage à ses frères",
    ],
    correctOptionIndex: 0,
    explanationEn: "For over 1,400 years, Islam gave women absolute property rights without requiring a guardian's permission for business transactions.",
    explanationFr: "Depuis 14 si\u00e8cles, l'Islam accorde \u00e0 la femme une autonomie financi\u00e8re totale sans tutelle maritale sur son patrimoine propre.",
  },
  {
    promptEn: "What is the true spiritual wisdom (*Hikmah*) behind the Islamic modest dress code (*Al-Hijab*) for Muslim women?",
    promptFr: "Quelle est la v\u00e9ritable sagesse spirituelle (*Hikmah*) du v\u00eatement pudique (*Al-Hijab*) pour la femme musulmane ?",
    optionsJson: [
      "An act of supreme worship that protects her dignity and honor, requiring society to value her intellect, faith, and character over physical objectification",
      "A sign of patriarchal inferiority and social punishment",
      "An optional cultural uniform invented in the Ottoman era",
      "A garment designed to restrict women from leaving their homes",
    ],
    optionsFrJson: [
      "Un acte d'adoration protégeant sa dignité et son honneur, imposant qu'on l'estime pour sa foi et son esprit plutôt que de la réduire à un objet",
      "Un signe d'infériorité et une punition sociale",
      "Un simple habit folklorique apparu à l'époque ottomane",
      "Un vêtement destiné à interdire aux femmes de sortir",
    ],
    correctOptionIndex: 0,
    explanationEn: "Surah Al-Ahzab (33:59) states that modest attire ensures women are recognized with respect and not harassed.",
    explanationFr: "La Sourate Al-Ahzab (33:59) \u00e9nonce que la tenue pudique permet \u00e0 la femme d'\u00eatre respect\u00e9e et pr\u00e9serv\u00e9e de toute atteinte.",
  },
  {
    promptEn: "What foundational rule does Surah Al-Mumtahanah (60:8) establish regarding relationships with peaceful non-Muslims?",
    promptFr: "Quelle r\u00e8gle fondamentale la Sourate Al-Mumtahanah (60:8) \u00e9tablit-elle pour les relations avec les non-musulmans pacifiques ?",
    optionsJson: [
      "To treat them with benevolence, righteousness, and scrupulous justice (*Al-Birr wal-Qist*) as long as they do not initiate war or persecution",
      "To cheat them in business contracts whenever possible",
      "To avoid returning their greetings of peace",
      "To refuse humanitarian aid to non-Muslim orphans and elderly",
    ],
    optionsFrJson: [
      "Les traiter avec bonté, bienveillance et une stricte équité (*Al-Birr wal-Qist*) tant qu'ils ne combattent pas les musulmans",
      "Les tromper dans les contrats commerciaux",
      "Refuser de répondre à leurs salutations amicales",
      "Refuser l'aide humanitaire aux orphelins non-musulmans",
    ],
    correctOptionIndex: 0,
    explanationEn: "Allah says: 'Indeed, Allah loves those who act justly' (Qur'an 60:8). Justice is an uncompromising Islamic value for all humanity.",
    explanationFr: "Allah dit : 'Certes, Allah aime les gens \u00e9quitables' (Coran 60:8). La justice et la bont\u00e9 sont des devoirs envers tout \u00eatre pacifique.",
  },
  {
    promptEn: "What is the proper guidance for a New Muslim regarding family gatherings where un-Islamic foods or drinks may be present?",
    promptFr: "Quelle est la conduite appropri\u00e9e pour un nouveau musulman lors des repas familiaux o\u00f9 des mets ou boissons illicites sont pr\u00e9sents ?",
    optionsJson: [
      "Maintain warm, loving family relations, share permitted food politely, and respectfully refrain from alcohol, pork, or un-Islamic religious rituals",
      "Shout insults at one's family and smash their kitchen plates",
      "Sever all telephone and in-person contact permanently",
      "Compromise on Islamic monotheism to please parents",
    ],
    optionsFrJson: [
      "Maintenir des liens chaleureux, partager les aliments licites et s'abstenir courtoisement de l'alcool, du porc et des rituels religieux contraires au Tawhid",
      "Insulter sa famille et briser la vaisselle",
      "Couper définitivement toute communication",
      "Faire des concessions sur le Tawhid pour faire plaisir",
    ],
    correctOptionIndex: 0,
    explanationEn: "Wisdom, gentle manners, and steadfastness on faith demonstrate the transformative moral beauty of Islam to family members.",
    explanationFr: "La sagesse, la douceur et la fermet\u00e9 sur la foi montrent \u00e0 la famille la beaut\u00e9 morale et lumineuse de l'Islam.",
  },
  {
    promptEn: "Is a newly converted Muslim required by Islamic Sharia to legally change their birth name?",
    promptFr: "Un nouveau converti \u00e0 l'Islam est-il religieusement oblig\u00e9 de changer son nom ou pr\u00e9nom de naissance ?",
    optionsJson: [
      "No; they only change it if the name contains an explicit meaning of Shirk or worshipping false deities (the Companions kept their original names)",
      "Yes; every convert must adopt an Arab tribal family name",
      "Yes; failure to change one's passport name invalidates conversion",
      "No; but they must choose three new nicknames",
    ],
    optionsFrJson: [
      "Non ; il n'est tenu de le changer que si le prénom a un sens explicitement polythéiste (les Compagnons ont tous gardé leurs prénoms)",
      "Oui ; tout converti doit obligatoirement prendre un nom de tribu arabe",
      "Oui ; ne pas modifier ses papiers officiels annule la conversion",
      "Non ; mais il doit choisir trois surnoms",
    ],
    correctOptionIndex: 0,
    explanationEn: "Prominent Companions like Umar, Bilal, Salman, and Suhayb kept their historical names upon embracing Islam.",
    explanationFr: "D'illustres Compagnons comme Omar, Bilal, Salman ou Souhayb ont tous conserv\u00e9 leurs pr\u00e9noms d'origine.",
  },
  {
    promptEn: "What did the Prophet Muhammad \ufdfa teach regarding religious extremism and making religious practice excessively burdensome?",
    promptFr: "Qu'a enseign\u00e9 le Proph\u00e8te Muhammad \ufdfa au sujet de l'extr\u00e9misme religieux et de la rigueur excessive ?",
    optionsJson: [
      "«Indeed, the religion is ease, and no one overburdens himself in the religion except that it will overcome him» (Sahih al-Bukhari no. 39)",
      "The more extreme and painful a practice is, the more beloved it is to Allah",
      "Believers should abandon all sleep and worldly work permanently",
      "Only those who make life difficult for their families will enter Paradise",
    ],
    optionsFrJson: [
      "« Certes, la religion est facilité, et quiconque s'impose une rigueur excessive sera vaincu par elle » (Al-Bukhari n° 39)",
      "Plus une pratique est pénible et douloureuse, plus elle est aimée d'Allah",
      "Les croyants doivent délaisser définitivement le sommeil et le travail",
      "Seuls ceux qui compliquent la vie de leurs proches entreront au Paradis",
    ],
    correctOptionIndex: 0,
    explanationEn: "Islam is the balanced middle path (*Wasatiyyah*): steadfast upon the Sunnah without extremism (*Ghuluww*) or negligence (*Jafa'*).",
    explanationFr: "L'Islam est la voie m\u00e9diane \u00e9quilibr\u00e9e (*Wasatiyyah*) : fermet\u00e9 sur la Sunnah sans extr\u00e9misme ni laxisme.",
  },
];
