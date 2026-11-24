/**
 * Module architecture and API reference for `src/lib/resources/details/res-6.ts`.
 *
 * Exported symbols:
 * - `RES_6` (Const): res 6 definition.
 *
 * Internal dependencies:
 * - `./types`
 *
 * @module lib/resources/details/res-6
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

/**
 * Bilingual Islamic Library monograph content for resource res-6.
 */

import type { DetailedResourceContent } from "./types";

/** Verified scholarly monograph entry res-6. */
export const RES_6: DetailedResourceContent = {
  id: 'res-6',
  slug: 'islamic-ethics-compendium',
  category: 'ETHICS',
  resourceType: 'TEXT',
  titleEn: 'Islamic Ethics (Al-Akhlaq): Compassion, Honesty, and Neighbourly Rights',
  titleFr: 'L’Éthique Islamique (Al-Akhlaq) : Compassion, Honnêteté et Droits du Voisin',
  subtitleEn: 'The Moral Fabric of Islamic Civilization: Practical Guidelines for Living in Harmony',
  subtitleFr: 'Le socle moral de la civilisation islamique : règles pratiques pour vivre en harmonie',
  authorEn: 'Department of Islamic Ethics and Jurisprudence',
  authorFr: 'Département d’Éthique et de Jurisprudence Islamique',
  publishedDate: '1446 AH / 2025 CE',
  readingDuration: '9 min read',
  citationSource: 'Moral Compendium (Ref: AH-TXT-AKH-006)',
  keyTakeawaysEn: [
    'The Prophet ﷺ summarized his mission: "I was only sent to perfect good character."',
    'Fulfilling obligations to neighbours is so emphasized that the Prophet ﷺ wondered if neighbours would inherit.',
    'Honesty in trade, preservation of trusts, and environmental stewardship are religious duties.',
  ],
  keyTakeawaysFr: [
    'Le Prophète ﷺ a résumé sa mission : « Je n’ai été envoyé que pour parfaire les nobles caractères. »',
    'Le respect des voisins est tellement souligné que le Prophète ﷺ a pensé qu’ils allaient hériter.',
    'L’honnêteté dans le commerce, la loyauté envers les engagements et le respect de la nature sont des devoirs religieux.',
  ],
  sections: [
    {
      titleEn: '1. The Primacy of Moral Character (Husn al-Khuluq)',
      titleFr: '1. La primauté de la noblesse de caractère',
      contentEn: [
        'In Islam, ritual worship and ethical conduct are inseparable. A person who prays regularly but cheats in business or harms neighbors has neglected the core objective of prayer, which is to deter wrongdoing and cultivate inner beauty.',
      ],
      contentFr: [
        'En Islam, le culte rituel et l’éthique morale sont indissociables. Celui qui prie avec assiduité mais trompe dans le commerce ou nuit à ses voisins a manqué l’objectif même de la prière, qui est d’éloigner des turpitudes et d’élever l’âme.',
      ],
      arabicQuote: 'إِنَّمَا بُعِثْتُ لِأُتَمِّمَ مَكَارِمَ الْأَخْلَاقِ',
      arabicTransliteration: '“Innamā buʻithtu li-utammima makārimal-akhlāq”',
      arabicTranslationEn: '“I have only been sent to perfect noble manners.” (Al-Adab Al-Mufrad, Sahih)',
      arabicTranslationFr: '« Je n’ai été envoyé que pour parachever les nobles vertus morales. » (Al-Adab Al-Mufrad)',
    },
    {
      titleEn: '2. Rights of Neighbours and All Living Beings',
      titleFr: '2. Droits des voisins et de toute créature vivante',
      contentEn: [
        'Islamic jurisprudence protects the rights of neighbors regardless of religious background. The Prophet ﷺ stated: "Whoever believes in Allah and the Last Day, let him honor his neighbor." Kindness extends to non-human creation: wasting water even at a flowing river is prohibited, and mistreating an animal is warned against with severe accountability.',
      ],
      contentFr: [
        'La tradition islamique protège rigoureusement les droits du voisinage, quelle que soit son appartenance religieuse. Le Prophète ﷺ a enseigné : « Que celui qui croit en Allah et au Jour Dernier honore son voisin. » La bienveillance s’étend à toute la Création : le gaspillage de l’eau est proscrit même au bord d’une rivière abondante, et la cruauté envers les animaux est sévèrement condamnée.',
      ],
    },
  ],
};
