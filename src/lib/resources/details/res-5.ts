/**
 * Module architecture and API reference for `src/lib/resources/details/res-5.ts`.
 *
 * Exported symbols:
 * - `RES_5` (Const): res 5 definition.
 *
 * Internal dependencies:
 * - `./types`
 *
 * @module lib/resources/details/res-5
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

/**
 * Bilingual Islamic Library monograph content for resource res-5.
 */

import type { DetailedResourceContent } from "./types";

/** Verified scholarly monograph entry res-5. */
export const RES_5: DetailedResourceContent = {
  id: 'res-5',
  slug: 'pillars-of-islam-and-faith.pdf',
  category: 'PILLARS',
  resourceType: 'PDF',
  titleEn: 'The Five Pillars of Islam & Six Pillars of Faith Explained',
  titleFr: 'Les Cinq Piliers de l’Islam et les Six Piliers de la Foi Expliqués',
  subtitleEn: 'The Comprehensive Hadith of Jibril: Distinguishing Islam, Iman, and Ihsan',
  subtitleFr: 'Le Hadith fondamental de Jibril : Définition de l’Islam, de l’Iman et de l’Ihsan',
  authorEn: 'Academy of Islamic Foundations — Al Hiwar Educational Series',
  authorFr: 'Académie des Fondements Islamiques — Collection Éducative Al Hiwar',
  publishedDate: '1446 AH / 2025 CE',
  readingDuration: '12 min read',
  citationSource: 'Hadith of Jibril (Sahih Muslim, Hadith 8)',
  keyTakeawaysEn: [
    'Islam consists of five outward actions: Shahadah, Salah (Prayer), Zakah (Almsgiving), Sawm (Fasting), and Hajj (Pilgrimage).',
    'Iman consists of six inward beliefs: Belief in Allah, His Angels, His Revealed Books, His Messengers, the Last Day, and Divine Decree (Qadar).',
    'Ihsan represents spiritual excellence: To worship God as if you see Him, knowing that if you see Him not, He sees you.',
  ],
  keyTakeawaysFr: [
    'L’Islam repose sur cinq actes visibles : la Chahada, la Salât (Prière), la Zakât (Aumône légale), le Sawm (Jeûne de Ramadan) et le Hajj (Pèlerinage).',
    'L’Iman repose sur six croyances intérieures : la foi en Dieu, en Ses Anges, en Ses Livres révélés, en Ses Messagers, au Jour Dernier et au Destin (Qadar).',
    'L’Ihsan désigne l’excellence spirituelle : Adorer Dieu comme si tu Le voyais, car si tu ne Le vois pas, certes Lui te voit.',
  ],
  sections: [
    {
      titleEn: '1. The Five Operational Pillars of Islam',
      titleFr: '1. Les Cinq Piliers Pratiques de l’Islam',
      contentEn: [
        '1. Shahadah: The verbal testimony with heartfelt conviction that none has the right to be worshipped except Allah, and Muhammad is His Messenger.',
        '2. Salah: Five daily prayers establishing a constant conscious connection with God throughout morning, noon, afternoon, sunset, and night.',
        '3. Zakah: An annual compulsory contribution of 2.5% on qualifying surplus wealth distributed to the poor and needy to eradicate societal poverty.',
        '4. Sawm: Fasting from dawn to dusk during Ramadan cultivating discipline, empathy with the hungry, and spiritual rejuvenation.',
        '5. Hajj: The once-in-a-lifetime pilgrimage to the Ka’bah in Makkah for those possessing physical and financial capability.',
      ],
      contentFr: [
        '1. Chahada : L’attestation de foi sincère que nul ne mérite d’être adoré en dehors d’Allah et que Muhammad est Son Messager.',
        '2. Salât : Les cinq prières quotidiennes maintenant un lien conscient et régulier avec le Créateur tout au long du jour et de la nuit.',
        '3. Zakât : La contribution annuelle obligatoire de 2,5 % sur l’épargne excédentaire, versée aux nécessiteux pour assurer la justice sociale.',
        '4. Sawm : Le jeûne de l’aube au coucher du soleil durant le mois de Ramadan, développant la maîtrise de soi et la piété.',
        '5. Hajj : Le pèlerinage aux Lieux Saints de La Mecque une fois dans sa vie pour quiconque en a les moyens physiques et matériels.',
      ],
    },
    {
      titleEn: '2. The Six Theological Pillars of Faith (Iman)',
      titleFr: '2. Les Six Piliers de la Foi (Iman)',
      contentEn: [
        'True faith requires intellectual conviction and serene acceptance: believing in Allah without partners; His noble angels; His genuine revelations (including the original Torah, Psalms, Gospel, and Qur’an); His chain of prophets from Adam, Noah, Abraham, Moses, Jesus, to Muhammad; the reality of Resurrection and Judgment; and God’s sovereign wisdom overseeing all destiny.',
      ],
      contentFr: [
        'La foi authentique implique conviction intellectuelle et sérénité du cœur : croire en Allah sans associé ; en Ses nobles anges ; en Ses révélations originelles (la Torah, les Psaumes, l’Évangile et le Coran) ; en la lignée des prophètes d’Adam, Noé, Abraham, Moïse, Jésus jusqu’à Muhammad ; au Jour du Jugement ; et en la sagesse divine qui gouverne toute destinée.',
      ],
    },
  ],
};
