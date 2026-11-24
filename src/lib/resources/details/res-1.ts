/**
 * Module architecture and API reference for `src/lib/resources/details/res-1.ts`.
 *
 * Exported symbols:
 * - `RES_1` (Const): res 1 definition.
 *
 * Internal dependencies:
 * - `./types`
 *
 * @module lib/resources/details/res-1
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

/**
 * Bilingual Islamic Library monograph content for resource res-1.
 */

import type { DetailedResourceContent } from "./types";

/** Verified scholarly monograph entry res-1. */
export const RES_1: DetailedResourceContent = {
  id: 'res-1',
  slug: 'understanding-the-noble-quran.pdf',
  category: 'QURAN',
  resourceType: 'PDF',
  titleEn: 'Understanding the Noble Qur’an: Revelation, Preservation & Core Themes',
  titleFr: 'Comprendre le Noble Coran : Révélation, Préservation et Thèmes Centraux',
  subtitleEn: 'An Academic Monograph on the Divine Origin and Meticulous Preservation of the Final Scripture',
  subtitleFr: 'Monographie académique sur l’origine divine et la préservation méticuleuse de l’Écriture finale',
  authorEn: 'Al-Hiwar Research Directorate — Faculty of Da’wah',
  authorFr: 'Direction de la recherche Al-Hiwar — Faculté de Da’wah',
  publishedDate: '1446 AH / 2025 CE',
  readingDuration: '14 min read',
  citationSource: 'Verified by Academic Review Board (Ref: AH-RES-QUR-001)',
  keyTakeawaysEn: [
    'The Qur’an was revealed orally over a period of 23 years in response to historical events and human spiritual needs.',
    'Mass memorization (Tawatur) and concurrent written recording during the Prophet’s ﷺ lifetime guaranteed total preservation.',
    'Core thematic pillars center upon Pure Monotheism (Tawhid), moral accountability, social justice, and reflections on creation.',
  ],
  keyTakeawaysFr: [
    'Le Coran a été révélé oralement sur une période de 23 ans en réponse aux événements historiques et aux besoins spirituels de l’humanité.',
    'La mémorisation collective (Tawatur) et la transcription écrite simultanée durant la vie du Prophète ﷺ ont garanti une préservation intégrale.',
    'Les piliers thématiques centraux reposent sur le monothéisme pur (Tawhid), la responsabilité morale, la justice sociale et la contemplation de la création.',
  ],
  sections: [
    {
      titleEn: '1. The Mode and Chronology of Divine Revelation (Wahy)',
      titleFr: '1. Le mode et la chronologie de la Révélation Divine (Wahy)',
      contentEn: [
        'The Noble Qur’an is the literal Word of God (Kalam Allah), revealed in the clear Arabic tongue to Prophet Muhammad ﷺ through the Archangel Gabriel (Jibril). The revelation commenced in the Cave of Hira in the year 610 CE with the commanding word "Iqra" (Read/Proclaim).',
        'Unlike previous divine scriptures that were delivered in unified volumes, the Qur’an was sent down piecemeal (Munajjaman) over twenty-three years. This dynamic mode allowed the newly formed community of believers to absorb, understand, and enact its moral and legal injunctions progressively.',
      ],
      contentFr: [
        'Le Noble Coran est la Parole littérale de Dieu (Kalam Allah), révélée en langue arabe claire au Prophète Muhammad ﷺ par l’intermédiaire de l’Archange Gabriel (Jibril). La révélation a débuté dans la grotte de Hira en l’an 610 de l’ère chrétienne par le mot impératif « Iqra » (Lis / Proclame).',
        'Contrairement aux écritures antérieures révélées sous forme de volumes uniques, le Coran est descendu de manière progressive (Munajjaman) sur vingt-trois années. Ce mode dynamique a permis à la communauté naissante d’assimiler, de comprendre et de mettre en pratique ses préceptes moraux et juridiques pas à pas.',
      ],
      arabicQuote: 'إِنَّا نَحْنُ نَزَّلْنَا الذِّكْرَ وَإِنَّا لَهُ لَحَافِظُونَ',
      arabicTransliteration: '“Innā naḥnu nazzalnādh-dhikra wa innā lahū laḥāfiẓūn”',
      arabicTranslationEn: '“Indeed, it is We who sent down the Qur’an and indeed, We will be its guardian.” (Surah Al-Hijr 15:9)',
      arabicTranslationFr: '« En vérité, c’est Nous qui avons fait descendre le Rappel, et c’est Nous qui en sommes assurément les Gardiens. » (Sourate Al-Hijr 15:9)',
    },
    {
      titleEn: '2. Dual Pillars of Preservation: Oral Transmission and Inscription',
      titleFr: '2. Les deux piliers de la préservation : transmission orale et inscription',
      contentEn: [
        'The preservation of the Qur’an stands unique in religious historiography. Under the Prophet’s direct supervision, appointed scribes (Kuttab al-Wahy)—including Zayd ibn Thabit, Ali ibn Abi Talib, and Ubayy ibn Ka’b—inscribed each revelation onto parchment, scapulae, and palm leaves immediately upon recitation.',
        'Concurrently, thousands of companions committed the entire text to heart. In every generation since the 7th century, millions of huffadh (memorizers) across every continent have preserved the exact vocalization, intonation, and vowel points down to the single letter.',
      ],
      contentFr: [
        'La conservation du Coran est unique dans l’historiographie religieuse. Sous la supervision directe du Prophète, des scribes attitrés (Kouttab al-Wahy) — dont Zayd ibn Thabit, Ali ibn Abi Talib et Oubayy ibn Ka’b — consignaient chaque verset sur parchemin, omoplates et feuilles de palmier immédiatement après sa récitation.',
        'Simultanément, des milliers de compagnons ont mémorisé l’intégralité du texte par cœur. À chaque génération depuis le VIIe siècle, des millions de huffadh (mémorisateurs) sur tous les continents ont préservé l’exacte vocalisation et chaque syllabe sans la moindre altération.',
      ],
    },
    {
      titleEn: '3. Universal Message and Invitation to Intellect',
      titleFr: '3. Message universel et appel à l’intelligence',
      contentEn: [
        'The Qur’an does not demand blind faith; it consistently summons human beings to reflect upon the natural world, the horizons of astronomy, embryonic development, and historical civilizations. It speaks directly to human conscience, establishing that salvation rests upon sincere faith coupled with righteous societal action.',
      ],
      contentFr: [
        'Le Coran n’exige pas une foi aveugle ; il invite continuellement l’être humain à réfléchir sur l’ordre naturel, les horizons astronomiques, le développement embryonnaire et les civilisations passées. Il s’adresse directement à la conscience, affirmant que le salut repose sur une foi sincère unie à des œuvres bienfaisantes.',
      ],
    },
  ],
};
