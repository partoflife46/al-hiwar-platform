/**
 * Module architecture and API reference for `src/lib/resources/details/res-3.ts`.
 *
 * Exported symbols:
 * - `RES_3` (Const): res 3 definition.
 *
 * Internal dependencies:
 * - `./types`
 *
 * @module lib/resources/details/res-3
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

/**
 * Bilingual Islamic Library monograph content for resource res-3.
 */

import type { DetailedResourceContent } from "./types";

/** Verified scholarly monograph entry res-3. */
export const RES_3: DetailedResourceContent = {
  id: 'res-3',
  slug: 'biography-prophet-muhammad',
  category: 'PROPHET',
  resourceType: 'TEXT',
  titleEn: 'Mercy to the Worlds: The Biography of Prophet Muhammad ﷺ',
  titleFr: 'Miséricorde pour les Mondes : La Biographie du Prophète Muhammad ﷺ',
  subtitleEn: 'A Historical & Moral Account of the Final Messenger of God',
  subtitleFr: 'Récit historique et moral du Messager final de Dieu',
  authorEn: 'Department of Prophetic Biography (As-Sirah An-Nabawiyyah)',
  authorFr: 'Département de la Biographie Prophétique (As-Sirah An-Nabawiyyah)',
  publishedDate: '1446 AH / 2025 CE',
  readingDuration: '10 min read',
  citationSource: 'Based on Ibn Hisham, Al-Rahiq Al-Makhtum & Authentic Sunan',
  keyTakeawaysEn: [
    'Born in Makkah in 570 CE, known as Al-Sadiq Al-Amin (The Truthful, The Trustworthy) prior to his prophetic calling.',
    'Patiently endured thirteen years of boycott and persecution in Makkah preaching pure ethical monotheism.',
    'Founded a pluralistic, law-governed society in Madinah codified under the Charter of Madinah (Sahifat al-Madinah).',
  ],
  keyTakeawaysFr: [
    'Né à La Mecque en 570, reconnu sous le nom d’Al-Sadiq Al-Amin (Le Véridique, Le Digne de confiance) bien avant son appel prophétique.',
    'A enduré avec patience treize années d’oppression et de boycott à La Mecque en proclamant le monothéisme éthique.',
    'A fondé à Médine une société pluraliste régie par le droit, officialisée par la Charte de Médine (Sahifat al-Madina).',
  ],
  sections: [
    {
      titleEn: '1. Upright Character Before Prophethood',
      titleFr: '1. Un caractère irréprochable avant la prophétie',
      contentEn: [
        'Even in pre-Islamic Arabian society steeped in tribal conflict, Muhammad ﷺ was universally renowned for uprightness. The Quraysh tribe entrusted him with their valuables and sought his arbitration during disputes, praising his aversion to vices and falsehood.',
      ],
      contentFr: [
        'Même dans la société arabe préislamique marquée par les rivalités tribales, Muhammad ﷺ était respecté de tous pour sa droiture. La tribu de Quraysh lui confiait ses biens les plus précieux et recourait à son arbitrage éclairé, louant son intégrité morale.',
      ],
      arabicQuote: 'وَإِنَّكَ لَعَلَىٰ خُلُقٍ عَظِيمٍ',
      arabicTransliteration: '“Wa innaka laʻalā khuluqin ʻaẓīm”',
      arabicTranslationEn: '“And indeed, you are of a great moral character.” (Surah Al-Qalam 68:4)',
      arabicTranslationFr: '« Et tu es certes d’une moralité éminente. » (Sourate Al-Qalam 68:4)',
    },
    {
      titleEn: '2. The Message of Universal Compassion',
      titleFr: '2. Le message de miséricorde universelle',
      contentEn: [
        'Upon conquering Makkah without bloodshed after twenty years of hostility, the Prophet ﷺ granted general amnesty to his former persecutors, saying: "Go, for you are free." His message elevated the rights of orphans, prohibited female infanticide, commanded kindness to animals, and declared all human beings equal like the teeth of a comb.',
      ],
      contentFr: [
        'Lors de l’entrée pacifique à La Mecque après vingt années d’hostilités subies, le Prophète ﷺ accorda une amnistie générale à ses anciens persécuteurs, déclarant : « Partez, vous êtes libres. » Son message a garanti les droits des orphelins, aboli l’infanticide des filles, ordonné la bienveillance envers les animaux et proclamé l’égalité absolue des êtres humains.',
      ],
    },
  ],
};
