/**
 * Module architecture and API reference for `src/lib/resources/details/res-7.ts`.
 *
 * Exported symbols:
 * - `RES_7` (Const): res 7 definition.
 *
 * Internal dependencies:
 * - `./types`
 *
 * @module lib/resources/details/res-7
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

/**
 * Bilingual Islamic Library monograph content for resource res-7.
 */

import type { DetailedResourceContent } from "./types";

/** Verified scholarly monograph entry res-7. */
export const RES_7: DetailedResourceContent = {
  id: 'res-7',
  slug: 'clarifying-misconceptions-lecture.mp4',
  category: 'MISCONCEPTIONS',
  resourceType: 'VIDEO',
  titleEn: 'Clarifying Common Questions About Women, Peace, and Human Dignity in Islam',
  titleFr: 'Clarifier les Questions Courantes sur les Femmes, la Paix et la Dignité Humaine en Islam',
  subtitleEn: 'Academic Seminar Addressing Contemporary Misunderstandings with Primary Sources',
  subtitleFr: 'Séminaire académique répondant aux idées reçues contemporaines à partir des sources premières',
  authorEn: 'Center for Interfaith Dialogue and Contemporary Inquiries',
  authorFr: 'Centre de Dialogue Interreligieux et d’Études Contemporaines',
  publishedDate: '1446 AH / 2025 CE',
  readingDuration: '11 min lecture syllabus',
  citationSource: 'Symposium Papers (Ref: AH-VID-MISC-007)',
  keyTakeawaysEn: [
    'Islam codified independent financial identity and property ownership for women in the 7th century.',
    'The word Islam stems from the root "Salam" (peace and wholeness), prohibiting unjust aggression.',
    'Religious coercion is unequivocally forbidden by the explicit Qur’anic text.',
  ],
  keyTakeawaysFr: [
    'L’Islam a consacré l’indépendance financière et le droit de propriété des femmes dès le VIIe siècle.',
    'Le terme Islam dérive de la racine « Salam » (paix et intégrité), proscrivant toute agression injuste.',
    'La contrainte en matière de religion est catégoriquement rejetée par le texte coranique.',
  ],
  sections: [
    {
      titleEn: 'Lecture Modules and Verifiable References',
      titleFr: 'Modules de la conférence et références vérifiables',
      contentEn: [
        'Module 1: The Status and Dignity of Women. Examination of independent legal agency, consent in marriage, right to education, and spiritual equality before God (Surah Al-Ahzab 33:35).',
        'Module 2: Peace and Warfare Ethics. Classical Islamic rules of engagement explicitly prohibiting harming non-combatants, cutting trees, damaging places of worship, or mistreating prisoners.',
        'Module 3: Religious Freedom. The foundational Qur’anic principle: "There is no compulsion in religion" (Surah Al-Baqarah 2:256).',
      ],
      contentFr: [
        'Module 1 : Le statut et la dignité de la femme. Analyse de la personnalité juridique autonome, du consentement matrimonial, du droit au savoir et de l’égalité spirituelle devant Dieu (Sourate Al-Ahzab 33:35).',
        'Module 2 : La paix et l’éthique des engagements. Les règles islamiques traditionnelles interdisant formellement de toucher aux non-combattants, de couper les arbres, d’endommager les lieux de culte ou de maltraiter les prisonniers.',
        'Module 3 : Liberté de conscience. Le principe coranique immuable : « Nulle contrainte en religion » (Sourate Al-Baqarah 2:256).',
      ],
      arabicQuote: 'لَا إِكْرَاهَ فِي الدِّينِ ۖ قَد تَّبَيَّنَ الرُّشْدُ مِنَ الْغَيِّ',
      arabicTransliteration: '“Lā ikrāha fid-dīn, qad tabayyanar-rushdu minal-ghayy”',
      arabicTranslationEn: '“There is no compulsion in religion. Verily, the Right Path has become distinct from the wrong path.” (Surah Al-Baqarah 2:256)',
      arabicTranslationFr: '« Nulle contrainte en religion ! Car le bon chemin s’est distingué de l’égarement. » (Sourate Al-Baqarah 2:256)',
    },
  ],
};
