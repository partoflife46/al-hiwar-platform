/**
 * Module architecture and API reference for `src/lib/resources/details/res-4.ts`.
 *
 * Exported symbols:
 * - `RES_4` (Const): res 4 definition.
 *
 * Internal dependencies:
 * - `./types`
 *
 * @module lib/resources/details/res-4
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

/**
 * Bilingual Islamic Library monograph content for resource res-4.
 */

import type { DetailedResourceContent } from "./types";

/** Verified scholarly monograph entry res-4. */
export const RES_4: DetailedResourceContent = {
  id: 'res-4',
  slug: 'prophetic-mosque-documentary.mp4',
  category: 'PROPHET',
  resourceType: 'VIDEO',
  titleEn: 'The Prophetic Mosque in Madinah: History & Spiritual Legacy',
  titleFr: 'La Mosquée Prophétique à Médine : Histoire et Héritage Spirituel',
  subtitleEn: 'Documentary Overview of Al-Masjid An-Nabawi as a Center of Community, Knowledge & Peace',
  subtitleFr: 'Aperçu documentaire d’Al-Masjid An-Nabawi comme centre de communauté, de savoir et de paix',
  authorEn: 'Al-Hiwar Media Archive & Islamic University Documentation Unit',
  authorFr: 'Archives Médias Al-Hiwar et Unité de Documentation de l’Université Islamique',
  publishedDate: '1446 AH / 2025 CE',
  readingDuration: '8 min syllabus & preview',
  citationSource: 'Historical Archive (Ref: AH-VID-MAD-004)',
  keyTakeawaysEn: [
    'Al-Masjid An-Nabawi was established in 622 CE as the heartbeat of civic and spiritual life.',
    'The Mosque functioned as a sanctuary of worship, a council of consultation (Shura), and the first universal residential academy (Suffah).',
    'The blessed Rawdah represents one of the gardens of Paradise as affirmed in authentic Prophetic traditions.',
  ],
  keyTakeawaysFr: [
    'Al-Masjid An-Nabawi a été érigée en 622 de l’ère chrétienne au cœur de la vie spirituelle et civique.',
    'La Mosquée faisait office de sanctuaire de prière, de conseil de concertation (Choura) et de première académie résidentielle (Al-Suffah).',
    'La noble Rawdah représente l’un des jardins du Paradis selon la tradition prophétique authentique.',
  ],
  sections: [
    {
      titleEn: 'Curated Video Syllabus & Archaeological Timeline',
      titleFr: 'Programme de la vidéo et repères historiques',
      contentEn: [
        'Segment 1 (00:00 - 02:30): The arrival in Yathrib (Madinah) and the initial construction with unbaked clay bricks and palm trunk pillars.',
        'Segment 2 (02:31 - 05:45): The Ashab al-Suffah: the world’s first full-time students of divine scripture and prophetic sciences.',
        'Segment 3 (05:46 - 08:00): Architectural evolution through the Umayyad, Abbasid, Ottoman, and contemporary Saudi expansions.',
      ],
      contentFr: [
        'Partie 1 (00:00 - 02:30) : L’arrivée à Yathrib (Médine) et la construction originelle en briques d’argile et troncs de palmiers.',
        'Partie 2 (02:31 - 05:45) : Les Ashab al-Suffah : les premiers étudiants à plein temps des sciences de la révélation.',
        'Partie 3 (05:46 - 08:00) : L’évolution architecturale à travers les époques omeyyade, abbasside, ottomane et les expansions contemporaines.',
      ],
      arabicQuote: 'مَا بَيْنَ بَيْتِي وَمِنْبَرِي رَوْضَةٌ مِنْ رِيَاضِ الْجَنَّةِ',
      arabicTransliteration: '“Mā bayna baytī wa minbarī rawḍatun min riyāḍil-jannah”',
      arabicTranslationEn: '“Between my house and my pulpit lies a garden from the gardens of Paradise.” (Sahih Al-Bukhari)',
      arabicTranslationFr: '« Ce qui se trouve entre ma demeure et ma chaire est un jardin parmi les jardins du Paradis. » (Sahih Al-Bukhari)',
    },
  ],
};
