/**
 * Application service module implementing shahadah audio business rules.
 * Coordinates domain invariants, persistence updates, and structured Result responses.
 * @module lib/services/shahadah-audio
 * @exports inferMimeFromUrl, resolveSubtypeFormat, persistAudioPayload,
 *   buildModelReferenceAudio, normalizeRetakeFeedback, buildShahadahChatText
 */

import { getServerFs } from '@/lib/db/server-fs';
import type { SupportedLanguage } from '@/lib/db/types';
import type { ModelReferenceAudio } from './shahadah-service';

/**
 * Constant definition for audio ext mime.
 */
const AUDIO_EXT_MIME: Array<[string, string]> = [
  ['.wav', 'audio/wav'],
  ['.m4a', 'audio/mp4'],
  ['.mp4', 'audio/mp4'],
];

/**
 * Constant definition for audio subtype map.
 */
const AUDIO_SUBTYPE_MAP: Array<[string, string, string]> = [
  ['wav', 'wav', 'audio/wav'],
  ['mp4', 'm4a', 'audio/mp4'],
  ['m4a', 'm4a', 'audio/mp4'],
  ['aac', 'm4a', 'audio/mp4'],
  ['mpeg', 'mp3', 'audio/mpeg'],
  ['mp3', 'mp3', 'audio/mpeg'],
  ['ogg', 'ogg', 'audio/ogg'],
];

/**
 * Constant definition for retake default fr.
 */
const RETAKE_DEFAULT_FR =
  'Veuillez écouter attentivement l’enregistrement audio de référence et réenregistrer.';
/**
 * Constant definition for retake default en.
 */
const RETAKE_DEFAULT_EN =
  'Please listen carefully to the authentic reference audio clip and record again.';
/**
 * Constant definition for retake alt en.
 */
const RETAKE_ALT_EN =
  'Please practice pronunciation with the authentic reference clip and record again.';

/** Infers MIME type from an audio URL extension, falling back to a default MIME string. */
export function inferMimeFromUrl(url: string, fallback: string): string {
  const lower = url.toLowerCase();
  const match = AUDIO_EXT_MIME.find(([ext]) => lower.endsWith(ext));
  return match ? match[1] : fallback;
}

/** Resolves file extension and canonical MIME type from an audio data-URL subtype. */
export function resolveSubtypeFormat(subType: string): { ext: string; mime: string } {
  const lower = subType.toLowerCase();
  const found = AUDIO_SUBTYPE_MAP.find(([key]) => lower.includes(key));
  return found ? { ext: found[1], mime: found[2] } : { ext: 'webm', mime: 'audio/webm' };
}

/** Persists inline base64 Shahadah audio recordings to `.data/audio/` on non-test servers. */
export function persistAudioPayload(
  rawUrl: string,
  initialMime: string,
  isTestEnv: boolean
): { audioUrl: string; mimeType: string } {
  if (rawUrl.startsWith('blob:')) {
    return { audioUrl: '/audio/sample-shahadah-jean-luc.wav', mimeType: 'audio/wav' };
  }
  const isInlineData =
    rawUrl.startsWith('data:audio/') ||
    (!rawUrl.startsWith('http') &&
      !rawUrl.startsWith('/audio/') &&
      !rawUrl.startsWith('/uploads/'));

  const serverFs = getServerFs();
  if (isTestEnv || !isInlineData || !serverFs) {
    return {
      audioUrl: rawUrl,
      mimeType: isTestEnv ? initialMime : inferMimeFromUrl(rawUrl, initialMime),
    };
  }

  try {
    const audioDir = serverFs.path.join(process.cwd(), '.data', 'audio');
    if (!serverFs.fs.existsSync(audioDir)) {
      serverFs.fs.mkdirSync(audioDir, { recursive: true });
    }
    const matches = rawUrl.match(/^data:audio\/([^;,]+)(?:;[^,]*)?;base64,(.+)$/i);
    const fmt = matches?.[2]
      ? resolveSubtypeFormat(matches[1])
      : { ext: 'wav', mime: initialMime };
    const base64Payload = extractBase64Payload(rawUrl, matches?.[2]);
    const fileName = `rec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${fmt.ext}`;
    serverFs.fs.writeFileSync(
      serverFs.path.join(audioDir, fileName),
      Buffer.from(base64Payload, 'base64')
    );
    return { audioUrl: `/audio/${fileName}`, mimeType: fmt.mime };
  } catch (e) {
    console.error('Audio persist error:', e);
    return { audioUrl: rawUrl, mimeType: initialMime };
  }
}

/**
 * Executes extract base64 payload logic.
 * @param rawUrl - Raw url value (`string`).
 * @param matchedPayload - Matched payload value (`string`).
 * @returns Value of type `string`.
 */
function extractBase64Payload(rawUrl: string, matchedPayload?: string): string {
  if (matchedPayload) return matchedPayload;
  return rawUrl.includes(';base64,') ? rawUrl.split(';base64,')[1] : rawUrl;
}

/** Returns the reference Shahadah audio metadata localized to EN or FR. */
export function buildModelReferenceAudio(language: SupportedLanguage): ModelReferenceAudio {
  const arabic =
    'أَشْهَدُ أَنْ لَا إِلَٰهَ إِلَّا ٱللَّٰهُ وَأَشْهَدُ أَنَّ مُحَمَّدًا رَسُولُ ٱللَّٰهِ';
  const phoneticsEn =
    'Ash-hadu an la ilaha illa Allah, wa ash-hadu anna Muhammadan Rasoolullah';
  const phoneticsFr =
    'Ach-hadou an la ilaha illa Allah, wa ach-hadou anna Mouhammadan rassouloullah';
  const transEn =
    'I bear witness that there is no deity worthy of worship except Allah, ' +
    'and I bear witness that Muhammad is the Messenger of Allah.';
  const transFr =
    "J'atteste qu'il n'y a de divinité digne d'adoration qu'Allah, " +
    "et j'atteste que Muhammad est le Messager d'Allah.";

  const selectedPhonetics = language === 'fr' ? phoneticsFr : phoneticsEn;
  const selectedTrans = language === 'fr' ? transFr : transEn;

  return {
    language,
    audioUrl: '/audio/reference-shahadah-ar.webm',
    durationSeconds: 24,
    arabicScript: arabic,
    arabicText: arabic,
    phoneticGuide: selectedPhonetics,
    phonetics: selectedPhonetics,
    englishTranslation: transEn,
    translation: selectedTrans,
    translationEn: transEn,
    translationFr: transFr,
  };
}

/** Normalizes specialist retake feedback notes into the conversation language. */
export function normalizeRetakeFeedback(
  notes: string | undefined,
  lang: SupportedLanguage
): string {
  const trimmed = notes?.trim();
  if (!trimmed) {
    return lang === 'fr' ? RETAKE_DEFAULT_FR : RETAKE_ALT_EN;
  }
  if (lang === 'fr' && (trimmed === RETAKE_DEFAULT_EN || trimmed === RETAKE_ALT_EN)) {
    return RETAKE_DEFAULT_FR;
  }
  if (lang === 'en' && trimmed === RETAKE_DEFAULT_FR) {
    return RETAKE_DEFAULT_EN;
  }
  return trimmed;
}

/** Builds localized chat notification text for Shahadah submission or review outcomes. */
export function buildShahadahChatText(
  kind: 'SUBMITTED' | 'RETAKE' | 'VALIDATED',
  lang: SupportedLanguage,
  feedbackNotes?: string | null
): string {
  if (kind === 'SUBMITTED') {
    return lang === 'fr'
      ? 'J’ai enregistré et soumis ma déclaration de Chahada pour examen.'
      : 'I have recorded and submitted my Shahadah audio declaration for review.';
  }
  if (kind === 'RETAKE') {
    return lang === 'fr'
      ? `Votre récitation de la Chahada nécessite une reprise. Remarques du spécialiste : "${feedbackNotes}". Veuillez écouter la récitation de référence ci-dessous et réenregistrer.`
      : `Your Shahadah recitation requires a retake. Specialist feedback: "${feedbackNotes}". Please listen to the authentic reference clip below and record again.`;
  }
  return lang === 'fr'
    ? 'Mubarak ! Louange à Allah, votre déclaration de Chahada a été officiellement validée. Bienvenue dans l’Islam ! Veuillez maintenant compléter votre profil pour débloquer votre accès à l’Académie.'
    : 'Mubarak! All praise is due to Allah, your Shahadah declaration has been officially validated. Welcome to Islam! Please complete your profile to unlock your access to the Academy.';
}
