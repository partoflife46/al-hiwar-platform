/**
 * Module architecture and API reference for `src/lib/resources/details/res-8.ts`.
 *
 * Exported symbols:
 * - `RES_8` (Const): res 8 definition.
 *
 * Internal dependencies:
 * - `./types`
 *
 * @module lib/resources/details/res-8
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

/**
 * Bilingual Islamic Library monograph content for resource res-8.
 */

import type { DetailedResourceContent } from "./types";

/** Verified scholarly monograph entry res-8. */
export const RES_8: DetailedResourceContent = {
  id: 'res-8',
  slug: 'jesus-and-mary-in-the-quran.mp3',
  category: 'MISCONCEPTIONS',
  resourceType: 'AUDIO',
  titleEn: 'Jesus (Isa) and Mary (Maryam) in the Noble Qur’an',
  titleFr: 'Jésus (Issa) et Marie (Maryam) dans le Noble Coran',
  subtitleEn: 'The Revered Status of the Messiah and His Blessed Mother in Islamic Theology',
  subtitleFr: 'Le statut vénéré du Messie et de sa sainte mère dans la théologie islamique',
  authorEn: 'Department of Comparative Religions and Qur’anic Exegesis',
  authorFr: 'Département de Religions Comparées et d’Exégèse Coranique',
  publishedDate: '1446 AH / 2025 CE',
  readingDuration: '9 min audio recitation & commentary',
  citationSource: 'Surah Maryam (Chapter 19) & Surah Ali ‘Imran (Chapter 3)',
  keyTakeawaysEn: [
    'Mary (Maryam) is the only woman mentioned by name in the Qur’an, and Chapter 19 is named in her honor.',
    'Muslims believe in the miraculous virgin birth of Jesus (peace be upon him) without a human father.',
    'Jesus is revered as one of the greatest Messengers of God and the Messiah (Al-Masih).',
  ],
  keyTakeawaysFr: [
    'Marie (Maryam) est la seule femme mentionnée par son nom dans le Coran, et le chapitre 19 lui est entièrement dédié.',
    'Les musulmans croient fermement à la naissance virginale et miraculeuse de Jésus (paix sur lui) sans père humain.',
    'Jésus est vénéré comme l’un des plus éminents Messagers de Dieu et le Messie (Al-Massih).',
  ],
  sections: [
    {
      titleEn: '1. The Pure Virgin Mary Chosen Above All Women',
      titleFr: '1. La Sainte Vierge Marie choisie au-dessus des femmes',
      contentEn: [
        'The Qur’an portrays Maryam with the highest reverence. She was devoted to temple worship in piety, and the angels brought her the glad tidings that God had purified her and chosen her above all women of the worlds.',
      ],
      contentFr: [
        'Le Coran dépeint Maryam avec la plus haute vénération. Consacrée au culte et à la pureté, les anges lui ont apporté la bonne nouvelle que Dieu l’avait purifiée et choisie au-dessus des femmes de tous les univers.',
      ],
      arabicQuote: 'وَإِذْ قَالَتِ الْمَلَائِكَةُ يَا مَرْيَمُ إِنَّ اللَّهَ اصْطَفَاكِ وَطَهَّرَكِ وَاصْطَفَاكِ عَلَىٰ نِسَاءِ الْعَالَمِينَ',
      arabicTransliteration: '“Wa idh qālatil-malā’ikatu yā Maryamu innallāhaṣ-ṭafāki wa ṭahharaki waṣ-ṭafāki ʻalā nisā’il-ʻālamīn”',
      arabicTranslationEn: '“And [mention] when the angels said, ‘O Mary, indeed Allah has chosen you and purified you and chosen you above the women of the worlds.’” (Surah Ali ‘Imran 3:42)',
      arabicTranslationFr: '« (Rappelle-toi) quand les Anges dirent : ‘Ô Marie, certes Allah t’a élue, t’a purifiée, et t’a choisie au-dessus des femmes des mondes.’ » (Sourate Ali ‘Imran 3:42)',
    },
    {
      titleEn: '2. The Miracles and Message of Jesus (Isa) ﷺ',
      titleFr: '2. Les miracles et le message de Jésus (Issa) ﷺ',
      contentEn: [
        'Through divine will, Jesus spoke from the cradle to defend his mother’s honor, healed the blind and leper, and raised the dead by God’s leave. He called his people to worship the One True Creator with pure devotion.',
      ],
      contentFr: [
        'Par décret divin, Jésus a parlé dès le berceau pour défendre l’honneur de sa sainte mère, a guéri l’aveugle-né et le lépreux, et a ressuscité les morts par la permission de Dieu. Il a appelé son peuple à adorer l’Unique Créateur dans une dévotion sincère.',
      ],
    },
  ],
};
