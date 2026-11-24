/**
 * Module architecture and API reference for `src/lib/db/seeds/islamic-resources.ts`.
 *
 * Exported symbols:
 * - `createInitialIslamicResources` (Function): create initial islamic resources
 *   definition.
 *
 * Internal dependencies:
 * - `../types`
 * - `./constants`
 *
 * @module lib/db/seeds/islamic-resources
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

/**
 * Seed fixture catalog for the 8 public Islamic multimedia resources displayed
 * on the bilingual Resources Library (`/resources`).
 */

import type { IslamicResource } from '../types';
import { NOW_ISO } from './constants';

/**
 * Creates the initial set of 8 bilingual public Islamic resources (PDF, audio,
 * text, and video) across Qur'an, Prophet, Pillars, Ethics, and Misconceptions.
 * @returns Fresh array of seeded `IslamicResource` entities.
 */
export function createInitialIslamicResources(): IslamicResource[] {
  return [
    {
      id: 'res-1',
      uploadedByAdminId: 'user-admin-1',
      titleEn: 'Understanding the Noble Qur’an: Revelation, Preservation & Core Themes',
      titleFr: 'Comprendre le Noble Coran : Révélation, Préservation et Thèmes Centraux',
      category: 'QURAN',
      resourceType: 'PDF',
      mediaUrl: '/resources/understanding-the-noble-quran.pdf',
      descriptionEn:
        'An introductory academic monograph published by the Al Hiwar Digital Da’wah Platform explaining how the Qur’an was revealed, memorized, and preserved letter-for-letter.',
      descriptionFr:
        'Une monographie académique d’introduction publiée par la plateforme Al Hiwar expliquant comment le Coran a été révélé, mémorisé et préservé lettre par lettre.',
      isPublic: true,
      createdAt: NOW_ISO,
    },
    {
      id: 'res-2',
      uploadedByAdminId: 'user-admin-1',
      titleEn: 'Recitation & Meaning of Surah Al-Fatihah (The Opening)',
      titleFr: 'Récitation et Sens de la Sourate Al-Fatihah (L’Ouverture)',
      category: 'QURAN',
      resourceType: 'AUDIO',
      mediaUrl: '/resources/surah-al-fatihah-recitation.mp3',
      descriptionEn:
        'Measured Arabic recitation from Al-Masjid An-Nabawi accompanied by line-by-line English and French commentary on the seven oft-repeated verses.',
      descriptionFr:
        'Récitation arabe mesurée depuis Al-Masjid An-Nabawi accompagnée d’un commentaire ligne par ligne en anglais et en français sur les sept versets répétés.',
      isPublic: true,
      createdAt: NOW_ISO,
    },
    {
      id: 'res-3',
      uploadedByAdminId: 'user-admin-1',
      titleEn: 'Mercy to the Worlds: The Biography of Prophet Muhammad ﷺ',
      titleFr: 'Miséricorde pour les Mondes : La Biographie du Prophète Muhammad ﷺ',
      category: 'PROPHET',
      resourceType: 'TEXT',
      mediaUrl: '/resources/biography-prophet-muhammad',
      descriptionEn:
        'A chronological overview of the Prophet’s character, truthfulness (Al-Sadiq Al-Amin), call to monotheism in Makkah, and establishment of justice in Madinah.',
      descriptionFr:
        'Un aperçu chronologique du caractère du Prophète, de sa véracité (Al-Sadiq Al-Amin), de son appel au monothéisme à La Mecque et de l’établissement de la justice à Médine.',
      isPublic: true,
      createdAt: NOW_ISO,
    },
    {
      id: 'res-4',
      uploadedByAdminId: 'user-admin-1',
      titleEn: 'The Prophetic Mosque in Madinah: History & Spiritual Legacy',
      titleFr: 'La Mosquée Prophétique à Médine : Histoire et Héritage Spirituel',
      category: 'PROPHET',
      resourceType: 'VIDEO',
      mediaUrl: '/resources/prophetic-mosque-documentary.mp4',
      descriptionEn:
        'Visual documentary exploring how the Prophet Muhammad ﷺ built a community of scholarship, compassion, and brotherhood in Madinah.',
      descriptionFr:
        'Documentaire visuel explorant comment le Prophète Muhammad ﷺ a bâti une communauté d’érudition, de compassion et de fraternité à Médine.',
      isPublic: true,
      createdAt: NOW_ISO,
    },
    {
      id: 'res-5',
      uploadedByAdminId: 'user-admin-1',
      titleEn: 'The Five Pillars of Islam & Six Pillars of Faith Explained',
      titleFr: 'Les Cinq Piliers de l’Islam et les Six Piliers de la Foi Expliqués',
      category: 'PILLARS',
      resourceType: 'PDF',
      mediaUrl: '/resources/pillars-of-islam-and-faith.pdf',
      descriptionEn:
        'Based on the famous Hadith of Jibril, this illustrated guide presents the foundational beliefs (Iman) and acts of worship (Islam) with clarity.',
      descriptionFr:
        'Basé sur le célèbre Hadith de Jibril, ce guide illustré présente avec clarté les croyances fondamentales (Iman) et les actes d’adoration (Islam).',
      isPublic: true,
      createdAt: NOW_ISO,
    },
    {
      id: 'res-6',
      uploadedByAdminId: 'user-admin-1',
      titleEn: 'Islamic Ethics (Al-Akhlaq): Compassion, Honesty, and Neighbourly Rights',
      titleFr: 'L’Éthique Islamique (Al-Akhlaq) : Compassion, Honnêteté et Droits du Voisin',
      category: 'ETHICS',
      resourceType: 'TEXT',
      mediaUrl: '/resources/islamic-ethics-compendium',
      descriptionEn:
        'How Islamic moral teachings elevate daily conduct—honoring parents, keeping trusts, caring for the environment, and showing kindness to all creation.',
      descriptionFr:
        'Comment les enseignements moraux islamiques élèvent la conduite quotidienne : honorer les parents, respecter les dépôts et faire preuve de bonté envers toute la création.',
      isPublic: true,
      createdAt: NOW_ISO,
    },
    {
      id: 'res-7',
      uploadedByAdminId: 'user-admin-1',
      titleEn: 'Clarifying Common Questions About Women, Peace, and Human Dignity in Islam',
      titleFr: 'Clarifier les Questions Courantes sur les Femmes, la Paix et la Dignité Humaine en Islam',
      category: 'MISCONCEPTIONS',
      resourceType: 'VIDEO',
      mediaUrl: '/resources/clarifying-misconceptions-lecture.mp4',
      descriptionEn:
        'Evidence-based lecture addressing frequent inquiries from Western seekers using primary Qur’anic texts and authentic Prophetic traditions.',
      descriptionFr:
        'Conférence fondée sur des preuves répondant aux questions fréquentes des chercheurs occidentaux à partir des textes coraniques primaires et des traditions authentiques.',
      isPublic: true,
      createdAt: NOW_ISO,
    },
    {
      id: 'res-8',
      uploadedByAdminId: 'user-admin-1',
      titleEn: 'Jesus (Isa) and Mary (Maryam) in the Noble Qur’an',
      titleFr: 'Jésus (Issa) et Marie (Maryam) dans le Noble Coran',
      category: 'MISCONCEPTIONS',
      resourceType: 'AUDIO',
      mediaUrl: '/resources/jesus-and-mary-in-the-quran.mp3',
      descriptionEn:
        'An audio exploration of Surah Maryam and how Muslims revere Jesus (peace be upon him) as one of the greatest Messengers of God.',
      descriptionFr:
        'Une exploration audio de la Sourate Maryam et de la manière dont les musulmans vénèrent Jésus (paix sur lui) comme l’un des plus grands Messagers de Dieu.',
      isPublic: true,
      createdAt: NOW_ISO,
    },
  ];
}
