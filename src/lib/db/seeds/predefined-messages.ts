/**
 * Module architecture and API reference for `src/lib/db/seeds/predefined-messages.ts`.
 *
 * Exported symbols:
 * - `createInitialPredefinedMessages` (Function): create initial predefined messages
 *   definition.
 *
 * Internal dependencies:
 * - `../types`
 * - `./constants`
 *
 * @module lib/db/seeds/predefined-messages
 * @remarks Maintains bilingual EN/FR parity and Al-Hiwar platform domain invariants.
 */

/**
 * Seed fixture templates for Dialogist quick replies (10 Supervisor-approved
 * templates plus 2 pending drafts awaiting Sharia review).
 */

import type { PredefinedMessage } from '../types';
import { NOW_ISO } from './constants';

/**
 * Creates the initial collection of bilingual predefined consultation replies.
 * @returns Fresh array of approved and pending `PredefinedMessage` records.
 */
export function createInitialPredefinedMessages(): PredefinedMessage[] {
  return [
    {
      id: 'pm-1',
      shortcut: '/greeting-welcome',
      category: 'GREETING',
      bodyEn:
        'Peace be upon you! Welcome to the Al Hiwar Dialogue Center. My name is Sheikh Ahmad. How may I assist you in your exploration of Islam today?',
      bodyFr:
        'Que la paix soit sur vous ! Bienvenue au Centre de Dialogue Al Hiwar. Je m’appelle Cheikh Ahmad. Comment puis-je vous accompagner dans votre découverte de l’Islam aujourd’hui ?',
      authorId: 'user-dialogist-1',
      approvedById: 'user-supervisor-1',
      isApproved: true,
      status: 'APPROVED',
      createdAt: NOW_ISO,
    },
    {
      id: 'pm-2',
      shortcut: '/greeting-safe-space',
      category: 'GREETING',
      bodyEn:
        'Thank you for reaching out. Please feel completely comfortable asking any question—there are no off-limit topics here, and our conversation is strictly confidential and respectful.',
      bodyFr:
        'Merci de nous avoir contactés. N’hésitez surtout pas à poser toutes vos questions : aucun sujet n’est tabou ici, et notre échange est strictement confidentiel et bienveillant.',
      authorId: 'user-dialogist-1',
      approvedById: 'user-supervisor-1',
      isApproved: true,
      status: 'APPROVED',
      createdAt: NOW_ISO,
    },
    {
      id: 'pm-3',
      shortcut: '/theology-tawhid',
      category: 'THEOLOGY',
      bodyEn:
        'At the heart of Islam is Tawhid—the pure, direct belief in One Unique Creator (Allah) who has no partners, equals, or intermediaries. Every person can call upon God directly in prayer.',
      bodyFr:
        'Au cœur de l’Islam se trouve le Tawhid : la croyance pure et directe en un Créateur Unique (Allah) qui n’a ni associé, ni égal, ni intermédiaire. Chacun peut invoquer Dieu directement.',
      authorId: 'user-dialogist-1',
      approvedById: 'user-supervisor-1',
      isApproved: true,
      status: 'APPROVED',
      createdAt: NOW_ISO,
    },
    {
      id: 'pm-4',
      shortcut: '/theology-prophets',
      category: 'THEOLOGY',
      bodyEn:
        'Muslims believe in all Prophets sent by God—including Adam, Noah, Abraham, Moses, Jesus, and finally Muhammad (peace be upon them all)—all calling humanity to worship the One Creator.',
      bodyFr:
        'Les musulmans croient en tous les Prophètes envoyés par Dieu — dont Adam, Noé, Abraham, Moïse, Jésus et enfin Muhammad (paix sur eux tous) — qui ont tous appelé l’humanité à adorer l’Unique Créateur.',
      authorId: 'user-dialogist-1',
      approvedById: 'user-supervisor-1',
      isApproved: true,
      status: 'APPROVED',
      createdAt: NOW_ISO,
    },
    {
      id: 'pm-5',
      shortcut: '/theology-purpose',
      category: 'THEOLOGY',
      bodyEn:
        'In the Qur’an (51:56), God states that humanity was created to know and worship Him willingly, cultivating gratitude, justice, and moral excellence in this life in preparation for the Eternal Hereafter.',
      bodyFr:
        'Dans le Coran (51:56), Dieu indique que l’humanité a été créée pour Le connaître et L’adorer librement, en cultivant la gratitude, la justice et l’excellence morale en vue de l’Au-delà éternel.',
      authorId: 'user-dialogist-1',
      approvedById: 'user-supervisor-1',
      isApproved: true,
      status: 'APPROVED',
      createdAt: NOW_ISO,
    },
    {
      id: 'pm-6',
      shortcut: '/shahadah-meaning',
      category: 'SHAHADAH',
      bodyEn:
        'Embracing Islam begins with sincere conviction in the heart and pronouncing the Shahadah: "Ash-hadu an la ilaha illa Allah, wa ash-hadu anna Muhammadan Rasulu Allah" (I bear witness that there is no deity worthy of worship except Allah, and I bear witness that Muhammad is the Messenger of Allah).',
      bodyFr:
        'Embrasser l’Islam commence par la conviction sincère du cœur et la prononciation de la Chahada : « Ash-hadu an la ilaha illa Allah, wa ash-hadu anna Muhammadan Rasulu Allah » (J’atteste qu’il n’y a de divinité digne d’adoration qu’Allah, et j’atteste que Muhammad est le Messager d’Allah).',
      authorId: 'user-dialogist-1',
      approvedById: 'user-supervisor-1',
      isApproved: true,
      status: 'APPROVED',
      createdAt: NOW_ISO,
    },
    {
      id: 'pm-7',
      shortcut: '/shahadah-recording-guide',
      category: 'SHAHADAH',
      bodyEn:
        'Whenever you feel ready, you can use the "Record Shahadah" button right here in our chat to record your declaration in Arabic and in your own language. I will listen and validate your pronunciation personally.',
      bodyFr:
        'Dès que vous vous sentez prêt(e), vous pouvez utiliser le bouton « Enregistrer la Chahada » ici même dans notre discussion pour enregistrer votre attestation en arabe et dans votre langue. Je l’écouterai et validerai votre prononciation personnellement.',
      authorId: 'user-dialogist-1',
      approvedById: 'user-supervisor-1',
      isApproved: true,
      status: 'APPROVED',
      createdAt: NOW_ISO,
    },
    {
      id: 'pm-8',
      shortcut: '/shahadah-mercy-forgiveness',
      category: 'SHAHADAH',
      bodyEn:
        'The Prophet Muhammad ﷺ taught that embracing Islam wipes away all previous sins completely—you begin a fresh, luminous chapter of your life with all your past good deeds preserved.',
      bodyFr:
        'Le Prophète Muhammad ﷺ a enseigné qu’embrasser l’Islam efface intégralement tous les péchés passés : vous commencez un nouveau chapitre lumineux de votre vie tout en conservant vos bonnes actions antérieures.',
      authorId: 'user-dialogist-1',
      approvedById: 'user-supervisor-1',
      isApproved: true,
      status: 'APPROVED',
      createdAt: NOW_ISO,
    },
    {
      id: 'pm-9',
      shortcut: '/misconceptions-jesus',
      category: 'MISCONCEPTIONS',
      bodyEn:
        'A Muslim cannot be a Muslim without believing in Jesus (peace be upon him)! We believe in his miraculous virgin birth, his noble miracles by God’s permission, and his message of pure monotheism.',
      bodyFr:
        'Un musulman ne peut être musulman sans croire en Jésus (paix sur lui) ! Nous croyons en sa naissance miraculeuse de la Vierge Marie, en ses nobles miracles par la permission de Dieu et en son message de pur monothéisme.',
      authorId: 'user-dialogist-1',
      approvedById: 'user-supervisor-1',
      isApproved: true,
      status: 'APPROVED',
      createdAt: NOW_ISO,
    },
    {
      id: 'pm-10',
      shortcut: '/misconceptions-compulsion',
      category: 'MISCONCEPTIONS',
      bodyEn:
        'The Qur’an states unequivocally in Surah Al-Baqarah (2:256): "There is no compulsion in religion." Faith in Islam is only valid when chosen with free will, intellectual clarity, and peace of heart.',
      bodyFr:
        'Le Coran affirme sans équivoque dans la Sourate Al-Baqarah (2:256) : « Nulle contrainte en religion. » La foi en Islam n’est valide que lorsqu’elle est choisie librement, avec clarté intellectuelle et sérénité du cœur.',
      authorId: 'user-dialogist-1',
      approvedById: 'user-supervisor-1',
      isApproved: true,
      status: 'APPROVED',
      createdAt: NOW_ISO,
    },
    // Pending drafts awaiting Supervisor approval
    {
      id: 'pm-draft-11',
      shortcut: '/theology-revelation-preservation',
      category: 'THEOLOGY',
      bodyEn:
        'The Noble Qur’an has been preserved both in written manuscripts dating back to the first Islamic century and in the unbroken oral memorization of millions of Huffaz worldwide.',
      bodyFr:
        'Le Noble Coran a été préservé à la fois dans des manuscrits écrits remontant au premier siècle de l’Islam et par la mémorisation orale ininterrompue de millions de Huffaz à travers le monde.',
      authorId: 'user-dialogist-1',
      approvedById: null,
      isApproved: false,
      status: 'PENDING_APPROVAL',
      createdAt: NOW_ISO,
    },
    {
      id: 'pm-draft-12',
      shortcut: '/misconceptions-science-faith',
      category: 'MISCONCEPTIONS',
      bodyEn:
        'In Islam, revelation and reason walk hand in hand. The very first word revealed of the Qur’an was "Iqra" (Read!), inspiring centuries of astronomy, medicine, mathematics, and scholarship.',
      bodyFr:
        'En Islam, la révélation et la raison marchent main dans la main. Le tout premier mot révélé du Coran fut « Iqra » (Lis !), inspirant des siècles d’astronomie, de médecine, de mathématiques et d’érudition.',
      authorId: 'user-dialogist-1',
      approvedById: null,
      isApproved: false,
      status: 'PENDING_APPROVAL',
      createdAt: NOW_ISO,
    },
  ];
}
